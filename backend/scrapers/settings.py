BOT_NAME = "scrapers"
SPIDER_MODULES = ["scrapers.spiders"]
NEWSPIDER_MODULE = "scrapers.spiders"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

DEFAULT_REQUEST_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}

ROBOTSTXT_OBEY = False
DOWNLOAD_DELAY = 0.5
RANDOMIZE_DOWNLOAD_DELAY = False
CONCURRENT_REQUESTS = 8
CONCURRENT_REQUESTS_PER_DOMAIN = 4

RETRY_TIMES = 2
RETRY_HTTP_CODES = [500, 502, 503, 504, 408, 429]
DOWNLOAD_TIMEOUT = 15

FEED_EXPORT_ENCODING = "utf-8"
ITEM_PIPELINES = {
    "scrapers.pipelines.PostgresPipeline": 200,
    "scrapers.pipelines.MostaqlSortPipeline": 300,
}
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"
LOG_LEVEL = "INFO"
