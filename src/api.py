import os
import sys
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, Query, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

import main
import database
import gemini_ai

app = FastAPI(
    title="Unified Freelance Jobs API",
    description="Multi-platform freelance scraper API integrated with SQLite",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    db_stats = database.get_db_stats()
    return {
        "service": "Freelance Jobs API",
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "database": db_stats,
        "endpoints": {
            "scrape": "POST /scrape",
            "jobs": "GET /jobs?limit=500",
            "analytics": "GET /jobs/analytics",
            "docs": "/docs"
        }
    }


@app.api_route("/scrape", methods=["GET", "POST"])
@app.api_route("/api/scrape", methods=["GET", "POST"])
def trigger_scrape(
    pages: int = Query(1, ge=1, le=5),
    delay: float = Query(1.0, ge=0.5, le=5.0),
    only_new: bool = Query(False)
):
    start_time = time.time()

    tasks = {
        "mostaql": lambda: main.run_mostaql(pages=pages, output_file=None),
        "khamsat": lambda: main.run_khamsat(pages=pages, output_file=None),
        "nafezly": lambda: main.run_nafezly(pages=pages, delay=delay, output_file=None),
        "freelancer": lambda: main.run_freelancer(pages=pages, max_jobs=None, delay=delay, output_file=None),
    }

    collected = {}
    from concurrent.futures import ThreadPoolExecutor, as_completed

    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(fn): name for name, fn in tasks.items()}
        for fut in as_completed(futures):
            name = futures[fut]
            try:
                collected[name] = fut.result() or []
            except Exception as e:
                print(f"[!] Error in {name} scraper: {e}")
                collected[name] = []

    all_projects_flat = []
    platforms_summary = {}

    for plat_key, items in collected.items():
        platforms_summary[plat_key] = len(items)
        for item in items:
            if "platform" not in item:
                item["platform"] = plat_key.capitalize()
            all_projects_flat.append(item)

    db_result = database.save_projects_batch(all_projects_flat)
    elapsed = time.time() - start_time

    return {
        "status": "success",
        "timestamp": datetime.now().isoformat(),
        "total_scraped": len(all_projects_flat),
        "new_count": db_result["inserted_new"],
        "duplicates_skipped": db_result["duplicates_skipped"],
        "execution_time_seconds": round(elapsed, 2),
        "platforms": platforms_summary,
        "new_projects": db_result["new_projects"] if only_new else all_projects_flat
    }


@app.get("/jobs")
@app.get("/api/projects")
def get_jobs(
    limit: int = Query(500, ge=1, le=1000),
    platform: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None)
):
    projects = database.query_projects(platform=platform, keyword=keyword, limit=limit)
    return {
        "status": "success",
        "total": len(projects),
        "limit": limit,
        "jobs": projects
    }


@app.get("/jobs/analytics")
def get_analytics():
    stats = database.get_db_stats()
    all_jobs = database.query_projects(limit=1000)

    skill_counts: Dict[str, int] = {}
    for j in all_jobs:
        for s in j.get("skills", []):
            skill_counts[s] = skill_counts.get(s, 0) + 1

    top_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:15]

    return {
        "status": "success",
        "timestamp": datetime.now().isoformat(),
        "total_jobs": stats["total_projects"],
        "platform_distribution": stats["by_platform"],
        "top_demanded_skills": [{"skill": s[0], "count": s[1]} for s in top_skills]
    }


@app.post("/gemini/analyze")
def analyze_with_gemini(payload: Dict[str, Any] = Body(...)):
    project = payload.get("project") or payload
    ai_result = gemini_ai.enrich_project_with_ai(project)
    return {
        "status": "success",
        "analysis": ai_result
    }


@app.get("/api/status")
def get_status():
    db_stats = database.get_db_stats()
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "gemini_api_configured": gemini_ai.is_gemini_configured(),
        "database": db_stats
    }


@app.post("/api/history/reset")
def reset_history():
    database.reset_db()
    return {
        "status": "success",
        "message": "Database and history reset successfully."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
