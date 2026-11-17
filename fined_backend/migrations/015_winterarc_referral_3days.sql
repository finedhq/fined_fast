-- ==========================================================
-- Migration 015: a referred friend counts only after 3 days of WinterArc (2026-11-17)
--
-- Decided 2026-11-17: in the referral contests a friend counts toward the
-- referrer only once the FRIEND has finished 3 days of the challenge (every
-- question of the day). The referrer does not need to.
--   - nov contest: friend joined with the link by 30 Nov, and finished
--     Days 1, 2 and 3 by the end of 3 Dec (IST). Results declared 4 Dec.
--   - dec contest: friend joined with the link 1-30 Dec, and finished any
--     3 days by the end of 30 Dec (IST).
-- The minimum (3 friends since 2026-11-17, was 5) applies (backend), on these counted friends.
--
-- Replaces the winterarc_referral_contests view from 014. Same columns, plus
-- `joined` (friends who signed up with the link and made a FinEd account,
-- the old count) so people can still see progress before December.
-- `referrals` is now the counted (3-day) friends and drives the rank;
-- `reached_at` is when the last counted friend finished their third day.
--
-- Safe to re-run. Needs 008-014.
-- Run order: PRACTICE database first; live only when the owner says so,
-- and BEFORE the backend that uses it is deployed.
-- ==========================================================

DROP VIEW IF EXISTS public.winterarc_referral_contests;

CREATE VIEW public.winterarc_referral_contests
WITH (security_invoker = true) AS
WITH contests AS (
    -- days_from/days_to: which days count; days_by: when they must be done
    SELECT 'nov'::text AS contest, timestamptz '-infinity' AS opens,
           timestamptz '2026-11-30 23:59:59.999+05:30' AS closes,
           1 AS days_from, 3 AS days_to, timestamptz '2026-12-03 23:59:59.999+05:30' AS days_by
    UNION ALL
    SELECT 'dec', timestamptz '2026-11-30 23:59:59.999+05:30',
           timestamptz '2026-12-30 23:59:59.999+05:30',
           1, 30, timestamptz '2026-12-30 23:59:59.999+05:30'
),
friends AS (
    SELECT c.contest, c.days_from, c.days_to, c.days_by, lower(w.email) AS email,
           w.referred_by_code AS code, greatest(w.created_at, u.created_at) AS joined_at
    FROM public.winterarc_waitlist w
    JOIN public.users u ON lower(u.email) = lower(w.email)
    JOIN contests c ON w.created_at > c.opens AND w.created_at <= c.closes
    WHERE w.referred_by_code IS NOT NULL
      AND w.disqualified_at IS NULL
      AND u.created_at IS NOT NULL AND u.created_at <= c.closes
),
-- A day is done when all 3 of its questions are finished (QUESTIONS_PER_DAY)
days_done AS (
    SELECT f.contest, f.email, a.day_no, max(a.finished_at) AS done_at
    FROM friends f
    JOIN public.winterarc_answers a ON lower(a.email) = f.email
    WHERE a.finished AND a.finished_at <= f.days_by
      AND a.day_no BETWEEN f.days_from AND f.days_to
    GROUP BY f.contest, f.email, a.day_no
    HAVING count(*) >= 3
),
counted AS (
    -- the moment the friend's third done day was finished
    SELECT contest, email, (array_agg(done_at ORDER BY done_at))[3] AS counted_at
    FROM days_done GROUP BY contest, email
    HAVING count(*) >= 3
),
per AS (
    SELECT f.contest, f.code, count(*) AS joined, count(k.email) AS referrals,
           max(greatest(f.joined_at, k.counted_at)) FILTER (WHERE k.email IS NOT NULL) AS reached_at
    FROM friends f
    LEFT JOIN counted k ON k.contest = f.contest AND k.email = f.email
    GROUP BY f.contest, f.code
)
SELECT
    p.contest,
    p.code,
    r.name AS referrer_name,
    p.referrals,
    p.reached_at,
    rank() OVER (PARTITION BY p.contest ORDER BY p.referrals DESC, p.reached_at ASC NULLS LAST) AS rank,
    p.joined
FROM per p
JOIN public.winterarc_waitlist r ON r.referral_code = p.code AND r.disqualified_at IS NULL;

REVOKE ALL ON public.winterarc_referral_contests FROM anon, authenticated;
