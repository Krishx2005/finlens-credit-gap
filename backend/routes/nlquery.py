"""Natural language to SQL query routes."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import json

from database import get_db, QueryCache
from services.claude_service import query_with_claude, EXAMPLE_QUERIES

router = APIRouter(prefix="/api/query", tags=["nlquery"])


class QueryRequest(BaseModel):
    question: str = Field(..., min_length=5, max_length=500)


@router.post("")
def run_nl_query(request: QueryRequest, db: Session = Depends(get_db)):
    """Process a natural language question against the FinLens database."""
    result = query_with_claude(request.question, db)
    return result


@router.get("/examples")
def get_example_queries():
    """Return curated example queries with pre-computed results."""
    return {"examples": EXAMPLE_QUERIES}


@router.get("/history")
def get_query_history(db: Session = Depends(get_db), limit: int = 20):
    """Return recent cached queries (anonymized)."""
    recent = (
        db.query(QueryCache)
        .order_by(QueryCache.id.desc())
        .limit(min(limit, 50))
        .all()
    )
    return {
        "history": [
            {
                "question": q.question,
                "sql": q.sql,
                "explanation": q.summary,
                "chart_type": q.chart_type,
                "created_at": q.created_at,
            }
            for q in recent
        ]
    }
