"""
Mostaql Web Scraper
====================
Extracts freelance projects from Mostaql (mostaql.com/projects),
parses project listings, and visits detail pages to extract:
- Title
- Price / Budget
- Duration
- Publication date
- Project URL
- Brief overview
- Full description
- Requirements and specifications
- Required skills and technologies
"""

import sys
import json
import time
import requests
from bs4 import BeautifulSoup

# Ensure safe UTF-8 terminal output on Windows
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
}


def clean_dict(d: dict) -> dict:
    """Remove empty, None, or blank entries from dictionary."""
    cleaned = {}
    for k, v in d.items():
        if v is not None and v != "" and v != [] and v != {}:
            if isinstance(v, dict):
                sub_clean = clean_dict(v)
                if sub_clean:
                    cleaned[k] = sub_clean
            else:
                cleaned[k] = v
    return cleaned


def fetch_project_details(session: requests.Session, project_url: str) -> dict:
    """Visit project detail page and extract full metadata, description, and requirements."""
    try:
        response = session.get(project_url, headers=HEADERS, timeout=15)
        if response.status_code != 200:
            print(f"  [!] Failed to fetch project page ({response.status_code}): {project_url}")
            return {}

        soup = BeautifulSoup(response.text, "html.parser")

        # 1. Project Title
        title_el = soup.select_one("h1")
        title = title_el.get_text(strip=True) if title_el else None

        # 2. Sidebar metadata (Budget, Duration, Publish date, etc.)
        meta_info = {}
        for row in soup.select(".meta-row"):
            label_el = row.select_one(".meta-label")
            if label_el:
                lbl = label_el.get_text(strip=True)
                val_parts = []
                for child in row.children:
                    if child != label_el and hasattr(child, 'get_text'):
                        val_parts.append(child.get_text(" ", strip=True))
                val = " ".join(" ".join(val_parts).split())
                if val:
                    meta_info[lbl] = val

        # 3. Full project description
        desc_el = soup.select_one("#projectDetailsTab .carda__content") or soup.select_one(".carda__content")
        description = desc_el.get_text("\n", strip=True) if desc_el else None

        # 4. Specific project requirements/specifications
        requirements = {}
        for field in soup.select("#projectDetailsTab .pdn--ts, #projectDetailsTab .row > div"):
            flabel = field.select_one(".field-label")
            if flabel:
                ftext = flabel.get_text(strip=True)
                val_div = field.select_one(".text-wrapper-div:not(.field-label)")
                if val_div:
                    fval = val_div.get_text(" ", strip=True)
                    if ftext and fval:
                        requirements[ftext] = fval

        # 5. Required skills
        skills = []
        for a in soup.select("a[href*='/skill/'], a[href*='/skills']"):
            skill_text = a.get_text(strip=True)
            if skill_text and skill_text not in skills:
                skills.append(skill_text)

        # 6. Publish date
        time_el = soup.select_one("time[datetime]") or soup.select_one(".meta-row time")
        publish_date = None
        if time_el and time_el.get("datetime"):
            publish_date = time_el.get("datetime")
        elif "تاريخ النشر" in meta_info:
            publish_date = meta_info["تاريخ النشر"]

        # Assemble project payload
        project_data = {
            "platform": "Mostaql",
            "title": title,
            "price": meta_info.get("الميزانية"),
            "duration": meta_info.get("مدة التنفيذ"),
            "publish_date": publish_date,
            "url": project_url,
            "description": description,
        }

        if requirements:
            project_data["requirements"] = requirements
        if skills:
            project_data["skills"] = skills

        return clean_dict(project_data)

    except Exception as e:
        print(f"  [X] Exception while fetching project details from {project_url}: {e}")
        return {}


def scrape_mostaql(max_pages: int = 1, output_file: str = "mostaql_projects.json"):
    """
    Scrape Mostaql projects across specified number of pages and optionally save to JSON.
    """
    session = requests.Session()
    all_projects = []

    print(f"[*] Starting Mostaql scraper (pages={max_pages})...")

    for page in range(1, max_pages + 1):
        page_url = f"https://mostaql.com/projects?page={page}"
        print(f"\n[+] Processing page {page}: {page_url}")

        try:
            resp = session.get(page_url, headers=HEADERS, timeout=15)
            if resp.status_code != 200:
                print(f"[!] Failed to load page {page} - Status code: {resp.status_code}")
                continue

            soup = BeautifulSoup(resp.text, "html.parser")
            rows = soup.select("tr.project-row")
            print(f"-> Found {len(rows)} projects on page {page}")

            for idx, row in enumerate(rows, 1):
                link_el = row.select_one("h2 a[href*='/project/']") or row.select_one("a[href*='/project/']")
                if not link_el:
                    continue

                project_url = link_el.get("href")
                if not project_url.startswith("http"):
                    project_url = "https://mostaql.com" + project_url

                project_title = link_el.get_text(strip=True)

                brief_el = row.select_one("p.project__brief")
                brief_text = brief_el.get_text(strip=True) if brief_el else None

                print(f"   ({idx:02d}/{len(rows):02d}) Fetching: {project_title[:45]}...")

                details = fetch_project_details(session, project_url)

                if details:
                    if brief_text:
                        details["brief"] = brief_text
                    if "url" not in details:
                        details["url"] = project_url
                    if "title" not in details:
                        details["title"] = project_title
                    all_projects.append(clean_dict(details))

                time.sleep(1.0)

        except Exception as e:
            print(f"[X] Error on page {page}: {e}")

    if output_file:
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(all_projects, f, ensure_ascii=False, indent=2)
        print(f"[+] Done: {len(all_projects)} projects saved to {output_file}")

    return all_projects


if __name__ == "__main__":
    scrape_mostaql(max_pages=1, output_file="mostaql_projects.json")
