-- ==========================================================
-- Migration 014: WinterArc daily boards and both referral contests (2026-11-15)
--
-- Prize split decided 2026-11-15: final top 3 (₹3,000 / ₹2,000 / ₹1,000),
-- ₹100 to the top scorer of each of the 30 days, and ₹500 to the top
-- referrer in each of two contests (by 30 Nov, and 1-30 Dec).
--
-- 1. winterarc_board_day: one row per person per day. A day's score is the
--    points from that day's questions finished inside the 36-hour
--    full-points window (on_time). Ranked by score, then whoever finished
--    first. Disqualified people are left out.
-- 2. winterarc_referral_contests: both referral contests in one view, one
--    row per referrer per contest ('nov' or 'dec'). A friend counts in a
--    contest when they joined with the link inside that contest's dates and
--    have a FinEd account (same email) made by its close. The 5-friend
--    minimum is applied by the backend, not here, so admins still see
--    everyone. Every winner is still checked by hand before payment.
--    (The old winterarc_referral_contest view is kept as it was.)
--
-- Additive only. Safe to re-run. Needs 008-013.
-- Run order: PRACTICE database first; live only when the owner says so,
-- and BEFORE the backend that uses it is deployed.
-- ==========================================================

CREATE OR REPLACE VIEW public.winterarc_board_day
WITH (security_invoker = true) AS
WITH members AS (
    SELECT DISTINCT ON (lower(email)) lower(email) AS email, name
    FROM public.winterarc_waitlist
    WHERE disqualified_at IS NULL
    ORDER BY lower(email), created_at
),
per AS (
    SELECT lower(email) AS email, day_no, sum(points) AS points, max(finished_at) AS reached_at,
           count(*) AS questions
    FROM public.winterarc_answers
    WHERE finished AND on_time AND points > 0
    GROUP BY lower(email), day_no
)
SELECT
    p.day_no,
    p.email,
    coalesce(nullif(trim(split_part(trim(m.name), ' ', 1) || ' ' ||
        CASE WHEN split_part(trim(m.name), ' ', 2) <> '' THEN left(split_part(trim(m.name), ' ', 2), 1) || '.' ELSE '' END), ''),
        'WinterArc player') AS display_name,
    p.points,
    p.questions,
    p.reached_at,
    rank() OVER (PARTITION BY p.day_no ORDER BY p.points DESC, p.reached_at ASC) AS rank
FROM per p
JOIN members m ON m.email = p.email;

CREATE OR REPLACE VIEW public.winterarc_referral_contests
WITH (security_invoker = true) AS
WITH contests AS (
    SELECT 'nov'::text AS contest, timestamptz '-infinity' AS opens, timestamptz '2026-11-30 23:59:59.999+05:30' AS closes
    UNION ALL
    SELECT 'dec', timestamptz '2026-11-30 23:59:59.999+05:30', timestamptz '2026-12-30 23:59:59.999+05:30'
),
friends AS (
    SELECT c.contest, w.referred_by_code AS code, greatest(w.created_at, u.created_at) AS qualified_at
    FROM public.winterarc_waitlist w
    JOIN public.users u ON lower(u.email) = lower(w.email)
    JOIN contests c ON w.created_at > c.opens AND w.created_at <= c.closes
    WHERE w.referred_by_code IS NOT NULL
      AND w.disqualified_at IS NULL
      AND u.created_at IS NOT NULL AND u.created_at <= c.closes
),
per AS (
    SELECT contest, code, count(*) AS referrals, max(qualified_at) AS reached_at
    FROM friends GROUP BY contest, code
)
SELECT
    p.contest,
    p.code,
    r.name AS referrer_name,
    p.referrals,
    p.reached_at,
    rank() OVER (PARTITION BY p.contest ORDER BY p.referrals DESC, p.reached_at ASC) AS rank
FROM per p
JOIN public.winterarc_waitlist r ON r.referral_code = p.code AND r.disqualified_at IS NULL;

REVOKE ALL ON public.winterarc_board_day FROM anon, authenticated;
REVOKE ALL ON public.winterarc_referral_contests FROM anon, authenticated;
