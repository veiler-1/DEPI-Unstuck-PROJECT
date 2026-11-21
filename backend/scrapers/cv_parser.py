"""
CV Parser Module
Extracts text from PDF, DOCX, TXT files (file path or in-memory bytes)
and extracts structured profile data (Skills, Experience, Title, Summary, Name, Email).
Supports AI models (GLM, OpenAI, Gemini) and rich offline heuristic engine.
"""

import io
import os
import re
import json
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger("scrapers.cv_parser")

POPULAR_SKILL_KEYWORDS = [
    # Programming Languages
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "Dart", "R", "Scala", "MATLAB",
    # Frontend
    "React", "React.js", "Next.js", "Vue", "Vue.js", "Nuxt.js", "Angular", "Svelte", "HTML", "HTML5", "CSS", "CSS3", "Tailwind", "Tailwind CSS", "Bootstrap", "SASS", "Redux", "Zustand", "Vite", "Webpack",
    # Backend & APIs
    "FastAPI", "Django", "Flask", "Node.js", "Express", "NestJS", "Spring", "Spring Boot", "Laravel", "ASP.NET", ".NET", "Ruby on Rails", "REST", "RESTful APIs", "GraphQL", "gRPC", "Microservices", "WebSockets",
    # Databases & Caching
    "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "Supabase", "Firebase", "Elasticsearch", "Prisma", "SQLAlchemy", "TypeORM", "Cassandra", "DynamoDB",
    # Automation & AI & Tools
    "Automation", "n8n", "Make", "Zapier", "Scraping", "Scrapy", "Selenium", "Playwright", "Puppeteer", "BeautifulSoup",
    "OpenAI", "ChatGPT", "LLM", "LangChain", "LlamaIndex", "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "TensorFlow", "PyTorch", "HuggingFace",
    # Cloud, DevOps & Tools
    "Docker", "Kubernetes", "AWS", "Azure", "Google Cloud", "GCP", "Linux", "Git", "GitHub", "GitLab", "CI/CD", "GitHub Actions", "Nginx", "Vercel", "Netlify",
    # Mobile
    "Flutter", "React Native", "Android", "iOS",
    # Design & Product
    "UI/UX", "Figma", "Adobe XD", "Adobe Photoshop", "Adobe Illustrator", "Wireframing", "Prototyping",
    # General & Soft Skills
    "Agile", "Scrum", "Project Management", "Technical Writing", "SEO", "WordPress", "Shopify"
]


def parse_cv_bytes(file_bytes: bytes, filename: str) -> str:
    """Extracts raw text from uploaded CV bytes (PDF, DOCX, TXT)."""
    if not file_bytes:
        return ""

    ext = os.path.splitext(filename or "")[1].lower()

    if ext == ".pdf":
        return _extract_from_pdf_stream(io.BytesIO(file_bytes))
    elif ext in (".docx", ".doc"):
        return _extract_from_docx_stream(io.BytesIO(file_bytes))
    elif ext in (".txt", ".md", ".rtf", ""):
        try:
            return file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            return str(file_bytes)
    else:
        # Try as plain text fallback
        try:
            return file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            raise ValueError(f"Unsupported CV file extension: '{ext}'. Please upload .pdf, .docx, or .txt")


def parse_cv_file(file_path: str) -> str:
    """Extract raw text from a PDF or DOCX file path."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    with open(file_path, "rb") as f:
        data = f.read()
    return parse_cv_bytes(data, os.path.basename(file_path))


def _extract_from_pdf_stream(stream: io.BytesIO) -> str:
    """Extract text from PDF stream using pdfplumber or pypdf."""
    text = ""
    # 1. Try pdfplumber
    try:
        import pdfplumber
        with pdfplumber.open(stream) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"
        if text.strip():
            return text.strip()
    except Exception as e:
        logger.debug(f"pdfplumber stream extraction notice: {e}")

    # 2. Try pypdf / PyPDF2
    stream.seek(0)
    try:
        import pypdf
        reader = pypdf.PdfReader(stream)
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
        if text.strip():
            return text.strip()
    except Exception as e:
        logger.debug(f"pypdf extraction notice: {e}")

    # 3. Try PyMuPDF (fitz)
    stream.seek(0)
    try:
        import fitz
        doc = fitz.open(stream=stream.read(), filetype="pdf")
        for page in doc:
            t = page.get_text()
            if t:
                text += t + "\n"
        if text.strip():
            return text.strip()
    except Exception as e:
        logger.debug(f"PyMuPDF extraction notice: {e}")

    return text.strip()


def _extract_from_docx_stream(stream: io.BytesIO) -> str:
    """Extract text from DOCX stream using python-docx."""
    try:
        import docx
        doc = docx.Document(stream)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if cell.text.strip():
                        paragraphs.append(cell.text.strip())
        return "\n".join(paragraphs)
    except Exception as e:
        logger.warning(f"Failed to extract text from DOCX stream: {e}")
        return ""


def extract_skills_from_cv_text(text: str) -> Dict[str, Any]:
    """
    Intelligently extracts profile data from CV text.
    First attempts LLM extraction via GLM / OpenAI / Gemini.
    Falls back to rich offline heuristic extractor if offline or unauthorized.
    """
    if not text or not text.strip():
        return _empty_profile("No text provided in CV.")

    # Try AI Extraction
    try:
        from scrapers.ai import call_glm_chat
        prompt = f"""You are an expert HR and Technical Recruiter AI.
