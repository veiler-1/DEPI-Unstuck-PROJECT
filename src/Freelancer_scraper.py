"""
Freelancer.com Jobs Web Scraper
================================
Python scraper to extract freelance jobs from Freelancer.com using BeautifulSoup and Requests.

Features:
- Extracts title, budget/price, full and brief descriptions, duration/deadline, job URL, publish date, and skills.
- Visits each job detail page for in-depth data and requirements extraction.
- Supports multi-page pagination.
- Outputs structured, clean JSON in UTF-8 format.
- Configurable via command-line interface (CLI).
"""

import os
import sys
import json
import time
import re
import argparse
from typing import Dict, List, Optional, Any
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup

# Ensure safe UTF-8 terminal printing on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


# Base URL for Freelancer
BASE_URL = "https://www.freelancer.com"
JOBS_URL = "https://www.freelancer.com/jobs"

# Default request headers to simulate a modern browser
DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
    "Connection": "keep-alive",
}


def clean_text(text: Optional[str]) -> str:
    """Clean extra whitespaces and linebreaks."""
    if not text:
        return ""
    # Normalize multiple spaces and non-breaking spaces
    text = text.replace("\xa0", " ")
    return re.sub(r"\s+", " ", text).strip()


def extract_brief_and_requirements(full_description: str, skills: List[str]) -> tuple:
    """
    Generate a brief synopsis of the project and extract specific requirements
    for subsequent AI analysis.
    """
    if not full_description:
        return "", []

    # 1. Generate Brief (first 2-3 sentences or up to ~250 chars)
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", full_description) if s.strip()]
    if sentences:
        brief = " ".join(sentences[:2])
        if len(brief) > 300:
            brief = brief[:297].rstrip() + "..."
    else:
        brief = full_description[:200].rstrip() + "..."

    # 2. Extract Requirements
    requirements = []
    lines = [line.strip() for line in full_description.split("\n") if line.strip()]

    # Match section headers related to requirements/deliverables
    req_header_pattern = re.compile(
        r"^(technical\s+)?(requirements?|deliverables?|qualifications?|responsibilities|ideal\s+freelancer|scope\s+of\s+work|what\s+you\s+need|must\s+have|prerequisites):?$",
        re.IGNORECASE
    )
    any_header_pattern = re.compile(r"^[A-Z][A-Za-z0-9\s/–-]{2,40}:$", re.IGNORECASE)

    in_req_section = False
    for line in lines:
        if req_header_pattern.match(line):
            in_req_section = True
            continue
        elif any_header_pattern.match(line):
            in_req_section = False

        bullet_pattern = r"^(\d+[\.\)\-]|[\-\*•])\s*"
        if in_req_section:
            cleaned = re.sub(bullet_pattern, "", line).strip()
            if cleaned and len(cleaned) >= 5 and cleaned not in requirements:
                requirements.append(cleaned)
        elif re.match(bullet_pattern, line):
            cleaned = re.sub(bullet_pattern, "", line).strip()
            if cleaned and len(cleaned) >= 5 and cleaned not in requirements:
                requirements.append(cleaned)

    # If few or no requirements found, scan sentences with requirement keywords
    if len(requirements) < 2:
        keywords = [
            "must", "require", "need", "should", "looking for", "seeking",
            "experience with", "task involves", "familiarity", "proficient",
            "responsible", "skills required", "deliverables", "objective",
            "qualifications", "prerequisites"
        ]
        for s in sentences:
            s_lower = s.lower()
            if any(k in s_lower for k in keywords):
                if 15 <= len(s) <= 250 and s not in requirements:
                    requirements.append(s)

    # If still empty, use skills as baseline requirements
    if not requirements and skills:
        requirements = [f"Proficiency in {skill}" for skill in skills]

    return brief, requirements


