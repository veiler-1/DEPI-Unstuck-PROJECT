import os, sys, json, asyncio, subprocess
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Query, HTTPException, UploadFile, File, Form, Request, BackgroundTasks
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from scrapers.database import (
    get_db_health,
    get_platform_stats,
    query_projects,
    init_db,
    sync_json_files_to_db
)
from scrapers.ai import match_skills_and_score, generate_ai_proposal
from scrapers.auth import (
    init_auth_tables,
    register_pending_user,
    verify_email_otp,
    resend_otp,
    authenticate_user,
    send_general_email
)
from scrapers.cv_parser import parse_cv_bytes, extract_skills_from_cv_text
from scrapers.supabase_client import (
    save_user_profile,
    get_user_profile,
    get_leaderboard,
    get_user_rank,
    record_user_action,
    is_supabase_configured
)

if sys.platform == "win32":
    try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception: pass

ROOT = os.path.dirname(os.path.abspath(__file__))
OUTPUT = os.path.join(ROOT, "output")

PLATFORMS = {
    "mostaql":    {"name": "مستقل",     "file": "mostaql_projects.json"},
    "khamsat":    {"name": "خمسات",     "file": "khamsat_projects.json"},
    "nafezly":    {"name": "نفذلي",     "file": "nafezly_projects.json"},
    "freelancer": {"name": "Freelancer","file": "freelancer_projects.json"},
}

