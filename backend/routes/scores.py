"""Credit score API routes."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models.alternative_score import calculate_score

router = APIRouter(prefix="/api/scores", tags=["scores"])


class ScoreRequest(BaseModel):
    income: float = Field(..., gt=0, description="Annual income in USD")
    loan_amount: float = Field(..., gt=0, description="Requested loan amount in USD")
    county_fips: str = Field(..., min_length=5, max_length=5, description="5-digit county FIPS code")
    age_bracket: str = Field(..., description="Age bracket: 18-25, 26-35, 36-50, 51-65, 65+")
    employment_type: str = Field(..., description="Employment type")


class ScoreResponse(BaseModel):
    alternative_score: int
    fico_estimate: int
    score_gap: int
    grade: str
    approval_probability: float
    score_breakdown: dict
    explanation: str
    county_name: str
    is_rural: bool


@router.post("/calculate", response_model=ScoreResponse)
def calculate_credit_score(request: ScoreRequest, db: Session = Depends(get_db)):
    """Calculate alternative credit score for an applicant."""
    valid_age_brackets = {"18-25", "26-35", "36-50", "51-65", "65+"}
    if request.age_bracket not in valid_age_brackets:
        raise HTTPException(status_code=422, detail=f"age_bracket must be one of {valid_age_brackets}")

    valid_employment = {"employed", "self_employed", "part_time", "gig_worker", "retired"}
    if request.employment_type not in valid_employment:
        raise HTTPException(status_code=422, detail=f"employment_type must be one of {valid_employment}")

    result = calculate_score(
        income=request.income,
        loan_amount=request.loan_amount,
        county_fips=request.county_fips,
        age_bracket=request.age_bracket,
        employment_type=request.employment_type,
        db_session=db,
    )
    return result


@router.get("/demo")
def get_demo_scores(db: Session = Depends(get_db)):
    """Return pre-computed contrasting applicant examples."""
    demo_profiles = [
        {
            "label": "Young Rural Borrower",
            "income": 52000,
            "loan_amount": 220000,
            "county_fips": "30031",
            "age_bracket": "18-25",
            "employment_type": "employed",
        },
        {
            "label": "Urban Mid-Career Professional",
            "income": 95000,
            "loan_amount": 380000,
            "county_fips": "06037",
            "age_bracket": "36-50",
            "employment_type": "employed",
        },
        {
            "label": "Rural Gig Worker",
            "income": 38000,
            "loan_amount": 145000,
            "county_fips": "56021",
            "age_bracket": "26-35",
            "employment_type": "gig_worker",
        },
        {
            "label": "Suburban Retiree",
            "income": 72000,
            "loan_amount": 180000,
            "county_fips": "06085",
            "age_bracket": "65+",
            "employment_type": "retired",
        },
        {
            "label": "Rural Self-Employed",
            "income": 61000,
            "loan_amount": 210000,
            "county_fips": "28049",
            "age_bracket": "36-50",
            "employment_type": "self_employed",
        },
    ]

    results = []
    for profile in demo_profiles:
        label = profile.pop("label")
        try:
            result = calculate_score(**profile, db_session=db)
            result["label"] = label
            results.append(result)
        except Exception:
            pass
    return {"profiles": results}


@router.get("/model-info")
def get_model_info():
    """Return model metadata."""
    from models.alternative_score import load_model
    model_data = load_model()
    return {
        "model_type": "RandomForestClassifier",
        "features": [
            "county_income_ratio", "bank_access_score", "area_stability_score",
            "complaint_burden_score", "loan_to_income_ratio", "geographic_risk_score",
            "rural_urban_code", "age_bracket_encoded",
        ],
        "trained": model_data is not None,
        "accuracy": model_data.get("accuracy") if model_data else None,
        "auc": model_data.get("auc") if model_data else None,
        "score_range": "300-850",
        "methodology": (
            "Alternative scoring uses structural socioeconomic indicators "
            "instead of traditional credit history, capturing creditworthiness "
            "for young and rural borrowers underserved by FICO."
        ),
    }
