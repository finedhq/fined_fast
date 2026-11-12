-- ==========================================================
-- Migration 010: WinterArc metrics (2026-11-11)
--
-- The numbers for funders and partners, defined ONCE here and read by the
-- admin metrics page (routes/winterarc_metrics.py). Nothing is stored: both
-- are views over the waitlist, the answers and the users table.
--
-- winterarc_people   one row per person on the waitlist:
--   has_account       a FinEd account exists with the same email
--   first_answer_at   their first try at any WinterArc question
--   activated         they have answered at least one question
--   returned_7d       activated, AND tried a question on a different IST
--                     calendar day within 7x24 hours of that first try
--   days_started      challenge days with at least one try
--   days_done         challenge days with every question finished
--   points            question points + other points (bonuses, referrals,
--                     grants, reversals)
-- winterarc_day_stats  one row per challenge day that has any tries:
--   started / done    people with a try / with every question finished
--
-- Only the backend (service role) may read these: they run with the
-- reader's permissions (security_invoker), the tables underneath have row
-- level security with no policies, and the web roles are refused outright.
--
-- Additive only. Safe to re-run. Needs 008 and 009.
-- Run order: PRACTICE database first; live only when the owner says so.
-- ==========================================================

CREATE OR REPLACE VIEW public.winterarc_people
WITH (security_invoker = true) AS
WITH q AS (
    -- questions per challenge module
    SELECT c.module_id, count(*) AS questions
    FROM public.cards c
    WHERE c.card_template = 'quiz'
    GROUP BY c.module_id
),
a AS (
    SELECT lower(email) AS email, day_no, module_id, finished, points, first_try_at,
           (first_try_at AT TIME ZONE 'Asia/Kolkata')::date AS ist_day
    FROM public.winterarc_answers
),
firsts AS (
    SELECT email, min(first_try_at) AS first_answer_at
    FROM a GROUP BY email
),
per_day AS (
    SELECT a.email, a.day_no, count(*) FILTER (WHERE a.finished) AS finished, max(q.questions) AS questions
    FROM a LEFT JOIN q ON q.module_id = a.module_id
    GROUP BY a.email, a.day_no
),
extra AS (
    SELECT lower(email) AS email, sum(points) AS points
    FROM public.winterarc_points GROUP BY lower(email)
)
SELECT
    w.id,
    lower(w.email)                         AS email,
    w.name,
    nullif(lower(trim(w.college)), '')     AS college,
    w.heard_from,
    w.referral_code,
    w.referred_by_code,
    lower(w.utm_source)                    AS utm_source,
    lower(w.utm_medium)                    AS utm_medium,
    lower(w.utm_campaign)                  AS utm_campaign,
    w.created_at                           AS signed_up_at,
    (w.created_at AT TIME ZONE 'Asia/Kolkata')::date AS signed_up_ist_day,
    EXISTS (SELECT 1 FROM public.users u WHERE lower(u.email) = lower(w.email)) AS has_account,
    f.first_answer_at,
    f.first_answer_at IS NOT NULL          AS activated,
    COALESCE(EXISTS (
        SELECT 1 FROM a a2
        WHERE a2.email = lower(w.email)
          AND a2.ist_day <> (f.first_answer_at AT TIME ZONE 'Asia/Kolkata')::date
          AND a2.first_try_at <= f.first_answer_at + interval '7 days'
    ), false)                              AS returned_7d,
    (SELECT count(*) FROM per_day d WHERE d.email = lower(w.email))  AS days_started,
    (SELECT count(*) FROM per_day d WHERE d.email = lower(w.email)
        AND d.questions IS NOT NULL AND d.finished >= d.questions)  AS days_done,
    COALESCE((SELECT sum(points) FROM a WHERE a.email = lower(w.email)), 0)
        + COALESCE((SELECT points FROM extra e WHERE e.email = lower(w.email)), 0) AS points
FROM public.winterarc_waitlist w
LEFT JOIN firsts f ON f.email = lower(w.email);

CREATE OR REPLACE VIEW public.winterarc_day_stats
WITH (security_invoker = true) AS
WITH q AS (
    SELECT c.module_id, count(*) AS questions
    FROM public.cards c
    WHERE c.card_template = 'quiz'
    GROUP BY c.module_id
),
per_person AS (
    SELECT lower(a.email) AS email, a.day_no, a.module_id,
           count(*) FILTER (WHERE a.finished) AS finished,
           sum(a.points) AS points
    FROM public.winterarc_answers a
    GROUP BY lower(a.email), a.day_no, a.module_id
)
SELECT
    p.day_no,
    count(*)                                                  AS started,
    count(*) FILTER (WHERE p.finished >= q.questions)         AS done,
    round(avg(p.points)::numeric, 1)                          AS avg_points
FROM per_person p
LEFT JOIN q ON q.module_id = p.module_id
GROUP BY p.day_no;

REVOKE ALL ON public.winterarc_people FROM anon, authenticated;
REVOKE ALL ON public.winterarc_day_stats FROM anon, authenticated;
