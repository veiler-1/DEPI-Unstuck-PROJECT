"""
Supabase Client & Multi-User Profile / Leaderboard Manager
Supports:
1. Supabase Python Client (SUPABASE_URL + SUPABASE_KEY / SUPABASE_SERVICE_ROLE_KEY)
2. Direct PostgreSQL / Supabase Connection via database.py (SUPABASE_DB_URL)
3. Local SQLite Fallback (unstuck_auth.db) if Supabase is not yet configured.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger("scrapers.supabase_client")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")

_supabase_client = None

def get_supabase():
    """Initializes or returns singleton Supabase Client."""
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    url = os.getenv("SUPABASE_URL", "").strip()
    key = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")).strip()

    if url and key and url.startswith("http"):
        try:
            from supabase import create_client
            _supabase_client = create_client(url, key)
            logger.info("Supabase client initialized successfully.")
            return _supabase_client
        except Exception as e:
            logger.warning(f"Could not initialize Supabase client: {e}")
    return None


def is_supabase_configured() -> bool:
    """Returns True if Supabase REST or DB URL is configured."""
    url = os.getenv("SUPABASE_URL", "").strip()
    key = os.getenv("SUPABASE_KEY", "") or os.getenv("SUPABASE_ANON_KEY", "") or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    db_url = os.getenv("SUPABASE_DB_URL", "").strip()
    return bool((url and key) or db_url)


def calculate_score_and_badge(skills: List[str], applied_count: int, proposals_count: int = 0) -> Dict[str, Any]:
    """
    Computes user ranking points based on:
    1. Verified Skills: 15 pts each (+ 10 bonus for high demand skills)
    2. Applied work / proposals: 50 pts each
    """
    high_demand = {"react", "python", "fastapi", "automation", "n8n", "docker", "ui/ux", "figma", "flutter", "supabase"}
    skills_score = 0
    for s in skills:
        s_clean = s.strip().lower()
        skills_score += 25 if s_clean in high_demand else 15

    applied_score = (applied_count * 50) + (proposals_count * 30)
    total_score = skills_score + applied_score

    if total_score >= 500:
        badge = "🏆 Elite Master"
    elif total_score >= 300:
        badge = "⚡ Senior Pro"
    elif total_score >= 150:
        badge = "🚀 Rising Star"
    else:
        badge = "🌱 Aspiring Talent"

    return {
        "skills_score": skills_score,
        "applied_score": applied_score,
        "total_score": total_score,
        "badge": badge
    }


def save_user_profile(profile_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Upserts user profile into Supabase (or PostgreSQL / SQLite fallback)
    and computes dynamic leaderboard points.
    """
    email = profile_data.get("email", "").strip().lower()
    if not email:
        return {"success": False, "error": "Email is required"}

    full_name = profile_data.get("full_name") or profile_data.get("name") or "Freelancer"
    title = profile_data.get("title") or profile_data.get("professional_title") or "Full-Stack Specialist"
    exp = profile_data.get("experience_level") or profile_data.get("experience") or "Mid-Level"
    summary = profile_data.get("summary") or ""
    skills = profile_data.get("skills") or []
    if isinstance(skills, str):
        try: skills = json.loads(skills)
        except Exception: skills = [skills]

    applied_count = int(profile_data.get("applied_jobs_count") or 0)
    proposals_count = int(profile_data.get("proposals_count") or 0)

    # 1. Calculate Score
    metrics = calculate_score_and_badge(skills, applied_count, proposals_count)

    row = {
        "email": email,
        "full_name": full_name,
        "title": title,
        "experience_level": exp,
        "summary": summary,
        "skills": json.dumps(skills, ensure_ascii=False) if isinstance(skills, list) else skills,
        "applied_jobs_count": applied_count,
        "proposals_count": proposals_count,
        "skills_score": metrics["skills_score"],
        "applied_score": metrics["applied_score"],
        "total_score": metrics["total_score"],
        "badge": metrics["badge"],
        "updated_at": datetime.utcnow().isoformat()
    }

    # 2. Try Supabase REST Client
    sb = get_supabase()
    if sb:
        try:
            # Check if user exists
            res = sb.table("profiles").upsert(row, on_conflict="email").execute()
            logger.info(f"User profile saved to Supabase for {email}")
            return {"success": True, "source": "supabase", "profile": row, "metrics": metrics}
        except Exception as e:
            logger.warning(f"Supabase REST upsert failed: {e}. Trying DB cursor...")

    # 3. Try PostgreSQL / Supabase DB Connection
    try:
        from scrapers.database import get_db_cursor
        sql = """
        INSERT INTO profiles (
            email, full_name, title, experience_level, summary, skills,
            applied_jobs_count, proposals_count, skills_score, applied_score,
            total_score, badge, updated_at
        ) VALUES (
            %(email)s, %(full_name)s, %(title)s, %(experience_level)s, %(summary)s,
            %(skills)s::jsonb, %(applied_jobs_count)s, %(proposals_count)s,
            %(skills_score)s, %(applied_score)s, %(total_score)s, %(badge)s, CURRENT_TIMESTAMP
        )
        ON CONFLICT (email) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            title = EXCLUDED.title,
            experience_level = EXCLUDED.experience_level,
            summary = EXCLUDED.summary,
            skills = EXCLUDED.skills,
            applied_jobs_count = GREATEST(profiles.applied_jobs_count, EXCLUDED.applied_jobs_count),
            proposals_count = GREATEST(profiles.proposals_count, EXCLUDED.proposals_count),
            skills_score = EXCLUDED.skills_score,
            applied_score = EXCLUDED.applied_score,
            total_score = EXCLUDED.total_score,
            badge = EXCLUDED.badge,
            updated_at = CURRENT_TIMESTAMP;
        """
        with get_db_cursor(commit=True) as cur:
            cur.execute(sql, row)
        return {"success": True, "source": "postgresql", "profile": row, "metrics": metrics}
    except Exception as e:
        logger.debug(f"PostgreSQL profiles upsert failed ({e}). Falling back to SQLite...")

    # 4. Fallback: SQLite
    try:
        from scrapers.auth import get_sqlite_conn
        conn = get_sqlite_conn()
        cur = conn.cursor()
        # Ensure profiles table in SQLite
        cur.execute("""
        CREATE TABLE IF NOT EXISTS user_profiles (
            email TEXT PRIMARY KEY,
            full_name TEXT,
            title TEXT,
            experience_level TEXT,
            summary TEXT,
            skills TEXT,
            applied_jobs_count INTEGER DEFAULT 0,
            proposals_count INTEGER DEFAULT 0,
            skills_score INTEGER DEFAULT 0,
            applied_score INTEGER DEFAULT 0,
            total_score INTEGER DEFAULT 0,
            badge TEXT,
            updated_at TEXT
        );
        """)
        cur.execute("""
        INSERT INTO user_profiles (
            email, full_name, title, experience_level, summary, skills,
            applied_jobs_count, proposals_count, skills_score, applied_score,
            total_score, badge, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
            full_name=excluded.full_name,
            title=excluded.title,
            experience_level=excluded.experience_level,
            summary=excluded.summary,
            skills=excluded.skills,
            skills_score=excluded.skills_score,
            applied_score=excluded.applied_score,
            total_score=excluded.total_score,
            badge=excluded.badge,
            updated_at=excluded.updated_at;
        """, (
            email, full_name, title, exp, summary,
            json.dumps(skills, ensure_ascii=False) if isinstance(skills, list) else skills,
            applied_count, proposals_count, metrics["skills_score"], metrics["applied_score"],
            metrics["total_score"], metrics["badge"], datetime.utcnow().isoformat()
        ))
        conn.commit()
        conn.close()
        return {"success": True, "source": "sqlite_fallback", "profile": row, "metrics": metrics}
    except Exception as e:
        logger.error(f"Failed to save profile to SQLite: {e}")
        return {"success": False, "error": str(e)}


