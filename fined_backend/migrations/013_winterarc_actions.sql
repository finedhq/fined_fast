-- ==========================================================
-- Migration 013: WinterArc daily action tick-box (2026-11-12)
--
-- Each day can have one optional real-life action (written on the day's
-- completion card, field `winterarc_action`). A member ticks "I did this":
-- that is one 'action_done' row in winterarc_points (0 points, ref
-- "action:<day>", so once per person per day). Unticking deletes it (it
-- carries no points).
--
-- winterarc_day_stats gets an `actions_done` column: people who ticked the
-- day's action.
--
-- Additive only. Safe to re-run. Needs 008-012.
-- Run order: PRACTICE database first; live only when the owner says so,
-- and BEFORE the backend that uses it is deployed.
-- ==========================================================

ALTER TABLE public.winterarc_points DROP CONSTRAINT IF EXISTS winterarc_points_kind_check;
ALTER TABLE public.winterarc_points ADD CONSTRAINT winterarc_points_kind_check
    CHECK (kind IN ('streak_bonus', 'referral', 'referral_rejected', 'admin_grant', 'reversal',
                    'reset_used', 'reset_earned', 'action_done'));

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
),
actions AS (
    SELECT day_no, count(DISTINCT lower(email)) AS actions_done
    FROM public.winterarc_points
    WHERE kind = 'action_done'
    GROUP BY day_no
),
stats AS (
    SELECT
        p.day_no,
        count(*)                                                  AS started,
        count(*) FILTER (WHERE p.finished >= q.questions)         AS done,
        round(avg(p.points)::numeric, 1)                          AS avg_points
    FROM per_person p
    LEFT JOIN q ON q.module_id = p.module_id
    GROUP BY p.day_no
)
SELECT
    coalesce(s.day_no, x.day_no)   AS day_no,
    coalesce(s.started, 0)         AS started,
    coalesce(s.done, 0)            AS done,
    s.avg_points,
    coalesce(x.actions_done, 0)    AS actions_done
FROM stats s
FULL JOIN actions x ON x.day_no = s.day_no;

REVOKE ALL ON public.winterarc_day_stats FROM anon, authenticated;
