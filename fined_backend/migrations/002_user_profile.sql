-- ==========================================================
-- Migration 002: FinEd User Profile
-- Adds user profile fields: username, career_stage, financial_level, bio, macro_profile
-- ==========================================================

ALTER TABLE IF EXISTS users
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS career_stage TEXT DEFAULT 'Student',
ADD COLUMN IF NOT EXISTS financial_level TEXT DEFAULT 'Beginner (Level 1) - Starting with basics',
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT 'Engineering student building daily personal finance & investing discipline 10 minutes a day on FinEd.',
ADD COLUMN IF NOT EXISTS macro_profile JSONB DEFAULT '{}'::jsonb;

-- Ensure unique username if populated
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;