def scrape_job_details(job_url: str, session: requests.Session, timeout: int = 15) -> Dict[str, Any]:
    """
    Fetch a single job page and extract full description, requirements,
    posted time, exact budget, deadline, skills, etc.
    """
    details = {
        "full_description": "",
        "brief_description": "",
        "extracted_requirements": [],
        "budget_detail": "",
        "posted_date": "",
        "duration_deadline": "",
        "status": "Open",
        "proposals_count": "",
        "skills": [],
        "project_id": ""
    }

    try:
        resp = session.get(job_url, timeout=timeout)
        if resp.status_code != 200:
            return details

        # Enforce UTF-8 encoding
        resp.encoding = "utf-8"

        soup = BeautifulSoup(resp.text, "html.parser")

        main = soup.find("app-project-view-logged-out-main") or soup

        # 1. Project Description
        desc_el = main.find(class_=lambda x: x and "Project-description" in x)
        if desc_el:
            details["full_description"] = desc_el.get_text("\n", strip=True)

        # 2. Budget / Price Range
        budget_el = main.find("h2", class_=lambda x: x and "desktop:text-title-32" in x)
        if budget_el:
            details["budget_detail"] = clean_text(budget_el.get_text())

        # 3. Posted date & Duration / Deadline
        icon_pair = main.find(class_=lambda x: x and "IconTextPair" in x)
        if icon_pair:
            for p in icon_pair.find_all("p"):
                txt = clean_text(p.get_text(" ", strip=True))
                if "posted" in txt.lower():
                    details["posted_date"] = txt
                elif "ends in" in txt.lower() or "left" in txt.lower():
                    details["duration_deadline"] = txt
                elif "open" in txt.lower() or "closed" in txt.lower():
                    details["status"] = txt

        # 4. Skills required
        for a in main.find_all("a", href=lambda h: h and "/jobs/" in h):
            skill = clean_text(a.get_text())
            if skill and skill.lower() != "jobs" and skill not in details["skills"]:
                details["skills"].append(skill)

        # 5. Project ID and Proposals count
        text_content = main.get_text()
        pid_match = re.search(r"Project ID:\s*(\d+)", text_content)
        if pid_match:
            details["project_id"] = pid_match.group(1)

        proposals_match = re.search(r"(\d+\s+proposals|\d+\s+bids)", text_content, re.IGNORECASE)
        if proposals_match:
            details["proposals_count"] = proposals_match.group(1)

        # 6. Extract brief and requirements for AI analysis
        brief, reqs = extract_brief_and_requirements(details["full_description"], details["skills"])
        details["brief_description"] = brief
        details["extracted_requirements"] = reqs

    except Exception as e:
        # Graceful fallback - keep what we have
        pass

    return details


def scrape_jobs_page(page_num: int, session: requests.Session, timeout: int = 15) -> List[Dict[str, Any]]:
    """
    Fetch the jobs list page (e.g. /jobs or /jobs/2) and extract all card-level data.
    """
    url = JOBS_URL if page_num == 1 else f"{JOBS_URL}/{page_num}"
    print(f"\n[+] Fetching Page {page_num}: {url}")

    resp = session.get(url, timeout=timeout)
    if resp.status_code != 200:
        print(f"[-] Failed to fetch page {page_num} (HTTP {resp.status_code})")
        return []

    # Enforce UTF-8 encoding
    resp.encoding = "utf-8"

    soup = BeautifulSoup(resp.text, "html.parser")
    cards = soup.find_all("div", class_="JobSearchCard-item")
    print(f"[*] Found {len(cards)} jobs on page {page_num}")

    jobs = []
    for card in cards:
        # Title & URL
        title_el = card.find("a", class_="JobSearchCard-primary-heading-link")
        if not title_el:
            continue

        title = clean_text(title_el.get_text())
        rel_href = title_el.get("href", "")
        job_url = urljoin(BASE_URL, rel_href)

        # Duration / Days left
        time_el = card.find("span", class_="JobSearchCard-primary-heading-days")
        duration = clean_text(time_el.get_text()) if time_el else ""

        # Price / Budget from card
        price_el = card.find("div", class_="JobSearchCard-secondary-price")
        price = clean_text(price_el.get_text(" ", strip=True)) if price_el else ""

        # Short description snippet
        desc_el = card.find("p", class_="JobSearchCard-primary-description")
        desc_snippet = clean_text(desc_el.get_text()) if desc_el else ""

        # Skills from card
        skills = [
            clean_text(tag.get_text())
            for tag in card.find_all("a", class_="JobSearchCard-primary-tagsLink")
            if clean_text(tag.get_text())
        ]

        # Bids count
        entry_el = card.find("div", class_="JobSearchCard-secondary-entry")
        bids = clean_text(entry_el.get_text()) if entry_el else ""

        jobs.append({
            "platform": "Freelancer",
            "title": title,
            "url": job_url,
            "price": price,
            "duration": duration,
            "card_description": desc_snippet,
            "skills": skills,
            "bids_count": bids,
        })

    return jobs


