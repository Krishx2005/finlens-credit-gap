"""Realistic mock data generator for FinLens — used when USE_MOCK_DATA=true."""
import random
from datetime import datetime, timedelta

import numpy as np

random.seed(42)
np.random.seed(42)

US_COUNTIES = [
    ("01001", "AL", "Autauga County", True),
    ("01003", "AL", "Baldwin County", False),
    ("04013", "AZ", "Maricopa County", False),
    ("06037", "CA", "Los Angeles County", False),
    ("06073", "CA", "San Diego County", False),
    ("06085", "CA", "Santa Clara County", False),
    ("08031", "CO", "Denver County", False),
    ("09003", "CT", "Hartford County", False),
    ("12086", "FL", "Miami-Dade County", False),
    ("12057", "FL", "Hillsborough County", False),
    ("13121", "GA", "Fulton County", False),
    ("17031", "IL", "Cook County", False),
    ("18097", "IN", "Marion County", False),
    ("20161", "KS", "Riley County", True),
    ("21111", "KY", "Jefferson County", False),
    ("22071", "LA", "Orleans County", False),
    ("24005", "MD", "Baltimore County", False),
    ("25017", "MA", "Middlesex County", False),
    ("26081", "MI", "Kent County", False),
    ("27053", "MN", "Hennepin County", False),
    ("28049", "MS", "Hinds County", True),
    ("29095", "MO", "Jackson County", False),
    ("30031", "MT", "Gallatin County", True),
    ("31055", "NE", "Douglas County", False),
    ("32003", "NV", "Clark County", False),
    ("34013", "NJ", "Essex County", False),
    ("35001", "NM", "Bernalillo County", False),
    ("36061", "NY", "New York County", False),
    ("36047", "NY", "Kings County", False),
    ("37119", "NC", "Mecklenburg County", False),
    ("39035", "OH", "Cuyahoga County", False),
    ("39049", "OH", "Franklin County", False),
    ("40109", "OK", "Oklahoma County", False),
    ("41051", "OR", "Multnomah County", False),
    ("42101", "PA", "Philadelphia County", False),
    ("44007", "RI", "Providence County", False),
    ("45019", "SC", "Charleston County", False),
    ("47157", "TN", "Shelby County", False),
    ("48201", "TX", "Harris County", False),
    ("48113", "TX", "Dallas County", False),
    ("49035", "UT", "Salt Lake County", False),
    ("51760", "VA", "Richmond City", False),
    ("53033", "WA", "King County", False),
    ("53061", "WA", "Snohomish County", False),
    ("55079", "WI", "Milwaukee County", False),
    ("56021", "WY", "Laramie County", True),
    ("05143", "AR", "Washington County", True),
    ("16001", "ID", "Ada County", False),
    ("23005", "ME", "Cumberland County", True),
    ("24009", "MD", "Calvert County", True),
    ("33011", "NH", "Hillsborough County", False),
    ("38017", "ND", "Cass County", True),
    ("41003", "OR", "Benton County", True),
    ("46099", "SD", "Minnehaha County", True),
    ("50007", "VT", "Chittenden County", True),
    ("54039", "WV", "Kanawha County", True),
    ("02020", "AK", "Anchorage Borough", True),
    ("15003", "HI", "Honolulu County", False),
    ("19153", "IA", "Polk County", False),
    ("21059", "KY", "Daviess County", True),
    ("27137", "MN", "St. Louis County", True),
    ("28073", "MS", "Lamar County", True),
    ("29099", "MO", "Jefferson County", True),
    ("30049", "MT", "Lewis and Clark County", True),
    ("31153", "NE", "Sarpy County", False),
    ("33015", "NH", "Rockingham County", False),
    ("35049", "NM", "Santa Fe County", False),
    ("37067", "NC", "Forsyth County", False),
    ("38065", "ND", "Pembina County", True),
    ("40017", "OK", "Canadian County", False),
    ("41067", "OR", "Washington County", False),
    ("43", "PR", "Ponce Municipio", True),
    ("45045", "SC", "Greenville County", False),
    ("47037", "TN", "Davidson County", False),
    ("48029", "TX", "Bexar County", False),
    ("48303", "TX", "Lubbock County", True),
    ("49049", "UT", "Utah County", False),
    ("51059", "VA", "Fairfax County", False),
    ("53053", "WA", "Pierce County", False),
    ("55025", "WI", "Dane County", False),
    ("56013", "WY", "Fremont County", True),
    ("01073", "AL", "Jefferson County", False),
    ("04021", "AZ", "Pinal County", True),
    ("06065", "CA", "Riverside County", False),
    ("08041", "CO", "El Paso County", False),
    ("09009", "CT", "New Haven County", False),
    ("12103", "FL", "Palm Beach County", False),
    ("13089", "GA", "DeKalb County", False),
    ("17043", "IL", "DuPage County", False),
    ("18089", "IN", "Lake County", False),
    ("20091", "KS", "Johnson County", False),
    ("22033", "LA", "East Baton Rouge Parish", False),
    ("24031", "MD", "Montgomery County", False),
    ("25025", "MA", "Suffolk County", False),
    ("26125", "MI", "Oakland County", False),
    ("27123", "MN", "Ramsey County", False),
    ("29189", "MO", "St. Louis County", False),
    ("32510", "NV", "Carson City", True),
    ("36103", "NY", "Suffolk County", False),
]

