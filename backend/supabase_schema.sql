-- =========================================================================
-- 🚀 UNSTUCK APP: COMPLETE SUPABASE DATABASE SCHEMA
-- Multi-User Profiles, Freelance Projects UPSERT, Applications & Leaderboard
-- =========================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles & Freelance DNA Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_total_score ON public.profiles(total_score DESC);

-- 3. Scraped Projects Table (UPSERT on url)
CREATE TABLE IF NOT EXISTS public.projects (
    id BIGSERIAL PRIMARY KEY,
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

CREATE INDEX IF NOT EXISTS idx_projects_url ON public.projects(url);
CREATE INDEX IF NOT EXISTS idx_projects_platform_key ON public.projects(platform_key);
CREATE INDEX IF NOT EXISTS idx_projects_published_at ON public.projects(published_at DESC);

-- 4. User Applications & Work Activity Tracking Table
CREATE TABLE IF NOT EXISTS public.user_applications (
    id BIGSERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    project_title TEXT,
    platform VARCHAR(100),
    action VARCHAR(50) DEFAULT 'apply',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_applications_email ON public.user_applications(user_email);

-- 5. Stored Function to Automatically Recalculate User Rank & Badge
CREATE OR REPLACE FUNCTION public.recalculate_user_score()
RETURNS TRIGGER AS $$
DECLARE
    skill_count INTEGER := 0;
    computed_skills_score INTEGER := 0;
    computed_applied_score INTEGER := 0;
    computed_total INTEGER := 0;
    computed_badge VARCHAR(50);
BEGIN
    -- Count number of skills in JSONB array
    IF NEW.skills IS NOT NULL AND jsonb_typeof(NEW.skills) = 'array' THEN
        skill_count := jsonb_array_length(NEW.skills);
    ELSE
        skill_count := 0;
    END IF;

    -- Compute scores
    computed_skills_score := (skill_count * 20);
    computed_applied_score := (COALESCE(NEW.applied_jobs_count, 0) * 50) + (COALESCE(NEW.proposals_count, 0) * 30);
    computed_total := computed_skills_score + computed_applied_score;

    -- Assign badge based on total score
    IF computed_total >= 500 THEN
        computed_badge := '🏆 Elite Master';
    ELSIF computed_total >= 300 THEN
        computed_badge := '⚡ Senior Pro';
    ELSIF computed_total >= 150 THEN
        computed_badge := '🚀 Rising Star';
    ELSE
        computed_badge := '🌱 Aspiring Talent';
    END IF;

    NEW.skills_score := computed_skills_score;
    NEW.applied_score := computed_applied_score;
    NEW.total_score := computed_total;
    NEW.badge := computed_badge;
    NEW.updated_at := CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate score before insert or update on profiles
DROP TRIGGER IF EXISTS trigger_profile_score_calc ON public.profiles;
CREATE TRIGGER trigger_profile_score_calc
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_user_score();

-- 6. Dynamic View for Leaderboard Ranking
CREATE OR REPLACE VIEW public.v_leaderboard AS
SELECT
    id,
    email,
    full_name,
    title,
    experience_level,
    skills,
    applied_jobs_count,
    proposals_count,
    skills_score,
    applied_score,
    total_score,
    badge,
    DENSE_RANK() OVER (ORDER BY total_score DESC) AS rank
FROM public.profiles
ORDER BY total_score DESC;

-- 7. Row Level Security (RLS) & Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert on profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Allow public read on projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on projects" ON public.projects FOR ALL USING (true);

CREATE POLICY "Allow public read on applications" ON public.user_applications FOR SELECT USING (true);
CREATE POLICY "Allow public insert on applications" ON public.user_applications FOR INSERT WITH CHECK (true);

-- 8. Seed Initial Freelancers to Populate Leaderboard
INSERT INTO public.profiles (email, full_name, title, skills, applied_jobs_count, proposals_count)
VALUES
('ahmed.fathy.dev@gmail.com', 'أحمد فتحي (You)', 'Full-Stack & AI Automation Specialist', '["React", "FastAPI", "Python", "n8n", "Docker", "Supabase", "Tailwind"]'::jsonb, 8, 14),
('sarah.uiux@unstuck.app', 'سارة الشريف', 'Senior Product & UI/UX Designer', '["Figma", "UI/UX", "Design Systems", "Prototyping", "User Research"]'::jsonb, 6, 9),
('kareem.cloud@unstuck.app', 'كريم عبد العزيز', 'DevOps & Cloud Automation Engineer', '["Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Python"]'::jsonb, 4, 7),
('layla.nlp@unstuck.app', 'ليلى محمود', 'AI & NLP Data Specialist', '["Python", "FastAPI", "Scraping", "OpenAI", "NLP"]'::jsonb, 3, 5),
('omar.flutter@unstuck.app', 'عمر طارق', 'Mobile Engineer (Flutter / Dart)', '["Flutter", "Dart", "Firebase", "REST APIs", "State Management"]'::jsonb, 2, 4)
ON CONFLICT (email) DO UPDATE SET
    applied_jobs_count = EXCLUDED.applied_jobs_count,
    proposals_count = EXCLUDED.proposals_count;
