import os
import json
import logging
from typing import Dict, Any, List, Optional
import urllib.request
import urllib.error

logger = logging.getLogger("scrapers.ai")

GLM_API_KEY = os.getenv("GLM_API_KEY", "613c172ccdf34cdeac8276de24b0ffec")
GLM_BASE_URL = os.getenv("GLM_BASE_URL", "https://open.bigmodel.cn/api/paas/v4/chat/completions")
GLM_MODEL = os.getenv("GLM_MODEL", "glm-4-flash")

def call_glm_chat(messages: List[Dict[str, str]], temperature: float = 0.7, max_tokens: int = 1000) -> Optional[str]:
    """Calls GLM model endpoint with Bearer authentication."""
    if not GLM_API_KEY:
        logger.warning("GLM_API_KEY is not configured.")
        return None

    payload = {
        "model": GLM_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GLM_API_KEY}"
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(GLM_BASE_URL, data=data, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            res_body = json.loads(resp.read().decode("utf-8"))
            choices = res_body.get("choices", [])
            if choices:
                return choices[0].get("message", {}).get("content", "").strip()
    except Exception as e:
        logger.warning(f"GLM API call encountered: {e}. Falling back to rule-based engine.")
        return None

def match_skills_and_score(user_skills: List[str], project_skills: List[str], project_title: str, project_brief: str) -> Dict[str, Any]:
    """
    Computes a match score and reasons between a user's skills and a project.
    Can enhance with GLM AI if available or use intelligent local matcher.
    """
    user_skills_clean = [s.strip().lower() for s in user_skills if s and s.strip()]
    proj_skills_clean = [s.strip().lower() for s in project_skills if s and s.strip()]

    matched = []
    missing = []

    for ps in project_skills:
        if any(us in ps.lower() or ps.lower() in us for us in user_skills_clean):
            matched.append(ps)
        else:
            missing.append(ps)

    # Check title & brief for additional user skills matches
    full_text = (project_title + " " + (project_brief or "")).lower()
    for us in user_skills:
        us_clean = us.strip().lower()
        if len(us_clean) > 2 and us_clean in full_text and us not in matched:
            matched.append(us)

    # Calculate match percentage
    total_relevant = max(1, len(project_skills))
    ratio = len(matched) / total_relevant
    score = int(min(98, max(35, round(ratio * 100))))
    if len(matched) >= 3 and score < 75:
        score = 85
    elif len(matched) >= 1 and score < 50:
        score = 65

    reasons = []
    if matched:
        reasons.append(f"تطابق ممتاز مع مهاراتك في: {', '.join(matched[:4])}")
    if missing:
        reasons.append(f"يتطلب مهارات إضافية قد تحتاج لمراجعتها: {', '.join(missing[:3])}")
    else:
        reasons.append("جميع المهارات المطلوبة في المشروع متوافقة مع ملفك الشخصي بنسبة 100%")

    return {
        "score": score,
        "matched_skills": matched,
        "missing_skills": missing,
        "reasons": reasons
    }

def generate_ai_proposal(
    project_title: str,
    project_brief: str,
    project_skills: List[str],
    user_profile: Dict[str, Any],
    tone: str = "value",
    language: str = "arabic"
) -> Dict[str, Any]:
    """Generates an intelligent proposal tailored to the job using GLM or smart template."""
    user_name = user_profile.get("name", "المستقل")
    user_title = user_profile.get("title", "مطور برمجيات")
    user_skills = user_profile.get("skills", [])
    skills_str = ", ".join(user_skills[:5])
    req_str = ", ".join(project_skills[:5])

    # 1. Try GLM LLM if key responds
    prompt = f"""
أنت مساعد ذكي ومحترف لكتابة عروض عمل احترافية (Proposals) لمنصات العمل الحر (مستقل، خمسات، نفذلي، فريلانسر).
تفاصيل المشروع:
- عنوان المشروع: {project_title}
- وصف المشروع: {project_brief}
- المهارات المطلوبة: {req_str}

بيانات المستقل:
- التخصص: {user_title}
- المهارات: {skills_str}

المطلوب:
اكتب عرض عمل احترافي وجذاب ومقنع جداً للعميل.
- النبرة المطلوبة: {tone} (value: قيمة مضافة وإنجاز حلول, direct: مباشر وسريع, authoritative: خبير ومتمكن)
- اللغة: {language} (العربية أو الإنجليزية حسب الطلب)
- اجعل العرض مختصراً، يركز على المشكلة وطريقة حلها، وينهي بدعوة لمناقشة التفاصيل.
"""
    ai_resp = call_glm_chat([
        {"role": "system", "content": "You are an elite freelance proposal writing AI."},
        {"role": "user", "content": prompt}
    ])

    if ai_resp:
        return {
            "source": "glm-ai",
            "proposal": ai_resp,
            "tone": tone,
            "language": language
        }

    # 2. High-quality structured fallback engine
    is_ar = language.lower() == "arabic"
    if is_ar:
        if tone == "direct":
            pitch = f"مرحباً بك، اطلعت على مشروع \"{project_title}\" وجاهز لتنفيذه فوراً بأعلى معايير الدقة والاحترافية. خبرتي المباشرة في ({skills_str}) تضمن لك إنجاز كافة المتطلبات وتسليمها في الوقت المحدد بالضبط. متفرغ للبدء الآن ومناقشة التفاصيل."
        elif tone == "authoritative":
            pitch = f"أهلاً بك، بصفتي {user_title} ومتخصص في ({skills_str})، يسعدني تولي تنفيذ \"{project_title}\". سأعمل على تقديم حل متين، عالي الجودة والأداء، مع توثيق شامل وتسليم احترافي يتجاوز توقعاتك. بانتظار تواصلك للبدء."
        else: # value
            pitch = f"أهلاً بك! قرأت تفاصيل مشروعك \"{project_title}\" بعناية واحتياجك لـ ({req_str}). أمتلك خبرة عملية في بناء حلول مماثلة بالاعتماد على ({skills_str}) تضمن سرعة الأداء وجودة العمل. يسعدني مناقشة التفاصيل ونماذج الأعمال معك والبدء فوراً."
    else:
        if tone == "direct":
            pitch = f"Hello! I reviewed your project \"{project_title}\" and I am ready to start immediately. With direct expertise in {skills_str}, I will deliver a clean, high-performance solution within your exact timeframe. Available right now to discuss specifications."
        elif tone == "authoritative":
            pitch = f"Dear Client, as a specialized {user_title} with proven delivery experience across {skills_str}, I can guarantee an enterprise-grade execution of \"{project_title}\". My focus is maintainability, performance, and clean code that scales effortlessly."
        else: # value
            pitch = f"Hi there! I noticed your need for expertise in {req_str} for \"{project_title}\". Having delivered production systems using {skills_str}, I understand the key technical milestones required for this build. I can deliver a polished, fast, and fully documented solution tailored to your timeline."

    return {
        "source": "smart-engine",
        "proposal": pitch,
        "tone": tone,
        "language": language
    }
