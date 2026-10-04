-- ==========================================================
-- Migration 003: rank lookup for the dashboard
-- user_repo.get_rank() calls this through supabase.rpc() and shows
-- rank = (users with a higher FinScore) + 1. If the function is missing,
-- the backend silently falls back to rank 1 for everyone.
--
-- FinScore = article_score + course_score + consistency_score
-- (the retired expense_score is no longer part of it). Keep this sum
-- in step with score_service.compute_total().
--
-- Safe to re-run: CREATE OR REPLACE.
-- ==========================================================

CREATE OR REPLACE FUNCTION public.count_users_above_score(score_threshold integer)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT count(*)::integer
    FROM public.users
    WHERE coalesce(article_score, 0)
        + coalesce(course_score, 0)
        + coalesce(consistency_score, 0) > score_threshold;
$$;
