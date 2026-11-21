import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import re
import scrapy
from scrapers.items import ProjectItem
from scrapers.utils import parse_arabic_relative_time

def clean(t): return re.sub(r"\s+", " ", t or "").strip()

class KhamsatSpider(scrapy.Spider):
    name = "khamsat"
    allowed_domains = ["khamsat.com"]
    output_filename = "khamsat_projects.json"
    start_urls = ["https://khamsat.com/community/requests"]
    custom_settings = {"DOWNLOAD_DELAY": 0.5}

    def parse(self, response):
        for row in response.css("tr.forum_post"):
            a = row.css("h3.details-head a")
            title = re.sub(r"^عنوان الطلب:\s*", "", clean(a.css("::text").get("")))
            href = a.attrib.get("href", "")
            if not title or not href:
                continue

            raw_time = next((clean(t) for t in row.css("span ::text, td ::text").getall()
                             if clean(t).startswith("منذ") and "تفاعل" not in clean(t)), "")

            item = ProjectItem(
                platform="خمسات (Khamsat)",
                title=title,
                url=response.urljoin(href),
                brief=title,
            )

            if raw_time:
                item["published_at"] = parse_arabic_relative_time(raw_time) or raw_time

            price_match = re.search(r'(?:ميزاني[ةي]|الميزانية|سعر|السعر|مقابل|بـ|بمبلغ|مبلغ|تكلفة)\s*[:=]?\s*(\$?\s*\d+(?:\s*[-–]\s*\d+)?\s*(?:\$|دولار|USD)?)', title, re.IGNORECASE)
            if price_match:
                item["price"] = clean(price_match.group(1))

            dur_match = re.search(r'(?:خلال|في غضون|مدة|المدة|في)\s*(\d+\s*(?:يوم|أيام|ايام|ساعة|ساعات|أسبوع|اسبوع|اسابيع|شهر)|يومين|اسبوعين|شهرين)', title)
            if dur_match:
                item["duration"] = clean(dur_match.group(1))

            stop = {"مطلوب","خدمة","طريقة","تصميم","برمجة","محترف","أريد","إنشاء","عمل","مشروع"}
            words = [w for w in re.split(r"[\s,،/\\-]+", title) if len(w) > 3 and w not in stop]
            if words: item["requirements"] = words[:5]

            yield item


if __name__ == "__main__":
    from scrapy.crawler import CrawlerProcess
    from scrapy.utils.project import get_project_settings
    os.environ.setdefault("SCRAPY_SETTINGS_MODULE", "scrapers.settings")
    process = CrawlerProcess(get_project_settings())
    process.crawl(KhamsatSpider)
    process.start()
