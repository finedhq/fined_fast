-- Migration: 002_add_reviewer_id_to_articles.sql
-- Description: Add optional reviewer_id column to articles table referencing authors table

ALTER TABLE IF EXISTS articles
ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES authors(id) ON DELETE SET NULL;

-- Create index for performance on reviewer queries
CREATE INDEX IF NOT EXISTS idx_articles_reviewer_id ON articles(reviewer_id);
