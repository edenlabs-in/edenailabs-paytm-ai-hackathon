# Seriouspreneur — Python Backend

Agentic FastAPI backend that replaces the n8n workflows. It serves the **same `/webhook/*` paths**
the React frontend already calls, so cutover is a single env change (`VITE_N8N_WEBHOOK_URL`).

See the full design in `../.claude/plans/soft-wiggling-sunset.md` (or ask Claude to summarize).

## Quick start (local)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
Copy-Item .env.example .env      # then fill in keys
.venv\Scripts\python -m uvicorn app.main:app --reload
```

- Docs/UI:   http://localhost:8000/docs
- Health:    http://localhost:8000/health

### Docker
```powershell
docker compose up --build
```

## Tests
```powershell
.venv\Scripts\python -m pytest          # unit + contract tests (no network)
.venv\Scripts\python tests\smoke.py      # live smoke against a running server
```

## Auth
Every endpoint verifies a **Supabase JWT** (`Authorization: Bearer <token>`) and derives the user
id from the token — request-body `user_id` is ignored. For local smoke tests without a real token,
set `AUTH_DISABLED=true` and pass `X-Debug-User: <uuid>`.

## Endpoint status (n8n → Python)
| Path | WF | Status |
|---|---|---|
| `/webhook/update-pipeline` | WF-04 | ✅ done |
| `/webhook/discover-leads` | WF-01 | ✅ done (+ dedup, lead scoring) |
| `/webhook/generate-outreach` | WF-02 | ✅ done (RAG enrich in Phase 3) |
| `/webhook/send-sms` | WF-06 | ✅ done (real delivery status) |
| `/webhook/send-whatsapp` | WF-07 | ✅ done (real delivery status) |
| `/webhook/log-call` | WF-08 | ✅ done |
| `/webhook/generate-website` | WF-03 | ✅ done (draft; deploy later) |
| `/webhook/generate-strategy` | WF-05 | ✅ done (LangGraph agent + RAG) |

**All 8 n8n workflows are now ported.** The strategy endpoint is a LangGraph agent
(`gather → synthesize → critique → refine`) that grounds its plan in the RAG knowledge base + live
Google CSE competitor research, and logs an evidence trace + $ cost to `agent_runs`.

### New intelligence endpoints (beyond n8n)
| Path | What |
|---|---|
| `GET /insights/next-best-action` | best time to call, channel to use, leads to focus on |
| `GET /insights/daily-plan` | WF-11 daily action plan (growth-advisor agent) |
| `GET /insights/analytics` | WF-10 analytics insights |
| `POST /insights/retrain-leads` | retrain the lead-scoring model on real outcomes |

### Background worker (replaces n8n cron)
`python -m app.workers.scheduler` runs: nightly lead-model retrain, 7:30 AM daily-plan + analytics +
greeting scheduling per user, and a weekly Reddit pain-point mine. Runs as its own container in
`docker compose`.

### Going live
See **CUTOVER.md**. Run the frontend's `001`+`002` migrations first, then the backend's additive
`003`→`005`, set `.env`, seed the KB (`python -m app.rag.ingest`), then point the frontend's
`VITE_N8N_WEBHOOK_URL` at this service. **34 tests** cover every endpoint, the agent loop, scoring,
NBA, and the workers. (Backend services are written to fit the existing 001/002 schema — its
constraints, enums, and the cards+schedule greeting model.)

## Layout
`app/core` config/auth/llm/budget/errors · `app/integrations` external clients ·
`app/services` business logic · `app/agents` LangGraph · `app/ml` scoring/NBA · `app/rag` vectors ·
`app/routers` FastAPI endpoints · `app/workers` schedulers · `migrations` SQL · `tests` pytest.
