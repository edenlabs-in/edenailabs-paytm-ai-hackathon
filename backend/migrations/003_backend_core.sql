-- Backend additions — RUN AFTER 001_initial_schema.sql and 002_v2_schema_expansion.sql.
-- Only adds what those don't already provide. Idempotent.

-- leads: explainable scoring (google_place_id & pin_code already exist from 001/002).
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score numeric;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score_factors jsonb DEFAULT '{}'::jsonb;

-- Idempotent dedup per user: re-running a PIN won't create duplicate leads.
CREATE UNIQUE INDEX IF NOT EXISTS leads_user_place_uniq
  ON leads (user_id, google_place_id)
  WHERE google_place_id IS NOT NULL AND google_place_id <> '';

-- outreach: honest delivery tracking (no more false "sent").
-- NOTE: response_status keeps its existing enum; delivery_status is free-text from the provider.
ALTER TABLE outreach ADD COLUMN IF NOT EXISTS delivery_status text;
ALTER TABLE outreach ADD COLUMN IF NOT EXISTS provider_message_id text;
ALTER TABLE outreach ADD COLUMN IF NOT EXISTS error text;
