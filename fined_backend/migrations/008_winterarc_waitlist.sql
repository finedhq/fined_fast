-- ==========================================================
-- Migration 008: WinterArc waitlist (2026-11-04)
--
-- One row per email for the WinterArc 30-day challenge waitlist.
-- Source fields are FIRST TOUCH: set when the row is created and never
-- overwritten, so each person is counted once against one source.
-- referral_code is the person's own code; referred_by_code is the code
-- they arrived with (self-referrals are dropped by the backend).
-- Consent and the 18+ declaration are stored with the time and the
-- wording version they agreed to.
--
-- Additive only. Safe to re-run.
-- Run order: PRACTICE database first; live only when the owner says so,
-- and BEFORE the backend that uses it is deployed.
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.winterarc_waitlist (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email             text NOT NULL,
    name              text,
    college           text,
    heard_from        text,
    age_confirmed     boolean NOT NULL DEFAULT false,
    consent_version   text NOT NULL,
    consented_at      timestamptz NOT NULL DEFAULT now(),
    referral_code     text NOT NULL,
    referred_by_code  text,
    utm_source        text,
    utm_medium        text,
    utm_campaign      text,
    utm_content       text,
    utm_term          text,
    landing_path      text,
    first_referrer    text,
    first_seen_at     timestamptz,
    created_at        timestamptz NOT NULL DEFAULT now()
);

-- One row per person (case-insensitive email) and unique referral codes
CREATE UNIQUE INDEX IF NOT EXISTS winterarc_waitlist_email_key
    ON public.winterarc_waitlist (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS winterarc_waitlist_referral_code_key
    ON public.winterarc_waitlist (referral_code);
CREATE INDEX IF NOT EXISTS winterarc_waitlist_referred_by_idx
    ON public.winterarc_waitlist (referred_by_code);
CREATE INDEX IF NOT EXISTS winterarc_waitlist_created_at_idx
    ON public.winterarc_waitlist (created_at);

-- Only the backend (service role) reads or writes this table
ALTER TABLE public.winterarc_waitlist ENABLE ROW LEVEL SECURITY;