def record_user_action(email: str, action: str = "apply", project_title: str = "", platform: str = "") -> Dict[str, Any]:
    """Records an application or proposal generated, granting user rank points."""
    email = (email or "").strip().lower()
    if not email:
        return {"success": False, "error": "Email is required"}

    # 1. Try Supabase
    sb = get_supabase()
    if sb:
        try:
            sb.table("user_applications").insert({
                "user_email": email,
                "project_title": project_title,
                "platform": platform,
                "action": action,
                "created_at": datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            logger.debug(f"Supabase action insert notice: {e}")

    # 2. Update user counts in DB or SQLite
    # Fetch current profile, increment count, and save
    current = get_user_profile(email)
    applied_count = int(current.get("applied_jobs_count") or 0)
    proposals_count = int(current.get("proposals_count") or 0)

    if action == "apply":
        applied_count += 1
    elif action == "proposal":
        proposals_count += 1

    current["applied_jobs_count"] = applied_count
    current["proposals_count"] = proposals_count
    return save_user_profile(current)


def get_user_profile(email: str) -> Dict[str, Any]:
    """Fetches user profile by email."""
    email = (email or "").strip().lower()
    if not email:
        return {}

    # 1. Try Supabase
    sb = get_supabase()
    if sb:
        try:
            res = sb.table("profiles").select("*").eq("email", email).execute()
            if res.data and len(res.data) > 0:
                p = res.data[0]
                if isinstance(p.get("skills"), str):
                    try: p["skills"] = json.loads(p["skills"])
                    except: pass
                return p
        except Exception as e:
            logger.debug(f"Supabase profile get notice: {e}")

    # 2. Try PostgreSQL
    try:
        from scrapers.database import get_db_cursor
        with get_db_cursor() as cur:
            cur.execute("SELECT * FROM profiles WHERE email = %s LIMIT 1;", (email,))
            row = cur.fetchone()
            if row:
                row_dict = dict(row)
                if isinstance(row_dict.get("skills"), str):
                    try: row_dict["skills"] = json.loads(row_dict["skills"])
                    except: pass
                return row_dict
    except Exception:
        pass

    # 3. Try SQLite
    try:
        from scrapers.auth import get_sqlite_conn
        conn = get_sqlite_conn()
        cur = conn.cursor()
        cur.execute("SELECT * FROM user_profiles WHERE email = ? LIMIT 1;", (email,))
        row = cur.fetchone()
        if row:
            d = dict(row)
            if isinstance(d.get("skills"), str):
                try: d["skills"] = json.loads(d["skills"])
                except: pass
            conn.close()
            return d
        conn.close()
    except Exception:
        pass

    return {
        "email": email,
        "full_name": "Freelancer",
        "title": "Full-Stack Specialist",
        "skills": ["React", "Python", "FastAPI"],
        "applied_jobs_count": 0,
        "proposals_count": 0,
        "total_score": 75,
        "badge": "🌱 Aspiring Talent"
    }


def get_leaderboard(limit: int = 50) -> List[Dict[str, Any]]:
    """Returns top freelancers ordered by total_score."""
    # 1. Try Supabase
    sb = get_supabase()
    if sb:
        try:
            res = sb.table("profiles").select("*").order("total_score", desc=True).limit(limit).execute()
            if res.data and len(res.data) > 0:
                items = res.data
                for idx, item in enumerate(items, 1):
                    item["rank"] = idx
                    if isinstance(item.get("skills"), str):
                        try: item["skills"] = json.loads(item["skills"])
                        except: pass
                return items
        except Exception as e:
            logger.debug(f"Supabase leaderboard notice: {e}")

    # 2. Try PostgreSQL
    try:
        from scrapers.database import get_db_cursor
        with get_db_cursor() as cur:
            cur.execute("""
            SELECT *, DENSE_RANK() OVER (ORDER BY total_score DESC) as rank
            FROM profiles
            ORDER BY total_score DESC
            LIMIT %s;
            """, (limit,))
            rows = cur.fetchall()
            if rows:
                out = []
                for r in rows:
                    rd = dict(r)
                    if isinstance(rd.get("skills"), str):
                        try: rd["skills"] = json.loads(rd["skills"])
                        except: pass
                    out.append(rd)
                return out
    except Exception:
        pass

    # 3. Fallback: SQLite & Mock baseline
    items = []
    try:
        from scrapers.auth import get_sqlite_conn
        conn = get_sqlite_conn()
        cur = conn.cursor()
        cur.execute("SELECT * FROM user_profiles ORDER BY total_score DESC LIMIT ?;", (limit,))
        rows = cur.fetchall()
        for idx, r in enumerate(rows, 1):
            d = dict(r)
            d["rank"] = idx
            if isinstance(d.get("skills"), str):
                try: d["skills"] = json.loads(d["skills"])
                except: pass
            items.append(d)
        conn.close()
    except Exception:
        pass

    # Seed with realistic top demo performers if empty
    if not items or len(items) < 3:
        seed_users = [
            {
                "email": "ahmed.fathy.dev@gmail.com",
                "full_name": "أحمد فتحي (You)",
                "title": "Full-Stack & AI Automation Specialist",
                "skills": ["React", "FastAPI", "Python", "n8n", "Docker", "Supabase", "Tailwind"],
                "applied_jobs_count": 8,
                "proposals_count": 14,
                "skills_score": 165,
                "applied_score": 820,
                "total_score": 985,
                "badge": "🏆 Elite Master"
            },
            {
                "email": "sarah.uiux@unstuck.app",
                "full_name": "سارة الشريف",
                "title": "Senior Product & UI/UX Designer",
                "skills": ["Figma", "UI/UX", "Design Systems", "Prototyping", "User Research"],
                "applied_jobs_count": 6,
                "proposals_count": 9,
                "skills_score": 115,
                "applied_score": 570,
                "total_score": 685,
                "badge": "🏆 Elite Master"
            },
            {
                "email": "kareem.cloud@unstuck.app",
                "full_name": "كريم عبد العزيز",
                "title": "DevOps & Cloud Automation Engineer",
                "skills": ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Python"],
                "applied_jobs_count": 4,
                "proposals_count": 7,
                "skills_score": 120,
                "applied_score": 410,
                "total_score": 530,
                "badge": "⚡ Senior Pro"
            },
            {
                "email": "layla.nlp@unstuck.app",
                "full_name": "ليلى محمود",
                "title": "AI & NLP Data Specialist",
                "skills": ["Python", "FastAPI", "Scraping", "OpenAI", "NLP"],
                "applied_jobs_count": 3,
                "proposals_count": 5,
                "skills_score": 110,
                "applied_score": 300,
                "total_score": 410,
                "badge": "⚡ Senior Pro"
            },
            {
                "email": "omar.flutter@unstuck.app",
                "full_name": "عمر طارق",
                "title": "Mobile Engineer (Flutter / Dart)",
                "skills": ["Flutter", "Dart", "Firebase", "REST APIs", "State Management"],
                "applied_jobs_count": 2,
                "proposals_count": 4,
                "skills_score": 95,
                "applied_score": 220,
                "total_score": 315,
                "badge": "⚡ Senior Pro"
            }
        ]
        # Assign ranks
        for idx, u in enumerate(seed_users, 1):
            u["rank"] = idx
            save_user_profile(u)
        return seed_users

    return items


def get_user_rank(email: str) -> Dict[str, Any]:
    """Finds exact rank and standing for a given user email."""
    leaderboard = get_leaderboard(limit=200)
    user_email = (email or "").strip().lower()

    for item in leaderboard:
        if item.get("email", "").lower() == user_email:
            return {
                "rank": item.get("rank", 1),
                "total_users": max(len(leaderboard), 45),
                "total_score": item.get("total_score", 0),
                "skills_score": item.get("skills_score", 0),
                "applied_score": item.get("applied_score", 0),
                "badge": item.get("badge", "🌱 Aspiring Talent"),
                "percentile": max(1, int(round((1 - (item.get("rank", 1) / max(len(leaderboard), 1))) * 100)))
            }

    # If user not found in top list, calculate on the fly
    profile = get_user_profile(email)
    return {
        "rank": len(leaderboard) + 1,
        "total_users": len(leaderboard) + 1,
        "total_score": profile.get("total_score", 60),
        "skills_score": profile.get("skills_score", 60),
        "applied_score": profile.get("applied_score", 0),
        "badge": profile.get("badge", "🌱 Aspiring Talent"),
        "percentile": 50
    }
