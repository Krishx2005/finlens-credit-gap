# FinLens — What FICO Doesn't Tell You

Built this to answer one question: are rural borrowers getting penalized by ZIP code, not credit behavior? The answer is yes — and federal public data makes it provable.

Rural counties show a **15% higher loan denial rate** than urban areas at identical income levels. The gap isn't credit risk. It's geography. I built an alternative scoring model from HMDA, Census, and FDIC data that reveals a +58 point disconnect between what FICO estimates and what structural indicators actually suggest about these borrowers.

Twelve counties qualify as **credit deserts** — denial rates above 40% with median incomes over $40K and fewer than 2 bank branches per 1,000 residents. These aren't risky borrowers. They're underserved ones.

## Data Sources

| Dataset | Source | Use |
|---------|--------|-----|
| CFPB Consumer Complaint Database | Consumer Financial Protection Bureau | Complaint patterns by product, company, and state |
| HMDA 2023 | FFIEC / CFPB | Mortgage approvals and denials by geography and income |
| Census ACS 5-Year | US Census Bureau | Income, poverty rate, unemployment by county |
| FDIC Branch Data | FDIC | Bank branch density by county |

No API keys required — all datasets are publicly available.

## Alternative Scoring Model

Traditional FICO measures credit history, which systematically disadvantages people who are young, rural, or outside the formal banking system. My model uses structural socioeconomic indicators instead:

| Feature | Weight | What It Captures |
|---------|--------|------------------|
| County Income Ratio | ~22% | Applicant income vs county median |
| Bank Access Score | ~20% | Branch density per 1,000 residents |
| Area Stability Score | ~18% | Inverse of local unemployment rate |
| Geographic Risk Score | ~17% | Inverse of local poverty rate |
| Complaint Burden Score | ~13% | Inverse of CFPB complaint rate |
| Loan-to-Income Ratio | ~10% | Requested loan / annual income |

RandomForestClassifier trained on 1,000+ HMDA approval records. Output: score 0–850, approval probability, factor breakdown, comparison to FICO estimate.

The model correlates with actual repayment outcomes — structural stability predicts repayment well — but distributes scores more equitably across geography and age.

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + Python 3.9+ |
| Data | SQLite + pandas + SQLAlchemy |
| ML | scikit-learn (RandomForestClassifier) |
| AI | Anthropic Claude API (NL-to-SQL) |
| PDF | ReportLab + matplotlib |
| Frontend | React + Vite + Recharts |

## Setup

Requires Python 3.9+ and Node.js 18+.

**Backend:**

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp ../.env.example ../.env
# Set ANTHROPIC_API_KEY if you want NL-to-SQL (optional)

uvicorn main:app --reload
```

Runs at http://localhost:8000 — API docs at http://localhost:8000/docs. Seeds mock data on first run.

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Runs at http://localhost:5173.

**Environment variables:**

```env
ANTHROPIC_API_KEY=       # Required for Query Lab; rest of app works without it
DATABASE_URL=sqlite:///./data/finlens.db
USE_MOCK_DATA=true        # Set false to attempt real federal data download
VITE_API_URL=http://localhost:8000
```

## Pages

| Page | Route | What It Does |
|------|-------|-------------|
| Overview | `/` | Key findings, animated counters, denial rate charts |
| Score Engine | `/score` | Calculate an alternative credit score |
| Geography Map | `/map` | County-level disparity explorer, 5 metric layers |
| Complaint Explorer | `/complaints` | CFPB complaint dashboard |
| Query Lab | `/query` | Natural language queries via Claude |
| Reports | `/reports` | PDF executive reports |

## API Endpoints

```
GET  /health                        → system health + data counts
POST /api/scores/calculate          → alternative credit score
GET  /api/scores/demo               → 5 contrasting demo profiles
GET  /api/geography/counties        → all counties with metrics
GET  /api/geography/credit-deserts  → high-denial, adequate-income counties
GET  /api/geography/summary         → national disparity statistics
GET  /api/complaints/summary        → CFPB complaint aggregates
POST /api/query                     → NL-to-SQL via Claude
GET  /api/reports/download          → PDF report (binary)
```

## Project Structure

```
FinLens/
├── backend/
│   ├── main.py                  # FastAPI app + lifespan startup
│   ├── database.py              # SQLAlchemy models + SQLite setup
│   ├── mock_data.py             # Realistic fallback data generator
│   ├── data/
│   │   ├── ingest.py            # Federal data download + fallback
│   │   └── load.py              # SQLite bulk loader
│   ├── models/
│   │   └── alternative_score.py # RandomForest scoring model
│   ├── routes/
│   │   ├── scores.py
│   │   ├── geography.py
│   │   ├── complaints.py
│   │   ├── nlquery.py
│   │   └── reports.py
│   └── services/
│       └── claude_service.py    # Anthropic API NL-to-SQL
├── frontend/
│   └── src/
│       ├── pages/
│       ├── components/
│       └── api/index.js
└── .env.example
```

## Deploying

Frontend deploys to Vercel (connect repo, set `VITE_API_URL`). Backend deploys to Railway (auto-detects Python, set env vars).

---

*All analysis is based on public federal datasets and is educational — not financial advice.*
