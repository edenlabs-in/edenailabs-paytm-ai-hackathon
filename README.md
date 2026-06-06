# PAYTM — AI Merchant-KYC & Cross-Sell Platform

An AI-driven platform that helps PAYTM field/relationship teams **discover merchants pending KYC**,
**generate a per-merchant game plan**, **reach out across call / SMS / WhatsApp**, and **track every
merchant from discovery to RBI-compliant** — while cross-selling ecosystem products (BNPL, micro-finance,
credit lines, insurance, a 0%-EMI in-ecosystem marketplace) where **the discount is the CAC** handed back
to the merchant instead of spent on ads.

> Built for the Paytm AI Hackathon. The backend is a from-scratch **agentic Python service** that
> the frontend is a React/Vite SPA.

---

## ✨ What it does — the loop

| Step | Screen | What happens |
|---|---|---|
| 1. **Discover** | Discover Merchants | Enter a PIN code → find local merchants pending KYC, auto-scored & saved |
| 2. **Strategize** | AI Strategy | A **LangGraph agent** writes a grounded KYC + cross-sell plan per merchant |
| 3. **Reach out** | Outreach | Down-time-aware call/SMS/WhatsApp scripts + **CAC-funded incentives**; outcomes advance the pipeline; 3 failed attempts → dispatch a field agent |
| 4. **Track** | Pipeline | Kanban board: New → Contacted → Processing → KYC Done → RBI Compliant |

The Dashboard ties it together with clickable KYC stats and a live merchant list.

---

## 🏗️ Architecture

```
┌──────────────┐   HTTPS    ┌─────────────────────────────┐   service-role / user JWT
│  Frontend    │ ─────────► │   Backend API (FastAPI)     │ ─────────────────────────►  Supabase
│ React + Vite │  /webhook  │  • JWT auth (Supabase)      │        (Postgres + Auth +
│ (nginx in    │  /insights │  • LangGraph agents         │         pgvector + RLS)
│  Docker)     │            │  • ML scoring + next-best-act│
└──────┬───────┘            │  • RAG (pgvector + fastembed)│ ──► OpenRouter (LLM), Google Places,
       │                    │  • OpenRouter LLM gateway   │     Google CSE, MSG91, Gallabox
       │ Supabase JS SDK    └──────────────┬──────────────┘
       └──────(auth + realtime + reads)────┘     ▲
                                                 │ cron jobs
                                  ┌──────────────┴───────────────┐
                                  │  Worker (APScheduler)        │
                                  │  analytics · daily plan ·    │
                                  │  greetings · lead retrain ·  │
                                  │  Reddit pain-point mining    │
                                  └──────────────────────────────┘
```

- **Frontend talks to Supabase directly** for auth + data reads (realtime), and to the **backend** for
  all AI/actions on the same `/webhook/*` paths the old n8n used.
