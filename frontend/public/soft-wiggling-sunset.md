# Plan: Replace n8n with an Agentic Python Backend for Seriouspreneur

## Context

Today, all 8 backend workflows live in **n8n** (`sach4much.app.n8n.cloud`) as linear
`Webhook → fetch → JS transform → AI/provider call → save → respond` pipelines. The React
frontend hits them through thin wrappers in `src/lib/n8n.ts`. This works but has hard limits:

- **No real intelligence** — strategy/outreach are single one-shot Gemini calls; there are no
  multi-step agents, no memory, no retrieval, no learning from outcomes.
- **Correctness bugs** (found in review): the app reports `sent`/`generated` success on any
  non-throwing webhook even when the downstream provider failed; n8n trusts a client-supplied
  `user_id` in the request body (auth bypass risk); two Supabase clients cause session races.
- **Hard to test/version** — JS-in-JSON nodes can't be unit-tested or code-reviewed.

**Goal:** stand up a single, fully-typed **Python (FastAPI) backend** that (1) replaces all 8 n8n
endpoints 1:1 on the same webhook paths, (2) fixes the correctness/security bugs in the port, and
(3) adds four "smart" capabilities — ML lead scoring, an agentic strategy researcher, a RAG +
pain-point knowledge base, and predictive next-best-action — orchestrated with **LangGraph** and
powered through **OpenRouter** (model routing tuned to the $20 budget). **Full cutover**: once
verified, n8n is retired and the frontend points at the Python service.

### Decisions locked with the user
| Decision | Choice |
|---|---|
| LLM provider | **OpenRouter** (one OpenAI-compatible gateway; route models per task to stretch $20) |
| Agent orchestration | **LangGraph** + Pydantic structured outputs |
| Data layer | **Keep Supabase** for app/auth/realtime; **add pgvector** in Supabase for RAG/memory |
| Embeddings | **Local `sentence-transformers` (MiniLM, 384-dim)** → $0, stored in Supabase pgvector |
| Cutover | **Full replacement** — serve the same `/webhook/*` paths, retire n8n |
| Intelligence | All four: lead scoring · agentic strategy · RAG + pain-points · predictive NBA |

