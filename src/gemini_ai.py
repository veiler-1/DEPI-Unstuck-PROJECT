import os
import json
import logging
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("gemini_ai")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()


def is_gemini_configured() -> bool:
    return bool(GEMINI_API_KEY and len(GEMINI_API_KEY) > 10)


def get_gemini_client():
    if not is_gemini_configured():
        return None
    try:
        from google import genai
        return genai.Client(api_key=GEMINI_API_KEY)
    except Exception as e:
        logger.warning(f"Failed to initialize GenAI Client: {e}")
        return None


def enrich_project_with_ai(project: Dict[str, Any], client=None) -> Dict[str, Any]:
    if not is_gemini_configured():
        title = project.get("title") or "Project"
        fallback_desc = (
            project.get("brief")
            or project.get("brief_description")
            or (project.get("description") or "")[:120] + "..."
        )
        return {
            "ai_enabled": False,
            "ai_summary": fallback_desc,
            "ai_category": "General",
            "ai_complexity": "Unspecified",
            "ai_proposal_pitch": f"Hello, I reviewed your project '{title}' and would be glad to assist you with it."
        }

    try:
        if client is None:
            client = get_gemini_client()
        if not client:
            raise ValueError("Gemini Client not initialized")

        title = project.get("title") or ""
        description = project.get("description") or project.get("full_description") or ""
        platform = project.get("platform") or "Freelance Platform"
        skills = project.get("skills") or project.get("required_skills") or []
        price = project.get("price") or "Not specified"

        prompt = f"""
Analyze the following freelance project from ({platform}):
- Title: {title}
- Budget: {price}
- Skills: {skills}
- Details: {description[:1200]}

Return a JSON object strictly matching this schema:
{{
  "ai_summary": "Concise 2-line summary explaining core requirements",
  "ai_category": "Domain classification (e.g. Web Development, Scraping, AI)",
  "ai_complexity": "Simple, Medium, or Complex",
  "ai_key_points": ["Key requirement 1", "Key requirement 2"],
  "ai_proposal_pitch": "Proposal pitch (3-4 lines) tailored for this client"
}}
Return raw JSON only without markdown formatting.
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        response_text = response.text.strip()
        if response_text.startswith("```"):
            lines = response_text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            response_text = "\n".join(lines).strip()

        parsed = json.loads(response_text)
        parsed["ai_enabled"] = True
        return parsed

    except Exception as e:
        logger.warning(f"Error invoking Gemini for '{project.get('title', '')}': {e}")
        return {
            "ai_enabled": False,
            "ai_error": str(e),
            "ai_summary": project.get("brief") or (project.get("description", "")[:120] + "..."),
            "ai_category": "General",
            "ai_complexity": "Unavailable",
            "ai_proposal_pitch": f"Hello, I am interested in collaborating on '{project.get('title', '')}'."
        }
