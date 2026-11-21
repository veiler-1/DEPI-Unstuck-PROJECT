import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import json, re
import scrapy
from scrapers.items import ProjectItem
from scrapers.utils import parse_arabic_relative_time

def clean(t): return re.sub(r"\s+", " ", t or "").strip()

def get_schema(response):
    for script in response.css('script[type*="json"]::text').getall():
        if '"JobPosting"' in script:
            try:
                d = json.loads(script)
                if d.get("@type") == "JobPosting":
                    return d
            except Exception:
                pass
    return {}

def get_desc(response, job):
    # 1. من schema.org JobPosting description
    desc = clean(job.get("description", ""))
    if desc:
        return desc

    # 2. من meta description tag
    desc = clean(response.css('meta[name="description"]::attr(content)').get(""))
    if desc and len(desc) > 30:
        return desc

    # 3. من og:description
    desc = clean(response.css('meta[property="og:description"]::attr(content)').get(""))
    if desc and len(desc) > 30:
        return desc

    # 4. من أي script يحتوي على بيانات المشروع (Inertia.js / SSR data)
    for script in response.css("script::text").getall():
        if "description" in script and len(script) < 50000:
            try:
                # Inertia page data
                match = re.search(r'"description"\s*:\s*"([^"]{30,})"', script)
                if match:
                    return clean(match.group(1).encode().decode("unicode_escape"))
            except Exception:
                pass

    # 5. من HTML مباشرة بعدة selectors
    for selector in [
        "[class*='description'] p::text, [class*='description'] li::text",
        "[class*='content'] p::text, [class*='content'] li::text",
        "[class*='detail'] p::text, [class*='detail'] li::text",
        "[class*='body'] p::text, [class*='body'] li::text",
        "article p::text, article li::text",
        "main p::text",
    ]:
        parts = [p.strip() for p in response.css(selector).getall()
                 if len(p.strip()) > 15]
        if parts:
            return clean(" ".join(parts))

    return ""


class NafezlySpider(scrapy.Spider):
    name = "nafezly"
    allowed_domains = ["nafezly.com"]
    output_filename = "nafezly_projects.json"
    start_urls = ["https://nafezly.com/projects"]
    custom_settings = {"DOWNLOAD_DELAY": 0.5, "CONCURRENT_REQUESTS": 4}

    def parse(self, response):
        seen = set()
        for a in response.xpath('//a[contains(@href, "/project/")]'):
            url = response.urljoin(a.attrib.get("href", ""))
            if any(c.isdigit() for c in url) and url not in seen and not url.endswith("/create-guest"):
                seen.add(url)
                yield response.follow(url, self.parse_project, dont_filter=True)

    def parse_project(self, response):
        job = get_schema(response)
        item = ProjectItem(platform="نفذلي (Nafezly)", url=response.url)

        item["title"] = clean(job.get("title", "")) or clean(" ".join(response.css("h1 ::text").getall()))

        # السعر
        price = ""
        for node in response.xpath('//*[contains(text(),"الميزانية")]/parent::*'):
            m = re.search(r'(\d+(?:\s*[-–]\s*\d+)?\s*\$)', " ".join(node.css("::text").getall()))
            if m: price = clean(m.group(1)); break
        if not price and job.get("baseSalary"):
            val = job["baseSalary"].get("value", {}).get("value")
            if val: price = f"{val} {job.get('salaryCurrency', 'USD')}"
        if price:
            item["price"] = price

        # المدة
        duration = ""
        dur_nodes = response.xpath('//*[contains(text(),"المدة المتاحة") or contains(text(),"مدة التنفيذ")]/parent::*')
        for node in dur_nodes:
            raw_text = clean(" ".join(node.css("::text").getall()))
            m = re.search(r'(\d+)\s*(?:يوم|أيام|ايام|ساعة|ساعات|شهر|أسبوع|اسبوع)', raw_text)
            if m:
                duration = m.group(0)
                break
        if not duration and job.get("workHours"):
            duration = f"{job.get('workHours')} أيام"
        if duration:
            item["duration"] = duration

        # تاريخ النشر
        raw_pub = ""
        for node in response.xpath('//*[contains(text(),"تاريخ النشر")]/parent::*'):
            txts = [t.strip() for t in node.css("::text").getall()
                    if t.strip() and t.strip() != "تاريخ النشر"]
            if txts: raw_pub = " ".join(txts); break
        dt = parse_arabic_relative_time(raw_pub) if raw_pub else (
            f"{clean(job.get('datePosted', ''))} 00:00:00" if job.get("datePosted") else "")
        if dt: item["published_at"] = dt
        elif raw_pub: item["published_at"] = raw_pub

        # الوصف
        desc = get_desc(response, job)
        if desc:
            item["brief"] = desc

        # المهارات
        raw_s = job.get("skills", [])
        skills = [clean(s) for s in (raw_s.split(",") if isinstance(raw_s, str) else raw_s) if clean(s)]
        if not skills:
            skills = [clean(s) for s in response.css('a[href*="skill"]::text, .badge::text').getall()]
        skills = [s for s in skills if 2 < len(s) <= 40 and len(s.split()) <= 4]
        if skills:
            item["requirements"] = list(dict.fromkeys(skills))[:6]

        yield item


if __name__ == "__main__":
    from scrapy.crawler import CrawlerProcess
    from scrapy.utils.project import get_project_settings
    os.environ.setdefault("SCRAPY_SETTINGS_MODULE", "scrapers.settings")
    process = CrawlerProcess(get_project_settings())
    process.crawl(NafezlySpider)
    process.start()
