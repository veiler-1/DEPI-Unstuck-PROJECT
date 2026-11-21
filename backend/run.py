import os, sys, argparse
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
from scrapers.spiders.mostaql_spider import MostaqlSpider
from scrapers.spiders.khamsat_spider import KhamsatSpider
from scrapers.spiders.nafezly_spider import NafezlySpider
from scrapers.spiders.freelancer_spider import FreelancerSpider

SPIDERS = {
    "mostaql": MostaqlSpider,
    "khamsat": KhamsatSpider,
    "nafezly": NafezlySpider,
    "freelancer": FreelancerSpider,
}

def run(target="all"):
    os.environ.setdefault("SCRAPY_SETTINGS_MODULE", "scrapers.settings")
    process = CrawlerProcess(get_project_settings())
    if target == "all":
        for spider in SPIDERS.values():
            process.crawl(spider)
    elif target in SPIDERS:
        process.crawl(SPIDERS[target])
    else:
        print(f"Unknown spider: {target}")
        return
    process.start()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--spider", default="all", choices=list(SPIDERS.keys()) + ["all"])
    args = parser.parse_args()
    run(args.spider)
