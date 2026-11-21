import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import re
import scrapy
from scrapers.items import ProjectItem
from scrapers.utils import convert_utc_to_local

def clean(t): return re.sub(r"\s+", " ", t or "").strip()

def get_meta(response, label):
    for row in response.css(".meta-row"):
        if label in clean(row.css(".meta-label::text").get("")):
            return clean(" ".join(row.css(".meta-value ::text").getall()))
    return ""

class MostaqlSpider(scrapy.Spider):
    name = "mostaql"
    allowed_domains = ["mostaql.com"]
    output_filename = "mostaql_projects.json"
    start_urls = ["https://mostaql.com/projects"]
    custom_settings = {"DOWNLOAD_DELAY": 0.5, "CONCURRENT_REQUESTS": 4}

    def parse(self, response):
        for row in response.css("tr.project-row"):
            a = row.css("h2 a, h3 a")
            url = response.urljoin(a.attrib.get("href", ""))
            if url:
                yield response.follow(url, self.parse_project, dont_filter=True, meta={
                    "title": clean(a.css("::text").get("")),
                    "url": url,
                    "time": row.css("time::attr(datetime)").get(""),
                    "brief": clean(" ".join(row.css("p.project__brief ::text").getall())),
                })

    def parse_project(self, response):
        m = response.meta
        item = ProjectItem(platform="مستقل (Mostaql)", url=m["url"])
        item["title"] = clean(" ".join(response.css("h1 ::text").getall())) or m["title"]

        price = clean(response.css('[data-type="project-budget_range"] span::text').get("")) or get_meta(response, "الميزانية")
        if price: item["price"] = price

        dur = get_meta(response, "مدة التنفيذ")
        if dur: item["duration"] = dur

        t = response.css(".meta-row time::attr(datetime)").get("") or m["time"]
        if t: item["published_at"] = convert_utc_to_local(clean(t))

        # محاولة سحب الوصف بعدة selectors مختلفة
        desc = ""
        for selector in [
            ".col-md-8 p::text, .col-md-8 li::text",
            ".project-brief p::text, .project-brief li::text",
            ".panel-body p::text, .panel-body li::text",
            "article p::text, main p::text",
        ]:
            parts = [p.strip() for p in response.css(selector).getall() if p.strip()]
            if parts:
                desc = clean(" ".join(parts))
                break
        if not desc:
            desc = m["brief"]
        if desc:
            item["brief"] = desc

        skills = [clean(s) for s in response.css(".skills__item bdi::text, .tag bdi::text").getall()]
        skills = [s for s in skills if 2 < len(s) <= 40 and len(s.split()) <= 4]
        if skills: item["requirements"] = list(dict.fromkeys(skills))[:6]

        yield item


if __name__ == "__main__":
    from scrapy.crawler import CrawlerProcess
    from scrapy.utils.project import get_project_settings
    os.environ.setdefault("SCRAPY_SETTINGS_MODULE", "scrapers.settings")
    process = CrawlerProcess(get_project_settings())
    process.crawl(MostaqlSpider)
    process.start()
