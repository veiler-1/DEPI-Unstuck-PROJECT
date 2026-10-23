import os
import sqlite3
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "freelance_projects.db")


def get_db_connection(db_path: str = DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db(db_path: str = DB_PATH) -> None:
    conn = get_db_connection(db_path)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS platforms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            base_url TEXT NOT NULL
        );
    """)

    default_platforms = [
        ("Mostaql", "https://mostaql.com"),
        ("Khamsat", "https://khamsat.com"),
        ("Nafezly", "https://nafezly.com"),
        ("Freelancer", "https://freelancer.com"),
    ]
    cursor.executemany(
        "INSERT OR IGNORE INTO platforms (name, base_url) VALUES (?, ?);",
        default_platforms,
    )

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_uid TEXT UNIQUE NOT NULL,
            platform_id INTEGER NOT NULL,
            platform TEXT NOT NULL,
            title TEXT NOT NULL,
            url TEXT,
            price TEXT,
            duration TEXT,
            published_date TEXT,
            author TEXT,
            brief TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS project_skills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            skill_name TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ai_analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER UNIQUE NOT NULL,
            ai_summary TEXT,
            ai_category TEXT,
            ai_complexity TEXT,
            ai_proposal_pitch TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_projects_uid ON projects(project_uid);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_projects_platform ON projects(platform);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_skills_project_id ON project_skills(project_id);")

    conn.commit()
    conn.close()


def generate_project_uid(project: Dict[str, Any]) -> str:
    url = project.get("url") or project.get("link")
    if url:
        return hashlib.md5(url.strip().encode("utf-8")).hexdigest()

    platform = str(project.get("platform", "general")).strip().lower()
    title = str(project.get("title", "")).strip().lower()
    return hashlib.md5(f"{platform}:{title}".encode("utf-8")).hexdigest()


def insert_project(project: Dict[str, Any], db_path: str = DB_PATH) -> Tuple[bool, Optional[int]]:
    uid = generate_project_uid(project)
    conn = get_db_connection(db_path)
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM projects WHERE project_uid = ?", (uid,))
    existing = cursor.fetchone()
    if existing:
        conn.close()
        return False, existing["id"]

    platform_name = str(project.get("platform", "Other")).capitalize()

    cursor.execute("SELECT id FROM platforms WHERE LOWER(name) = LOWER(?)", (platform_name,))
    plat_row = cursor.fetchone()
    if plat_row:
        platform_id = plat_row["id"]
    else:
        cursor.execute("INSERT INTO platforms (name, base_url) VALUES (?, ?)", (platform_name, project.get("url", "")))
        platform_id = cursor.lastrowid

    cursor.execute("""
        INSERT INTO projects (
            project_uid, platform_id, platform, title, url,
            price, duration, published_date, author, brief, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        uid,
        platform_id,
        platform_name,
        project.get("title", "Untitled"),
        project.get("url"),
        project.get("price"),
        project.get("duration"),
        project.get("published_date") or project.get("published_at"),
        project.get("author"),
        project.get("brief"),
        project.get("description"),
    ))
    project_id = cursor.lastrowid

    skills = project.get("skills") or project.get("required_skills") or []
    if isinstance(skills, list):
        for s in skills:
            if s and isinstance(s, str):
                cursor.execute(
                    "INSERT INTO project_skills (project_id, skill_name) VALUES (?, ?)",
                    (project_id, s.strip()),
                )

    ai_data = project.get("ai_analysis")
    if isinstance(ai_data, dict) and ai_data.get("ai_enabled"):
        cursor.execute("""
            INSERT OR REPLACE INTO ai_analysis (
                project_id, ai_summary, ai_category, ai_complexity, ai_proposal_pitch
            ) VALUES (?, ?, ?, ?, ?)
        """, (
            project_id,
            ai_data.get("ai_summary"),
            ai_data.get("ai_category"),
            ai_data.get("ai_complexity"),
            ai_data.get("ai_proposal_pitch")
        ))

    conn.commit()
    conn.close()
    return True, project_id


def save_projects_batch(projects: List[Dict[str, Any]], db_path: str = DB_PATH) -> Dict[str, Any]:
    init_db(db_path)
    inserted_count = 0
    duplicate_count = 0
    new_projects = []

    for proj in projects:
        is_new, _ = insert_project(proj, db_path=db_path)
        if is_new:
            inserted_count += 1
            new_projects.append(proj)
        else:
            duplicate_count += 1

    return {
        "total": len(projects),
        "inserted_new": inserted_count,
        "duplicates_skipped": duplicate_count,
        "new_projects": new_projects
    }


def filter_new_projects(projects: List[Dict[str, Any]], db_path: str = DB_PATH) -> List[Dict[str, Any]]:
    init_db(db_path)
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    new_items = []

    for p in projects:
        uid = generate_project_uid(p)
        cursor.execute("SELECT id FROM projects WHERE project_uid = ?", (uid,))
        if not cursor.fetchone():
            new_items.append(p)

    conn.close()
    return new_items


def query_projects(
    platform: Optional[str] = None,
    keyword: Optional[str] = None,
    limit: int = 50,
    db_path: str = DB_PATH
) -> List[Dict[str, Any]]:
    init_db(db_path)
    conn = get_db_connection(db_path)
    cursor = conn.cursor()

    query = """
        SELECT p.*,
               a.ai_summary, a.ai_category, a.ai_complexity, a.ai_proposal_pitch
        FROM projects p
        LEFT JOIN ai_analysis a ON p.id = a.project_id
        WHERE 1=1
    """
    params = []

    if platform:
        query += " AND LOWER(p.platform) = LOWER(?)"
        params.append(platform.strip())

    if keyword:
        kw = f"%{keyword.strip()}%"
        query += " AND (p.title LIKE ? OR p.description LIKE ? OR p.brief LIKE ?)"
        params.extend([kw, kw, kw])

    query += " ORDER BY p.id DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    rows = cursor.fetchall()

    results = []
    for r in rows:
        item = dict(r)
        cursor.execute("SELECT skill_name FROM project_skills WHERE project_id = ?", (item["id"],))
        item["skills"] = [s["skill_name"] for s in cursor.fetchall()]
        results.append(item)

    conn.close()
    return results


def get_db_stats(db_path: str = DB_PATH) -> Dict[str, Any]:
    init_db(db_path)
    conn = get_db_connection(db_path)
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) AS total FROM projects")
    total_projects = cursor.fetchone()["total"]

    cursor.execute("SELECT platform, COUNT(*) AS count FROM projects GROUP BY platform")
    platform_counts = {r["platform"]: r["count"] for r in cursor.fetchall()}

    cursor.execute("SELECT COUNT(*) AS total FROM ai_analysis")
    ai_count = cursor.fetchone()["total"]

    conn.close()
    return {
        "db_file": db_path,
        "total_projects": total_projects,
        "by_platform": platform_counts,
        "ai_enriched_count": ai_count
    }


def reset_db(db_path: str = DB_PATH) -> None:
    if os.path.exists(db_path):
        os.remove(db_path)
    init_db(db_path)
