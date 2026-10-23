# Unstuck - Freelance Platforms Scraper & Unified Database

A Python-based data extraction pipeline that collects, normalizes, and stores freelance listings from Mostaql, Khamsat, Nafezly, and Freelancer.com into an SQLite database. It provides a FastAPI backend to query stored records and integrate with automation tools like n8n.

## Repository Structure

```
.
├── docs/                                  # Project documentation, proposal, and deliverables
│   ├── 01_Project_Planning_and_Management.pdf
│   ├── Requirements_Gathering.pdf
│   ├── UNSTUCK_Literature_Review_Competitive_Analysis.pdf
│   └── final proposal templet.docx
│
├── src/                                   # Source code and database files
│   ├── main.py                            # Parallel scraper runner
│   ├── api.py                             # FastAPI REST endpoints
│   ├── database.py                        # SQLite schema and query manager
│   ├── freelance_projects.db              # SQLite relational database
│   ├── Freelancer_scraper.py              # Freelancer.com scraper
│   ├── Khamsat_scraper.py                 # Khamsat requests scraper
│   ├── mostaql_scraper.py                 # Mostaql projects scraper
│   ├── nafezly_scraper.py                 # Nafezly projects scraper
│   ├── gemini_ai.py                       # Gemini AI enrichment module
│   ├── n8n_workflow.json                  # UNSTUCK automated n8n workflow
│   ├── all_projects.json                  # Consolidated project dump
│   ├── requirements.txt                   # Python dependencies
│   └── .env.example                       # Environment configuration template
│
└── README.md
```

## Setup

```bash
cd src
pip install -r requirements.txt
```

Create a `.env` file from `.env.example` if using Gemini API features:
```bash
cp .env.example .env
```

## Usage

### Run Scraper Directly

```bash
cd src
python main.py
```

Options:
- `--pages <int>`: Number of pages per site (default: 1)
- `--delay <float>`: Delay between requests in seconds (default: 1.0)
- `--sequential`: Run scrapers sequentially instead of multi-threaded

### Start the API Server

```bash
cd src
python api.py
```
- API Docs: `http://localhost:8000/docs`
- Query Jobs: `http://localhost:8000/jobs?limit=500`
- Market Analytics: `http://localhost:8000/jobs/analytics`

### n8n Integration

Import `src/n8n_workflow.json` into n8n to execute scheduled scraping and ingest jobs into your pipeline.
