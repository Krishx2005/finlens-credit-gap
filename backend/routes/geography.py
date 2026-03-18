"""Geographic disparity API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db, CountyMaster

router = APIRouter(prefix="/api/geography", tags=["geography"])


def _county_to_dict(c: CountyMaster) -> dict:
    return {
        "county_fips": c.county_fips,
        "state": c.state,
        "county_name": c.county_name,
        "median_income": c.median_income,
        "poverty_rate": c.poverty_rate,
        "unemployment_rate": c.unemployment_rate,
        "bank_branch_count": c.bank_branch_count,
        "population": c.population,
        "loan_denial_rate": c.loan_denial_rate,
        "complaint_rate": c.complaint_rate,
        "avg_loan_amount": c.avg_loan_amount,
        "approval_rate": c.approval_rate,
        "alternative_score_avg": c.alternative_score_avg,
        "fico_estimate_avg": c.fico_estimate_avg,
        "score_gap": c.score_gap,
        "credit_desert": c.credit_desert,
        "disparity_index": c.disparity_index,
        "is_rural": c.is_rural,
    }


@router.get("/counties")
def get_all_counties(db: Session = Depends(get_db)):
    """Return all counties with disparity metrics."""
    counties = db.query(CountyMaster).all()
    return {"counties": [_county_to_dict(c) for c in counties], "total": len(counties)}


@router.get("/county/{fips}")
def get_county(fips: str, db: Session = Depends(get_db)):
    """Return full profile for one county."""
    if len(fips) != 5 or not fips.isdigit():
        raise HTTPException(status_code=422, detail="FIPS code must be 5 digits")
    county = db.query(CountyMaster).filter_by(county_fips=fips).first()
    if not county:
        raise HTTPException(status_code=404, detail=f"County {fips} not found")
    return _county_to_dict(county)


@router.get("/disparities")
def get_top_disparities(db: Session = Depends(get_db)):
    """Return top 50 most underscored counties (high alternative score + high denial rate)."""
    counties = db.query(CountyMaster).order_by(
        CountyMaster.disparity_index.desc()
    ).limit(50).all()
    return {
        "counties": [_county_to_dict(c) for c in counties],
        "description": "Counties with highest disparity between alternative creditworthiness and loan denial rates",
    }


@router.get("/credit-deserts")
def get_credit_deserts(db: Session = Depends(get_db)):
    """Return counties where denial rate > 40%, income > $40K, branches/1000 < 2."""
    counties = db.query(CountyMaster).filter(
        CountyMaster.loan_denial_rate > 0.40,
        CountyMaster.median_income > 40000,
    ).all()

    deserts = []
    for c in counties:
        branches_per_1000 = c.bank_branch_count / max(1, c.population / 1000)
        if branches_per_1000 < 2:
            d = _county_to_dict(c)
            d["branches_per_1000"] = round(branches_per_1000, 3)
            deserts.append(d)

    return {
        "credit_deserts": deserts,
        "count": len(deserts),
        "definition": "Counties where loan denial rate > 40%, median income > $40K, and bank branches per 1,000 residents < 2",
    }


@router.get("/summary")
def get_geographic_summary(db: Session = Depends(get_db)):
    """Return national-level summary statistics."""
    counties = db.query(CountyMaster).all()
    if not counties:
        return {}

    rural = [c for c in counties if c.is_rural]
    urban = [c for c in counties if not c.is_rural]
    deserts = [c for c in counties if c.credit_desert]

    def avg(items, attr):
        vals = [getattr(i, attr) for i in items if getattr(i, attr) is not None]
        return round(sum(vals) / len(vals), 2) if vals else 0

    rural_denial = avg(rural, "loan_denial_rate")
    urban_denial = avg(urban, "loan_denial_rate")
    rural_score = avg(rural, "alternative_score_avg")
    urban_score = avg(urban, "alternative_score_avg")

    return {
        "total_counties": len(counties),
        "credit_deserts": len(deserts),
        "rural_counties": len(rural),
        "urban_counties": len(urban),
        "avg_denial_rate_rural": rural_denial,
        "avg_denial_rate_urban": urban_denial,
        "rural_denial_premium": round(rural_denial - urban_denial, 4),
        "avg_alternative_score_rural": rural_score,
        "avg_alternative_score_urban": urban_score,
        "avg_score_gap_rural": avg(rural, "score_gap"),
        "avg_score_gap_urban": avg(urban, "score_gap"),
        "avg_disparity_index": avg(counties, "disparity_index"),
    }
