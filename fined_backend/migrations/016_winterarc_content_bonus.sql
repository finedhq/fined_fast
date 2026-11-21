-- ==========================================================
-- 016: WinterArc content bonus (2026-11-21)
-- Reading an article or finishing a course module during 1-30 Dec earns +3,
-- once per challenge day: kind 'content_bonus', ref 'content:<day>' (the
-- existing winterarc_points_once_key index keeps it to one a day).
-- Run on practice, then live, BEFORE the backend that uses it is deployed.
-- ==========================================================

ALTER TABLE public.winterarc_points DROP CONSTRAINT IF EXISTS winterarc_points_kind_check;
ALTER TABLE public.winterarc_points ADD CONSTRAINT winterarc_points_kind_check
    CHECK (kind IN ('streak_bonus', 'referral', 'referral_rejected', 'admin_grant', 'reversal',
                    'reset_used', 'reset_earned', 'action_done', 'content_bonus'));
