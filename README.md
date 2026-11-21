# ⚡ UNSTUCK — Autonomous Freelance Radar & Multi-Platform Intelligence System

<div align="center">

![UNSTUCK Banner](frontend/src/assets/unstuck_3d_wordmark.png)

**توقف عن البحث اليدوي. ابدأ باقتناص المشاريع فور طرحها.**  
*Stop Searching Manually. Start Matching and Winning.*

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Scrapy](https://img.shields.io/badge/Scrapy-2.11-EE0000?style=for-the-badge&logo=scrapy&logoColor=white)](https://scrapy.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![n8n](https://img.shields.io/badge/n8n-Workflow%20Automation-EA4B71?style=for-the-badge&logo=n8n&logoColor=white)](https://n8n.io/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---
**DEPI Graduation Project — Digital Egypt Pioneers Initiative**  
*Graduation Project in AI & Software Development*
</div>

---

## 📌 Table of Contents / جدول المحتويات
- [Overview / نظرة عامة](#-overview--نظرة-عامة)
- [System Architecture / المعمارية البرمجية](#-system-architecture--المعمارية-البرمجية)
- [Key Features / المزايا الرئيسية](#-key-features--المزايا-الرئيسية)
- [Project Directory Structure / هيكلية المجلدات](#-project-directory-structure--هيكلية-المجلدات)
- [Prerequisites & Requirements / المتطلبات](#-prerequisites--requirements--المتطلبات)
- [Quick Start Guide / طريقة التشغيل الفورية](#-quick-start-guide--طريقة-التشغيل-الفورية)
- [Environment Configuration / إعداد متغيرات البيئة](#-environment-configuration--إعداد-متغيرات-البيئة)
- [REST API Endpoints Reference / مرجع واجهات برمجة التطبيقات](#-rest-api-endpoints-reference--مرجع-واجهات-برمجة-التطبيقات)
- [n8n Automation Pipeline / خط أتمتة n8n](#-n8n-automation-pipeline--خط-أتمتة-n8n)
- [Supabase Cloud Database & Triggers / قاعدة بيانات Supabase](#-supabase-cloud-database--triggers--قاعدة-بيانات-supabase)
- [Automated Email Alerts / إشعارات البريد التلقائية](#-automated-email-alerts--إشعارات-البريد-التلقائية)
- [Leaderboard & Scoring System / لوحة الصدارة ونظام النقاط](#-leaderboard--scoring-system--لوحة-الصدارة-ونظام-النقاط)
- [Automated Test Suite / جناح الاختبارات الشاملة](#-automated-test-suite--جناح-الاختبارات-الشاملة)
- [Academic Deliverables / تسليمات المشروع](#-academic-deliverables--تسليمات-المشروع)

---

## 📖 Overview / نظرة عامة

يقضي المستقلون (Freelancers) في العالم العربي والعالم ساعات طويلة يومياً في التنقل المرهق بين منصات العمل الحر المختلفة (**مستقل، خمسات، نفذلي، و Freelancer.com**) بحثاً عن مشاريع تناسب تخصصاتهم، مما يؤدي إلى ضياع فرص ثمينة وبطء في تقديم العروض التنافسية.

منصة **UNSTUCK** هي منظومة متكاملة ذكية تعمل كـ **Radar** ذاتي الاستقلالية:
1. **تجمع وتكشط المشاريع الحية** عبر 4 منصات في وقت واحد وبشكل لحظي.
2. **تحلل السيرة الذاتية (CV)** للمستقل بنقرة واحدة (PDF / DOCX / TXT) وتستخرج مهاراته وخبرته عبر الذكاء الاصطناعي.
3. **تطابق المشاريع بدقة** بنسب مئوية (Match Score 0-100%) وتقدم أسباباً تفصيلية للتوافق.
4. **تولد عروض عمل احترافية (Proposals)** ثنائية اللغة (عربي / إنجليزي) وبـ 3 نبرات تسويقية (Value-First, Direct, Authoritative).
5. **ترتب المستقلين في لوحة صدارة تنافسية (Leaderboard)** وفق نظام نقاط معتمد ومخزن سحابياً على Supabase.
6. **ترسل إشعارات فورية بالبريد الإلكتروني** بمجرد تسجيل الدخول أو عند طرح مشاريع مطابقة عبر SMTP و n8n.

---

## 🏛 System Architecture / المعمارية البرمجية

```mermaid
flowchart TB
    subgraph Client ["Client Layer (React 19 + Vite)"]
        UI["Landing, Radar, Opportunities Explorer"]
        DNA["Freelance DNA & CV Drag-and-Drop"]
        LB["Application Leaderboard & Podium"]
        PG["AI Proposal Generator Engine"]
    end

    subgraph API ["Backend Layer (FastAPI :8000)"]
        Router["REST API Router & Auth"]
        CVParser["CV Parser (PyPDF, Docx, NLP, AI)"]
        Matcher["Weighted Matcher & Scoring Algorithm"]
        GenAI["Proposal Engine (GLM-4 / Heuristic)"]
        SMTPService["Gmail SMTP Background Dispatcher"]
    end

    subgraph Scrapers ["Web Scraping Engine (Scrapy)"]
        Spiders["Spiders: Mostaql, Khamsat, Nafezly, Freelancer"]
        Pipeline["PostgreSQL / SQLite Upsert Pipeline"]
    end

    subgraph Automation ["Automation & DB Layer"]
        Supa[("Supabase Cloud DB (PostgreSQL)")]
        N8N["n8n Workflow (Docker :5678)"]
        SMTP[("Google Gmail SMTP")]
    end

    UI -->|HTTP / JSON| Router
    DNA -->|Multipart CV File| CVParser
    CVParser -->|Save Profile & Skills| Supa
    CVParser -->|Match Skills| Matcher
    Matcher -->|Fetch Active Projects| Supa
    Matcher -->|Dispatch Instant Match Email| SMTPService
    SMTPService -->|TLS Delivery| SMTP
    Router -->|User Actions / Rank| Supa
    LB -->|Real-time Leaderboard| Supa
    PG -->|Generate Pitch| GenAI
    Spiders -->|Upsert Raw Jobs| Pipeline
    Pipeline -->|Sync| Supa
    N8N -->|Hourly Cron & Webhooks| Router
```

---

## ✨ Key Features / المزايا الرئيسية

| الميزة | الوصف التقني | المنصة / التقنية |
|---|---|---|
| **Multi-Platform Scrapers** | سحب المشاريع تلقائياً من 4 منصات وتحديث مستمر | Scrapy, Twisted, XPath, CSS Selectors |
| **Intelligent CV Upload** | رفع السيرة الذاتية (PDF, DOCX, TXT) واستخراج المهارات | PyPDF, PDFPlumber, python-docx, NLP |
| **Real-Time Matchmaking** | خوارزمية ذكية لمطابقة متطلبات المشاريع مع مهارات المستخدم | Weighted Token Jaccard + TF-IDF Vectorizer |
| **AI Proposal Generator** | توليد بروبوزال احترافي بـ 3 نبرات وباللغتين العربية والإنجليزية | GLM-4 AI Engine / Smart Fallback Engine |
| **Multi-User Leaderboard** | لوحة صدارة سحابية مع احتساب النقاط والرتب تلقائياً عبر Database Trigger | Supabase Cloud, PostgreSQL Triggers, Views |
| **Instant Email Alerts** | إرسال إشعار فوري بالمشاريع المطابقة عند تسجيل الدخول أو رفع الـ CV | Python smtplib, Gmail App Passwords, HTML Email |
| **n8n Orchestration** | خط أتمتة مكون من 17 نود يشمل Webhook لرفع الـ CV ومجدول كشط دوري | n8n v1 Docker Engine |
| **Responsive Modern UI** | واجهة ويب متطورة فائقة السرعة مع الوضع الليلي والنهاري | React 19, Vite, Tailwind CSS, Lucide Icons |

---

## 📂 Project Directory Structure / هيكلية المجلدات

```text
DEPI-Unstuck-PROJECT/
├── docs/                                    # مستندات وتسليمات المشروع الأكاديمية (DEPI)
│   ├── 01_Project_Planning_and_Management.pdf
│   ├── Requirements_Gathering.pdf
│   ├── UNSTUCK_Literature_Review_Competitive_Analysis.pdf
│   └── final proposal templet.docx
│
├── frontend/                                # تطبيق الواجهة الأمامية (React + Vite)
│   ├── src/
│   │   ├── assets/                          # الصور والشعارات ثلاثية الأبعاد
│   │   ├── components/
│   │   │   ├── common/                      # Header, Footer, BrandLogo, ThemeToggle
│   │   │   ├── forms/                       # حقول الإدخال والتحقق
│   │   │   └── ui/                          # البطاقات، الأزرار، الإشعارات (Toasts)
│   │   ├── pages/
│   │   │   ├── app/                         # صفحات التطبيق (Radar, Opportunities, Detail, DNA, Leaderboard, Admin)
│   │   │   └── public/                      # صفحات الهبوط والتسجيل (Landing, Login, SignUp, VerifyOtp)
│   │   ├── App.jsx                          # المكون الرئيسي ومسارات التطبيق
│   │   └── main.jsx                         # نقطة البداية لتطبيق React
│   ├── index.html                           # صفحة HTML الأساسية
│   ├── package.json                         # حزم وتبيعات الواجهة
│   └── vite.config.js                       # إعدادات Vite
│
├── backend/                                 # خادم الباك إند والكواشط والذكاء الاصطناعي
│   ├── scrapers/                            # حزمة الكواشط والخدمات
│   │   ├── spiders/
│   │   │   ├── mostaql_spider.py            # كاشط منصة مستقل
│   │   │   ├── khamsat_spider.py            # كاشط منصة خمسات
│   │   │   ├── nafezly_spider.py            # كاشط منصة نفذلي
│   │   │   └── freelancer_spider.py         # كاشط منصة Freelancer.com
│   │   ├── ai.py                            # محرك المطابقة وتوليد العروض بالذكاء الاصطناعي
│   │   ├── auth.py                          # إدارة المستخدمين، التشفير، OTP، و SMTP
│   │   ├── cv_parser.py                     # مستخرج السير الذاتية (PDF/DOCX/TXT)
│   │   ├── database.py                      # مدير PostgreSQL و SQLite
│   │   ├── supabase_client.py               # العميل السحابي لـ Supabase REST & PostgREST
│   │   ├── pipelines.py                     # معالجة وتخزين البيانات المسحوبة
│   │   ├── settings.py                      # إعدادات Scrapy (User-Agents, Concurrency)
│   │   └── user_agents.py                   # تدوير الـ User-Agents لتفادي الحظر
│   ├── output/                              # ملفات JSON الاحتياطية للمشاريع
│   ├── main.py                              # تطبيق FastAPI الرئيسي والـ Endpoints
│   ├── run.py                               # مشغل كواشط البيانات
│   ├── scrapy.cfg                           # ملف ضبط Scrapy
│   ├── n8n_workflow.json                    # الورك فلو الشامل لـ n8n (17 نود)
│   ├── supabase_schema.sql                  # ملف إنشاء جداول وترجرات Supabase
│   ├── migrate_to_supabase.py               # سكربت ترحيل البيانات السحابية
│   ├── test_suite.py                        # اختبارات التكامل الشاملة (16/16 Pass)
│   ├── docker-compose.yml                   # تشغيل PostgreSQL و n8n عبر Docker
│   ├── requirements.txt                     # مكتبات بايثون المطلوبة
│   ├── START_API.bat                        # تشغيل الباك إند فقط
│   └── .env.example                         # نموذج متغيرات البيئة
│
├── START.bat                                # ملف التشغيل الفوري الموحد (Frontend + Backend)
├── README.md                                # التوثيق الشامل للمشروع
└── .gitignore                               # استثناء المفاتيح السرية والملفات المؤقتة
```

---

## ⚙️ Prerequisites & Requirements / المتطلبات

1. **Python 3.10+** (يفضل Python 3.11).
2. **Node.js 18+** مع `npm`.
3. **Docker Desktop** (اختياري، لتشغيل n8n محلياً).
4. **حساب Supabase مجاني** (لقاعدة البيانات السحابية).
5. **حساب Google** مع **App Password** (لتفعيل إرسال إيميلات حقيقية عبر Gmail SMTP).

---

## 🚀 Quick Start Guide / طريقة التشغيل الفورية

### الخيار 1: التشغيل بنقرة واحدة (One-Click Launch) 🌟
اضغط دبل كليك على ملف:
```cmd
START.bat
```
سيقوم الملف تلقائياً بالآتي:
- تشغيل خادم **FastAPI Backend** على المنفذ `http://localhost:8000`.
- فتح المتصفح على واجهة التطبيق.
- تشغيل خادم **React Vite Frontend** على المنفذ `http://localhost:5173`.

---

### الخيار 2: التشغيل اليدوي (Manual Step-by-Step)

#### 1. إعداد وتشغيل الباك إند (Backend):
```bash
cd backend

# إنشاء بيئة افتراضية وتفعيلها
python -m venv venv
venv\Scripts\activate   # على Windows
# source venv/bin/activate # على Linux/Mac

# تثبيت الحزم المطلوبة
pip install -r requirements.txt

# إنشاء ملف البيئة
copy .env.example .env
# ضع بيانات Supabase و Gmail في ملف .env

# تشغيل خادم FastAPI
py -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
- يمكنك تفقد توثيق Swagger التفاعلي عبر: [http://localhost:8000/docs](http://localhost:8000/docs)

#### 2. إعداد وتشغيل الواجهة الأمامية (Frontend):
```bash
cd frontend

# تثبيت الحزم
npm install

# تشغيل خادم التطوير
npm run dev
```
- افتح المتصفح على: [http://localhost:5173](http://localhost:5173)

---

## 🔐 Environment Configuration / إعداد متغيرات البيئة

أنشئ ملف `.env` داخل مجلد `backend/` مسترشداً بملف `backend/.env.example`:

```env
# Supabase Cloud Database Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-service-role-or-anon-key
SUPABASE_DB_URL=postgresql://postgres:password@db.your-project-id.supabase.co:5432/postgres

# AI & LLM Engine (GLM-4 / OpenAI / Gemini)
GLM_API_KEY=your-glm-api-key
OPENAI_API_KEY=
GEMINI_API_KEY=

# Gmail SMTP Configuration (لإرسال إشعارات وOTP حقيقية)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_16_digit_app_password
SMTP_FROM_EMAIL=your_email@gmail.com
SMTP_USE_TLS=true
```

> [!TIP]
> للحصول على `SMTP_PASSWORD` الخاص بجوجل:
> 1. ادخل على [myaccount.google.com/security](https://myaccount.google.com/security) وفعل التحقق بخطوتين (2-Step Verification).
> 2. توجه إلى [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
> 3. اختر اسماً (مثل `Unstuck`) وانسخ الكود المكون من 16 حرفاً وضعه في `SMTP_PASSWORD`.

---

## 🌐 REST API Endpoints Reference / مرجع واجهات برمجة التطبيقات

| Endpoint | Method | الوصف | المعاملات / الجسم |
|---|---|---|---|
| `/api/status` | `GET` | فحص حالة الكواشط وعدد المشاريع المتوفرة وتاريخ التحديث | None |
| `/api/db-status` | `GET` | فحص اتصال قاعدة بيانات PostgreSQL / Supabase | None |
| `/api/projects` | `GET` | جلب المشاريع المجمعة مع إمكانية الفلترة والبحث | `platform`, `q`, `limit`, `offset` |
| `/api/match` | `POST` | مطابقة المهارات وحساب درجات التوافق والمشاريع المناسبة | `{ user_skills: string[], limit: int }` |
| `/api/generate-proposal` | `POST` | توليد عرض عمل تسويقي بالذكاء الاصطناعي بأساليب متعددة | `{ project_title, tone, language, ... }` |
| `/api/cv/upload` | `POST` | رفع السيرة الذاتية واستخراج المهارات وحفظ البروفايل ومطابقة المشاريع وإرسال إيميل فوري | Multipart `file` أو JSON text |
| `/api/auth/register` | `POST` | إنشاء حساب جديد وتشفير كلمة المرور وإرسال OTP للبريد | `{ full_name, email, password }` |
| `/api/auth/verify-otp` | `POST` | تأكيد كود الـ 6 أرقام وتفعيل الحساب وإرسال الفرص المطابقة | `{ email, otp }` |
| `/api/auth/login` | `POST` | تسجيل الدخول وإطلاق إرسال الوظائف المتطابقة تلقائياً | `{ email, password }` |
| `/api/leaderboard` | `GET` | جلب ترتيب المستقلين في لوحة الصدارة الشاملة | `limit` (default: 50) |
| `/api/user/rank` | `GET` | جلب ترتيب مستخدم معين بالتفصيل ونقاطه ومستواه | `email` (query param) |
| `/api/user/action` | `POST` | تسجيل تقديم عرض أو التقدم لمشروع وزيادة النقاط (+50 أو +30) | `{ email, action, project_title }` |
| `/api/notify/email` | `POST` | إرسال إشعار بريدي مخصص عبر خادم SMTP | `{ to_email, subject, html_content }` |
| `/api/scrape` | `POST` | تشغيل كواشط البيانات في الخلفية أو بالانتظار | `{ platforms: ["all"], wait: bool }` |

---

## 🔄 n8n Automation Pipeline / خط أتمتة n8n

يتضمن المشروع ملف أتمتة احترافي `backend/n8n_workflow.json` مكون من **17 نود**:

```mermaid
flowchart LR
    subgraph StreamA ["مسار استخراج الـ CV الفوري"]
        WH["Webhook: /webhook/cv-upload"] --> Ext["Extract Skills (Backend API)"]
        Ext --> Sync["Sync to Supabase"]
        Sync --> Chk{"Matches > 0?"}
        Chk -->|Yes| Mail1["Format & Send HTML Email"]
        Chk -->|No| Resp["Respond to Webhook"]
        Mail1 --> Resp
    end

    subgraph StreamB ["مسار الجدولة الدورية"]
        Cron["Schedule (كل ساعة)"] --> Scrape["Scrape 4 Platforms"]
        Scrape --> Users["Fetch Users from Supabase"]
        Users --> Match["Match Jobs per User"]
        Match --> Mail2["Send Match Alerts to Users"]
    end
```

### خطوات تفعيل الـ Workflow في n8n:
1. تأكد من تشغيل حاوية n8n:
   ```bash
   docker run -d --name n8n -p 5678:5678 -e N8N_HOST=localhost -e WEBHOOK_URL=http://localhost:5678/ docker.n8n.io/n8nio/n8n:latest
   ```
2. ادخل على لوحة التحكم `http://localhost:5678`.
3. اضغط **Add Workflow** -> **Import from File** واختر `backend/n8n_workflow.json`.
4. اضغط **Publish** ليصبح الورك فلو مفعلاً دائماً.

---

## 🗄 Supabase Cloud Database & Triggers / قاعدة بيانات Supabase

تم تصميم قاعدة البيانات السحابية لتدعم بيئة متعددة المستخدمين (Multi-User) بكفاءة عالية عبر ملف `backend/supabase_schema.sql`:

### 1. الجداول الأساسية:
- `profiles`: تخزين بيانات المستقلين، المهارات المستخرجة، ومستوى الخبرة.
- `projects`: تخزين مئات المشاريع المسحوبة والمحدثة لحظياً.
- `user_applications`: تسجيل تفاعل المستقلين مع المشاريع (تقديم عروض أو حفظ مشاريع).

### 2. الترجرز الذكية (Database Trigger):
```sql
CREATE OR REPLACE FUNCTION recalculate_user_score()
RETURNS TRIGGER AS $$
DECLARE
    v_skills_count INT := 0;
    v_apps_count INT := 0;
    v_proposals_count INT := 0;
    v_total_score INT := 0;
BEGIN
    -- حساب النقاط: المهارات المعتمدة (20 نقطة) + المشاريع المقدمة (50 نقطة) + العروض (30 نقطة)
    ...
    UPDATE public.profiles
    SET total_score = v_total_score, updated_at = NOW()
    WHERE email = NEW.user_email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🏆 Leaderboard & Scoring System / لوحة الصدارة ونظام النقاط

تم بناء نظام تحفيزي متكامل (Gamification) لترتيب المستقلين:
- **+20 نقطة** لكل مهارة معتمدة مستخرجة من السيرة الذاتية (CV).
- **+50 نقطة** عند التقدم لأي مشروع عبر المنصة.
- **+30 نقطة** عند إنشاء عرض عمل (Proposal) ذكي.

### مستويات الرتب (Badges):
- 👑 **Master Elite**: أكثر من 1,000 نقطة.
- ⚡ **Senior Pro**: أكثر من 500 نقطة.
- 🚀 **Rising Star**: أكثر من 200 نقطة.
- 🌱 **Aspiring Talent**: نقطة البداية.

---

## 🧪 Automated Test Suite / جناح الاختبارات الشاملة

يحتوي المشروع على ملف اختبار تكاملي شامل `backend/test_suite.py` يفحص كافة وظائف المنظومة:

```bash
cd backend
py test_suite.py
```

### نتائج تدقيق الاختبارات (Audit Results):
```text
============================================================
STARTING FULL END-TO-END SUITE FOR UNSTUCK BACKEND & UI
============================================================
[PASS] GET / -> Status: 200
[PASS] GET /api/status -> Platforms: ['mostaql', 'khamsat', 'nafezly', 'freelancer']
[PASS] GET /api/db-status -> Connected: True
[PASS] POST /api/match -> Returned 20 jobs
[PASS] Match schema integrity -> Score: 65%
[PASS] POST /api/generate-proposal (Arabic Value) -> Length: 290
[PASS] POST /api/generate-proposal (English Direct) -> Length: 272
[PASS] POST /api/auth/register -> Sent OTP email
[PASS] POST /api/auth/login (Requires Verification) -> Correctly Refused
[PASS] Account Verification -> Account verified for login test
[PASS] POST /api/auth/login (Verified) -> Logged in as: Audit Tester
[PASS] POST /api/auth/resend-otp (Rate Limit Cooldown Enforced) -> Enforced
[PASS] POST /api/cv/upload (Skills Extraction & Job Matching) -> Skills: 6 | Matches: 50
[PASS] GET /api/leaderboard (Supabase / Multi-User Ranking) -> Total Ranked Users: 20
[PASS] GET /api/user/rank (Standing & Percentile) -> Rank: #21
[PASS] POST /api/user/action (Award Points & Elevate Rank) -> Points Awarded: 50 pts
============================================================
FINAL AUDIT SUMMARY: 16/16 TESTS PASSED (100% SUCCESS)
============================================================
```

---

## 📚 Academic Deliverables / تسليمات المشروع

كافة المستندات التوثيقية المعتمدة لمبادرة رواد مصر الرقمية (DEPI) محفوظة ومتاحة داخل مجلد [`docs/`](docs/):
- [`docs/01_Project_Planning_and_Management.pdf`](docs/01_Project_Planning_and_Management.pdf): خطة وإدارة المشروع.
- [`docs/Requirements_Gathering.pdf`](docs/Requirements_Gathering.pdf): وثيقة جمع المتطلبات وتحليل النظام.
- [`docs/UNSTUCK_Literature_Review_Competitive_Analysis.pdf`](docs/UNSTUCK_Literature_Review_Competitive_Analysis.pdf): الدراسة المرجعية والتحليل التنافسي.
- [`docs/final proposal templet.docx`](docs/final%20proposal%20templet.docx): نموذج المقترح النهائي للمشروع.

---

## 👥 Contributors & Team

**DEPI Graduation Project — Track: AI & Software Engineering**  
- **Ahmed Mohamed Saad** ([@veiler-1](https://github.com/veiler-1)) — Full-Stack & AI Engineer

---
<div align="center">
<b>UNSTUCK • Stop Searching. Start Winning.</b>
</div>
