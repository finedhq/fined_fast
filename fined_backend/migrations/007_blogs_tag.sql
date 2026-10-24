-- ==========================================================
-- Migration 007: Allow the "Blogs" article tag (2026-10-23).
--
-- Blogs are promotional/SEO posts. The site keeps them out of the general
-- feeds and only lists them under the Blogs filter and /tags/blogs.
--
-- The articles table has a rule (articles_tag_check) that only allowed the
-- five original tags, so saving an article tagged "Blogs" failed. This
-- replaces that rule with the same five tags plus "Blogs".
--
-- Safe to re-run. Runs as one transaction: if any existing article has a tag
-- outside this list, the whole thing stops and nothing changes.
-- Run order: PRACTICE database first, then the live database.
-- ==========================================================

BEGIN;

ALTER TABLE public.articles DROP CONSTRAINT IF EXISTS articles_tag_check;

ALTER TABLE public.articles ADD CONSTRAINT articles_tag_check
  CHECK (tag IN ('Personal Finance', 'IPO', 'Investing', 'Deep Dives', 'Economy', 'Blogs'));

COMMIT;

-- Shows the new rule so you can confirm it includes 'Blogs'.
SELECT pg_get_constraintdef(oid) AS articles_tag_rule
FROM pg_constraint
WHERE conname = 'articles_tag_check';
