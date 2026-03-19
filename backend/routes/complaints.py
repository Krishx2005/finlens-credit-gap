"""CFPB Complaint API routes."""
import sqlite3
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db, CFPBComplaint

_DB_PATH = str(Path(__file__).parent.parent / "data" / "finlens.db")

router = APIRouter(prefix="/api/complaints", tags=["complaints"])


@router.get("")
def get_complaints(
    db: Session = Depends(get_db),
    state: Optional[str] = Query(None),
    product: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    # Accept offset (frontend) or page (legacy) for pagination
    offset: int = Query(0, ge=0),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
):
    q = db.query(CFPBComplaint)
    if state:
        q = q.filter(CFPBComplaint.state == state.upper())
    if product:
        q = q.filter(CFPBComplaint.product.ilike(f"%{product}%"))
    if company:
        q = q.filter(CFPBComplaint.company.ilike(f"%{company}%"))
    if date_from:
        q = q.filter(CFPBComplaint.date_received >= date_from)
    if date_to:
        q = q.filter(CFPBComplaint.date_received <= date_to)

    total = q.count()
    # Prefer offset param; fall back to page-based calculation
    skip = offset if offset > 0 else (page - 1) * limit
    items = q.offset(skip).limit(limit).all()

    return {
        "complaints": [
            {
                "id": c.id,
                "company": c.company,
                "product": c.product,
                "issue": c.issue,
                "state": c.state,
                "zip_code": c.zip_code,
                "date_received": c.date_received,
                "timely_response": c.timely_response,
                "consumer_disputed": c.consumer_disputed,
                "company_response": c.company_response,
            }
            for c in items
        ],
        "total": total,
        "offset": skip,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
    }


@router.get("/summary")
def get_complaint_summary(db: Session = Depends(get_db)):
    all_complaints = db.query(CFPBComplaint).all()

    by_product: dict[str, int] = {}
    by_company: dict[str, int] = {}
    by_state: dict[str, int] = {}
    by_issue: dict[str, int] = {}
    by_month: dict[str, int] = {}
    by_response: dict[str, int] = {}
    for c in all_complaints:
        if c.product:
            by_product[c.product] = by_product.get(c.product, 0) + 1
        if c.company:
            by_company[c.company] = by_company.get(c.company, 0) + 1
        if c.state:
            by_state[c.state] = by_state.get(c.state, 0) + 1
        if c.issue:
            by_issue[c.issue] = by_issue.get(c.issue, 0) + 1
        if c.company_response:
            by_response[c.company_response] = by_response.get(c.company_response, 0) + 1
        month_key = c.date_received[:7] if c.date_received and len(c.date_received) >= 7 else "unknown"
        by_month[month_key] = by_month.get(month_key, 0) + 1

    total = len(all_complaints)
    with sqlite3.connect(_DB_PATH) as _conn:
        disputed_total = _conn.execute(
            "SELECT COUNT(*) FROM cfpb_complaints WHERE consumer_disputed = 1"
        ).fetchone()[0]
        timely_total = _conn.execute(
            "SELECT COUNT(*) FROM cfpb_complaints WHERE timely_response = 1"
        ).fetchone()[0]

    top_companies = sorted(by_company.items(), key=lambda x: x[1], reverse=True)[:10]
    monthly_series = sorted(by_month.items())
    avg_monthly = round(total / max(1, len(by_month)), 1) if by_month else 0

    return {
        "total_complaints": total,
        "by_product": [{"product": k, "count": v} for k, v in sorted(by_product.items(), key=lambda x: x[1], reverse=True)],
        "by_company": [{"company": k, "count": v} for k, v in top_companies],
        "by_state": [{"state": k, "count": v} for k, v in sorted(by_state.items(), key=lambda x: x[1], reverse=True)],
        "by_issue": [{"issue": k, "count": v} for k, v in sorted(by_issue.items(), key=lambda x: x[1], reverse=True)],
        "by_response": [{"response": k, "count": v} for k, v in sorted(by_response.items(), key=lambda x: x[1], reverse=True)],
        "monthly_trend": [{"month": k, "count": v} for k, v in monthly_series],
        "dispute_rate": round(disputed_total / max(1, total), 4),
        "timely_response_rate": round(timely_total / max(1, total), 4),
        "avg_monthly": avg_monthly,
        "available_products": sorted(by_product.keys()),
        "available_states": sorted([s for s in by_state.keys() if s]),
    }
