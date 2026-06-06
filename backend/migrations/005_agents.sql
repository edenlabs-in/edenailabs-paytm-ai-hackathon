-- Agent observability. RUN AFTER 004_rag.sql. Idempotent.
-- (strategies / ai_insights / daily_plans / crm_contacts / greeting_cards already exist from 002.)

CREATE TABLE IF NOT EXISTS agent_runs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent text NOT NULL,                 -- 'strategy_researcher' | 'growth_advisor' | ...
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  input jsonb DEFAULT '{}'::jsonb,
  steps jsonb DEFAULT '{}'::jsonb,     -- evidence gathered, iterations, tool calls
  output jsonb DEFAULT '{}'::jsonb,
  tokens integer,
  cost_usd numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own_agent_runs" ON agent_runs
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
