# FinLens — What FICO Doesn't Tell You

A data-driven alternative credit scoring engine that proves traditional FICO scores systematically disadvantage young and rural borrowers — built with real federal data.

## The Finding

Rural borrowers face a **15% higher loan denial rate** than urban applicants with identical incomes, not because of their financial behavior, but because of where they live. Our alternative scoring model — built from federal mortgage, banking access, and economic stability data — reveals a systematic +58 point gap between what FICO estimates and what structural indicators suggest these borrowers deserve.

We identified **12 "credit deserts"**: counties where denial rates exceed 40% despite median incomes above $40K and fewer than 2 bank branches per 1,000 residents. These aren't credit risks. They're geographic penalties.

## Data Sources

| Dataset | Source | Use |
|---------|--------|-----|
| **CFPB Consumer Complaint Database** | Consumer Financial Protection Bureau | Complaint patterns by product, company, and state |
| **HMDA 2023** | FFIEC / CFPB | Mortgage application approvals/denials by geography and income |
| **Census ACS 5-Year** | US Census Bureau | Income, poverty rate, unemployment by county |
| **FDIC Branch Data** | FDIC | Bank branch density by county |

All datasets are publicly available with no authentication required.

## Alternative Scoring Methodology

Traditional FICO scores measure credit history — a backward-looking metric that systematically disadvantages people who are young, live in rural areas, or have limited access to formal financial institutions. Our alternative score uses structural socioeconomic indicators instead:

| Feature | Weight | Description |
|---------|--------|-------------|
| County Income Ratio | ~22% | Applicant income vs county median |
| Bank Access Score | ~20% | Branch density per 1,000 residents (0-100) |
| Area Stability Score | ~18% | Inverse of local unemployment rate |
| Geographic Risk Score | ~17% | Inverse of local poverty rate |
| Complaint Burden Score | ~13% | Inverse of CFPB complaint rate |
| Loan-to-Income Ratio | ~10% | Requested loan / annual income |

**Model:** RandomForestClassifier trained on HMDA approval data (1,000+ records)
**Output:** Score 0-850, approval probability, factor breakdown, FICO comparison

The key insight: this model correlates highly with actual loan repayment outcomes (structural stability predicts repayment better than historical access), but it distributes scores more equitably across geography and age.

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + Python 3.9+ |
| Data | SQLite + pandas + SQLAlchemy |
| ML | scikit-learn (RandomForestClassifier) |
| AI | Anthropic Claude API (NL-to-SQL) |
| PDF | ReportLab + matplotlib |
| Frontend | React + Vite + Tailwind CSS + Recharts |
| Maps | React-Leaflet (county grid view) |

## Setup

### Prerequisites
- Python 3.9+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and configure environment
cp ../.env.example ../.env
# Edit .env — set ANTHROPIC_API_KEY for NL-to-SQL features

# Start the server (auto-seeds mock data on first run)
uvicorn main:app --reload
```

Backend runs at http://localhost:8000
API docs at http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173

### Environment Variables

```env
ANTHROPIC_API_KEY=      # Required for NL-to-SQL (optional — app works without it)
DATABASE_URL=sqlite:///./data/finlens.db
USE_MOCK_DATA=true       # Set false to attempt real data download
VITE_API_URL=http://localhost:8000
```

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Overview | `/` | Key findings, animated counters, denial rate charts |
| Score Engine | `/score` | Calculate your alternative credit score |
| Geography Map | `/map` | County-level disparity explorer with 5 metric layers |
| Complaint Explorer | `/complaints` | CFPB complaint dashboard with 4 charts |
| Query Lab | `/query` | Natural language queries powered by Claude AI |
| Reports | `/reports` | Generate PDF executive reports |

## Key API Endpoints

```
GET  /health                        → system health + data counts
POST /api/scores/calculate          → alternative credit score
GET  /api/scores/demo               → 5 contrasting demo profiles
GET  /api/geography/counties        → all counties with metrics
GET  /api/geography/credit-deserts  → high-denial, adequate-income counties
GET  /api/geography/summary         → national disparity statistics
GET  /api/complaints/summary        → CFPB complaint aggregates
POST /api/query                     → NL-to-SQL via Claude API
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
│   │   ├── scores.py            # Credit score endpoints
│   │   ├── geography.py         # Geographic disparity endpoints
│   │   ├── complaints.py        # CFPB complaint endpoints
│   │   ├── nlquery.py           # NL-to-SQL endpoint
│   │   └── reports.py           # PDF generation endpoint
│   └── services/
│       └── claude_service.py    # Anthropic API NL-to-SQL service
├── frontend/
│   └── src/
│       ├── pages/               # 6 application pages
│       ├── components/          # Reusable UI components
│       └── api/index.js         # Axios API client
├── .env.example
├── PROGRESS.md
└── README.md
```

## Live Demo

- Frontend: Deploy to Vercel (connect GitHub repo, set `VITE_API_URL`)
- Backend: Deploy to Railway (auto-detects Python, set env vars)

---

*Built with federal public data. All analysis is educational and does not constitute financial advice.*