Analyze this CV/resume text and extract structured profile data.

CV TEXT:
---
{text[:4500]}
---

Return ONLY valid JSON (no markdown fences, no explanation) with this structure:
{{
  "candidate_name": "Full Name",
  "candidate_email": "Email address",
  "skills": ["Skill1", "Skill2", ...],
  "experience_level": "Junior | Mid-level | Senior | Lead",
  "professional_title": "Primary Job Title",
  "summary": "1-2 sentence professional summary"
}}
"""
        ai_response = call_glm_chat(
            messages=[
                {"role": "system", "content": "You are a CV parser assistant. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=1200
        )

        if ai_response:
            cleaned = ai_response.strip()
            if cleaned.startswith("```"):
                lines = cleaned.split("\n")
                lines = [l for l in lines if not l.strip().startswith("```")]
                cleaned = "\n".join(lines).strip()
            parsed = json.loads(cleaned)
            skills = parsed.get("skills", [])
            if skills and len(skills) > 0:
                return {
                    "candidate_name": parsed.get("candidate_name") or _extract_candidate_name(text),
                    "candidate_email": parsed.get("candidate_email") or _extract_email(text),
                    "skills": skills,
                    "experience_level": parsed.get("experience_level", "Mid-Level"),
                    "professional_title": parsed.get("professional_title", "Software Developer"),
                    "summary": parsed.get("summary", ""),
                    "extraction_source": "ai_llm"
                }
    except Exception as e:
        logger.debug(f"AI parsing skipped/failed: {e}")

    # Fallback: Rich heuristic extractor
    return _heuristic_extract(text)


def _extract_email(text: str) -> str:
    """Finds first valid email in text."""
    match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
    return match.group(0) if match else ""


def _extract_candidate_name(text: str) -> str:
    """Heuristically infers candidate name from first few lines."""
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    for line in lines[:5]:
        # Ignore lines with 'curriculum', 'resume', 'cv', '@', 'http', numbers
        lower = line.lower()
        if any(w in lower for w in ["resume", "curriculum", "vitae", "cv", "page", "contact", "@", "http", "phone"]):
            continue
        words = line.split()
        if 2 <= len(words) <= 4 and all(re.match(r"^[A-Za-z\u0600-\u06FF\.'-]+$", w) for w in words):
            return line
    return "Freelancer"


def _heuristic_extract(text: str) -> Dict[str, Any]:
    """Rich rule-based offline extraction."""
    text_lower = text.lower()

    # 1. Match skills
    found_skills = []
    for skill in POPULAR_SKILL_KEYWORDS:
        pattern = r"(?<![a-zA-Z0-9])" + re.escape(skill.lower()) + r"(?![a-zA-Z0-9])"
        if re.search(pattern, text_lower):
            found_skills.append(skill)

    # 2. Extract Candidate Info
    email = _extract_email(text)
    name = _extract_candidate_name(text)

    # 3. Infer experience level
    exp_level = "Mid-Level (2–4 Years)"
    if any(w in text_lower for w in ["senior", "lead", "principal", "architect", "head of", "8+ years", "7+ years", "10+ years"]):
        exp_level = "Senior (5+ Years)"
    elif any(w in text_lower for w in ["junior", "entry level", "fresh graduate", "intern", "trainee"]):
        exp_level = "Junior (0–2 Years)"

    # 4. Infer Professional Title
    title = "Full-Stack Developer"
    if "automation" in text_lower or "n8n" in text_lower or "scrapy" in text_lower:
        title = "AI Automation & Full-Stack Developer"
    elif "python" in text_lower and ("fastapi" in text_lower or "django" in text_lower):
        title = "Python Backend & API Specialist"
    elif "react" in text_lower or "next.js" in text_lower:
        title = "Frontend & React Developer"
    elif "ui" in text_lower or "ux" in text_lower or "figma" in text_lower:
        title = "UI/UX Designer & Product Specialist"
    elif "flutter" in text_lower:
        title = "Mobile App Developer (Flutter)"

    summary = f"Experienced {title} with skills in {', '.join(found_skills[:5]) if found_skills else 'modern technologies'}."

    return {
        "candidate_name": name,
        "candidate_email": email,
        "skills": found_skills if found_skills else ["Python", "JavaScript", "Automation"],
        "experience_level": exp_level,
        "professional_title": title,
        "summary": summary,
        "extraction_source": "rule_based_heuristics"
    }


def _empty_profile(reason: str = "") -> Dict[str, Any]:
    return {
        "candidate_name": "Freelancer",
        "candidate_email": "",
        "skills": [],
        "experience_level": "Unknown",
        "professional_title": "Unknown",
        "summary": reason or "Could not extract profile information.",
        "extraction_source": "empty"
    }