- **Backend acts as the calling user** for DB writes (anon key + the user's JWT → RLS-enforced), so it
  doesn't depend on a service key for user-scoped operations.

---

## 🧰 Tech stack

**Frontend:** React 18, Vite, TypeScript, Tailwind, shadcn/ui, React Router, TanStack Query, Supabase JS.
**Backend:** Python 3.11, FastAPI, Pydantic v2, httpx, **LangGraph**, OpenRouter (OpenAI-compatible),
**fastembed** (ONNX embeddings), scikit-learn, APScheduler, PyJWT.
**Data/Infra:** Supabase (Postgres + Auth + `pgvector` + RLS), Docker + nginx.
**LLM:** routed through OpenRouter — default `google/gemini-2.5-flash-lite` (override per task).

---

## 📁 Repository layout

```
.
├── frontend/                 # React/Vite SPA
│   ├── src/
│   │   ├── pages/            # Dashboard, Discover, AI Strategy, Outreach, Pipeline, Login…
│   │   ├── components/       # MerchantModal, dashboard layout, landing, ui/ (shadcn)
│   │   ├── hooks/            # useAuth, useLeads, useScripts
│   │   ├── lib/              # supabase client, n8n (backend webhook) helper
│   │   └── integrations/     # generated Supabase client + types
│   ├── supabase/migrations/  # 001_initial_schema.sql, 002_v2_schema_expansion.sql
│   ├── Dockerfile · nginx.conf
│   └── .env.example
│
├── backend/                  # Agentic FastAPI service
│   ├── app/
│   │   ├── core/             # config · auth (JWT) · llm (OpenRouter) · budget · errors
│   │   ├── integrations/     # supabase · places · geocode · cse · msg91 · gallabox
│   │   ├── services/         # discovery · outreach · messaging · calls · website · pipeline
│   │   ├── agents/           # strategy_researcher (LangGraph) · growth_advisor
│   │   ├── ml/               # lead_scoring · features · trainer · model_store · nba
│   │   ├── rag/              # embeddings · store (pgvector) · ingest · reddit_miner
│   │   ├── routers/          # one FastAPI router per endpoint (+ insights)
│   │   └── workers/          # scheduler (cron) · greetings
│   ├── migrations/           # 003_backend_core · 004_rag · 005_agents (run AFTER 001/002)
│   ├── tests/                # pytest: 34 unit/contract tests
│   ├── Dockerfile · docker-compose.yml (backend-only)
│   └── .env.example · CUTOVER.md · README.md
│
├── docker-compose.yml        # ← full stack: frontend + backend + worker
├── .env                      # secrets (gitignored) — see env reference below
└── graphify-out/             # knowledge-graph of the codebase (graph.html / .json / report)
```

---

## 🧠 The four intelligence modules

1. **Smart lead scoring** (`ml/`) — explainable heuristic that ranks merchants 0–100 (category prior,
   rating fit, reviews, area saturation, reachability). A LightGBM-style sklearn model trains on real
   outcomes when data exists, falling back to the heuristic until then.
2. **Agentic strategy researcher** (`agents/strategy_researcher.py`) — a **LangGraph** loop
   (`gather → synthesize → critique → refine`) using RAG + live Google CSE to write a grounded,
   schema-validated KYC + cross-sell plan; logs an evidence trace + token cost to `agent_runs`.
3. **RAG knowledge base** (`rag/`) — `pgvector` + local **fastembed** embeddings over an objection bank,
   case studies, and a Reddit pain-point miner. Used to ground outreach and strategy.
4. **Predictive next-best-action** (`ml/nba.py` + `agents/growth_advisor.py`) — best-time-to-contact,
   channel recommendation, and the analytics + daily-action-plan "growth advisor" run by the worker.

---

## 🔌 Backend API (all on the n8n paths, so the frontend is unchanged)

| Path | Purpose |
|---|---|
| `POST /webhook/discover-leads` | Find merchants pending KYC (Google Places + scoring; demo data if no Google key) |
| `POST /webhook/generate-strategy` | Agentic KYC + cross-sell strategy |
| `POST /webhook/generate-outreach` | RAG-grounded outreach script variants |
| `POST /webhook/send-sms` · `/send-whatsapp` | Real provider delivery status (MSG91 / Gallabox) |
| `POST /webhook/log-call` · `/update-pipeline` | Activity logging + KYC stage moves |
| `POST /webhook/generate-website` | Draft landing page (optional) |
| `GET  /insights/next-best-action` · `/daily-plan` · `/analytics` | Growth-advisor outputs |
| `POST /insights/retrain-leads` | Retrain the lead-scoring model |
| `GET  /health` · `GET /docs` | Health + Swagger UI |

---

## 🚀 Run it

### Option A — Docker (whole stack)
```bash
cp backend/.env.example .env      # fill in keys (see reference below)
# add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to the same .env for the frontend build
docker compose up --build
```
- Frontend → http://localhost:8080  ·  Backend → http://localhost:8000/docs
- nginx proxies the SPA's `/webhook` and `/insights` calls to the backend (no CORS to configure).

### Option B — Local dev
**Database (once):** in the Supabase SQL editor run, in order:
`frontend/supabase/migrations/001_…`, `002_…`, then `backend/migrations/003_…`, `004_…`, `005_…`.
Then seed the KB: `cd backend && .venv/Scripts/python -m app.rag.ingest`.

**Backend:**
```bash
cd backend
python -m venv .venv && .venv/Scripts/python -m pip install -r requirements.txt
cp .env.example .env   # or rely on the repo-root .env
.venv/Scripts/python -m uvicorn app.main:app --port 8000
```
**Frontend:**
```bash
cd frontend
npm install
# .env: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_N8N_WEBHOOK_URL=http://127.0.0.1:8000
npm run dev          # http://localhost:8080
```
> On Windows, use `127.0.0.1` (not `localhost`) if Docker holds IPv6 on a port.

---

## 🔑 Environment variables (repo-root `.env`)

| Key | Used by | Notes |
|---|---|---|
| `SUPABASE_URL` | backend + frontend | project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | backend | legacy `service_role` JWT recommended |
| `SUPABASE_JWT_SECRET` | backend | optional — backend can verify via Supabase `/auth/v1/user` instead |
| `OPENROUTER_API_KEY` / `OPENAI_API_KEY` | backend | OpenRouter key (either name works) |
| `OPENROUTER_BASE_URL` / `OPENAI_BASE_URL` | backend | `https://openrouter.ai/api/v1` |
| `MODEL_BULK` / `MODEL_AGENT` / `MODEL_ANALYTICS` | backend | default `google/gemini-2.5-flash-lite` |
| `GOOGLE_API_KEY` | backend | Places API (New) — for live Discover |
| `GOOGLE_CSE_ID` | backend | optional — strategy web search |
| `MSG91_*` / `GALLABOX_*` | backend | optional — real SMS / WhatsApp sending |
| `VITE_SUPABASE_URL` · `VITE_SUPABASE_PUBLISHABLE_KEY` | frontend | Supabase browser client |
| `VITE_N8N_WEBHOOK_URL` | frontend | backend base URL (empty in Docker → same-origin) |

`.env`, `frontend/.env`, `backend/.env` are **gitignored**; only `*.env.example` templates are committed.

---

## ✅ Testing

```bash
cd backend && .venv/Scripts/python -m pytest        # 34 unit + contract tests
.venv/Scripts/python tests/smoke.py                  # live smoke against a running server
```
Tests cover every endpoint, the agent loop, lead scoring, next-best-action, the workers, and the
security fixes (JWT-derived user id, honest provider delivery status, discovery dedup).

---

## 📝 Notes
- **Demo mode:** if `GOOGLE_API_KEY` is unset, Discover returns realistic sample merchants so the full
  flow is demoable with zero external keys.
- **Branding:** UI themed to PAYTM (light + sky-blue `#00BAF2` + navy `#002970`).
- A navigable knowledge graph of the codebase is in `graphify-out/graph.html`.
- Migration order and the n8n→Python cutover are documented in `backend/CUTOVER.md`.
