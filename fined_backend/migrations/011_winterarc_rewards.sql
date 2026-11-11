-- ==========================================================
-- Migration 011: WinterArc rewards and the referral contest (2026-11-11)
--
-- 1. winterarc_answers.on_time: the question was finished inside the
--    36-hour full-points window (a leaderboard tie-break).
-- 2. winterarc_points gets a `ref`, so each award happens once per person
--    (e.g. "streak:9:7" = the 7-day bonus of the streak that began on Day 9),
--    and two kinds with 0 points that track resets:
--      reset_used    a reset spent on a missed day (day_no = that day)
--      reset_earned  an extra reset for finishing every task in a week
-- 3. users.created_at: when a FinEd account was made. Existing accounts get
--    the time this migration runs (they all exist before the contest closes).
-- 4. Leaderboard views (members of the waitlist only; ranked by points,
--    then days finished on time, then whoever reached their score first;
--    a full tie shares the rank):
--      winterarc_board_week    one row per person per week
--      winterarc_board_final   one row per person, all weeks
-- 5. winterarc_referral_contest: the pre-launch top-referrer contest. A
--    referral counts when the friend joined the waitlist with the link AND
--    has a FinEd account with the same email, both by 30 Nov 2026 23:59 IST.
--    Every winner is still checked by hand before payment.
--
-- Additive only. Safe to re-run. Needs 008, 009 and 010.
-- Run order: PRACTICE database first; live only when the owner says so,
-- and BEFORE the backend that uses it is deployed.
-- ==========================================================

ALTER TABLE public.winterarc_answers ADD COLUMN IF NOT EXISTS on_time boolean NOT NULL DEFAULT false;

ALTER TABLE public.winterarc_points ADD COLUMN IF NOT EXISTS ref text;
ALTER TABLE public.winterarc_points DROP CONSTRAINT IF EXISTS winterarc_points_kind_check;
ALTER TABLE public.winterarc_points ADD CONSTRAINT winterarc_points_kind_check
    CHECK (kind IN ('streak_bonus', 'referral', 'admin_grant', 'reversal', 'reset_used', 'reset_earned'));
CREATE UNIQUE INDEX IF NOT EXISTS winterarc_points_once_key
    ON public.winterarc_points (lower(email), kind, ref) WHERE ref IS NOT NULL;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- ---------- Leaderboards ----------

CREATE OR REPLACE VIEW public.winterarc_board_week
WITH (security_invoker = true) AS
WITH members AS (
    SELECT DISTINCT ON (lower(email)) lower(email) AS email, name
    FROM public.winterarc_waitlist
    ORDER BY lower(email), created_at
),
entries AS (
    SELECT lower(email) AS email, week_no, points, finished_at AS at
    FROM public.winterarc_answers WHERE finished AND points <> 0
    UNION ALL
    SELECT lower(email), week_no, points, created_at
    FROM public.winterarc_points WHERE points <> 0
),
q AS (
    SELECT module_id, count(*) AS questions FROM public.cards WHERE card_template = 'quiz' GROUP BY module_id
),
days AS (
    -- a day finished on time: every question finished inside the full window
    SELECT lower(a.email) AS email, min(a.week_no) AS week_no
    FROM public.winterarc_answers a JOIN q ON q.module_id = a.module_id
    GROUP BY lower(a.email), a.day_no, q.questions
    HAVING count(*) FILTER (WHERE a.on_time) = q.questions
),
on_time AS (
    SELECT email, week_no, count(*) AS days FROM days GROUP BY email, week_no
),
totals AS (
    SELECT e.email, e.week_no, sum(e.points) AS points, max(e.at) AS reached_at
    FROM entries e GROUP BY e.email, e.week_no
)
SELECT
    t.week_no,
    t.email,
    coalesce(nullif(trim(split_part(trim(m.name), ' ', 1) || ' ' ||
        CASE WHEN split_part(trim(m.name), ' ', 2) <> '' THEN left(split_part(trim(m.name), ' ', 2), 1) || '.' ELSE '' END), ''),
        'WinterArc player') AS display_name,
    t.points,
    coalesce(o.days, 0) AS on_time_days,
    t.reached_at,
    rank() OVER (PARTITION BY t.week_no ORDER BY t.points DESC, coalesce(o.days, 0) DESC, t.reached_at ASC) AS rank
FROM totals t
JOIN members m ON m.email = t.email
LEFT JOIN on_time o ON o.email = t.email AND o.week_no = t.week_no;

CREATE OR REPLACE VIEW public.winterarc_board_final
WITH (security_invoker = true) AS
WITH per AS (
    SELECT email, display_name, sum(points) AS points, sum(on_time_days) AS on_time_days, max(reached_at) AS reached_at
    FROM public.winterarc_board_week
    GROUP BY email, display_name
)
SELECT
    email, display_name, points, on_time_days, reached_at,
    rank() OVER (ORDER BY points DESC, on_time_days DESC, reached_at ASC) AS rank
FROM per;

-- ---------- Pre-launch referral contest ----------

CREATE OR REPLACE VIEW public.winterarc_referral_contest
WITH (security_invoker = true) AS
WITH cutoff AS (SELECT timestamptz '2026-11-30 23:59:59.999+05:30' AS at),
friends AS (
    SELECT w.referred_by_code AS code, w.created_at AS joined_at, u.created_at AS account_at,
           greatest(w.created_at, u.created_at) AS qualified_at
    FROM public.winterarc_waitlist w
    JOIN public.users u ON lower(u.email) = lower(w.email)
    CROSS JOIN cutoff
    WHERE w.referred_by_code IS NOT NULL
      AND w.created_at <= cutoff.at
      AND u.created_at IS NOT NULL AND u.created_at <= cutoff.at
),
per AS (
    SELECT code, count(*) AS referrals, max(qualified_at) AS reached_at
    FROM friends GROUP BY code
)
SELECT
    p.code,
    r.name AS referrer_name,
    p.referrals,
    p.reached_at,
    rank() OVER (ORDER BY p.referrals DESC, p.reached_at ASC) AS rank
FROM per p
LEFT JOIN public.winterarc_waitlist r ON r.referral_code = p.code;

REVOKE ALL ON public.winterarc_board_week FROM anon, authenticated;
REVOKE ALL ON public.winterarc_board_final FROM anon, authenticated;
REVOKE ALL ON public.winterarc_referral_contest FROM anon, authenticated;
