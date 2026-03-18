"""Data ingestion pipeline — downloads federal datasets with mock fallbacks."""
import logging
import os
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).parent.parent))
from mock_data import (
    generate_complaints,
    generate_county_master,
    generate_hmda_loans,
)

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent
USE_MOCK = os.getenv("USE_MOCK_DATA", "true").lower() == "true"

SOURCES_STATUS: dict[str, str] = {}


def _load_cfpb_complaints() -> pd.DataFrame:
    """Download CFPB complaints or fall back to mock."""
    if USE_MOCK:
        logger.info("CFPB complaints: using mock data")
        SOURCES_STATUS["cfpb_complaints"] = "mock"
        records = generate_complaints(500)
        return pd.DataFrame(records)

    try:
        import requests, zipfile, io
        url = "https://files.consumerfinance.gov/ccdb/complaints.csv.zip"
        logger.info("Downloading CFPB complaints (this may take a while)...")
        resp = requests.get(url, stream=True, timeout=120)
        resp.raise_for_status()
        with zipfile.ZipFile(io.BytesIO(resp.content)) as z:
            name = [n for n in z.namelist() if n.endswith(".csv")][0]
            df = pd.read_csv(z.open(name), low_memory=False)

        cols = {
            "Company": "company",
            "Product": "product",
            "Issue": "issue",
            "State": "state",
            "ZIP code": "zip_code",
            "Date received": "date_received",
            "Timely response?": "timely_response",
            "Consumer disputed?": "consumer_disputed",
            "Company response to consumer": "company_response",
        }
        df = df.rename(columns=cols)[list(cols.values())]
        cutoff = pd.Timestamp.now() - pd.DateOffset(years=2)
        df["date_received"] = pd.to_datetime(df["date_received"], errors="coerce")
        df = df[df["date_received"] >= cutoff]
        df["timely_response"] = df["timely_response"] == "Yes"
        df["consumer_disputed"] = df["consumer_disputed"] == "Yes"
        df["date_received"] = df["date_received"].dt.strftime("%Y-%m-%d")
        SOURCES_STATUS["cfpb_complaints"] = "real"
        return df.head(50000)
    except Exception as exc:
        logger.warning("CFPB complaints download failed (%s) — using mock", exc)
        SOURCES_STATUS["cfpb_complaints"] = "mock_fallback"
        return pd.DataFrame(generate_complaints(500))


def _load_hmda_loans() -> pd.DataFrame:
    """Load HMDA loan data or fall back to mock."""
    if USE_MOCK:
        logger.info("HMDA loans: using mock data")
        SOURCES_STATUS["hmda_loans"] = "mock"
        return pd.DataFrame(generate_hmda_loans(1000))

    try:
        logger.info("Fetching HMDA data via CFPB API...")
        import requests
        # HMDA 2022 national sample via CFPB data browser
        base = "https://ffiec.cfpb.gov/api/public/hmda/institutions/snapshot"
        params = {"year": 2022, "page": 1, "size": 500}
        resp = requests.get(base, params=params, timeout=60)
        resp.raise_for_status()
        data = resp.json().get("institutions", [])
        if not data:
            raise ValueError("Empty HMDA response")
        df = pd.DataFrame(data)
        SOURCES_STATUS["hmda_loans"] = "real"
        return df
    except Exception as exc:
        logger.warning("HMDA download failed (%s) — using mock", exc)
        SOURCES_STATUS["hmda_loans"] = "mock_fallback"
        return pd.DataFrame(generate_hmda_loans(1000))


def _load_census_acs() -> pd.DataFrame:
    """Load Census ACS county-level data or fall back to county_master mock."""
    if USE_MOCK:
        logger.info("Census ACS: using mock data")
        SOURCES_STATUS["census_acs"] = "mock"
        return pd.DataFrame(generate_county_master())

    try:
        import requests
        api_key = os.getenv("CENSUS_API_KEY", "")
        url = "https://api.census.gov/data/2022/acs/acs5"
        params = {
            "get": "NAME,B19013_001E,B01002_001E,B17001_002E,B23025_005E",
            "for": "county:*",
        }
        if api_key:
            params["key"] = api_key
        resp = requests.get(url, params=params, timeout=60)
        resp.raise_for_status()
        rows = resp.json()
        headers = rows[0]
        df = pd.DataFrame(rows[1:], columns=headers)
        df = df.rename(columns={
            "NAME": "county_name",
            "B19013_001E": "median_income",
            "B01002_001E": "median_age",
            "B17001_002E": "poverty_count",
            "B23025_005E": "unemployed_count",
            "state": "state_fips",
            "county": "county_fips_suffix",
        })
        df["county_fips"] = df["state_fips"] + df["county_fips_suffix"]
        df["median_income"] = pd.to_numeric(df["median_income"], errors="coerce")
        SOURCES_STATUS["census_acs"] = "real"
        return df
    except Exception as exc:
        logger.warning("Census ACS failed (%s) — using mock", exc)
        SOURCES_STATUS["census_acs"] = "mock_fallback"
        return pd.DataFrame(generate_county_master())


def ingest_all() -> dict[str, pd.DataFrame]:
    """Run full ingestion pipeline, returning DataFrames for each source."""
    logger.info("Starting data ingestion (USE_MOCK_DATA=%s)", USE_MOCK)
    return {
        "complaints": _load_cfpb_complaints(),
        "hmda_loans": _load_hmda_loans(),
        "county_master": _load_census_acs(),
    }


def get_sources_status() -> dict[str, str]:
    return SOURCES_STATUS.copy()
