-- ==========================================================
-- Migration 004: Phone push notification tokens (mobile app, Phase 5)
-- One row per phone. A phone that signs in with another account takes the row over (token is unique).
-- Rows are removed when the user signs out in the app, deletes their account, or Firebase reports the
-- token as no longer valid.
-- ==========================================================

CREATE TABLE IF NOT EXISTS push_tokens (
    token TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'android',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_email ON push_tokens(email);

-- Only the backend (service key) reads or writes this table.
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