COMPANIES = [
    "JPMorgan Chase", "Bank of America", "Wells Fargo", "Citibank",
    "US Bank", "Capital One", "PNC Bank", "TD Bank", "Truist",
    "Citizens Bank", "Regions Bank", "Fifth Third Bank", "KeyBank",
    "Huntington Bank", "First Midwest Bank", "Ally Financial",
    "Discover Financial", "Synchrony Financial", "Navient", "SLM Corporation"
]

PRODUCTS = [
    "Mortgage", "Credit card", "Student loan", "Personal loan",
    "Auto loan", "Checking or savings account", "Payday loan",
    "Debt collection", "Credit reporting", "Money transfer"
]

ISSUES = [
    "Loan modification, collection, foreclosure",
    "Incorrect information on your report",
    "Trouble during payment process",
    "Applying for a mortgage or refinancing",
    "Problem with a credit reporting company's investigation",
    "Charged fees or interest you didn't expect",
    "Unable to get your credit report or credit score",
    "Threatened to take negative or legal action",
    "False statements or representation",
    "Cont'd attempts to collect debt not owed",
]

DENIAL_REASONS = [
    "Credit history", "Debt-to-income ratio", "Collateral",
    "Insufficient cash", "Unverifiable information", "Credit application incomplete",
    "Mortgage insurance denied", "Other"
]

EMPLOYMENT_TYPES = ["employed", "self_employed", "part_time", "gig_worker", "retired"]
AGE_BRACKETS = ["18-25", "26-35", "36-50", "51-65", "65+"]


def _rural_denial_boost(is_rural: bool, age_bracket: str) -> float:
    """Young + rural applicants face systematically higher denial rates."""
    boost = 0.0
    if is_rural:
        boost += 0.12
    if age_bracket in ("18-25", "26-35"):
        boost += 0.08
    if is_rural and age_bracket in ("18-25", "26-35"):
        boost += 0.05
    return boost


def generate_county_master() -> list[dict]:
    """Generate 100 realistic US counties with embedded disparity signals."""
    counties = []
    for fips, state, name, is_rural in US_COUNTIES:
        base_income = random.uniform(35000, 120000)
        if not is_rural:
            base_income *= random.uniform(1.0, 1.6)

        poverty_rate = random.uniform(0.05, 0.28)
        if is_rural:
            poverty_rate *= random.uniform(1.1, 1.5)

        unemployment_rate = random.uniform(0.03, 0.12)
        population = random.randint(5000, 2000000) if not is_rural else random.randint(5000, 150000)
        branches = max(1, int(population / 1000 * random.uniform(0.5, 3.0)))
        if is_rural:
            branches = max(1, int(branches * 0.4))

        base_denial = random.uniform(0.15, 0.35)
        if is_rural:
            base_denial += random.uniform(0.08, 0.18)

        complaint_rate = random.uniform(0.5, 4.0)
        if is_rural:
            complaint_rate *= random.uniform(1.1, 1.4)

        avg_loan = random.uniform(150000, 450000)
        approval_rate = 1.0 - base_denial

        # Alternative scores reflect structural access, not credit history
        alt_score = int(500 + (base_income / 150000) * 200 - poverty_rate * 150
                        - (0 if not is_rural else 30) + random.uniform(-20, 20))
        alt_score = max(300, min(850, alt_score))

        # FICO estimate correlates less with structural factors
        fico_est = int(alt_score + random.uniform(-80, 40))
        if is_rural:
            fico_est -= random.randint(20, 60)
        fico_est = max(300, min(850, fico_est))

        score_gap = alt_score - fico_est

        credit_desert = (base_denial > 0.40 and base_income > 40000
                         and branches / max(1, population / 1000) < 2)

        disparity_index = min(100.0, base_denial * 100 * 0.4
                              + complaint_rate * 5 * 0.3
                              + poverty_rate * 100 * 0.3)

        counties.append({
            "county_fips": fips,
            "state": state,
            "county_name": name,
            "median_income": round(base_income, 2),
            "poverty_rate": round(poverty_rate, 4),
            "unemployment_rate": round(unemployment_rate, 4),
            "bank_branch_count": branches,
            "population": population,
            "loan_denial_rate": round(base_denial, 4),
            "complaint_rate": round(complaint_rate, 4),
            "avg_loan_amount": round(avg_loan, 2),
            "approval_rate": round(approval_rate, 4),
            "alternative_score_avg": alt_score,
            "fico_estimate_avg": fico_est,
            "score_gap": score_gap,
            "credit_desert": credit_desert,
            "disparity_index": round(disparity_index, 2),
            "is_rural": is_rural,
        })
    return counties


