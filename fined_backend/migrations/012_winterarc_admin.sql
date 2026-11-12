-- ==========================================================
-- Migration 012: WinterArc referral checks and admin tools (2026-11-11)
--
-- 1. winterarc_waitlist.email_canonical: the inbox an email really reaches,
--    so variants count as one person. Lower case, anything after "+" dropped,
--    and for Gmail the dots dropped too ("a.b+x@gmail.com" -> "ab@gmail.com").
--    Same rule as canonical_email() in routes/winterarc.py.
-- 2. winterarc_waitlist.disqualified_at / disqualified_reason: set by an
--    admin. A disqualified person is left off every leaderboard and the
--    referral contest. Their points rows stay (nothing is ever deleted).
-- 3. winterarc_points gets one more kind, 'referral_rejected' (0 points),
--    recording an admin's "no" on a referral. 'referral' rows (+10 to the
--    referrer) record a "yes".
-- 4. The leaderboard and contest views are re-created without disqualified
--    people.
--
-- Additive only. Safe to re-run. Needs 008-011.
-- Run order: PRACTICE database first; live only when the owner says so,
-- and BEFORE the backend that uses it is deployed.
-- ==========================================================

ALTER TABLE public.winterarc_waitlist ADD COLUMN IF NOT EXISTS email_canonical text;
ALTER TABLE public.winterarc_waitlist ADD COLUMN IF NOT EXISTS disqualified_at timestamptz;
ALTER TABLE public.winterarc_waitlist ADD COLUMN IF NOT EXISTS disqualified_reason text;

UPDATE public.winterarc_waitlist
SET email_canonical = CASE
        WHEN split_part(lower(email), '@', 2) IN ('gmail.com', 'googlemail.com')
            THEN replace(split_part(split_part(lower(email), '@', 1), '+', 1), '.', '') || '@gmail.com'
        ELSE split_part(split_part(lower(email), '@', 1), '+', 1) || '@' || split_part(lower(email), '@', 2)
    END
WHERE email_canonical IS NULL;

CREATE INDEX IF NOT EXISTS winterarc_waitlist_canonical_idx ON public.winterarc_waitlist (email_canonical);

ALTER TABLE public.winterarc_points DROP CONSTRAINT IF EXISTS winterarc_points_kind_check;
ALTER TABLE public.winterarc_points ADD CONSTRAINT winterarc_points_kind_check
    CHECK (kind IN ('streak_bonus', 'referral', 'referral_rejected', 'admin_grant', 'reversal', 'reset_used', 'reset_earned'));

-- ---------- Leaderboards without disqualified people ----------

CREATE OR REPLACE VIEW public.winterarc_board_week
WITH (security_invoker = true) AS
WITH members AS (
    SELECT DISTINCT ON (lower(email)) lower(email) AS email, name
    FROM public.winterarc_waitlist
    WHERE disqualified_at IS NULL
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

CREATE OR REPLACE VIEW public.winterarc_referral_contest
WITH (security_invoker = true) AS
WITH cutoff AS (SELECT timestamptz '2026-11-30 23:59:59.999+05:30' AS at),
friends AS (
    SELECT w.referred_by_code AS code, greatest(w.created_at, u.created_at) AS qualified_at
    FROM public.winterarc_waitlist w
    JOIN public.users u ON lower(u.email) = lower(w.email)
    CROSS JOIN cutoff
    WHERE w.referred_by_code IS NOT NULL
      AND w.disqualified_at IS NULL
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
JOIN public.winterarc_waitlist r ON r.referral_code = p.code AND r.disqualified_at IS NULL;

REVOKE ALL ON public.winterarc_board_week FROM anon, authenticated;
REVOKE ALL ON public.winterarc_referral_contest FROM anon, authenticated;
