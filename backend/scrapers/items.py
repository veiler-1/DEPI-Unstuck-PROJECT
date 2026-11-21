import scrapy


class ProjectItem(scrapy.Item):
    platform = scrapy.Field()
    title = scrapy.Field()
    url = scrapy.Field()
    price = scrapy.Field()
    duration = scrapy.Field()
    published_at = scrapy.Field()
    brief = scrapy.Field()
    requirements = scrapy.Field()
