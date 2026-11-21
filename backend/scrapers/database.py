import os
import json
import logging
from typing import Optional, Dict, Any, List, Tuple
from contextlib import contextmanager
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

logger = logging.getLogger("scrapers.database")

# Load environment variables from .env if present
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ENV_PATH = os.path.join(ROOT_DIR, ".env")
if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH)

def get_db_config() -> Dict[str, Any]:
    return {
        "host": os.getenv("POSTGRES_HOST", "localhost"),
        "port": int(os.getenv("POSTGRES_PORT", "5432")),
        "dbname": os.getenv("POSTGRES_DB", "postgres"),
        "user": os.getenv("POSTGRES_USER", "postgres"),
        "password": os.getenv("POSTGRES_PASSWORD", "postgres"),
        "connect_timeout": int(os.getenv("POSTGRES_TIMEOUT", "4")),
    }

def get_connection():
    db_url = (os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL") or "").strip()
    if db_url:
        return psycopg2.connect(db_url)
    config = get_db_config()
    return psycopg2.connect(**config)

@contextmanager
def get_db_cursor(commit=False):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        yield cursor
        if commit:
            conn.commit()
    except Exception:
        if conn and commit:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()

def init_db():
    """Initializes the database schema and indexes."""
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        platform VARCHAR(100) NOT NULL,
        platform_key VARCHAR(50) NOT NULL,
        title TEXT NOT NULL,
        url TEXT UNIQUE NOT NULL,
        price VARCHAR(100),
        duration VARCHAR(100),
        published_at VARCHAR(100),
        brief TEXT,
        requirements JSONB DEFAULT '[]'::jsonb,
        scraped_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_projects_platform_key ON projects(platform_key);
    CREATE INDEX IF NOT EXISTS idx_projects_published_at ON projects(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_projects_url ON projects(url);

    CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        title VARCHAR(255) DEFAULT 'Full-Stack Developer',
        experience_level VARCHAR(100) DEFAULT 'Mid-Level',
        summary TEXT DEFAULT '',
        skills JSONB DEFAULT '[]'::jsonb,
        cv_url TEXT DEFAULT '',
        alert_threshold INTEGER DEFAULT 75,
        applied_jobs_count INTEGER DEFAULT 0,
        proposals_count INTEGER DEFAULT 0,
        skills_score INTEGER DEFAULT 0,
        applied_score INTEGER DEFAULT 0,
        total_score INTEGER DEFAULT 0,
        badge VARCHAR(50) DEFAULT '🌱 Aspiring Talent',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
    CREATE INDEX IF NOT EXISTS idx_profiles_total_score ON profiles(total_score DESC);

    CREATE TABLE IF NOT EXISTS user_applications (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        project_title TEXT,
        platform VARCHAR(100),
        action VARCHAR(50) DEFAULT 'apply',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_user_applications_email ON user_applications(user_email);
    """
    with get_db_cursor(commit=True) as cur:
        cur.execute(create_table_sql)
    logger.info("PostgreSQL tables 'projects', 'profiles', 'user_applications' and indexes verified successfully.")

def upsert_project(conn, item: Dict[str, Any], platform_key: str) -> bool:
    """
    Upserts a single project by URL.
    Returns True if inserted (new), False if updated.
    """
    reqs = item.get("requirements") or []
    if isinstance(reqs, (list, dict)):
        reqs_json = json.dumps(reqs, ensure_ascii=False)
    else:
        reqs_json = json.dumps([str(reqs)], ensure_ascii=False)

    upsert_sql = """
    INSERT INTO projects (
        platform, platform_key, title, url, price, duration,
        published_at, brief, requirements, updated_at
    ) VALUES (
        %(platform)s, %(platform_key)s, %(title)s, %(url)s, %(price)s, %(duration)s,
        %(published_at)s, %(brief)s, %(requirements)s::jsonb, CURRENT_TIMESTAMP
    )
    ON CONFLICT (url) DO UPDATE SET
        platform = EXCLUDED.platform,
        platform_key = EXCLUDED.platform_key,
        title = EXCLUDED.title,
        price = EXCLUDED.price,
        duration = EXCLUDED.duration,
        published_at = EXCLUDED.published_at,
        brief = EXCLUDED.brief,
        requirements = EXCLUDED.requirements,
        updated_at = CURRENT_TIMESTAMP
    RETURNING (xmax = 0) AS is_inserted;
    """

    params = {
        "platform": str(item.get("platform") or platform_key),
        "platform_key": platform_key,
        "title": str(item.get("title") or ""),
        "url": str(item.get("url") or "").strip(),
        "price": item.get("price"),
        "duration": item.get("duration"),
        "published_at": item.get("published_at"),
        "brief": item.get("brief"),
        "requirements": reqs_json,
    }

    if not params["url"]:
        return False

    with conn.cursor() as cur:
        cur.execute(upsert_sql, params)
        row = cur.fetchone()
        return bool(row[0]) if row else False

def get_db_health() -> Dict[str, Any]:
    """Checks whether database is reachable and returns health status."""
    try:
        with get_db_cursor(commit=False) as cur:
            cur.execute("SELECT COUNT(*) AS total FROM projects;")
            row = cur.fetchone()
            total = row["total"] if row else 0
            return {"connected": True, "total_projects": total, "error": None}
    except Exception as e:
        return {"connected": False, "total_projects": 0, "error": str(e)}

def get_platform_stats() -> Optional[Dict[str, Dict[str, Any]]]:
    """Retrieves project counts and latest updated timestamp per platform."""
    try:
        sql = """
        SELECT platform_key,
               COUNT(*) AS count,
               MAX(updated_at) AS last_updated
        FROM projects
        GROUP BY platform_key;
        """
        with get_db_cursor(commit=False) as cur:
            cur.execute(sql)
            rows = cur.fetchall()
            stats = {}
            for r in rows:
                updated_str = r["last_updated"].strftime("%Y-%m-%d %H:%M:%S") if r["last_updated"] else None
                stats[r["platform_key"]] = {
                    "count": r["count"],
                    "last_updated": updated_str
                }
            return stats
    except Exception:
        return None

def query_projects(
    platforms: List[str],
    q: Optional[str] = None,
    limit: int = 200,
    offset: int = 0
) -> Tuple[int, List[Dict[str, Any]]]:
    """Queries projects with optional platform filtering, full search, pagination."""
    where_clauses = ["platform_key = ANY(%(platforms)s)"]
    params: Dict[str, Any] = {
        "platforms": platforms,
        "limit": limit,
        "offset": offset
    }

    search_term = None
    if q and isinstance(q, str) and q.strip():
        search_term = q.strip()
        where_clauses.append(
            "(title ILIKE %(q)s OR brief ILIKE %(q)s OR requirements::text ILIKE %(q)s)"
        )
        params["q"] = f"%{search_term}%"

    where_sql = " AND ".join(where_clauses)
    count_sql = f"SELECT COUNT(*) AS total FROM projects WHERE {where_sql};"
    data_sql = f"""
    SELECT platform, title, url, price, duration, published_at, brief, requirements
    FROM projects
    WHERE {where_sql}
    ORDER BY published_at DESC NULLS LAST, id DESC
    LIMIT %(limit)s OFFSET %(offset)s;
    """

    with get_db_cursor(commit=False) as cur:
        cur.execute(count_sql, params)
        total_row = cur.fetchone()
        total = total_row["total"] if total_row else 0

        cur.execute(data_sql, params)
        rows = cur.fetchall()
        projects = []
        for r in rows:
            projects.append({
                "platform": r["platform"],
                "title": r["title"],
                "url": r["url"],
                "price": r["price"],
                "duration": r["duration"],
                "published_at": r["published_at"],
                "brief": r["brief"],
                "requirements": r["requirements"] if r["requirements"] is not None else [],
            })
        return total, projects

def sync_json_files_to_db(output_dir: Optional[str] = None) -> Dict[str, Any]:
    """Reads all JSON files in output/ and dumps/upserts them directly into PostgreSQL."""
    if not output_dir:
        output_dir = os.path.join(ROOT_DIR, "output")

    files_map = {
        "mostaql": "mostaql_projects.json",
        "khamsat": "khamsat_projects.json",
        "nafezly": "nafezly_projects.json",
        "freelancer": "freelancer_projects.json",
    }

    init_db()
    conn = get_connection()
    conn.autocommit = True

    results = {}
    grand_inserted = 0
    grand_updated = 0

    try:
        for platform_key, filename in files_map.items():
            path = os.path.join(output_dir, filename)
            if not os.path.exists(path):
                continue
            try:
                with open(path, "r", encoding="utf-8") as f:
                    items = json.load(f)
            except Exception:
                continue

            inserted = 0
            updated = 0
            for item in items:
                try:
                    is_new = upsert_project(conn, item, platform_key)
                    if is_new:
                        inserted += 1
                    else:
                        updated += 1
                except Exception:
                    pass

            results[platform_key] = {"total": inserted + updated, "inserted": inserted, "updated": updated}
            grand_inserted += inserted
            grand_updated += updated
    finally:
        conn.close()

    return {
        "status": "ok",
        "total_processed": grand_inserted + grand_updated,
        "new_inserted": grand_inserted,
        "updated": grand_updated,
        "platforms": results
    }
