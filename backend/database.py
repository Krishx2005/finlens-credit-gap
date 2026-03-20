"""SQLite + SQLAlchemy database setup for FinLens."""
import os
from pathlib import Path
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, Text, create_engine
)
try:
    from sqlalchemy.orm import declarative_base
except ImportError:
    from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

DATABASE_PATH = Path(__file__).parent / "finlens.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATABASE_PATH}")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=NullPool,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class CountyMaster(Base):
    __tablename__ = "county_master"

    county_fips = Column(String(5), primary_key=True)
    state = Column(String(2))
    county_name = Column(String(100))
    median_income = Column(Float)
    poverty_rate = Column(Float)
    unemployment_rate = Column(Float)
    bank_branch_count = Column(Integer)
    population = Column(Integer)
    loan_denial_rate = Column(Float)
    complaint_rate = Column(Float)
    avg_loan_amount = Column(Float)
    approval_rate = Column(Float)
    alternative_score_avg = Column(Float)
    fico_estimate_avg = Column(Float)
    score_gap = Column(Float)
    credit_desert = Column(Boolean, default=False)
    disparity_index = Column(Float, default=0.0)
    is_rural = Column(Boolean, default=False)


class HMDALoan(Base):
    __tablename__ = "hmda_loans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    action_taken = Column(Integer)
    loan_type = Column(Integer)
    loan_purpose = Column(Integer)
    applicant_income = Column(Float)
    county_code = Column(String(5))
    denial_reason_1 = Column(String(50))
    applicant_race_1 = Column(String(50))
    applicant_sex = Column(Integer)
    loan_amount = Column(Float)
    loan_approved = Column(Boolean)
    age_bracket = Column(String(20))
    rural_urban_code = Column(Integer)


class CFPBComplaint(Base):
    __tablename__ = "cfpb_complaints"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company = Column(String(200))
    product = Column(String(100))
    issue = Column(String(200))
    state = Column(String(2))
    zip_code = Column(String(10))
    date_received = Column(String(20))
    timely_response = Column(Boolean)
    consumer_disputed = Column(Boolean)
    company_response = Column(String(100))


class FDICBranch(Base):
    __tablename__ = "fdic_branches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    county_fips = Column(String(5))
    county = Column(String(100))
    state = Column(String(2))
    offices = Column(Integer)



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables and enable WAL mode."""
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        conn.execute(__import__("sqlalchemy").text("PRAGMA journal_mode=WAL"))
        conn.execute(__import__("sqlalchemy").text("PRAGMA synchronous=NORMAL"))
