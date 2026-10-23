# Unstuck - Freelance Platforms Scraper & Unified Database

A high-performance Python data extraction pipeline that collects, normalizes, and stores freelance listings from Mostaql, Khamsat, Nafezly, and Freelancer.com into an SQLite database. It provides a FastAPI backend to query stored records and integrate with automation tools like n8n.

## Architecture

- **Scrapers**: Individual modules using `requests` and `BeautifulSoup` to scrape each platform.
- **Concurrency**: `ThreadPoolExecutor` handles parallel execution across platforms in `main.py`.
- **Database**: SQLite database (`freelance_projects.db`) with normalized schema and automatic deduplication based on unique URL hashes.
- **API**: FastAPI service (`api.py`) exposing endpoints for scraping, querying jobs, and market analytics.
- **Workflow**: Automated scheduling and data transformation via n8n (`n8n_workflow.json`).

## Database Schema

- `platforms`: Platform metadata (id, name, base_url).
- `projects`: Main listing data (title, url, price, duration, published_date, description, project_uid).
- `project_skills`: Normalized tags and required skills linked by `project_id`.
- `ai_analysis`: Optional structured evaluation and proposal draft.

## Setup

```bash
pip install -r requirements.txt
```

Create a `.env` file from `.env.example` if using Gemini API features:
```bash
cp .env.example .env
```

## Usage

### Run Scraper Directly

Scrape one page per platform and persist to database:
```bash
python main.py
```

Options:
- `--pages <int>`: Number of pages per site (default: 1)
- `--delay <float>`: Delay between requests in seconds (default: 1.0)
- `--sequential`: Run scrapers sequentially instead of multi-threaded

### Start the API Server

```bash
python api.py
```
Default URL: `http://localhost:8000`  
Interactive documentation: `http://localhost:8000/docs`

### API Endpoints

- `POST /scrape`: Run scrapers and sync results to database.
- `GET /jobs`: Query stored jobs with filtering (`platform`, `keyword`, `limit`).
- `GET /jobs/analytics`: Aggregated skill counts and platform distribution.
- `GET /api/status`: Service and database health.

### n8n Integration

Import `n8n_workflow.json` into n8n to execute scheduled scraping and ingest jobs into your pipeline.
