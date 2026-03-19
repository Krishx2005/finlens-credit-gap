"""Anthropic Claude API service for NL-to-SQL queries."""
import hashlib
import json
import logging
import os
import re
from datetime import datetime
from pathlib import Path

import sqlparse

logger = logging.getLogger(__name__)

ALLOWED_TABLES = {"county_master", "hmda_loans", "cfpb_complaints", "fdic_branches", "query_cache"}
BLOCKED_KEYWORDS = {"INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE", "REPLACE", "PRAGMA"}

DB_SCHEMA = """
Tables available (SQLite):

county_master:
  county_fips TEXT PRIMARY KEY  -- 5-digit FIPS code
  state TEXT                    -- 2-letter state abbreviation
  county_name TEXT
  median_income REAL            -- Median household income in USD
  poverty_rate REAL             -- 0.0 to 1.0
  unemployment_rate REAL        -- 0.0 to 1.0
  bank_branch_count INTEGER
  population INTEGER
  loan_denial_rate REAL         -- 0.0 to 1.0
  complaint_rate REAL           -- complaints per 1000 residents
  avg_loan_amount REAL
  approval_rate REAL            -- 0.0 to 1.0
  alternative_score_avg REAL   -- FinLens alternative score 300-850
  fico_estimate_avg REAL        -- Estimated FICO equivalent
  score_gap REAL                -- alternative_score_avg - fico_estimate_avg
  credit_desert BOOLEAN         -- True if denial>40% AND income>$40K AND branches<2/1000
  disparity_index REAL          -- 0-100 composite disparity score
  is_rural BOOLEAN

hmda_loans:
  id INTEGER PRIMARY KEY
  action_taken INTEGER          -- 1=approved, 3=denied
  loan_type INTEGER
  loan_purpose INTEGER
  applicant_income REAL
  county_code TEXT              -- FK to county_master.county_fips
  denial_reason_1 TEXT
  applicant_race_1 TEXT
  applicant_sex INTEGER
  loan_amount REAL
  loan_approved BOOLEAN
  age_bracket TEXT              -- '18-25','26-35','36-50','51-65','65+'
  rural_urban_code INTEGER      -- 1=urban, 9=most rural

cfpb_complaints:
  id INTEGER PRIMARY KEY
  company TEXT
  product TEXT
  issue TEXT
  state TEXT
  zip_code TEXT
  date_received TEXT
  timely_response BOOLEAN
  consumer_disputed BOOLEAN
  company_response TEXT
"""

SYSTEM_PROMPT = f"""You are a financial data analyst with access to a US mortgage, credit, and banking database.

{DB_SCHEMA}

Rules:
1. Generate ONLY valid SQLite SELECT statements — no INSERT, UPDATE, DELETE, DROP, ALTER, or CREATE.
2. Use ONLY the tables listed above.
3. Output the SQL query first, on its own line, with no markdown formatting or backticks.
4. Keep queries efficient — use LIMIT when appropriate (default LIMIT 100).
5. After the SQL, add a blank line and then write a 2-3 sentence explanation of what the query finds, written like a senior analyst presenting to executives.
6. End with: CHART_TYPE: [bar|line|scatter|table|pie] (pick the best visualization).

Example output format:
SELECT state, AVG(loan_denial_rate) as avg_denial FROM county_master WHERE is_rural = 1 GROUP BY state ORDER BY avg_denial DESC LIMIT 10;

Rural loan denial rates vary significantly by state. The top 10 states show denial rates 15-25 percentage points above the national average, concentrated in the Southeast and Appalachian regions. This pattern suggests geographic clustering of credit access barriers beyond individual creditworthiness.

CHART_TYPE: bar"""


