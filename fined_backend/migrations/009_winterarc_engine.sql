-- ==========================================================
-- Migration 009: WinterArc daily engine (2026-11-11)
--
-- Two tables. The day schedule needs none: day n is the module with
-- order_index n in the WinterArc course, and it opens at midnight IST on
-- n Dec once an admin has published it. Settings live in the backend
-- (app/services/winterarc_rules.py).
--
--   winterarc_answers  one row per person per question: tries so far, the
--                      last answer, whether it was right, and the points it
--                      earned once finished. Question points live here.
--   winterarc_points   every other point (streak bonuses, referrals, admin
--                      grants and reversals). Rows are never deleted: a
--                      disqualification adds a reversing row.
--
-- A score = sum(winterarc_answers.points) + sum(winterarc_points.points),
-- per week_no for the weekly boards.
--
-- Additive only. Safe to re-run.
-- Run order: PRACTICE database first; live only when the owner says so,
-- and BEFORE the backend that uses it is deployed.
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.winterarc_answers (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email        text NOT NULL,
    card_id      uuid NOT NULL,
    module_id    uuid NOT NULL,
    day_no       smallint NOT NULL CHECK (day_no BETWEEN 1 AND 30),
    week_no      smallint NOT NULL CHECK (week_no BETWEEN 1 AND 5),
    tries        smallint NOT NULL DEFAULT 0,
    last_answer  text,
    is_correct   boolean NOT NULL DEFAULT false,
    finished     boolean NOT NULL DEFAULT false,
    points       integer NOT NULL DEFAULT 0,
    first_try_at timestamptz NOT NULL DEFAULT now(),
    finished_at  timestamptz,
    updated_at   timestamptz NOT NULL DEFAULT now()
);

-- One row per person per question (case-insensitive email)
CREATE UNIQUE INDEX IF NOT EXISTS winterarc_answers_person_card_key
    ON public.winterarc_answers (lower(email), card_id);
CREATE INDEX IF NOT EXISTS winterarc_answers_email_idx
    ON public.winterarc_answers (lower(email));
CREATE INDEX IF NOT EXISTS winterarc_answers_week_idx
    ON public.winterarc_answers (week_no, finished);

CREATE TABLE IF NOT EXISTS public.winterarc_points (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email       text NOT NULL,
    kind        text NOT NULL CHECK (kind IN ('streak_bonus', 'referral', 'admin_grant', 'reversal')),
    points      integer NOT NULL,
    week_no     smallint NOT NULL CHECK (week_no BETWEEN 1 AND 5),
    day_no      smallint CHECK (day_no BETWEEN 1 AND 30),
    reason      text,
    created_by  text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS winterarc_points_email_idx
    ON public.winterarc_points (lower(email));
CREATE INDEX IF NOT EXISTS winterarc_points_week_idx
    ON public.winterarc_points (week_no);

-- Only the backend (service role) reads or writes these tables
ALTER TABLE public.winterarc_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winterarc_points ENABLE ROW LEVEL SECURITY;
