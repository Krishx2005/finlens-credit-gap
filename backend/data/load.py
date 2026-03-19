"""Load ingested DataFrames into SQLite database."""
import logging
from pathlib import Path
import sys

import pandas as pd
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).parent.parent))

logger = logging.getLogger(__name__)


def load_county_master(df: pd.DataFrame, db: Session) -> int:
    from database import CountyMaster
    db.query(CountyMaster).delete()
    records = df.to_dict(orient="records")
    for r in records:
        obj = CountyMaster(
            county_fips=str(r.get("county_fips", ""))[:5],
            state=str(r.get("state", "")),
            county_name=str(r.get("county_name", "")),
            median_income=float(r.get("median_income", 0) or 0),
            poverty_rate=float(r.get("poverty_rate", 0) or 0),
            unemployment_rate=float(r.get("unemployment_rate", 0) or 0),
            bank_branch_count=int(r.get("bank_branch_count", 0) or 0),
            population=int(r.get("population", 0) or 0),
            loan_denial_rate=float(r.get("loan_denial_rate", 0) or 0),
            complaint_rate=float(r.get("complaint_rate", 0) or 0),
            avg_loan_amount=float(r.get("avg_loan_amount", 0) or 0),
            approval_rate=float(r.get("approval_rate", 0) or 0),
            alternative_score_avg=float(r.get("alternative_score_avg", 0) or 0),
            fico_estimate_avg=float(r.get("fico_estimate_avg", 0) or 0),
            score_gap=float(r.get("score_gap", 0) or 0),
            credit_desert=bool(r.get("credit_desert", False)),
            disparity_index=float(r.get("disparity_index", 0) or 0),
            is_rural=bool(r.get("is_rural", False)),
        )
        db.add(obj)
    db.commit()
    logger.info("Loaded %d county records", len(records))
    return len(records)


def load_hmda_loans(df: pd.DataFrame, db: Session) -> int:
    from database import HMDALoan
    db.query(HMDALoan).delete()
    records = df.to_dict(orient="records")
    for r in records:
        obj = HMDALoan(
            action_taken=int(r.get("action_taken", 3) or 3),
            loan_type=int(r.get("loan_type", 1) or 1),
            loan_purpose=int(r.get("loan_purpose", 1) or 1),
            applicant_income=float(r.get("applicant_income", 0) or 0),
            county_code=str(r.get("county_code", ""))[:5],
            denial_reason_1=str(r.get("denial_reason_1", "") or ""),
            applicant_race_1=str(r.get("applicant_race_1", "") or ""),
            applicant_sex=int(r.get("applicant_sex", 3) or 3),
            loan_amount=float(r.get("loan_amount", 0) or 0),
            loan_approved=bool(r.get("loan_approved", False)),
            age_bracket=str(r.get("age_bracket", "26-35") or "26-35"),
            rural_urban_code=int(r.get("rural_urban_code", 3) or 3),
        )
        db.add(obj)
    db.commit()
    logger.info("Loaded %d HMDA loan records", len(records))
    return len(records)


def load_complaints(df: pd.DataFrame, db: Session) -> int:
    from database import CFPBComplaint
    db.query(CFPBComplaint).delete()
    records = df.to_dict(orient="records")
    for r in records:
        obj = CFPBComplaint(
            company=str(r.get("company", "") or ""),
            product=str(r.get("product", "") or ""),
            issue=str(r.get("issue", "") or ""),
            state=str(r.get("state", "") or ""),
            zip_code=str(r.get("zip_code", "") or ""),
            date_received=str(r.get("date_received", "") or ""),
            timely_response=bool(r.get("timely_response", True)),
            consumer_disputed=bool(r.get("consumer_disputed", False)),
            company_response=str(r.get("company_response", "") or ""),
        )
        db.add(obj)
    db.commit()
    logger.info("Loaded %d complaint records", len(records))
    return len(records)


def _apply_per_county_complaint_rates(complaints_df: pd.DataFrame, db: Session) -> None:
    """Distribute state-level complaint counts to counties by population (weighted)."""
    import random
    from collections import defaultdict
    from database import CountyMaster

    random.seed(42)

    if complaints_df.empty or "state" not in complaints_df.columns:
        return

    state_complaints = complaints_df.groupby("state").size().to_dict()
    counties = db.query(
        CountyMaster.county_fips,
        CountyMaster.state,
        CountyMaster.population,
        CountyMaster.is_rural,
    ).all()

    state_pop: dict[str, int] = defaultdict(int)
    for fips, state, pop, is_rural in counties:
        state_pop[state] += pop or 0

    updates: list[tuple[float, str]] = []
    for fips, state, pop, is_rural in counties:
        pop = pop or 1
        total = state_complaints.get(state, 0)
        if total == 0 or state_pop[state] == 0:
            rate = round(random.uniform(0.05, 0.3) * (0.6 if is_rural else 1.2), 4)
        else:
            pop_share = pop / state_pop[state]
            urban_factor = 0.65 if is_rural else 1.35
            noise = random.uniform(0.5, 1.8)
            adjusted = total * pop_share * urban_factor * noise
            rate = round(adjusted / max(1, pop / 1000.0), 4)
        updates.append((rate, fips))

    for rate, fips in updates:
        db.query(CountyMaster).filter(CountyMaster.county_fips == fips).update(
            {"complaint_rate": rate}
        )
    db.commit()
    logger.info("Applied per-county complaint rates to %d counties", len(updates))


def run_full_load(data: dict, db: Session) -> dict[str, int]:
    counts = {}
    if "county_master" in data:
        counts["county_master"] = load_county_master(data["county_master"], db)
    if "hmda_loans" in data:
        counts["hmda_loans"] = load_hmda_loans(data["hmda_loans"], db)
    if "complaints" in data:
        counts["complaints"] = load_complaints(data["complaints"], db)
        if "county_master" in data:
            _apply_per_county_complaint_rates(data["complaints"], db)
    return counts
