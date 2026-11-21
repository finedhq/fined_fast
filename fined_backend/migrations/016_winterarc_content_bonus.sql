-- ==========================================================
-- 016: WinterArc content bonus (2026-11-21)
-- Reading an article or finishing a course module during 1-30 Dec earns +3,
-- once per challenge day: kind 'content_bonus', ref 'content:<day>' (the
-- existing winterarc_points_once_key index keeps it to one a day).
-- The bonus counts on the daily board too (owner 2026-11-21): a day's board
-- score is that day's on-time answers plus that day's bonus. Only people who
-- did the day's task are on its board; the bonus alone does not put you there.
-- The weekly and overall boards already add up every winterarc_points row.
-- Additive only. Safe to re-run. Needs 008-015.
-- Run on practice, then live, BEFORE the backend that uses it is deployed.
-- ==========================================================

ALTER TABLE public.winterarc_points DROP CONSTRAINT IF EXISTS winterarc_points_kind_check;
ALTER TABLE public.winterarc_points ADD CONSTRAINT winterarc_points_kind_check
    CHECK (kind IN ('streak_bonus', 'referral', 'referral_rejected', 'admin_grant', 'reversal',
                    'reset_used', 'reset_earned', 'action_done', 'content_bonus'));

-- Same columns as in 014, so CREATE OR REPLACE works.
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
),
bonus AS (
    SELECT lower(email) AS email, day_no, sum(points) AS points
    FROM public.winterarc_points
    WHERE kind = 'content_bonus' AND day_no IS NOT NULL
    GROUP BY lower(email), day_no
)
SELECT
    p.day_no,
    p.email,
    coalesce(nullif(trim(split_part(trim(m.name), ' ', 1) || ' ' ||
        CASE WHEN split_part(trim(m.name), ' ', 2) <> '' THEN left(split_part(trim(m.name), ' ', 2), 1) || '.' ELSE '' END), ''),
        'WinterArc player') AS display_name,
    p.points + coalesce(b.points, 0) AS points,
    p.questions,
    p.reached_at,
    rank() OVER (PARTITION BY p.day_no ORDER BY p.points + coalesce(b.points, 0) DESC, p.reached_at ASC) AS rank
FROM per p
JOIN members m ON m.email = p.email
LEFT JOIN bonus b ON b.email = p.email AND b.day_no = p.day_no;

REVOKE ALL ON public.winterarc_board_day FROM anon, authenticated;
