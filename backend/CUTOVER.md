# Cutover: n8n → Python backend

The Python backend serves the **exact same `/webhook/*` paths** as the old n8n workflows, so going
live is mostly configuration. Do it in this order.

## 1. Provision the database
Run migrations **in this exact order** in the Supabase **SQL Editor**. The first two are the
frontend's existing schema (they create the base tables); the backend ones only add to them.
```
supabase/migrations/001_initial_schema.sql        # profiles, leads, outreach, websites, activities, templates
supabase/migrations/002_v2_schema_expansion.sql   # strategies, scripts, call_logs, crm_contacts, greetings, ai_insights, daily_plans, ...
backend/migrations/003_backend_core.sql           # leads.score/score_factors, dedup index, outreach delivery columns
backend/migrations/004_rag.sql                     # pgvector + kb_documents + match RPC
backend/migrations/005_agents.sql                  # agent_runs
```
> The backend migrations are additive and idempotent — they assume 001 + 002 already ran.

## 2. Configure secrets
```powershell
Copy-Item .env.example .env   # fill in Supabase, OpenRouter, Google, MSG91/Gallabox keys
```
The minimum to run everything: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`,
`OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GOOGLE_CSE_ID`.

## 3. Seed the knowledge base
```powershell
.venv\Scripts\python.exe -m app.rag.ingest    # objection bank + case studies into kb_documents
```

## 4. Run it
```powershell
# API
.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000
# Background jobs (separate process / container)
.venv\Scripts\python.exe -m app.workers.scheduler
```
Or both at once: `docker compose up --build`.

## 5. Verify
```powershell
.venv\Scripts\python.exe -m pytest          # 34 unit/contract tests
.venv\Scripts\python.exe tests\smoke.py      # live, against a running server (AUTH_DISABLED=true)
```

## 6. Point the frontend here (the actual switch)
In the React app (`serious-prenuer`), change one env var:
```
VITE_N8N_WEBHOOK_URL = http://<your-backend-host>:8000
```
`src/lib/n8n.ts` needs **no code change** — it already builds `${base}/webhook/<path>`. For local
testing use `http://127.0.0.1:8000` (note: `127.0.0.1`, not `localhost`, if Docker holds port 8000).

Recommended adjacent frontend cleanups (from the code review):
- Consolidate the two Supabase clients (`@/lib/supabase` vs `@/integrations/supabase/client`).
- Remove the `console.log(body)` token leak in `n8n.ts`.

## 7. Retire n8n
Once the app works end-to-end against the Python backend, **deactivate** the 8 workflows in n8n Cloud
(don't delete immediately — keep them inactive as a rollback path for a week, then remove).

## Endpoint parity
| n8n workflow | Python endpoint |
|---|---|
| WF-01..WF-08 | `/webhook/{discover-leads, generate-outreach, generate-website, update-pipeline, generate-strategy, send-sms, send-whatsapp, log-call}` |
| WF-10 / WF-11 (cron) | scheduler jobs + `GET /insights/analytics`, `GET /insights/daily-plan` |
| — (new) | `GET /insights/next-best-action`, `POST /insights/retrain-leads` |