def _validate_sql(sql: str) -> tuple[bool, str]:
    sql_upper = sql.upper()
    for kw in BLOCKED_KEYWORDS:
        if re.search(rf"\b{kw}\b", sql_upper):
            return False, f"SQL contains forbidden keyword: {kw}"

    if not sql_upper.strip().startswith("SELECT"):
        return False, "SQL must start with SELECT"

    if "FROM" not in sql_upper:
        return False, "SQL missing FROM clause"

    if len(sql) > 3000:
        return False, "SQL query too long (max 3000 chars)"

    return True, ""


def _extract_sql_and_explanation(response_text: str) -> tuple[str, str, str]:
    lines = response_text.strip().split("\n")

    sql_lines = []
    explanation_lines = []
    chart_type = "table"
    in_sql = False
    in_explanation = False

    for line in lines:
        stripped = line.strip()
        if stripped.upper().startswith("CHART_TYPE:"):
            chart_type = stripped.split(":", 1)[1].strip().lower()
            continue
        # Strip markdown code fences
        if stripped.startswith("```"):
            continue
        if not in_sql and stripped.upper().startswith("SELECT"):
            in_sql = True
            sql_lines.append(stripped)
        elif in_sql and not in_explanation:
            if stripped == "":
                in_explanation = True
            else:
                sql_lines.append(stripped)
        elif in_explanation and stripped:
            explanation_lines.append(stripped)

    sql = " ".join(sql_lines).strip()
    explanation = " ".join(explanation_lines).strip()
    return sql, explanation, chart_type


def _hash_question(question: str) -> str:
    return hashlib.sha256(question.lower().strip().encode()).hexdigest()


def query_with_claude(question: str, db_session) -> dict:
    """Process a natural language question and return SQL results + explanation."""
    # Cache disabled — always call Claude directly
    # from database import QueryCache
    # question_hash = _hash_question(question)
    # cached = db_session.query(QueryCache).filter_by(question_hash=question_hash).first()
    # if cached: ...

    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        return _mock_nl_response(question)

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        def _call_claude(messages):
            return client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=2048,
                system=SYSTEM_PROMPT,
                messages=messages,
            ).content[0].text

        response_text = _call_claude([{"role": "user", "content": question}])
    except Exception as exc:
        logger.warning("Claude API call failed: %s", exc)
        return _mock_nl_response(question)

    sql, explanation, chart_type = _extract_sql_and_explanation(response_text)

    # If FROM is missing the response was likely truncated — retry once with a stricter prompt
    if not sql or "FROM" not in sql.upper():
        logger.warning("SQL missing FROM clause, retrying with stricter prompt")
        try:
            retry_text = _call_claude([
                {"role": "user", "content": question},
                {"role": "assistant", "content": response_text},
                {"role": "user", "content": "Your SQL was incomplete — it was missing the FROM clause. Rewrite the complete SQL query on a single line starting with SELECT and including FROM, WHERE (if needed), GROUP BY (if needed), ORDER BY, and LIMIT."},
            ])
            sql, explanation, chart_type = _extract_sql_and_explanation(retry_text)
        except Exception as exc:
            logger.warning("Retry failed: %s", exc)

    if not sql:
        return {
            "question": question,
            "sql": "",
            "results": [],
            "explanation": "Could not generate a valid SQL query for this question.",
            "chart_type": "table",
            "cached": False,
        }

    valid, error_msg = _validate_sql(sql)
    if not valid:
        logger.warning("SQL validation failed: %s | SQL: %s", error_msg, sql)
        return {
            "question": question,
            "sql": sql,
            "results": [],
            "explanation": f"Query validation failed: {error_msg}",
            "chart_type": "table",
            "cached": False,
        }

    # Execute against read-only connection
    results = _execute_sql(sql)

    # Cache write disabled
    # try:
    #     cache_entry = QueryCache(...)
    #     db_session.add(cache_entry)
    #     db_session.commit()
    # except Exception as exc:
    #     logger.warning("Failed to cache query: %s", exc)
    #     db_session.rollback()

    return {
        "question": question,
        "sql": sql,
        "results": results,
        "explanation": explanation,
        "chart_type": chart_type,
        "cached": False,
    }


