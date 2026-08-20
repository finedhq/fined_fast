-- ==========================================================
-- Migration 001: FinEd Personal Lens
-- Supports personalized pre-reading AI takeaways & caching
-- ==========================================================

-- 1. Ensure columns exist on articles table
ALTER TABLE IF EXISTS articles
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS editor_summary TEXT DEFAULT '';

-- 2. Create article_questions table (for customizable questionnaires per article)
CREATE TABLE IF NOT EXISTS article_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_article_questions_article_id 
ON article_questions(article_id);

-- 3. Create personal_lens_cache table (deterministic caching by profile_key)
CREATE TABLE IF NOT EXISTS personal_lens_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id TEXT NOT NULL,
    profile_key TEXT NOT NULL,
    response JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_article_profile UNIQUE(article_id, profile_key)
);

CREATE INDEX IF NOT EXISTS idx_personal_lens_cache_lookup 
ON personal_lens_cache(article_id, profile_key);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE article_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_lens_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access to questions and cache
CREATE POLICY "Public Read Questions" ON article_questions
    FOR SELECT USING (true);

CREATE POLICY "Public Read Cache" ON personal_lens_cache
    FOR SELECT USING (true);

-- Allow service role full access
CREATE POLICY "Service Role Full Access Questions" ON article_questions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service Role Full Access Cache" ON personal_lens_cache
    FOR ALL USING (auth.role() = 'service_role');

-- ==========================================================
-- DAILY ARTICLE UPLOAD EXAMPLES & BLUEPRINTS FOR SUPABASE
-- ==========================================================

-- ----------------------------------------------------------
-- TEMPLATE 1: INSERTING A NEW ARTICLE WITH METADATA & SUMMARY
-- ----------------------------------------------------------
/*
INSERT INTO articles (
    title,
    slug,
    content,
    description,
    image_url,
    tag,
    status,
    editor_summary,
    metadata
) VALUES (
    'The Economics of Four Day Workweeks',
    'the-economics-of-four-day-workweeks',
    'Full markdown article content here...',
    'A deep dive into productivity, labor economics, and corporate pilots of the 4-day workweek.',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c',
    'Deep Dives',
    'published',
    -- 2-3 sentence high level summary for the AI Pre-Reading Coach:
    'This explainer analyzes global 4-day workweek trials, examining how reduced hours affect worker productivity, burnout, employer revenue, and macroeconomic labor shifts.',
    -- Structured Metadata JSON:
    '{
        "difficulty": "Intermediate",
        "readingTime": "7 min read",
        "targetAudience": "Salaried employees, managers, and business owners",
        "keyConcepts": ["Parkinson''s Law", "Burnout Reduction", "100-80-100 Rule", "Labor Productivity"],
        "importantSections": [
            "What Is the 100-80-100 Model?",
            "Productivity Paradox: Doing More in Fewer Hours",
            "Which Industries Can Actually Transition?",
            "Macroeconomic Impact on Wages and Hiring"
        ]
    }'::jsonb
) RETURNING id;
*/

-- ----------------------------------------------------------
-- TEMPLATE 2: INSERTING 4 CUSTOM QUESTIONS (Plain Strings Format)
-- (No IDs, tags, or icons required — just the question & 4 option strings!)
-- ----------------------------------------------------------
/*
INSERT INTO article_questions (article_id, question, display_order, options) VALUES
(
    'YOUR_ARTICLE_UUID_HERE',
    'How familiar are you with discussions around Four-Day Workweeks?',
    1,
    '[
        "Never heard of it",
        "Follow general news and debates",
        "Read business pilot results and case studies",
        "Actively researching or experiencing it at work"
    ]'::jsonb
),
(
    'YOUR_ARTICLE_UUID_HERE',
    'What is your main goal for reading this article?',
    2,
    '[
        "Understanding macroeconomic & business impact",
        "Seeing how it affects productivity and burnout",
        "Evaluating what it means for my career/industry",
        "Learning how companies can actually pull it off"
    ]'::jsonb
),
(
    'YOUR_ARTICLE_UUID_HERE',
    'What is your current professional context?',
    3,
    '[
        "Full-time employee (Corporate/Tech/Desk)",
        "Shift, Healthcare, or Operational role",
        "Student or entering the workforce soon",
        "Business owner, manager, or freelancer"
    ]'::jsonb
),
(
    'YOUR_ARTICLE_UUID_HERE',
    'What is your single biggest question or skepticism on this topic?',
    4,
    '[
        "Does output really stay the same in 4 days?",
        "Will salaries be reduced or hours crammed?",
        "Which industries can actually make this work?",
        "Is this a real future or just a passing trend?"
    ]'::jsonb
);
*/