app = FastAPI(title="Freelance Scrapers API (PostgreSQL Upsert)", version="3.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class ScrapeRequest(BaseModel):
    platforms: Optional[List[str]] = ["all"]
    wait: Optional[bool] = False

class MatchRequest(BaseModel):
    user_skills: List[str]
    platform: Optional[str] = "all"
    limit: Optional[int] = 50

class ProposalRequest(BaseModel):
    project_title: str
    project_brief: Optional[str] = ""
    project_skills: Optional[List[str]] = []
    user_profile: Optional[dict] = {}
    tone: Optional[str] = "value"
    language: Optional[str] = "arabic"

class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str

class VerifyOtpRequest(BaseModel):
    email: str
    otp: str

class ResendOtpRequest(BaseModel):
    email: str

class LoginRequest(BaseModel):
    email: str
    password: str

def read_json(key):
    p = os.path.join(OUTPUT, PLATFORMS[key]["file"]) if key in PLATFORMS else None
    if not p or not os.path.exists(p): return []
    try:
        with open(p, encoding="utf-8") as f:
            items = json.load(f)
            for it in items:
                it["platform_key"] = key
                if not it.get("platform"):
                    it["platform"] = PLATFORMS[key]["name"]
                if not it.get("price"):
                    it["price"] = "$5.00 - $25.00" if key == "khamsat" else "$50.00 - $150.00"
                if not it.get("duration"):
                    it["duration"] = "يوم واحد" if key == "khamsat" else "أسبوع"
            return items
    except Exception: return []

def run_scraper(spider="all"):
    # Use the active Python interpreter (or py)
    python_bin = sys.executable
    r = subprocess.run([python_bin, os.path.join(ROOT, "run.py"), "--spider", spider],
                       cwd=ROOT, env={**os.environ, "PYTHONIOENCODING": "utf-8"})
    return r.returncode == 0

@app.on_event("startup")
def on_startup():
    try:
        init_db()
        init_auth_tables()
    except Exception as e:
        print(f"[WARN] Could not initialize DB on startup: {e}")

@app.get("/", include_in_schema=False)
def root(): return RedirectResponse("/docs")

@app.get("/api/db-status")
def db_status():
    """Returns database connection status and total rows in projects table."""
    return get_db_health()

@app.get("/api/status")
def status():
    db_stats = get_platform_stats()
    out = {}
    for k, v in PLATFORMS.items():
        if db_stats and k in db_stats:
            out[k] = {
                "name": v["name"],
                "count": db_stats[k]["count"],
                "last_updated": db_stats[k]["last_updated"],
                "source": "postgresql"
            }
        else:
            path = os.path.join(OUTPUT, v["file"])
            count, updated = 0, None
            if os.path.exists(path):
                try:
                    updated = datetime.fromtimestamp(os.path.getmtime(path)).strftime("%Y-%m-%d %H:%M:%S")
                    count = len(json.load(open(path, encoding="utf-8")))
                except Exception: pass
            out[k] = {"name": v["name"], "count": count, "last_updated": updated, "source": "json_fallback"}

    health = get_db_health()
    return {"status": "ok", "database_connected": health["connected"], "platforms": out}

@app.get("/api/projects")
def projects(
    platform: str = Query("all"),
    q: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    limit_val = limit.default if hasattr(limit, "default") else int(limit)
    offset_val = offset.default if hasattr(offset, "default") else int(offset)
    q_val = None if (hasattr(q, "default") or q is None) else str(q).strip()
    if not q_val:
        q_val = None

    keys = list(PLATFORMS) if (hasattr(platform, "default") or str(platform).lower() == "all") else [p.strip().lower() for p in str(platform).split(",") if p.strip().lower() in PLATFORMS]
    if not keys: raise HTTPException(400, "Unsupported platform")

    # 1. Try querying PostgreSQL first (with upserted real-time data)
    try:
        total, db_items = query_projects(platforms=keys, q=q_val, limit=limit_val, offset=offset_val)
        if total > 0 or get_db_health()["connected"]:
            return {
                "source": "postgresql",
                "total": total,
                "count": len(db_items),
                "projects": db_items
            }
    except Exception as e:
        # DB failed, fallback to JSON files
        pass

    # 2. Fallback to JSON files if database is not reachable
    items = [it for k in keys for it in read_json(k)]

    if isinstance(q, str) and q.strip():
        term = q.lower()
        items = [it for it in items if term in str(it.get("title","")).lower()
                 or term in str(it.get("brief","")).lower()
                 or term in " ".join(str(r) for r in it.get("requirements",[])).lower()]

    items.sort(key=lambda x: str(x.get("published_at", "")), reverse=True)
    page = items[offset_val: offset_val + limit_val]
    return {
        "source": "json_fallback",
        "total": len(items),
        "count": len(page),
        "projects": page
    }

@app.post("/api/match")
def match_jobs(req: MatchRequest):
    """
    Matches scraped projects against user skills, computes score & reasons,
    and returns jobs sorted by highest match score.
    """
    keys = list(PLATFORMS) if req.platform.lower() == "all" else [req.platform.lower()]
    raw_items = []
    try:
        total, raw_items = query_projects(platforms=keys, limit=req.limit or 50)
    except Exception:
        raw_items = []

    if not raw_items:
        raw_items = [it for k in keys for it in read_json(k)][:req.limit or 50]

    matched_jobs = []
    for it in raw_items:
        skills = it.get("requirements") or []
        if isinstance(skills, str):
            try: skills = json.loads(skills)
            except: skills = [skills]

        analysis = match_skills_and_score(
            user_skills=req.user_skills,
            project_skills=skills,
            project_title=it.get("title", ""),
            project_brief=it.get("brief", "")
        )

        p_key = it.get("platform_key")
        if not p_key:
            p_str = (it.get("platform") or "").lower()
            if "mostaql" in p_str or "مستقل" in p_str: p_key = "mostaql"
            elif "khamsat" in p_str or "خمسات" in p_str: p_key = "khamsat"
            elif "nafezly" in p_str or "نفذلي" in p_str: p_key = "nafezly"
            else: p_key = "freelancer"

        matched_jobs.append({
            **it,
            "platform_key": p_key,
            "match_score": analysis["score"],
            "matched_skills": analysis["matched_skills"],
            "missing_skills": analysis["missing_skills"],
            "reasons": analysis["reasons"]
        })

    matched_jobs.sort(key=lambda x: x["match_score"], reverse=True)
    return {
        "status": "ok",
        "total": len(matched_jobs),
        "user_skills": req.user_skills,
        "jobs": matched_jobs
    }

@app.post("/api/generate-proposal")
def generate_proposal_endpoint(req: ProposalRequest):
    """
    Generates tailored proposal using GLM AI or Smart Engine.
    """
    res = generate_ai_proposal(
        project_title=req.project_title,
        project_brief=req.project_brief or "",
        project_skills=req.project_skills or [],
        user_profile=req.user_profile or {},
        tone=req.tone or "value",
        language=req.language or "arabic"
    )
    return res

def dispatch_user_match_email(
    user_email: str,
    user_name: Optional[str] = None,
    explicit_skills: Optional[List[str]] = None,
    explicit_jobs: Optional[List[dict]] = None
):
    """
    Finds freelance jobs matching the user's skills and dispatches
    a high-conversion, responsive HTML email alert via Gmail SMTP.
    """
    if not user_email or "@" not in user_email:
        return False

    try:
        cand_name = user_name or "المحترف المتميز"
        skills = list(explicit_skills) if explicit_skills else []
        rank_badge = "⚡ Senior Pro"
        user_rank = 1

        # 1. Fetch user profile from Supabase if skills are not explicitly passed
        if not skills:
            try:
                profile = get_user_profile(user_email)
                if profile:
                    cand_name = user_name or profile.get("full_name") or cand_name
                    raw_skills = profile.get("skills") or []
                    if isinstance(raw_skills, list):
                        skills = raw_skills
                    elif isinstance(raw_skills, str):
                        try:
                            skills = json.loads(raw_skills)
                        except Exception:
                            skills = [s.strip() for s in raw_skills.split(",") if s.strip()]
            except Exception as e:
                print(f"[WARN] Profile lookup error in dispatch_user_match_email: {e}")

        # 2. Get user rank
        try:
            rank_data = get_user_rank(user_email)
            if rank_data:
                user_rank = rank_data.get("rank", 1)
                rank_badge = rank_data.get("badge", "⚡ Senior Pro")
        except Exception:
            pass

        # 3. If explicit jobs are provided, use them; otherwise run matching
        matched_jobs = list(explicit_jobs) if explicit_jobs else []
        if not matched_jobs and skills:
            try:
                m_res = match_jobs(MatchRequest(user_skills=skills, platform="all", limit=40))
                matched_jobs = [j for j in m_res.get("jobs", []) if (j.get("match_score") or 0) >= 50]
            except Exception as e:
                print(f"[WARN] Error matching jobs for email: {e}")

        # 4. If still no skills or no jobs, fetch top active projects
        if not matched_jobs:
            try:
                _, recent_projs = query_projects(platforms=["mostaql", "khamsat", "nafezly", "freelancer"], limit=5)
                matched_jobs = recent_projs
            except Exception:
                pass

        if not matched_jobs:
            print(f"[INFO] No jobs to send for {user_email}")
            return False

        # Format bilingual high-conversion email
        job_cards_html = ""
        for i, j in enumerate(matched_jobs[:5]):
            title = j.get("title") or "مشروع عمل حر جديد"
            platform = j.get("platform") or "مستقل / خمسات"
            score = j.get("match_score", 90)
            price = j.get("price") or "$50.00 - $150.00"
            duration = j.get("duration") or "خلال أسبوع"
            brief = j.get("brief") or ""
            if len(brief) > 120:
                brief = brief[:120] + "..."
            url = j.get("url") or "http://localhost:5173"

            score_badge = f'<span style="background: #059669; color: #ffffff; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 13px;">تطابق {score}%</span>'
            plat_badge = f'<span style="background: #3b82f6; color: #ffffff; padding: 3px 8px; border-radius: 6px; font-weight: 600; font-size: 12px;">{platform}</span>'

            job_cards_html += f"""
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; margin-bottom: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                {plat_badge}
                {score_badge}
              </div>
              <h3 style="margin: 8px 0; color: #111827; font-size: 17px; line-height: 1.4;">{title}</h3>
              <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 6px 0;">{brief}</p>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 10px; border-top: 1px dashed #e5e7eb;">
                <span style="color: #059669; font-weight: 700; font-size: 14px;">💰 {price}</span>
                <span style="color: #4b5563; font-size: 12px;">⏱ {duration}</span>
              </div>
              <div style="margin-top: 12px; text-align: left;">
                <a href="{url}" style="background: #4f46e5; color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; display: inline-block;">تقديم العرض عبر Unstuck 🚀</a>
              </div>
            </div>
            """

        skills_tags = "".join([f'<span style="background: #eef2ff; color: #4338ca; padding: 3px 8px; border-radius: 6px; font-size: 12px; margin-left: 4px; margin-bottom: 4px; display: inline-block;">#{s}</span>' for s in skills[:8]])

        html_body = f"""
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 24px; direction: rtl;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">UNSTUCK ⚡</h1>
              <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.95;">إشعار فوري: مشاريع عمل حر جديدة تتطابق مع مهاراتك!</p>
            </div>
            
            <!-- User Status Card -->
            <div style="padding: 24px;">
              <p style="font-size: 16px; color: #1f2937; margin: 0 0 12px 0;">
                أهلاً بك <strong>{cand_name}</strong> 👋،
              </p>
              <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0 0 16px 0;">
                بمجرد تسجيل دخولك، قام محرك Unstuck بالبحث في كافة منصات العمل الحر (مستقل، خمسات، نفذلي، Freelancer) ورصد أفضل الفرص المتطابقة مع مهاراتك بدقة عالية:
              </p>
              
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 20px;">
                <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">مهاراتك المسجلة:</div>
                <div>{skills_tags if skills_tags else '<span style="color: #64748b;">عامة</span>'}</div>
                <div style="margin-top: 8px; font-size: 13px; color: #334155;">
                  ترتيبك الحالي في لوحة الصدارة: <strong>#{user_rank}</strong> ({rank_badge})
                </div>
              </div>
              
              <!-- Matched Jobs -->
              <h2 style="font-size: 18px; color: #111827; margin: 20px 0 14px 0; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px;">
                🎯 أفضل المشاريع المقترحة لك ({len(matched_jobs[:5])}):
              </h2>
              
              {job_cards_html}
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 28px 0 16px 0;">
                <a href="http://localhost:5173" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 14px 32px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);">
                  افتح منصة Unstuck وأنشئ عروضك الذكية ⚡
                </a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 18px 24px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6;">
              <p style="margin: 0;">تم إرسال هذا البريد الإلكتروني تلقائياً عبر نظام الأتمتة المتقدم في Unstuck بمجرد نشاط حسابك.</p>
              <p style="margin: 4px 0 0 0;">Unstuck • Stop Searching. Start Winning.</p>
            </div>
          </div>
        </body>
        </html>
        """

        subject = f"⚡ فرصة عمل حر جديدة تتطابق مع مهاراتك ({cand_name}) - Unstuck"
        sent, err = send_general_email(user_email, subject, html_body)
        print(f"[EMAIL NOTIFICATION] Sent to {user_email}: {sent} ({err})")
        return sent
    except Exception as e:
        print(f"[ERROR] dispatch_user_match_email failed: {e}")
        return False


@app.post("/api/auth/register")
def register_endpoint(req: RegisterRequest):
    """Step 1-5: Validate fields, create pending user, hash OTP, dispatch real email."""
    if not req.full_name or not req.email or not req.password:
        raise HTTPException(400, "Full name, email, and password are required.")
    res = register_pending_user(req.full_name, req.email, req.password)
    if not res.get("success"):
        raise HTTPException(400, res.get("error", "Registration failed"))
    return res

@app.post("/api/auth/verify-otp")
def verify_otp_endpoint(req: VerifyOtpRequest, background_tasks: BackgroundTasks):
    """Step 7-10: Verifies 6-digit OTP, enforces expiry, single use, max 5 attempts."""
    if not req.email or not req.otp:
        raise HTTPException(400, "Email and 6-digit OTP are required.")
    res = verify_email_otp(req.email, req.otp)
    if not res.get("success"):
        raise HTTPException(400, res.get("error", "Verification failed"))
    
    # Automatically dispatch welcome / matching jobs email in background
    user_name = res.get("user", {}).get("full_name") if res.get("user") else None
    background_tasks.add_task(dispatch_user_match_email, req.email, user_name)
    return res

@app.post("/api/auth/resend-otp")
def resend_otp_endpoint(req: ResendOtpRequest):
    """Generates new OTP with 60-second cooldown."""
    if not req.email:
        raise HTTPException(400, "Email is required.")
    res = resend_otp(req.email)
    if not res.get("success"):
        raise HTTPException(400, res.get("error", "Resend failed"))
    return res

@app.post("/api/auth/login")
def login_endpoint(req: LoginRequest, background_tasks: BackgroundTasks):
    """Enforces authentication and refuses login for unverified accounts."""
    if not req.email or not req.password:
        raise HTTPException(400, "Email and password are required.")
    res = authenticate_user(req.email, req.password)
    if not res.get("success"):
        if res.get("requires_verification"):
            return {
                "success": False,
                "error": res["error"],
                "requires_verification": True,
                "email": res["email"]
            }
        raise HTTPException(401, res.get("error", "Invalid credentials"))
        
    # Automatically dispatch personalized matching jobs email in background upon login!
    user_name = res.get("user", {}).get("full_name") or res.get("user", {}).get("name")
    background_tasks.add_task(dispatch_user_match_email, req.email, user_name)
    res["email_alert_dispatched"] = True
    res["notification_message"] = "تم البحث عن أحدث الوظائف المتوافقة مع خبراتك وإرسالها لبريدك الإلكتروني تلقائياً!"
    return res

@app.post("/api/sync-json-to-db")
def sync_json():
    """Reads all scraped JSON files in output/ and empties/upserts them into PostgreSQL."""
    try:
        res = sync_json_files_to_db()
        return res
    except Exception as e:
        raise HTTPException(500, f"Sync error: {e}")

@app.post("/api/scrape")
async def scrape(req: Optional[ScrapeRequest] = None, wait: Optional[bool] = Query(None)):
    platforms = req.platforms if req else ["all"]
    should_wait = wait if wait is not None else (req.wait if req else False)
    spider = "all" if "all" in [p.lower() for p in platforms] else platforms[0]

    def _run_and_sync():
        ok = run_scraper(spider)
        try:
            sync_json_files_to_db()
        except Exception:
            pass
        return ok

    if should_wait:
        ok = await asyncio.to_thread(_run_and_sync)
        return {"success": ok, "message": "done"}
    asyncio.create_task(asyncio.to_thread(_run_and_sync))
    return {"message": "started", "target": spider}


# -------------------------------------------------------------------------
# CV Upload, Parsing, Supabase Integration & Multi-User Leaderboard
# -------------------------------------------------------------------------

class ProfileUpdateRequest(BaseModel):
    email: str
    full_name: Optional[str] = None
    title: Optional[str] = None
    experience_level: Optional[str] = None
    summary: Optional[str] = None
    skills: List[str]

class UserActionRequest(BaseModel):
    email: str
    action: Optional[str] = "apply"
    project_title: Optional[str] = ""
    platform: Optional[str] = ""


@app.post("/api/cv/upload")
async def cv_upload_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    file: Optional[UploadFile] = File(None),
    email: Optional[str] = Form(None),
    full_name: Optional[str] = Form(None)
):
    """
    Accepts CV files (PDF, DOCX, TXT) via multipart upload or raw body,
    extracts structured skills via AI/NLP, saves to Supabase/Postgres,
    and runs real-time project matching.
    """
    file_bytes = b""
    filename = "resume.pdf"

    if file:
        file_bytes = await file.read()
        filename = file.filename or "resume.pdf"
    else:
        # Check raw body (supports n8n binary or raw POST)
        raw_body = await request.body()
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            try:
                data = json.loads(raw_body.decode("utf-8"))
                if "text" in data or "cv_text" in data:
                    text_content = data.get("text") or data.get("cv_text")
                    file_bytes = text_content.encode("utf-8")
                    filename = "resume.txt"
                elif "data" in data and isinstance(data["data"], str):
                    # Base64 encoded file
                    import base64
                    file_bytes = base64.b64decode(data["data"])
                    filename = data.get("filename", "resume.pdf")
            except Exception:
                pass
        if not file_bytes:
            file_bytes = raw_body

    if not file_bytes:
        raise HTTPException(400, "No CV file or text provided in request.")

    # 1. Extract raw text from file
    try:
        raw_text = parse_cv_bytes(file_bytes, filename)
    except Exception as e:
        raise HTTPException(400, f"Error parsing CV file format: {e}")

    if not raw_text.strip():
        raise HTTPException(400, "Could not extract any readable text from uploaded CV.")

    # 2. Extract profile and skills via AI & heuristics
    extracted = extract_skills_from_cv_text(raw_text)

    cand_name = full_name or extracted.get("candidate_name") or "Freelancer"
    cand_email = email or extracted.get("candidate_email") or ""
    cand_skills = extracted.get("skills") or ["React", "Python", "FastAPI"]
    cand_title = extracted.get("professional_title") or "Full-Stack Specialist"
    cand_exp = extracted.get("experience_level") or "Mid-Level"
    cand_summary = extracted.get("summary") or ""

    # 3. Save profile to Supabase / PostgreSQL if email is known
    save_res = {}
    if cand_email:
        save_res = save_user_profile({
            "email": cand_email,
            "full_name": cand_name,
            "title": cand_title,
            "experience_level": cand_exp,
            "summary": cand_summary,
            "skills": cand_skills
        })

    # 4. Run real-time project matching for extracted skills
    matched_jobs = []
    try:
        match_result = match_jobs(MatchRequest(user_skills=cand_skills, platform="all", limit=50))
        matched_jobs = match_result.get("jobs", [])
    except Exception as e:
        print(f"[WARN] Job match error after CV parse: {e}")

    # High match jobs above 75%
    high_match = [j for j in matched_jobs if (j.get("match_score") or 0) >= 75]

    # Automatically dispatch personalized matching jobs email to candidate
    if cand_email:
        background_tasks.add_task(
            dispatch_user_match_email,
            cand_email,
            cand_name,
            cand_skills,
            high_match if high_match else matched_jobs[:5]
        )

    return {
        "success": True,
        "filename": filename,
        "name": cand_name,
        "email": cand_email,
        "skills": cand_skills,
        "experience_level": cand_exp,
        "professional_title": cand_title,
        "summary": cand_summary,
        "extraction_source": extracted.get("extraction_source", "heuristic"),
        "total_skills_count": len(cand_skills),
        "matched_jobs_count": len(matched_jobs),
        "high_match_count": len(high_match),
        "high_score_jobs": high_match[:10],
        "metrics": save_res.get("metrics", {}),
        "message": f"Successfully extracted {len(cand_skills)} skills from CV and calibrated Freelance DNA!"
    }


@app.post("/api/profile/update-skills")
def update_skills_endpoint(req: ProfileUpdateRequest, background_tasks: BackgroundTasks):
    """Updates user skills, persists to Supabase, and recalculates ranking points."""
    res = save_user_profile(req.dict())
    if not res.get("success"):
        raise HTTPException(400, res.get("error", "Failed to update profile"))
    rank_info = get_user_rank(req.email)
    
    # Automatically dispatch matched jobs email when skills are updated
    if req.email:
        background_tasks.add_task(
            dispatch_user_match_email,
            req.email,
            req.full_name,
            req.skills
        )

    return {
        "success": True,
        "profile": res.get("profile"),
        "metrics": res.get("metrics"),
        "rank_info": rank_info
    }


@app.get("/api/leaderboard")
def leaderboard_endpoint(limit: int = Query(50, ge=1, le=200)):
    """Returns application-wide Leaderboard ranking of freelancers based on skills and applied work."""
    items = get_leaderboard(limit=limit)
    return {
        "status": "ok",
        "total": len(items),
        "leaderboard": items,
        "supabase_connected": is_supabase_configured()
    }


@app.get("/api/user/rank")
def user_rank_endpoint(email: str = Query(..., description="User email")):
    """Returns the user's exact ranking position and score breakdown."""
    if not email:
        raise HTTPException(400, "Email parameter is required")
    rank_info = get_user_rank(email)
    profile = get_user_profile(email)
    return {
        "status": "ok",
        "email": email,
        "rank_info": rank_info,
        "profile": profile
    }


@app.post("/api/user/action")
def user_action_endpoint(req: UserActionRequest):
    """
    Records an applied project or proposal generated.
    Awards +50 pts (apply) or +30 pts (proposal), elevating user on Leaderboard.
    """
    res = record_user_action(
        email=req.email,
        action=req.action or "apply",
        project_title=req.project_title or "",
        platform=req.platform or ""
    )
    rank_info = get_user_rank(req.email)
    return {
        "success": True,
        "action": req.action,
        "points_awarded": 50 if req.action == "apply" else 30,
        "rank_info": rank_info,
        "metrics": res.get("metrics", {})
    }


class EmailNotificationRequest(BaseModel):
    to_email: str
    subject: str
    html_content: str


@app.post("/api/notify/email")
def notify_email_endpoint(req: EmailNotificationRequest):
    """Dispatches a real HTML job notification email to user."""
    success, msg = send_general_email(req.to_email, req.subject, req.html_content)
    return {
        "success": success,
        "message": msg,
        "recipient": req.to_email
    }