def generate_hmda_loans(n: int = 1000) -> list[dict]:
    """Generate HMDA loan records with realistic approval/denial patterns."""
    counties = generate_county_master()
    county_map = {c["county_fips"]: c for c in counties}
    fips_list = list(county_map.keys())

    loans = []
    for i in range(n):
        fips = random.choice(fips_list)
        county = county_map[fips]
        age_bracket = random.choice(AGE_BRACKETS)
        is_rural = county["is_rural"]

        base_income = random.uniform(25000, 200000)
        loan_amount = base_income * random.uniform(2.5, 6.0)

        denial_prob = county["loan_denial_rate"] + _rural_denial_boost(is_rural, age_bracket)
        loan_approved = random.random() > min(0.85, denial_prob)
        action_taken = 1 if loan_approved else 3

        loans.append({
            "action_taken": action_taken,
            "loan_type": random.randint(1, 4),
            "loan_purpose": random.randint(1, 5),
            "applicant_income": round(base_income, 2),
            "county_code": fips,
            "denial_reason_1": random.choice(DENIAL_REASONS) if not loan_approved else None,
            "applicant_race_1": str(random.randint(1, 6)),
            "applicant_sex": random.randint(1, 3),
            "loan_amount": round(loan_amount, 2),
            "loan_approved": loan_approved,
            "age_bracket": age_bracket,
            "rural_urban_code": random.randint(4, 9) if is_rural else random.randint(1, 3),
        })
    return loans


def generate_complaints(n: int = 500) -> list[dict]:
    """Generate CFPB complaint records."""
    complaints = []
    start_date = datetime(2022, 1, 1)
    counties = generate_county_master()
    states = list({c["state"] for c in counties})

    for _ in range(n):
        days_offset = random.randint(0, 730)
        date_received = (start_date + timedelta(days=days_offset)).strftime("%Y-%m-%d")
        timely = random.random() > 0.15
        disputed = random.random() > 0.75

        complaints.append({
            "company": random.choice(COMPANIES),
            "product": random.choice(PRODUCTS),
            "issue": random.choice(ISSUES),
            "state": random.choice(states),
            "zip_code": f"{random.randint(10000, 99999):05d}",
            "date_received": date_received,
            "timely_response": timely,
            "consumer_disputed": disputed,
            "company_response": random.choice([
                "Closed with explanation",
                "Closed with monetary relief",
                "Closed with non-monetary relief",
                "In progress",
                "Untimely response",
            ]),
        })
    return complaints


def generate_alternative_scores(n: int = 50) -> list[dict]:
    """Generate pre-calculated alternative credit score examples."""
    counties = generate_county_master()
    fips_list = [c["county_fips"] for c in counties]
    scores = []

    for _ in range(n):
        fips = random.choice(fips_list)
        county = next(c for c in counties if c["county_fips"] == fips)
        income = random.uniform(30000, 180000)
        loan_amount = income * random.uniform(2.0, 5.5)
        age_bracket = random.choice(AGE_BRACKETS)
        employment = random.choice(EMPLOYMENT_TYPES)

        ratio = income / max(1, county["median_income"])
        branch_score = min(100, county["bank_branch_count"] / max(1, county["population"] / 1000) * 30)
        stability = max(0, 100 - county["unemployment_rate"] * 500)
        complaint_burden = max(0, 100 - county["complaint_rate"] * 10)
        geo_risk = max(0, 100 - county["poverty_rate"] * 200)
        lti = loan_amount / max(1, income)

        raw = (ratio * 150 + branch_score * 0.8 + stability * 0.6
               + complaint_burden * 0.4 + geo_risk * 0.5 - lti * 30)
        alt_score = int(300 + min(550, max(0, raw)))

        fico_est = int(alt_score + random.uniform(-90, 50))
        if county["is_rural"]:
            fico_est -= random.randint(15, 55)
        fico_est = max(300, min(850, fico_est))

        scores.append({
            "county_fips": fips,
            "state": county["state"],
            "income": round(income, 2),
            "loan_amount": round(loan_amount, 2),
            "age_bracket": age_bracket,
            "employment_type": employment,
            "alternative_score": alt_score,
            "fico_estimate": fico_est,
            "score_gap": alt_score - fico_est,
            "approval_probability": min(0.95, max(0.05, 0.5 + (alt_score - 580) / 550)),
            "is_rural": county["is_rural"],
        })
    return scores