def _execute_sql(sql: str) -> list[dict]:
    """Execute validated SQL against a read-only SQLite connection."""
    import sqlite3
    from pathlib import Path

    db_path = Path(__file__).parent.parent / "data" / "finlens.db"
    if not db_path.exists():
        return []

    try:
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(sql)
        rows = cursor.fetchmany(500)
        conn.close()
        return [dict(row) for row in rows]
    except Exception as exc:
        logger.warning("SQL execution failed: %s", exc)
        return []


def _mock_nl_response(question: str) -> dict:
    """Return a mock response when Claude API is unavailable."""
    q_lower = question.lower()

    if "denial" in q_lower and "rural" in q_lower:
        sql = "SELECT state, AVG(loan_denial_rate) as avg_denial_rate, COUNT(*) as county_count FROM county_master WHERE is_rural = 1 GROUP BY state ORDER BY avg_denial_rate DESC LIMIT 10;"
        explanation = "Rural counties show significantly elevated loan denial rates concentrated in specific states. This pattern reflects structural barriers including limited banking access and income volatility in agricultural economies. The data suggests geographic clustering of credit access problems beyond individual creditworthiness factors."
        chart_type = "bar"
    elif "complaint" in q_lower:
        sql = "SELECT state, AVG(complaint_rate) as avg_complaints FROM county_master GROUP BY state ORDER BY avg_complaints DESC LIMIT 10;"
        explanation = "Consumer complaint rates vary substantially by state, with some states showing rates 3x the national average. High complaint concentrations often correlate with states that have fewer consumer protection resources or higher populations of underserved borrowers."
        chart_type = "bar"
    elif "score" in q_lower or "gap" in q_lower:
        sql = "SELECT county_name, state, alternative_score_avg, fico_estimate_avg, score_gap FROM county_master WHERE score_gap > 30 ORDER BY score_gap DESC LIMIT 20;"
        explanation = "Counties where the alternative score significantly exceeds the FICO estimate represent areas where traditional credit scoring most undervalues local borrowers. These gaps are largest in rural communities with strong economic fundamentals but limited credit history infrastructure."
        chart_type = "scatter"
    else:
        sql = "SELECT state, AVG(loan_denial_rate) as denial_rate, AVG(median_income) as median_income, COUNT(*) as counties FROM county_master GROUP BY state ORDER BY denial_rate DESC LIMIT 15;"
        explanation = "Loan denial rates show an inverse relationship with median income at the state level, but with significant exceptions where high-income states still exhibit elevated denial rates in rural pockets. This suggests income alone is insufficient to explain credit access disparities."
        chart_type = "scatter"

    results = _execute_sql(sql)
    return {
        "question": question,
        "sql": sql,
        "results": results,
        "explanation": explanation,
        "chart_type": chart_type,
        "cached": False,
        "mock": True,
    }


EXAMPLE_QUERIES = [
    {
        "id": 1,
        "question": "Which states have the highest loan denial rates for rural counties?",
        "category": "geography",
    },
    {
        "id": 2,
        "question": "Top 10 counties with highest complaint rates",
        "category": "complaints",
    },
    {
        "id": 3,
        "question": "Show income vs approval rate correlation across counties",
        "category": "correlation",
    },
    {
        "id": 4,
        "question": "Counties where alternative score gap exceeds 50 points",
        "category": "disparity",
    },
    {
        "id": 5,
        "question": "Which companies receive the most consumer complaints?",
        "category": "complaints",
    },
    {
        "id": 6,
        "question": "How do loan denial rates differ between age brackets?",
        "category": "demographics",
    },
    {
        "id": 7,
        "question": "Which counties are credit deserts and what is their population?",
        "category": "geography",
    },
    {
        "id": 8,
        "question": "States with largest rural vs urban denial rate gap",
        "category": "disparity",
    },
]
