"""
Khamsat Community Requests Scraper
===================================
Scrapes buyer requests from Khamsat Community (khamsat.com/community/requests),
bypasses anti-bot / WAF protections if needed, normalizes text content,
and extracts structured data (title, budget, duration, requirements, author, etc.).
"""

import sys
import os
import re
import json
import time
import argparse
from typing import Dict, Any, List, Optional
import requests
from bs4 import BeautifulSoup

# Ensure safe UTF-8 terminal printing on Windows
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

BASE_URL = "https://khamsat.com"
COMMUNITY_REQUESTS_URL = "https://khamsat.com/community/requests"

DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
    'Referer': 'https://khamsat.com/community/requests',
    'Connection': 'keep-alive',
}


def clean_text(text: Optional[str]) -> str:
    """Normalize text, replace newlines/tabs with spaces, and strip redundant whitespaces."""
    if not text:
        return ""
    cleaned = text.replace('\r', ' ').replace('\n', ' ').replace('\t', ' ')
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned


def get_waf_cookies(sample_topic_url: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve AWS WAF challenge tokens using Playwright if required."""
    print("[*] Initializing browser session for AWS WAF verification...")
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("[!] Playwright library not installed. Proceeding with standard requests.")
        return []

    target_url = sample_topic_url or "https://khamsat.com/community/requests"

    cookies = []
    with sync_playwright() as p:
        browser = None
        for channel in ['chrome', 'msedge', None]:
            try:
                launch_kwargs = {
                    'headless': True,
                    'args': ['--disable-blink-features=AutomationControlled', '--no-sandbox']
                }
                if channel:
                    launch_kwargs['channel'] = channel
                browser = p.chromium.launch(**launch_kwargs)
                break
            except Exception:
                continue

        if not browser:
            print("[!] Could not launch headless browser. Falling back to direct requests.")
            return []

        try:
            context = browser.new_context(
                user_agent=DEFAULT_HEADERS['User-Agent'],
                locale='ar-SA'
            )
            page = context.new_page()
            page.goto(target_url, wait_until='networkidle', timeout=30000)
            time.sleep(2)
            cookies = context.cookies()
            print(f"[+] Successfully extracted {len(cookies)} session cookies.")
        except Exception as e:
            print(f"[!] Warning during cookie extraction: {e}")
        finally:
            browser.close()

    return cookies


def extract_price(text: str) -> Optional[str]:
    """Extract price or budget if specified in the request body."""
    patterns = [
        r'(?:ميزانية|بمبلغ|سعر|المبلغ|الميزانية)?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:\$|دولار|USD)',
        r'\$\s*(\d+(?:\.\d+)?)',
        r'(?:ميزانية|بمبلغ|الميزانية)\s*[:\-]?\s*(\d+)',
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            val = m.group(1).strip()
            return f"{val} USD"
    return None


def extract_duration(text: str) -> Optional[str]:
    """Extract delivery duration if mentioned in request body."""
    m_dual = re.search(r'\b(?:خلال\s+)?(يومان|يومين|أسبوعان|أسبوعين|اسبوعان|اسبوعين|شهران|شهرين|ساعتان|ساعتين)\b', text)
    if m_dual:
        return m_dual.group(0).strip()

    m = re.search(r'(?:خلال|في خلال|في غضون|المدة\s*[:\-]?|مدة التسليم\s*[:\-]?)\s*(\d+\s*(?:يوم|أيام|ساعات|ساعة|أسبوع|اسبوع|أسابيع|شهور|أشهر|شهر))', text)
    if m:
        return m.group(1).strip()

    m2 = re.search(r'\b(\d+\s*(?:يوم|أيام|ساعات|أسبوع|اسبوع|أسابيع|شهور|أشهر|شهر))\b', text)
    if m2:
        return m2.group(1).strip()

    return None


def extract_requirements(text: str) -> Optional[List[str]]:
    """Extract itemized requirements or task points from description text."""
    reqs = []
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    for line in lines:
        if line.startswith(('-', '•', '*', '1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.')):
            cleaned = re.sub(r'^[-•*\d\.]+\s*', '', line).strip()
            cleaned = clean_text(cleaned)
            if cleaned and len(cleaned) > 3:
                reqs.append(cleaned)
        elif any(kw in line for kw in ['المطلوب:', 'المطلوب :', 'الشروط:', 'احتاج الى', 'أحتاج إلى']):
            cleaned = re.sub(r'^(المطلوب|الشروط)\s*[:\-]?\s*', '', line).strip()
            cleaned = clean_text(cleaned)
            if cleaned and len(cleaned) > 5:
                reqs.append(cleaned)

    return reqs if reqs else None


def extract_brief(text: str) -> Optional[str]:
    """Extract concise single-line overview from description text."""
    if not text:
        return None
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    if not lines:
        return None

    first_meaningful = lines[0]
    if len(first_meaningful) < 25 and len(lines) > 1:
        first_meaningful += " - " + lines[1]

    cleaned = clean_text(first_meaningful)
    if len(cleaned) > 180:
        return cleaned[:177] + "..."
    return cleaned


def scrape_topic_details(session: requests.Session, topic_url: str) -> Dict[str, Any]:
    """Visit topic detail page to parse description, brief, budget, and requirements."""
    details = {}
    try:
        resp = session.get(topic_url, timeout=15)
        if resp.status_code != 200:
            return details

        soup = BeautifulSoup(resp.text, 'html.parser')

        # Extract article body
        article = soup.find('article', class_='replace_urls')
        if article:
            raw_description = article.get_text(separator='\n', strip=True)
            if raw_description:
                brief = extract_brief(raw_description)
                reqs = extract_requirements(raw_description)
                price = extract_price(raw_description)
                duration = extract_duration(raw_description)
                clean_desc = clean_text(raw_description)

                if clean_desc:
                    details['description'] = clean_desc

                if brief:
                    details['brief'] = clean_text(brief)

                if reqs:
                    details['requirements'] = [clean_text(r) for r in reqs if clean_text(r)]

                if price:
                    details['price'] = clean_text(price)

                if duration:
                    details['duration'] = clean_text(duration)

        # Precise publish time from sidebar
        sidebar = soup.find('div', id='community_sidebar') or soup.find('div', class_='col-lg-4')
        if sidebar:
            time_elem = sidebar.find('span', dir='ltr')
            if time_elem:
                exact_time = clean_text(time_elem.get('title') or time_elem.get_text(strip=True))
                if exact_time:
                    details['published_date_detailed'] = exact_time

    except Exception as e:
        print(f"    [!] Error fetching details for {topic_url}: {e}")

    return details


def scrape_khamsat_requests(num_pages: int = 1, output_file: str = "khamsat_requests.json"):
    """
    Scrape requests from Khamsat Community across specified number of pages.
    """
    session = requests.Session()
    session.headers.update(DEFAULT_HEADERS)

    print(f"[*] Connecting to Khamsat Community: {COMMUNITY_REQUESTS_URL}")
    initial_res = session.get(COMMUNITY_REQUESTS_URL, timeout=15)
    initial_soup = BeautifulSoup(initial_res.text, 'html.parser')

    sample_url = None
    first_tr = initial_soup.find('tr', class_='forum_post')
    if first_tr:
        link_elem = first_tr.find('h3', class_='details-head')
        if link_elem and link_elem.find('a'):
            sample_url = BASE_URL + link_elem.find('a')['href']

    cookies = get_waf_cookies(sample_url)
    for c in cookies:
        session.cookies.set(c['name'], c['value'], domain=c.get('domain', 'khamsat.com'))

    all_projects = []

    for page_idx in range(1, num_pages + 1):
        page_url = COMMUNITY_REQUESTS_URL if page_idx == 1 else f"{COMMUNITY_REQUESTS_URL}?page={page_idx}"
        print(f"[*] Processing page {page_idx} of {num_pages}: {page_url}")

        page_res = session.get(page_url, timeout=15)
        if page_res.status_code != 200:
            print(f"[!] Failed to access page {page_idx} (Status code: {page_res.status_code})")
            continue

        soup = BeautifulSoup(page_res.text, 'html.parser')
        rows = soup.find_all('tr', class_='forum_post')
        print(f"[+] Found {len(rows)} requests on page {page_idx}.\n")

        for idx, tr in enumerate(rows, start=1):
            title_tag = tr.find('h3', class_='details-head')
            if not title_tag or not title_tag.find('a'):
                continue

            a_tag = title_tag.find('a')
            title = clean_text(a_tag.get_text(strip=True))
            link = BASE_URL + a_tag['href']

            details_list = tr.find('ul', class_='details-list')
            published_date = None
            publisher = None

            if details_list:
                user_tag = details_list.find('a', class_='user')
                if user_tag:
                    publisher = clean_text(user_tag.get_text(strip=True))

                time_tag = details_list.find('span', dir='ltr')
                if time_tag:
                    rel_time = clean_text(time_tag.get_text(strip=True))
                    abs_time = clean_text(time_tag.get('title'))
                    if abs_time and rel_time:
                        published_date = f"{rel_time} ({abs_time})"
                    else:
                        published_date = abs_time or rel_time

            print(f"[{idx}/{len(rows)}] Fetching request details: {title[:45]}...")

            post_details = scrape_topic_details(session, link)

            project_data = {
                'platform': 'Khamsat',
                'title': title,
                'url': link,
            }

            if published_date:
                project_data['published_date'] = published_date

            if publisher:
                project_data['author'] = publisher

            for k, v in post_details.items():
                if v:
                    project_data[k] = v

            all_projects.append(project_data)
            time.sleep(0.4)

    if output_file:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_projects, f, ensure_ascii=False, indent=2)
        print(f"[+] Done: {len(all_projects)} requests saved to {output_file}")

    return all_projects


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Khamsat Community Requests Scraper")
    parser.add_argument('--pages', type=int, default=1, help="Number of pages to scrape (default: 1)")
    parser.add_argument('--output', type=str, default="khamsat_requests.json", help="Output JSON filename")
    args = parser.parse_args()

    scrape_khamsat_requests(num_pages=args.pages, output_file=args.output)
