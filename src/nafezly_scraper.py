#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Nafezly Web Scraper
====================
Extracts project listings from Nafezly (nafezly.com/projects).
Scrapes title, price/budget, full description, duration, URL, publish date,
and required skills, with clean text normalization and structured JSON output.
"""

import os
import sys
import time
import json
import re
import argparse
from typing import Dict, Any, List, Optional
import requests
from bs4 import BeautifulSoup

# Ensure safe UTF-8 terminal printing on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Session setup and browser headers
SESSION = requests.Session()
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
    "Referer": "https://nafezly.com/projects",
}
SESSION.headers.update(HEADERS)


def clean_text(text: Optional[str]) -> str:
    """Normalize text, eliminate newline/tab characters, and strip redundant whitespace."""
    if not text:
        return ""
    cleaned = re.sub(r"[\r\n\t]+", " ", str(text))
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


def remove_empty_fields(data: Dict[str, Any]) -> Dict[str, Any]:
    """Filter out empty, None, or zero-length entries from payload."""
    filtered = {}
    for k, v in data.items():
        if v is None:
            continue
        if isinstance(v, str) and not v.strip():
            continue
        if isinstance(v, (list, dict)) and len(v) == 0:
            continue
        filtered[k] = v
    return filtered


def get_rss_feed_descriptions() -> Dict[str, str]:
    """Fetch RSS feed from Nafezly as a fallback source for descriptions."""
    feed_map = {}
    try:
        resp = SESSION.get("https://nafezly.com/feed", timeout=12)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "xml")
            for item in soup.find_all("item"):
                link_tag = item.find("link")
                desc_tag = item.find("description")
                if link_tag and desc_tag:
                    link = clean_text(link_tag.get_text())
                    desc = clean_text(desc_tag.get_text())
                    m = re.search(r"/project/(\d+)", link)
                    if m and desc:
                        feed_map[m.group(1)] = desc
    except Exception as e:
        print(f"[!] Warning while reading RSS feed: {e}")
    return feed_map


def extract_requirements(description: str) -> Optional[str]:
    """Extract requirements section from project description if present."""
    if not description:
        return None
    pattern = r"((?:المطلوب|المتطلبات|الشروط|المهام المطلوبة)[:\-].+?)(?=(?:يرجى|ملاحظة|تنبيه|مدة التنفيذ|الميزانية|$))"
    match = re.search(pattern, description)
    if match:
        req = clean_text(match.group(1))
        req = re.sub(r"[\s\-:،,.]+$", "", req).strip()
        if len(req) > 10:
            return req
    return None


def scrape_project_details(url: str, fallback_desc: str = "") -> Dict[str, Any]:
    """Visit project detail page to parse full description, required skills, and metadata."""
    details: Dict[str, Any] = {}
    try:
        resp = SESSION.get(url, timeout=15)
        if resp.status_code == 429 or "Error 1015" in resp.text:
            if fallback_desc:
                details["description"] = fallback_desc
            return details

        if resp.status_code != 200:
            if fallback_desc:
                details["description"] = fallback_desc
            return details

        soup = BeautifulSoup(resp.text, "html.parser")

        # 1. Title
        h1 = soup.find("h1")
        if h1:
            title_text = clean_text(h1.get_text())
            if title_text:
                details["title"] = title_text

        # 2. Description
        h2 = soup.find("h2")
        if h2:
            desc_text = clean_text(h2.get_text())
            if desc_text:
                details["description"] = desc_text
        elif fallback_desc:
            details["description"] = fallback_desc

        # 3. Required skills (Tags)
        skill_tags = soup.find_all("a", class_=lambda c: c and "tag-class" in c)
        skills = []
        for a in skill_tags:
            s_name = clean_text(a.get_text())
            if s_name and s_name not in skills:
                skills.append(s_name)
        if skills:
            details["required_skills"] = skills

        # 4. Project metadata box
        card_boxes = soup.find_all("div", class_="main-nafez-box-styles")
        for box in card_boxes:
            if "بطاقة المشروع" in box.get_text():
                for row in box.find_all("div", class_="row"):
                    cols = [clean_text(c.get_text()) for c in row.find_all("div", recursive=False)]
                    cols = [c for c in cols if c]
                    if len(cols) == 2:
                        k, v = cols[0], cols[1]
                        if "الميزانية" in k and v:
                            details["price"] = v
                        elif ("المدة" in k or "المدة المتاحة" in k) and v:
                            details["duration"] = v
                        elif "تاريخ النشر" in k and v:
                            details["published_at"] = v
                        elif "حالة المشروع" in k and v:
                            details["status"] = v
                        elif "عدد المتقدمين" in k and v:
                            details["proposals_count"] = v

    except Exception as e:
        print(f"[!] Warning while opening project page ({url}): {e}")
        if fallback_desc:
            details["description"] = fallback_desc

    return details


def scrape_nafezly(pages: int = 1, delay: float = 1.5) -> List[Dict[str, Any]]:
    print(f"[*] Starting Nafezly scraper (pages={pages}, delay={delay}s)...")
    rss_map = get_rss_feed_descriptions()

    all_projects: List[Dict[str, Any]] = []

    for page_num in range(1, pages + 1):
        page_url = "https://nafezly.com/projects" if page_num == 1 else f"https://nafezly.com/projects?page={page_num}"
        print(f"\n[+] Processing page {page_num}: {page_url}")

        try:
            resp = SESSION.get(page_url, timeout=15)
            if resp.status_code != 200:
                print(f"[!] Failed to access page {page_num} (Status code: {resp.status_code})")
                continue

            soup = BeautifulSoup(resp.text, "html.parser")
            project_boxes = soup.find_all("div", class_="project-box")
            print(f"-> Found {len(project_boxes)} projects on page {page_num}")

            for idx, box in enumerate(project_boxes, 1):
                link_tag = box.find("a", href=re.compile(r"/project/\d+"))
                if not link_tag:
                    continue

                url = link_tag.get("href", "").strip()
                title_from_card = clean_text(link_tag.get_text())

                proj_id_match = re.search(r"/project/(\d+)", url)
                proj_id = proj_id_match.group(1) if proj_id_match else ""

                price_card = ""
                duration_card = ""
                date_card = ""
                desc_snippet = ""

                h3 = box.find("h3")
                if h3:
                    desc_snippet = clean_text(h3.get_text())

                for s in box.find_all("span"):
                    txt = clean_text(s.get_text())
                    if "$" in txt and not price_card:
                        price_card = txt
                    elif ("أيام" in txt or "يوم" in txt) and not duration_card:
                        duration_card = txt
                    elif "منذ" in txt and not date_card:
                        date_card = txt

                fallback_desc = rss_map.get(proj_id) or desc_snippet

                print(f"  [{idx}/{len(project_boxes)}] Fetching details: {title_from_card[:45]}...")

                time.sleep(delay)
                detail_data = scrape_project_details(url, fallback_desc=fallback_desc)

                project_item: Dict[str, Any] = {
                    "platform": "Nafezly",
                    "title": detail_data.get("title") or title_from_card,
                    "price": detail_data.get("price") or price_card,
                    "duration": detail_data.get("duration") or duration_card,
                    "published_at": detail_data.get("published_at") or date_card,
                    "url": url,
                    "description": detail_data.get("description") or fallback_desc,
                }

                if "required_skills" in detail_data:
                    project_item["required_skills"] = detail_data["required_skills"]

                desc_for_req = project_item.get("description", "")
                req = extract_requirements(desc_for_req)
                if req:
                    project_item["requirements"] = req

                if "status" in detail_data:
                    project_item["status"] = detail_data["status"]

                if "proposals_count" in detail_data:
                    project_item["proposals_count"] = detail_data["proposals_count"]

                cleaned_project = remove_empty_fields(project_item)
                all_projects.append(cleaned_project)

        except Exception as e:
            print(f"[X] Error processing page {page_num}: {e}")

    return all_projects


def main():
    parser = argparse.ArgumentParser(description="Nafezly Freelance Projects Scraper")
    parser.add_argument("--pages", type=int, default=1, help="Number of pages to scrape (default: 1)")
    parser.add_argument("--output", type=str, default="nafezly_projects.json", help="Output JSON filename")
    parser.add_argument("--delay", type=float, default=1.5, help="Delay between requests in seconds (default: 1.5)")
    args = parser.parse_args()

    results = scrape_nafezly(pages=args.pages, delay=args.delay)

    output_path = os.path.abspath(args.output)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    file_size_kb = os.path.getsize(output_path) / 1024

    print(f"Done: {len(results)} projects saved to {output_path} ({file_size_kb:.2f} KB)")


if __name__ == "__main__":
    main()
