# FinLens

Rural borrowers get denied loans at 15% higher rates than urban borrowers at identical income levels. That gap isn't credit risk — it's geography. I built this to make that provable with public federal data and show what a fairer scoring model looks like.

The core finding: 12 counties qualify as credit deserts — denial rates above 40%, median incomes above $40K, fewer than 2 bank branches per 1,000 residents. These aren't risky borrowers. They're underserved ones. My alternative scoring model shows a +58 point disconnect between FICO estimates and what structural indicators actually suggest about the same borrowers.

## What I Built

There are five pages. The **Score Engine** lets you input income, loan amount, county, and employment type and get back an alternative credit score (0–850) with a factor-by-factor breakdown alongside the FICO estimate — so you can see exactly where the gap comes from. The **Geography Map** is a county-level choropleth you can toggle across five metric layers: denial rate, score gap, credit deserts, branch density, and median income. Click any county to get its full profile.

The **Complaint Explorer** pulls from the CFPB database — top companies by volume, trends over time, a treemap of issue categories. The **Query Lab** is a natural language interface backed by Claude: type a question in plain English, get back SQL, results, a chart, and an analyst-style explanation. And **Reports** generates a downloadable PDF — disparity analysis, credit desert profile, or complaint summary — for any state or county.

On the backend, a FastAPI service handles a data pipeline that joins four federal datasets at the county level, a RandomForestClassifier trained on HMDA approval records, and a Claude-powered NL-to-SQL layer. Complaint rates are matched to counties via a zip-to-county crosswalk (HUD/GitHub geo data), so each county gets its own rate rather than a state average.

## Data

**HMDA 2023** (FFIEC/CFPB) is the backbone — mortgage approvals and denials by geography, income, race, and age. This is what the model trains on and what the denial rate map is built from. **Census ACS 5-Year** provides the economic context: median income, poverty rate, and unemployment for all 3,200+ counties. **FDIC branch data** gives bank access per county, which turns out to be one of the stronger predictors of denial rates independent of income. **CFPB complaints** add a consumer experience layer — which companies generate the most complaints, and where.

## Stack

- FastAPI + Python, SQLite + SQLAlchemy, pandas
- scikit-learn (RandomForestClassifier)
- Anthropic Claude API (NL-to-SQL)
- React + Vite + Tailwind + Recharts + React-Leaflet
- ReportLab + matplotlib (PDF generation)
- Deployed: Render (backend) + Vercel (frontend)

## Running It Locally

Requires Python 3.9+ and Node 18+.

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env
uvicorn main:app --reload
# → http://localhost:8000 (docs at /docs)

# Frontend
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

The only required env var is `VITE_API_URL=http://localhost:8000`. Set `ANTHROPIC_API_KEY` to enable the Query Lab — the rest of the app works without it. The pre-built database ships with the repo so there's no data download on startup.

## Live Demo

[finlens-credit-gap.vercel.app](https://finlens-credit-gap.vercel.app)
