"""FinLens FastAPI application."""
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).parent.parent / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and seed data on startup."""
    from database import init_db, SessionLocal
    from data.ingest import ingest_all, get_sources_status
    from data.load import run_full_load
    from models.alternative_score import train_model, load_model

    logger.info("FinLens starting up...")
    init_db()

    db = SessionLocal()
    try:
        from database import CountyMaster
        count = db.query(CountyMaster).count()
        if count == 0:
            logger.info("Database empty — ingesting data...")
            data = ingest_all()
            counts = run_full_load(data, db)
            logger.info("Data loaded: %s", counts)
        else:
            logger.info("Database has %d counties — skipping ingest", count)

        from database import HMDALoan
        from models.alternative_score import MODEL_PATH
        loan_count = db.query(HMDALoan).count()
        if loan_count >= 50 and not MODEL_PATH.exists():
            logger.info("Training scoring model...")
            train_model(db)
        elif MODEL_PATH.exists():
            load_model()
            logger.info("Scoring model loaded from disk")

    except Exception as exc:
        logger.error("Startup error: %s", exc)
    finally:
        db.close()

    logger.info("FinLens ready")
    yield
    logger.info("FinLens shutting down")


app = FastAPI(
    title="FinLens API",
    description="Alternative credit scoring and financial disparity analytics",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend origins
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    os.getenv("FRONTEND_URL", ""),
]
allowed_origins = [o for o in allowed_origins if o]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

# Register routers
from routes.scores import router as scores_router
from routes.geography import router as geography_router
from routes.complaints import router as complaints_router
from routes.nlquery import router as nlquery_router
from routes.reports import router as reports_router

app.include_router(scores_router)
app.include_router(geography_router)
app.include_router(complaints_router)
app.include_router(nlquery_router)
app.include_router(reports_router)


@app.get("/")
def root():
    return {"name": "FinLens API", "tagline": "What FICO doesn't tell you.", "version": "1.0.0"}


@app.get("/health")
def health():
    from database import SessionLocal, CountyMaster, HMDALoan, CFPBComplaint
    db = SessionLocal()
    try:
        return {
            "status": "ok",
            "counties": db.query(CountyMaster).count(),
            "loans": db.query(HMDALoan).count(),
            "complaints": db.query(CFPBComplaint).count(),
        }
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