### Open decision (needs a one-word answer at kickoff, default chosen)
- **Where the backend lives:** default = a new **`backend/`** folder co-located inside the existing
  project repo (`Downloads/serious-prenuer-main`) so frontend + backend ship together. (Alternative:
  this hackathon git repo. Easily changed — it's just the project root.)

---

## Target architecture

```
React (unchanged)  ──HTTP /webhook/*──►  FastAPI (Python)  ──►  Supabase (Postgres + pgvector + Auth)
   src/lib/n8n.ts                          │  ├─ JWT verify (Supabase secret) — ignores body user_id
   (only base URL                          │  ├─ LangGraph agents ──► OpenRouter (model router)
    env changes)                           │  ├─ ML scoring (scikit-learn/LightGBM)
                                           │  ├─ RAG (MiniLM embeddings + pgvector)
                                           │  └─ external: Google Places/Nominatim/CSE, MSG91, Gallabox
                                APScheduler worker ──► WF-10 analytics, WF-11 daily plan, greetings
```

### Backend folder layout (`backend/`)
```
backend/
├── app/
│   ├── main.py                 # FastAPI app, mounts routers on /webhook/*  (paths identical to n8n)
│   ├── core/
│   │   ├── config.py           # pydantic-settings: keys, model map, budget cap
│   │   ├── auth.py             # get_current_user() — verifies Supabase JWT, returns user_id  (FIXES auth bypass)
│   │   ├── llm.py              # OpenRouter client + task→model router + structured-output helper
│   │   ├── budget.py           # per-call cost logging + soft cap to protect $20
│   │   └── errors.py           # uniform error envelope; never report false success
│   ├── schemas/                # Pydantic request/response models — one per endpoint, mirrors n8n.ts payloads
│   ├── integrations/
│   │   ├── supabase.py         # service-role REST/`supabase-py` client (single source of truth)
│   │   ├── places.py           # Google Places (New) searchNearby
│   │   ├── geocode.py          # Nominatim (free, already used by WF-01)
│   │   ├── cse.py              # Google Custom Search (competitor lookup)
│   │   ├── msg91.py            # SMS + delivery status
│   │   └── gallabox.py         # WhatsApp + template/image send + status
│   ├── services/               # business logic per feature (testable, no framework glue)
│   │   ├── discovery.py        # WF-01  (+ dedup + lead scoring hook)
│   │   ├── outreach.py         # WF-02  (+ RAG personalization)
│   │   ├── website.py          # WF-03
│   │   ├── pipeline.py         # WF-04
│   │   ├── messaging.py        # WF-06/07  (real delivery status — FIXES "lies about delivery")
│   │   └── calls.py            # WF-08
│   ├── agents/                 # LangGraph graphs
│   │   ├── strategy_researcher.py   # WF-05 upgrade (multi-tool, grounded)
│   │   └── growth_advisor.py        # WF-10 analytics + WF-11 daily plan
│   ├── ml/
│   │   ├── lead_scoring.py      # heuristic cold-start → LightGBM trained on outcomes
│   │   └── nba.py              # best-time-to-contact + channel recommender
│   ├── rag/
│   │   ├── embeddings.py        # MiniLM (sentence-transformers), 384-dim
│   │   ├── store.py            # pgvector upsert/similarity search
│   │   └── ingest.py           # case studies, objection bank, Reddit pain-point miner
│   ├── routers/                # FastAPI routers: one file, 8 endpoints, identical paths
│   └── workers/scheduler.py     # APScheduler: analytics, daily plan, greeting cards
├── migrations/                 # SQL: pgvector, new columns/tables
├── tests/                      # pytest: unit (mocked) + contract (response-shape) + smoke
├── pyproject.toml / requirements.txt
├── Dockerfile + docker-compose.yml
└── .env.example
```

---

## Endpoint port map (all keep their exact paths so the frontend is untouched)

| Path | n8n WF | Python module | Port notes & upgrades |
|---|---|---|---|
| `/webhook/discover-leads` | WF-01 | `services/discovery.py` | Nominatim geocode → Places searchNearby → filter `!websiteUri` → **dedup on `google_place_id`** → **`lead_scoring`** sets `score`/`priority` → upsert. Returns `{success, leads_count, message}` (unchanged shape). |
| `/webhook/generate-outreach` | WF-02 | `services/outreach.py` | 3 variants, but **RAG-personalized** (retrieve objection handlers + pain points for the category). Returns `{success, scripts:[…]}`. |
| `/webhook/generate-website` | WF-03 | `services/website.py` | Template + LLM SEO copy; deploy hook stubbed (Vercel) behind a flag. |
| `/webhook/update-pipeline` | WF-04 | `services/pipeline.py` | PATCH lead status + insert `activities`. Emits an outcome event for ML training. |
| `/webhook/generate-strategy` | WF-05 | `agents/strategy_researcher.py` | **Biggest upgrade** → LangGraph agent (below). Same Supabase `strategies` write + `{success}` shape. |
| `/webhook/send-sms` | WF-06 | `services/messaging.py` | MSG91 send → store **real `provider_message_id` + `delivery_status`**; only report success on provider 2xx. |
| `/webhook/send-whatsapp` | WF-07 | `services/messaging.py` | Gallabox template send (+ AI image flag) → real status. |
| `/webhook/log-call` | WF-08 | `services/calls.py` | Insert `call_logs`; feeds NBA best-time model. |

**Frontend change = 1 line:** point `VITE_N8N_WEBHOOK_URL` at the Python host. `src/lib/n8n.ts`
needs no edits. (Adjacent recommended cleanup, optional: consolidate the two Supabase clients and
drop the prod `console.log(body)` token leak — both flagged in review.)

---

## The four intelligence modules

**1. Smart lead scoring (`ml/lead_scoring.py`)**
- **Cold start (ship day 1):** transparent weighted heuristic — Google rating, category conversion
  prior, area saturation (count of no-website peers in the PIN), data completeness, recency.
- **Learned (when data exists):** LightGBM/GradientBoosting trained on `leads.status` transitions
  (`new→contacted→interested→client`) joined with `activities`. Nightly retrain in the worker.
- Writes `leads.score` (0-100) + `leads.score_factors` (jsonb, explainable) and reorders priority.

**2. Agentic strategy researcher (`agents/strategy_researcher.py`)** — replaces WF-05's single call
- **LangGraph** state machine with tools: `web_search` (CSE), `find_competitors`, `local_market_signals`
  (rating distribution from Places in the area), `kb_lookup` (RAG). Loop: plan → gather evidence →
  synthesize → self-check → emit **Pydantic-validated `Strategy`** (same JSON contract the UI expects,
  but grounded in real competitor/market evidence instead of hallucinated).
- Persists the full reasoning trace to `agent_runs` for observability + cost.

**3. RAG + pain-point mining (`rag/`)**
- `kb_documents(id, kind, content, embedding vector(384), metadata jsonb)` in Supabase (pgvector).
- Seed corpus: case studies + a curated **objection-handling bank**; ingestion pipeline embeds with
  local MiniLM ($0).
- **Reddit pain-point miner** (`ingest.py`): PRAW-based scrape of relevant local-business subreddits
  → embed → cluster (HDBSCAN/KMeans) → LLM summarizes **top-3 pain points** per category (the
  founder's explicit ask). Retrieval tool shared by the strategy agent + outreach personalization.

**4. Predictive next-best-action (`ml/nba.py` + `agents/growth_advisor.py`)**
- `nba.py`: best-time-to-contact (outcome rates by hour×category from `call_logs`/`outreach`),
  channel recommender, "focus these N leads" ranking.
- `growth_advisor.py` (LangGraph): **WF-10 analytics insights** (daily aggregate → narrative insights
  into `ai_insights`) and **WF-11 daily action plan** (per-user task list into `daily_plans`), run by
  the scheduler. This is the Phase-3 "growth advisor" brain.

---

## OpenRouter model routing (tuned to $20)

`core/llm.py` maps **task → model** (env-overridable), with cost logged per call into `agent_runs`
and a soft budget cap in `core/budget.py`:

| Task | Default model (OpenRouter slug) | Why |
|---|---|---|
| Parsing / bulk copy / outreach variants | `google/gemini-2.0-flash-exp:free` (fallback `meta-llama/llama-3.1-8b-instruct`) | ~free, high volume |
| Strategy agent reasoning / tool use | `deepseek/deepseek-chat` (opt-in `anthropic/claude-3.5-sonnet`) | strong + very cheap; Sonnet when quality matters |
| Analytics / daily-plan synthesis | `openai/gpt-4o-mini` | cheap, reliable JSON |
| Embeddings | **local MiniLM** (no OpenRouter) | $0 |

---

## Database migrations (`backend/migrations/`)
- Enable `pgvector`; create `kb_documents` (above).
- `leads`: add `score numeric`, `score_factors jsonb`, **unique `google_place_id`** (dedup).
- `outreach`: add `provider_message_id text`, `delivery_status text`, `error text`.
- New: `agent_runs(id, agent, input jsonb, steps jsonb, output jsonb, tokens int, cost_usd numeric, created_at)`.
- Add only the Phase-2/3 tables actually used now (`ai_insights`, `daily_plans`); rest deferred.
- All new tables get RLS policies mirroring existing `own_data` pattern.

## Security/correctness fixes baked into the port
- `core/auth.py` verifies the Supabase JWT (HS256 via `SUPABASE_JWT_SECRET`) and derives `user_id`
  from the token — **body `user_id` is ignored**, closing the auth-bypass hole.
- Provider calls return real status; success envelopes only on confirmed 2xx (no more false "sent").
- Single Supabase client; structured error envelope; no payload/token logging in prod.

---

## Implementation phases (suggested order)
1. **Scaffold** — FastAPI app, config, single Supabase client, JWT auth dep, OpenRouter router,
   Dockerfile, `.env.example`, pytest harness, CI. Health check + one ported endpoint end-to-end.
2. **Port the 6 mechanical endpoints** (discover, pipeline, outreach, sms, whatsapp, log-call) with
   the correctness fixes (real delivery status, JWT auth, dedup). Contract tests vs frontend shapes.
3. **Migrations + RAG** — pgvector, `kb_documents`, embeddings, seed objection bank + case studies.
4. **Agentic strategy researcher** (WF-05) using RAG + CSE tools; persist `agent_runs`.
5. **Lead scoring + NBA** — heuristic first, wire `score` into discovery & pipeline ordering.
6. **Workers** — APScheduler for analytics (WF-10), daily plan (WF-11), greeting scheduler; Reddit
   pain-point miner job.
7. **Cutover** — flip `VITE_N8N_WEBHOOK_URL`, smoke-test all 8 paths, retire n8n; (optional) frontend
   Supabase-client consolidation.

---

## Verification
- **Unit tests** (`pytest`, httpx + LLM mocked) per service/agent — incl. the bug-fix assertions
  (no success on provider failure; body `user_id` rejected).
- **Contract tests** asserting each endpoint returns the exact JSON the frontend reads
  (`leads_count`, `scripts[]`, `{success}`), so `n8n.ts` keeps working untouched.
- **Smoke script** (`tests/smoke.py`) POSTs all 8 webhook paths against a local container with a
  seeded test user + JWT; prints pass/fail per endpoint.
- **Local run:** `docker compose up` → run smoke + a real `discover-leads` against a sandbox PIN.
- **Agent eval:** golden-set check that `strategy_researcher` returns schema-valid, evidence-cited
  strategies and logs cost to `agent_runs` (confirm spend tracking works before opening the tap).
- **Cutover check:** point a dev build of the frontend at the Python host and walk the full
  Discover → Strategy → Outreach → Pipeline loop in the browser.
