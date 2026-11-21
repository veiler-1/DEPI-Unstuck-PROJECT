import os
import json
from itemadapter import ItemAdapter
from scrapers.database import init_db, get_connection, upsert_project

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "output")


class PostgresPipeline:
    """
    Pipelines that connects to PostgreSQL and UPSERTs each project item
    immediately on arrival to prevent duplicate records and keep data up-to-date.
    """
    def __init__(self):
        self.conn = None
        self.enabled = False
        self.inserted_count = 0
        self.updated_count = 0
        self.error_count = 0

    def open_spider(self, spider):
        try:
            init_db()
            self.conn = get_connection()
            self.conn.autocommit = True
            self.enabled = True
            spider.logger.info(f"[{spider.name}] Connected to PostgreSQL successfully for UPSERT.")
        except Exception as e:
            self.enabled = False
            spider.logger.error(
                f"[{spider.name}] Could not connect to PostgreSQL: {e}. "
                "Scraper will continue without database upsert."
            )

    def process_item(self, item, spider):
        if not self.enabled or not self.conn:
            return item

        adapter = ItemAdapter(item)
        raw_dict = adapter.asdict()
        platform_key = getattr(spider, "name", "unknown")

        try:
            is_new = upsert_project(self.conn, raw_dict, platform_key)
            if is_new:
                self.inserted_count += 1
            else:
                self.updated_count += 1
        except Exception as e:
            self.error_count += 1
            spider.logger.warning(f"[{spider.name}] Failed to upsert item {raw_dict.get('url')}: {e}")

        return item

    def close_spider(self, spider):
        if self.enabled and self.conn:
            try:
                self.conn.close()
            except Exception:
                pass
            spider.logger.info(
                f"[{spider.name}] PostgreSQL UPSERT finished -> "
                f"New: {self.inserted_count}, Updated: {self.updated_count}, Errors: {self.error_count}"
            )


class MostaqlSortPipeline:
    """
    Saves sorted results to JSON files in output/ directory (keeps backward compatibility).
    """
    def open_spider(self, spider):
        self.items = []
        os.makedirs(OUTPUT_DIR, exist_ok=True)

    def process_item(self, item, spider):
        cleaned = {k: v for k, v in ItemAdapter(item).asdict().items() if v not in (None, "", [], {})}
        self.items.append(cleaned)
        return item

    def close_spider(self, spider):
        self.items.sort(key=lambda x: str(x.get("published_at", "")), reverse=True)
        filename = getattr(spider, "output_filename", f"{spider.name}_projects.json")
        path = os.path.join(OUTPUT_DIR, filename)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(self.items, f, ensure_ascii=False, indent=2)
        spider.logger.info(f"[{spider.name}] saved {len(self.items)} projects to {path}")
