"""PDF report generation routes."""
import io
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db, CountyMaster, CFPBComplaint

router = APIRouter(prefix="/api/reports", tags=["reports"])


def _generate_pdf(db: Session, state: Optional[str] = None, report_type: str = "disparity") -> bytes:
    """Generate a FinLens disparity analysis PDF using ReportLab."""
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.lib.units import inch
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75 * inch,
                             bottomMargin=0.75 * inch)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("Title", parent=styles["Title"],
                                  textColor=colors.HexColor("#1e3a5f"), fontSize=22, spaceAfter=6)
    heading_style = ParagraphStyle("Heading", parent=styles["Heading2"],
                                    textColor=colors.HexColor("#1e3a5f"), fontSize=14, spaceBefore=12)
    body_style = styles["Normal"]
    small_style = ParagraphStyle("Small", parent=styles["Normal"], fontSize=9, textColor=colors.grey)

    story = []

    scope_label = f"State: {state.upper()}" if state else "National Overview"
    report_label = {"disparity": "Disparity Analysis", "credit_desert": "Credit Desert Profile",
                    "complaint": "Complaint Summary"}.get(report_type, report_type.replace("_", " ").title())
    story.append(Paragraph(f"FinLens — {report_label}", title_style))
    story.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%B %d, %Y')} · {scope_label}", small_style))
    story.append(Paragraph("Data-driven analysis of US credit access disparities", body_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#3b82f6"), spaceAfter=12))

    story.append(Paragraph("Executive Summary", heading_style))
    q = db.query(CountyMaster)
    if state:
        q = q.filter(CountyMaster.state == state.upper())
    counties = q.all()
    rural = [c for c in counties if c.is_rural]
    urban = [c for c in counties if not c.is_rural]
    deserts = [c for c in counties if c.credit_desert]

    def avg(items, attr):
        vals = [getattr(i, attr) for i in items if getattr(i, attr) is not None]
        return round(sum(vals) / len(vals), 4) if vals else 0

    rural_denial = avg(rural, "loan_denial_rate")
    urban_denial = avg(urban, "loan_denial_rate")
    rural_score = avg(rural, "alternative_score_avg")
    urban_score = avg(urban, "alternative_score_avg")
    avg_gap_rural = avg(rural, "score_gap")

    summary_text = (
        f"Analysis of {len(counties)} US counties reveals systemic patterns in credit access disparities. "
        f"Rural counties show an average loan denial rate of {rural_denial:.1%}, compared to {urban_denial:.1%} "
        f"for urban counties — a {rural_denial - urban_denial:.1%} premium that cannot be explained by income alone. "
        f"The FinLens alternative scoring model identifies {len(deserts)} credit deserts where borrowers face "
        f"denial rates exceeding 40% despite median incomes above $40,000. Rural borrowers score an average "
        f"of {avg_gap_rural:.0f} points higher on the alternative metric than traditional FICO estimates suggest, "
        f"indicating systematic undervaluation of their creditworthiness."
    )
    story.append(Paragraph(summary_text, body_style))
    story.append(Spacer(1, 12))

    story.append(Paragraph("Key Metrics", heading_style))
    metrics_data = [
        ["Metric", "Rural", "Urban", "Gap"],
        ["Avg Loan Denial Rate", f"{rural_denial:.1%}", f"{urban_denial:.1%}",
         f"+{(rural_denial - urban_denial):.1%}"],
        ["Alt Score Average", f"{rural_score:.0f}", f"{urban_score:.0f}",
         f"{rural_score - urban_score:+.0f}"],
        ["Score Gap (Alt - FICO)", f"{avg_gap_rural:.0f}", f"{avg(urban, 'score_gap'):.0f}", ""],
        ["Credit Deserts", str(len(deserts)), "", ""],
        ["Counties Analyzed", str(len(rural)), str(len(urban)), str(len(counties))],
    ]
    t = Table(metrics_data, colWidths=[2.5 * inch, 1.2 * inch, 1.2 * inch, 1.2 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a5f")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f0f4f8")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 16))

    story.append(Paragraph("Geographic Disparity Analysis", heading_style))

    top_counties = sorted(counties, key=lambda c: c.disparity_index or 0, reverse=True)[:10]
    if top_counties:
        fig, ax = plt.subplots(figsize=(6.5, 3.5))
        names = [f"{c.county_name[:20]}, {c.state}" for c in top_counties]
        values = [c.disparity_index or 0 for c in top_counties]
        bars = ax.barh(names[::-1], values[::-1], color="#3b82f6", edgecolor="#1e3a5f")
        ax.set_xlabel("Disparity Index (0-100)")
        ax.set_title("Top 10 Counties by Financial Disparity Index")
        ax.set_xlim(0, 100)
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        plt.tight_layout()
        chart_buf = io.BytesIO()
        fig.savefig(chart_buf, format="png", dpi=150, bbox_inches="tight")
        plt.close(fig)
        chart_buf.seek(0)

        from reportlab.platypus import Image as RLImage
        story.append(RLImage(chart_buf, width=6 * inch, height=3 * inch))
        story.append(Spacer(1, 8))

    story.append(Paragraph("Top 15 Most Disparate Counties", heading_style))
    top15 = sorted(counties, key=lambda c: c.disparity_index or 0, reverse=True)[:15]
    table_data = [["County", "State", "Denial Rate", "Alt Score", "FICO Est.", "Gap", "Rural"]]
    for c in top15:
        table_data.append([
            c.county_name[:25] if c.county_name else "",
            c.state or "",
            f"{(c.loan_denial_rate or 0):.1%}",
            str(int(c.alternative_score_avg or 0)),
            str(int(c.fico_estimate_avg or 0)),
            f"{int(c.score_gap or 0):+d}",
            "Yes" if c.is_rural else "No",
        ])
    t2 = Table(table_data, colWidths=[1.9 * inch, 0.5 * inch, 0.8 * inch,
                                       0.8 * inch, 0.8 * inch, 0.6 * inch, 0.6 * inch])
    t2.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a5f")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f0f4f8")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("PADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t2)
    story.append(Spacer(1, 16))

    cq = db.query(CFPBComplaint)
    if state:
        cq = cq.filter(CFPBComplaint.state == state.upper())
    complaints = cq.all()
    if complaints:
        story.append(Paragraph("CFPB Complaint Analysis", heading_style))
        by_product: dict[str, int] = {}
        for c in complaints:
            by_product[c.product] = by_product.get(c.product, 0) + 1
        top_products = sorted(by_product.items(), key=lambda x: x[1], reverse=True)[:8]

        fig2, ax2 = plt.subplots(figsize=(6.5, 3.5))
        prods = [p[0][:30] for p in top_products]
        counts = [p[1] for p in top_products]
        ax2.bar(range(len(prods)), counts, color="#10b981", edgecolor="#059669")
        ax2.set_xticks(range(len(prods)))
        ax2.set_xticklabels(prods, rotation=30, ha="right", fontsize=8)
        ax2.set_ylabel("Complaint Count")
        ax2.set_title("Complaints by Product Type")
        ax2.spines["top"].set_visible(False)
        ax2.spines["right"].set_visible(False)
        plt.tight_layout()
        chart2_buf = io.BytesIO()
        fig2.savefig(chart2_buf, format="png", dpi=150, bbox_inches="tight")
        plt.close(fig2)
        chart2_buf.seek(0)

        from reportlab.platypus import Image as RLImage
        story.append(RLImage(chart2_buf, width=6 * inch, height=3 * inch))

    story.append(Spacer(1, 16))

    story.append(Paragraph("Methodology & Data Sources", heading_style))
    methodology_text = (
        "The FinLens alternative credit score (range: 300-850) is computed using a RandomForestClassifier "
        "trained on HMDA loan application outcomes. Unlike traditional FICO scores, FinLens uses structural "
        "socioeconomic indicators: county income ratio, banking access density, area stability (unemployment), "
        "complaint burden, loan-to-income ratio, and geographic risk (poverty rate). Protected class attributes "
        "are explicitly excluded from model inputs. The score_gap metric (Alternative Score minus FICO estimate) "
        "identifies where traditional scoring most systematically undervalues borrowers."
    )
    story.append(Paragraph(methodology_text, body_style))
    story.append(Spacer(1, 8))

    sources_data = [
        ["Source", "URL", "Records"],
        ["CFPB Complaints", "files.consumerfinance.gov/ccdb/", f"{len(complaints):,}"],
        ["HMDA Loans", "ffiec.cfpb.gov/api/public/datasets", "See database"],
        ["Census ACS", "api.census.gov/data/2022/acs/acs5", f"{len(counties):,} counties"],
        ["FDIC Branches", "ffiec.gov", "See database"],
    ]
    t3 = Table(sources_data, colWidths=[2 * inch, 3 * inch, 1.2 * inch])
    t3.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#374151")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f0f4f8")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t3)

    story.append(Spacer(1, 12))
    story.append(Paragraph(
        "Limitations: The model is illustrative and should not be used for actual lending decisions. "
        "All findings are for research and policy analysis purposes only.",
        small_style
    ))

    doc.build(story)
    return buffer.getvalue()


@router.get("/generate")
def generate_report(
    db: Session = Depends(get_db),
    state: Optional[str] = Query(None),
    report_type: str = Query("disparity"),
):
    pdf_bytes = _generate_pdf(db, state=state, report_type=report_type)
    state_slug = f"_{state.lower()}" if state else ""
    filename = f"finlens_{report_type}{state_slug}_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/download")
