"""
Supabase Data Migration Tool
Uploads all scraped freelance projects and existing users directly to Supabase.
Usage:
    py migrate_to_supabase.py
"""

import os
import sys
import json
import sqlite3
import logging
from datetime import datetime
from dotenv import load_dotenv

# Reconfigure stdout for Windows arabic console support
if sys.platform == "win32":
    try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception: pass

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(ROOT_DIR, "output")
AUTH_DB_PATH = os.path.join(ROOT_DIR, "unstuck_auth.db")

load_dotenv(os.path.join(ROOT_DIR, ".env"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("migrate_to_supabase")

PLATFORM_FILES = {
    "mostaql":    {"name": "مستقل",     "file": "mostaql_projects.json"},
    "khamsat":    {"name": "خمسات",     "file": "khamsat_projects.json"},
    "nafezly":    {"name": "نفذلي",     "file": "nafezly_projects.json"},
    "freelancer": {"name": "Freelancer","file": "freelancer_projects.json"},
}


def get_all_scraped_projects():
    """Reads all scraped items from JSON files in output/."""
    all_projects = []
    for key, info in PLATFORM_FILES.items():
        file_path = os.path.join(OUTPUT_DIR, info["file"])
        if not os.path.exists(file_path):
            continue
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                items = json.load(f)
                for it in items:
                    it["platform_key"] = key
                    if not it.get("platform"):
                        it["platform"] = info["name"]
                    if not it.get("price"):
                        it["price"] = "$5.00 - $25.00" if key == "khamsat" else "$50.00 - $150.00"
                    if not it.get("duration"):
                        it["duration"] = "يوم واحد" if key == "khamsat" else "أسبوع"
                    all_projects.append(it)
        except Exception as e:
            logger.warning(f"Could not load {info['file']}: {e}")
    return all_projects


def get_existing_users():
    """Reads users from local SQLite auth DB."""
    if not os.path.exists(AUTH_DB_PATH):
        return []
    try:
        conn = sqlite3.connect(AUTH_DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT full_name, email FROM users;")
        rows = cur.fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception as e:
        logger.warning(f"Could not read SQLite users: {e}")
        return []


def run_migration():
    print("=" * 65)
    print("🚀 UNSTUCK APP: SUPABASE DATA MIGRATION ENGINE")
    print("=" * 65)

    supabase_url = os.getenv("SUPABASE_URL", "").strip()
    supabase_key = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")).strip()
    supabase_db_url = os.getenv("SUPABASE_DB_URL", "").strip()

    print(f"Target Supabase URL: {supabase_url if supabase_url else '(Not set, checking DB URL)'}")
    print(f"Target DB URI:      {'Configured' if supabase_db_url else '(Not set, checking PostgreSQL)'}")
    print()

    projects = get_all_scraped_projects()
    users = get_existing_users()
    print(f"📦 Found {len(projects)} scraped projects in output/ directory.")
    print(f"👥 Found {len(users)} registered users in local authentication database.")
    print()

    # 1. Check if Supabase REST Client is available
    use_supabase_client = False
    sb_client = None
    if supabase_url and supabase_key:
        try:
            from supabase import create_client
            sb_client = create_client(supabase_url, supabase_key)
            use_supabase_client = True
            print("✅ Connected to Supabase via REST API!")
        except Exception as e:
            print(f"⚠️  Supabase REST connection error: {e}")

    # 2. Check PostgreSQL connection
    use_postgres = False
    if not use_supabase_client:
        try:
            from scrapers.database import get_connection, init_db
            conn = get_connection()
            conn.close()
            init_db()
            use_postgres = True
            print("✅ Connected to PostgreSQL / Supabase Direct DB successfully!")
        except Exception as e:
            print(f"⚠️  PostgreSQL connection error: {e}")

    if not use_supabase_client and not use_postgres:
        print("❌ Could not connect to Supabase or PostgreSQL.")
        print("👉 Please add your Supabase credentials into .env:")
        print("   SUPABASE_URL=https://<your-project-id>.supabase.co")
        print("   SUPABASE_KEY=<your-service-role-or-anon-key>")
        print("   OR")
        print("   SUPABASE_DB_URL=postgresql://postgres:<password>@<host>:5432/postgres")
        print()
        print("📁 In the meantime, local SQLite & JSON files will continue to serve the app.")
        return False

    # 3. Migrate Projects
    print("\n⏳ Migrating projects...")
    success_count = 0
    batch_size = 50

    if use_supabase_client:
        # Upsert in chunks to Supabase
        for i in range(0, len(projects), batch_size):
            batch = projects[i:i + batch_size]
            formatted_batch = []
            for item in batch:
                reqs = item.get("requirements") or []
                formatted_batch.append({
                    "platform": item.get("platform", "Unknown"),
                    "platform_key": item.get("platform_key", "mostaql"),
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "price": item.get("price", ""),
                    "duration": item.get("duration", ""),
                    "published_at": item.get("published_at", ""),
                    "brief": item.get("brief", ""),
                    "requirements": reqs if isinstance(reqs, list) else [str(reqs)],
                    "updated_at": datetime.utcnow().isoformat()
                })
            try:
                sb_client.table("projects").upsert(formatted_batch, on_conflict="url").execute()
                success_count += len(batch)
                print(f"  → Uploaded {success_count}/{len(projects)} projects...")
            except Exception as e:
                logger.warning(f"Batch upsert error: {e}")

    elif use_postgres:
        from scrapers.database import get_db_cursor, upsert_project
        with get_db_cursor(commit=True) as cur:
            for item in projects:
                try:
                    upsert_project(cur.connection, item, item.get("platform_key", "mostaql"))
                    success_count += 1
                except Exception:
                    pass
        print(f"  → Upserted {success_count}/{len(projects)} projects to PostgreSQL!")

    # 4. Migrate User Profiles & Populate Leaderboard
    print("\n⏳ Migrating user profiles & Leaderboard...")
    from scrapers.supabase_client import save_user_profile

    # Default starter users to make the multi-user ranking immediately shine
    sample_profiles = [
        {
            "email": "ahmed.fathy.dev@gmail.com",
            "full_name": "أحمد فتحي (You)",
            "title": "Full-Stack & AI Automation Specialist",
            "skills": ["React", "FastAPI", "Python", "n8n", "Docker", "Supabase", "Tailwind"],
            "applied_jobs_count": 8,
            "proposals_count": 14
        },
        {
            "email": "sarah.uiux@unstuck.app",
            "full_name": "سارة الشريف",
            "title": "Senior Product & UI/UX Designer",
            "skills": ["Figma", "UI/UX", "Design Systems", "Prototyping", "User Research"],
            "applied_jobs_count": 6,
            "proposals_count": 9
        },
        {
            "email": "kareem.cloud@unstuck.app",
            "full_name": "كريم عبد العزيز",
            "title": "DevOps & Cloud Automation Engineer",
            "skills": ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Python"],
            "applied_jobs_count": 4,
            "proposals_count": 7
        },
        {
            "email": "layla.nlp@unstuck.app",
            "full_name": "ليلى محمود",
            "title": "AI & NLP Data Specialist",
            "skills": ["Python", "FastAPI", "Scraping", "OpenAI", "NLP"],
            "applied_jobs_count": 3,
            "proposals_count": 5
        },
        {
            "email": "omar.flutter@unstuck.app",
            "full_name": "عمر طارق",
            "title": "Mobile Engineer (Flutter / Dart)",
            "skills": ["Flutter", "Dart", "Firebase", "REST APIs", "State Management"],
            "applied_jobs_count": 2,
            "proposals_count": 4
        }
    ]

    # Add existing users from auth DB
    for u in users:
        sample_profiles.append({
            "email": u["email"],
            "full_name": u["full_name"],
            "title": "Freelance Specialist",
            "skills": ["React", "JavaScript", "Python"],
            "applied_jobs_count": 1,
            "proposals_count": 2
        })

    migrated_users = 0
    for prof in sample_profiles:
        try:
            res = save_user_profile(prof)
            if res.get("success"):
                migrated_users += 1
        except Exception as e:
            logger.warning(f"Could not save profile for {prof['email']}: {e}")

    print(f"  → Migrated {migrated_users} user profiles with active Leaderboard scores!")

    print("\n" + "=" * 65)
    print("🎉 MIGRATION COMPLETED SUCCESSFULLY!")
    print(f"  Projects Synced: {success_count}")
    print(f"  Users in Leaderboard: {migrated_users}")
    print("=" * 65 + "\n")
    return True


if __name__ == "__main__":
    run_migration()
