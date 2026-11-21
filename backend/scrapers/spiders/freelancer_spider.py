import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import json, re
from datetime import datetime
import scrapy
from scrapers.items import ProjectItem
from scrapers.utils import convert_utc_to_local

def clean(t): return re.sub(r"\s+", " ", t or "").strip()

class FreelancerSpider(scrapy.Spider):
    name = "freelancer"
    allowed_domains = ["freelancer.com"]
    output_filename = "freelancer_projects.json"
    start_urls = ["https://www.freelancer.com/api/projects/0.1/projects/active?limit=25&compact=true&job_details=true"]
    custom_settings = {"DOWNLOAD_DELAY": 0.5}

    def parse(self, response):
        try: data = json.loads(response.text)
        except Exception: return

        for p in data.get("result", {}).get("projects", []):
            item = ProjectItem(platform="فريلانسر (Freelancer.com)")
            item["title"] = clean(p.get("title", ""))

            seo = p.get("seo_url")
            item["url"] = f"https://www.freelancer.com/projects/{seo or p.get('id')}"

            sign = p.get("currency", {}).get("sign", "$")
            code = p.get("currency", {}).get("code", "USD")
            lo, hi = p.get("budget", {}).get("minimum"), p.get("budget", {}).get("maximum")
            if lo and hi: item["price"] = f"{sign}{lo} - {sign}{hi} {code}"
            elif lo: item["price"] = f"{sign}{lo} {code}"

            if p.get("bidperiod"): item["duration"] = f"{p['bidperiod']} أيام"

            ts = p.get("submitdate") or p.get("time_submitted")
            if ts:
                try: item["published_at"] = convert_utc_to_local(datetime.utcfromtimestamp(int(ts)).strftime("%Y-%m-%d %H:%M:%S"))
                except Exception: pass

            desc = clean(p.get("description") or p.get("preview_description") or "")
            if desc: item["brief"] = desc

            skills = [clean(j.get("name", "")) for j in p.get("jobs", []) if j.get("name")]
            if skills: item["requirements"] = skills

            yield item


if __name__ == "__main__":
    from scrapy.crawler import CrawlerProcess
    from scrapy.utils.project import get_project_settings
    os.environ.setdefault("SCRAPY_SETTINGS_MODULE", "scrapers.settings")
    process = CrawlerProcess(get_project_settings())
    process.crawl(FreelancerSpider)
    process.start()
