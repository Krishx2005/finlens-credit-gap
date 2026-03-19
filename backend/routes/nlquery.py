"""Natural language to SQL query routes."""
import os
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from services.claude_service import query_with_claude, EXAMPLE_QUERIES

router = APIRouter(prefix="/api/query", tags=["nlquery"])


class QueryRequest(BaseModel):
    question: str = Field(..., min_length=5, max_length=500)


@router.post("")
def run_nl_query(request: QueryRequest, db: Session = Depends(get_db)):
    return query_with_claude(request.question, db)


@router.get("/examples")
def get_example_queries():
    return {"examples": EXAMPLE_QUERIES}