def download_report(
    db: Session = Depends(get_db),
    state: Optional[str] = Query(None),
    report_type: str = Query("disparity"),
):
    """Generate and stream a PDF disparity report (legacy alias for /generate)."""
    pdf_bytes = _generate_pdf(db, state=state, report_type=report_type)
    state_slug = f"_{state.lower()}" if state else ""
    filename = f"finlens_{report_type}{state_slug}_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/preview")
def preview_report(db: Session = Depends(get_db)):
    counties = db.query(CountyMaster).all()
    complaints = db.query(CFPBComplaint).all()
    rural = [c for c in counties if c.is_rural]
    deserts = [c for c in counties if c.credit_desert]

    def avg(items, attr):
        vals = [getattr(i, attr) for i in items if getattr(i, attr) is not None]
        return round(sum(vals) / len(vals), 4) if vals else 0

    return {
        "generated_at": datetime.utcnow().isoformat(),
        "pages": 5,
        "sections": [
            "Executive Summary",
            "Key Metrics Table",
            "Geographic Disparity Analysis",
            "CFPB Complaint Analysis",
            "Methodology & Data Sources",
        ],
        "key_metrics": {
            "counties_analyzed": len(counties),
            "credit_deserts": len(deserts),
            "rural_counties": len(rural),
            "total_complaints": len(complaints),
            "avg_rural_denial_rate": avg(rural, "loan_denial_rate"),
            "avg_score_gap_rural": avg(rural, "score_gap"),
        },
    }