def run_scraper(
    num_pages: int = 1,
    max_jobs: Optional[int] = None,
    delay: float = 1.0,
    output_file: str = "freelancer_jobs.json"
) -> List[Dict[str, Any]]:
    """
    Main controller to scrape multiple pages, enter each job detail page,
    and save the output to a clean JSON file.
    """
    session = requests.Session()
    session.headers.update(DEFAULT_HEADERS)

    all_jobs_raw = []
    print("=" * 60)
    print("Freelancer.com Jobs Scraper started")
    print(f"Target Pages: {num_pages} | Max Jobs: {max_jobs or 'All'} | Delay: {delay}s")
    print("=" * 60)

    # 1. Scrape listing pages
    for page in range(1, num_pages + 1):
        page_jobs = scrape_jobs_page(page, session)
        if not page_jobs:
            print(f"[-] No more jobs found on page {page}, stopping pagination.")
            break
        all_jobs_raw.extend(page_jobs)
        if max_jobs and len(all_jobs_raw) >= max_jobs:
            all_jobs_raw = all_jobs_raw[:max_jobs]
            break
        if page < num_pages:
            time.sleep(delay)

    total_to_scrape = len(all_jobs_raw)
    print(f"\n[*] Total jobs collected from listings: {total_to_scrape}")
    print("[*] Now visiting each individual job page for full details & AI requirements...")

    # 2. Visit each job page for deep details
    detailed_jobs = []
    for idx, job in enumerate(all_jobs_raw, start=1):
        print(f"[{idx}/{total_to_scrape}] Fetching details: {job['title'][:45]}...")
        details = scrape_job_details(job["url"], session)

        # Merge card-level and detail-level information with smart fallbacks
        full_desc = details["full_description"] or job["card_description"]
        skills = details["skills"] or job["skills"]
        brief, reqs = extract_brief_and_requirements(full_desc, skills)

        final_job = {
            "platform": "Freelancer",
            "id": details["project_id"] or str(idx),
            "title": job["title"],
            "url": job["url"],
            "price": details["budget_detail"] or job["price"],
            "duration": details["duration_deadline"] or job["duration"],
            "posted_date": details["posted_date"] or "Recently",
            "status": details["status"],
            "proposals_count": details["proposals_count"] or job["bids_count"],
            "skills": skills,
            "brief_description": details["brief_description"] or brief,
            "extracted_requirements": details["extracted_requirements"] or reqs,
            "full_description": full_desc,
        }
        detailed_jobs.append(final_job)

        # Respectful delay between requests
        if delay > 0 and idx < total_to_scrape:
            time.sleep(delay)

    # 3. Save to JSON file if specified
    if output_file:
        out_dir = os.path.dirname(os.path.abspath(output_file))
        if out_dir:
            os.makedirs(out_dir, exist_ok=True)

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(detailed_jobs, f, ensure_ascii=False, indent=2)

        print("\n" + "=" * 60)
        print(f"[SUCCESS] Scraping completed successfully!")
        print(f"[SUCCESS] Total jobs saved: {len(detailed_jobs)}")
        print(f"[SUCCESS] Output JSON file saved at: {os.path.abspath(output_file)}")
        print("=" * 60)

    return detailed_jobs


def main():
    parser = argparse.ArgumentParser(
        description="Scrape jobs from Freelancer.com with pagination and deep details extraction."
    )
    parser.add_argument(
        "--pages",
        type=int,
        default=1,
        help="Number of pages to scrape (default: 1)"
    )
    parser.add_argument(
        "--max-jobs",
        type=int,
        default=None,
        help="Maximum number of jobs to fetch details for (e.g. 5, 20). If omitted, scrapes all."
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.0,
        help="Polite delay in seconds between requests (default: 1.0)"
    )
    parser.add_argument(
        "--output",
        type=str,
        default="freelancer_jobs.json",
        help="Output JSON file name or path (default: freelancer_jobs.json)"
    )

    args = parser.parse_args()
    run_scraper(
        num_pages=args.pages,
        max_jobs=args.max_jobs,
        delay=args.delay,
        output_file=args.output
    )


if __name__ == "__main__":
    main()
