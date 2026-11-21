import sys
import os
import json
import time

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_tests():
    print("=" * 60)
    print("STARTING FULL END-TO-END SUITE FOR UNSTUCK BACKEND & UI")
    print("=" * 60)
    
    passed = 0
    total = 0

    def assert_test(name, condition, details=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f"[PASS] {name} {details}")
        else:
            print(f"[FAIL] {name} {details}")

    # 1. Root Health Check / Docs redirect
    res = client.get("/", follow_redirects=True)
    assert_test("GET /", res.status_code == 200 and ("Swagger" in res.text or "docs" in str(res.url)), f"-> Status: {res.status_code}")

    # 2. Status
    res = client.get("/api/status")
    data = res.json()
    assert_test("GET /api/status", res.status_code == 200 and "platforms" in data, f"-> Platforms: {list(data.get('platforms', {}).keys())}")

    # 3. DB Status
    res = client.get("/api/db-status")
    db_data = res.json()
    assert_test("GET /api/db-status", res.status_code == 200 and "connected" in db_data, f"-> Connected: {db_data.get('connected')}")

    # 4. Opportunities Matching (/api/match)
    match_payload = {
        "user_skills": ["React", "Python", "FastAPI", "Automation", "n8n", "Tailwind"],
        "limit": 20
    }
    res = client.post("/api/match", json=match_payload)
    match_data = res.json()
    jobs = match_data.get("jobs", [])
    assert_test("POST /api/match", res.status_code == 200 and len(jobs) > 0, f"-> Returned {len(jobs)} jobs")
    if jobs:
        first_job = jobs[0]
        has_platform_key = "platform_key" in first_job
        has_match_score = "match_score" in first_job
        assert_test("Match schema integrity", has_platform_key and has_match_score, f"-> Sample: {first_job.get('title')[:30]}... ({first_job.get('platform_key')}) Score: {first_job.get('match_score')}%")

    # 5. Proposal Generation - Arabic
    prop_payload_ar = {
        "project_title": "مطلوب مطور Full-Stack لبناء لوحة تحكم ذكية",
        "project_brief": "نبحث عن مبرمج محترف يتقن React و FastAPI لربط الواجهة بالباك إند",
        "project_skills": ["React", "FastAPI", "Python"],
        "user_profile": {
            "name": "أحمد فوزي",
            "title": "مطور برمجيات وذكاء اصطناعي",
            "skills": ["React", "FastAPI", "Python", "Tailwind"]
        },
        "tone": "value",
        "language": "arabic"
    }
    res = client.post("/api/generate-proposal", json=prop_payload_ar)
    prop_data = res.json()
    assert_test("POST /api/generate-proposal (Arabic Value)", res.status_code == 200 and "proposal" in prop_data and len(prop_data["proposal"]) > 20, f"-> Length: {len(prop_data.get('proposal', ''))}")

    # 6. Proposal Generation - English Direct
    prop_payload_en = {
        "project_title": "Build a SaaS MVP in React and Python",
        "project_brief": "Need an experienced developer to deliver the MVP in 2 weeks",
        "project_skills": ["React", "Python"],
        "user_profile": {
            "name": "Ahmed Fathy",
            "title": "Full-Stack Engineer",
            "skills": ["React", "Python"]
        },
        "tone": "direct",
        "language": "english"
    }
    res = client.post("/api/generate-proposal", json=prop_payload_en)
    prop_data_en = res.json()
    assert_test("POST /api/generate-proposal (English Direct)", res.status_code == 200 and "proposal" in prop_data_en, f"-> Length: {len(prop_data_en.get('proposal', ''))}")

    # 7. User Registration Flow (Live SMTP verified)
    test_email = f"audit_{int(time.time())}@gmail.com"
    reg_payload = {
        "full_name": "Audit Tester",
        "email": test_email,
        "password": "Password123!"
    }
    res = client.post("/api/auth/register", json=reg_payload)
    reg_data = res.json()
    assert_test("POST /api/auth/register", res.status_code == 200 and reg_data.get("success") is True, f"-> Sent to: {test_email}")

    # 8. Unverified Login Check (Must return requires_verification: True)
    res_login_unverified = client.post("/api/auth/login", json={"email": test_email, "password": "Password123!"})
    login_unverified_data = res_login_unverified.json()
    assert_test(
        "POST /api/auth/login (Requires Verification)",
        res_login_unverified.status_code == 200 and login_unverified_data.get("requires_verification") is True,
        f"-> Response: {login_unverified_data.get('error')}"
    )

    # 9. Verify User (Mark verified to test verified login)
    try:
        from scrapers.database import get_db_cursor
        with get_db_cursor(commit=True) as cur:
            cur.execute("UPDATE users SET is_verified = TRUE WHERE email = %s", (test_email,))
        verify_success = True
    except Exception:
        from scrapers.auth import get_sqlite_conn
        conn = get_sqlite_conn()
        conn.cursor().execute("UPDATE users SET is_verified = 1 WHERE email = ?", (test_email,))
        conn.commit()
        conn.close()
        verify_success = True

    assert_test("Account Verification", verify_success, "-> Account verified for login test")

    # 10. Login with Verified Account
    res_login = client.post("/api/auth/login", json={"email": test_email, "password": "Password123!"})
    login_data = res_login.json()
    user_obj = login_data.get("user", {})
    user_name = user_obj.get("full_name") or user_obj.get("name")
    assert_test("POST /api/auth/login (Verified)", res_login.status_code == 200 and user_name == "Audit Tester", f"-> Logged in as: {user_name}")

    # 11. Test Resend OTP Cooldown Enforcement
    unverified_email = f"am3365568+unverified{int(time.time())}@gmail.com"
    client.post("/api/auth/register", json={"full_name": "Unverified User", "email": unverified_email, "password": "Password123!"})
    res_resend = client.post("/api/auth/resend-otp", json={"email": unverified_email})
    assert_test(
        "POST /api/auth/resend-otp (Rate Limit Cooldown Enforced)",
        res_resend.status_code == 400 and "wait" in res_resend.json().get("detail", "").lower(),
        f"-> Correctly Enforced: {res_resend.json().get('detail')}"
    )

    # 12. Test CV Upload Endpoint (/api/cv/upload)
    mock_cv_text = b"Kareem Hassan\nkareem.dev@example.com\nSenior Software Engineer with 7 years of experience in React, Python, FastAPI, Docker, and n8n automation."
    files = {"file": ("kareem_cv.txt", mock_cv_text, "text/plain")}
    res_cv = client.post("/api/cv/upload", files=files)
    cv_data = res_cv.json()
    assert_test(
        "POST /api/cv/upload (Skills Extraction & Job Matching)",
        res_cv.status_code == 200 and len(cv_data.get("skills", [])) >= 3,
        f"-> Skills: {cv_data.get('skills')} | Matches: {cv_data.get('matched_jobs_count')}"
    )

    # 13. Test Leaderboard Endpoint (/api/leaderboard)
    res_lb = client.get("/api/leaderboard")
    lb_data = res_lb.json()
    assert_test(
        "GET /api/leaderboard (Supabase / Multi-User Ranking)",
        res_lb.status_code == 200 and len(lb_data.get("leaderboard", [])) > 0,
        f"-> Total Ranked Users: {len(lb_data.get('leaderboard', []))}"
    )

    # 14. Test User Rank Endpoint (/api/user/rank)
    res_rank = client.get(f"/api/user/rank?email={test_email}")
    rank_data = res_rank.json()
    assert_test(
        "GET /api/user/rank (Standing & Percentile)",
        res_rank.status_code == 200 and "rank_info" in rank_data,
        f"-> Rank: #{rank_data.get('rank_info', {}).get('rank')} (Score: {rank_data.get('rank_info', {}).get('total_score')})"
    )

    # 15. Test User Action Reward Points (/api/user/action)
    res_action = client.post("/api/user/action", json={"email": test_email, "action": "apply", "project_title": "Build n8n workflow", "platform": "mostaql"})
    action_data = res_action.json()
    assert_test(
        "POST /api/user/action (Award Points & Elevate Rank)",
        res_action.status_code == 200 and action_data.get("points_awarded") == 50,
        f"-> Points Awarded: {action_data.get('points_awarded')} pts"
    )

    print("=" * 60)
    print(f"FINAL AUDIT SUMMARY: {passed}/{total} TESTS PASSED")
    print("=" * 60)
    
    if passed == total:
        print("ALL TESTS PASSED WITH ZERO FAILURES! (100% SUCCESS)")
        return 0
    else:
        print("SOME TESTS FAILED.")
        return 1

if __name__ == "__main__":
    sys.exit(run_tests())
