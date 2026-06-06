# Graph Report - backend/app  (2026-06-06)

## Corpus Check
- Corpus is ~10,098 words - fits in a single context window. You may not need a graph.

## Summary
- 281 nodes · 508 edges · 15 communities detected
- Extraction: 62% EXTRACTED · 38% INFERRED · 0% AMBIGUOUS · INFERRED: 195 edges (avg confidence: 0.67)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Auth, Errors & Call Log|Auth, Errors & Call Log]]
- [[_COMMUNITY_Growth Advisor & Greetings|Growth Advisor & Greetings]]
- [[_COMMUNITY_Schemas & Outreach|Schemas & Outreach]]
- [[_COMMUNITY_App Entry, Features & KB Seed|App Entry, Features & KB Seed]]
- [[_COMMUNITY_LLM Gateway & Providers|LLM Gateway & Providers]]
- [[_COMMUNITY_Lead Discovery & Scoring|Lead Discovery & Scoring]]
- [[_COMMUNITY_RAG Embeddings|RAG Embeddings]]
- [[_COMMUNITY_Strategy Agent (LangGraph)|Strategy Agent (LangGraph)]]
- [[_COMMUNITY_Messaging SMSWhatsApp|Messaging SMS/WhatsApp]]
- [[_COMMUNITY_External Integrations|External Integrations]]
- [[_COMMUNITY_Website Generator|Website Generator]]
- [[_COMMUNITY_Budget Guard|Budget Guard]]
- [[_COMMUNITY_Config  Settings|Config / Settings]]
- [[_COMMUNITY_RAG Package Init|RAG Package Init]]
- [[_COMMUNITY_Health Endpoint|Health Endpoint]]

## God Nodes (most connected - your core abstractions)
1. `SupabaseREST` - 34 edges
2. `ProviderError` - 27 edges
3. `AppError` - 14 edges
4. `NotFoundError` - 14 edges
5. `complete_json()` - 13 edges
6. `CurrentUser` - 11 edges
7. `WF-06 / WF-07: SMS & WhatsApp sending.  Correctness fix vs n8n: we only report s` - 11 edges
8. `get_supabase()` - 9 edges
9. `train_lead_model()` - 9 edges
10. `WF-08: Call Log Manager. Records call outcomes — feeds the best-time-to-contact` - 9 edges

## Surprising Connections (you probably didn't know these)
- `MSG91 SMS client. Returns a real provider message id + status, or raises Provide` --uses--> `ProviderError`  [INFERRED]
  C:\Users\danielsargunar\OneDrive\Documents\GitHub\edenailabs-paytm-ai-hackathon\backend\app\integrations\msg91.py → C:\Users\danielsargunar\OneDrive\Documents\GitHub\edenailabs-paytm-ai-hackathon\backend\app\core\errors.py
- `Thin async Supabase PostgREST client (the single server-side data client).  Uses` --uses--> `ProviderError`  [INFERRED]
  C:\Users\danielsargunar\OneDrive\Documents\GitHub\edenailabs-paytm-ai-hackathon\backend\app\integrations\supabase.py → C:\Users\danielsargunar\OneDrive\Documents\GitHub\edenailabs-paytm-ai-hackathon\backend\app\core\errors.py
- `FastAPI dependency / module accessor for the shared client.` --uses--> `ProviderError`  [INFERRED]
  C:\Users\danielsargunar\OneDrive\Documents\GitHub\edenailabs-paytm-ai-hackathon\backend\app\integrations\supabase.py → C:\Users\danielsargunar\OneDrive\Documents\GitHub\edenailabs-paytm-ai-hackathon\backend\app\core\errors.py
- `Background scheduler — replaces n8n's cron workflows (WF-10/11) + greetings + Re` --uses--> `SupabaseREST`  [INFERRED]
  C:\Users\danielsargunar\OneDrive\Documents\GitHub\edenailabs-paytm-ai-hackathon\backend\app\workers\scheduler.py → C:\Users\danielsargunar\OneDrive\Documents\GitHub\edenailabs-paytm-ai-hackathon\backend\app\integrations\supabase.py
- `Configure (but don't start) the scheduler. Separated out so tests can assert the` --uses--> `SupabaseREST`  [INFERRED]
  C:\Users\danielsargunar\OneDrive\Documents\GitHub\edenailabs-paytm-ai-hackathon\backend\app\workers\scheduler.py → C:\Users\danielsargunar\OneDrive\Documents\GitHub\edenailabs-paytm-ai-hackathon\backend\app\integrations\supabase.py

## Communities

### Community 0 - "Auth, Errors & Call Log"
Cohesion: 0.1
Nodes (22): CurrentUser, _extract_bearer(), get_current_user(), Supabase JWT verification.  THE security fix vs n8n: the authenticated user id c, FastAPI dependency. Returns the verified user or raises 401.      `AUTH_DISABLED, log_call(), log_call_endpoint(), LogCallRequest (+14 more)

### Community 1 - "Growth Advisor & Greetings"
Cohesion: 0.11
Nodes (22): Feature 8: holiday greeting scheduler.  On a schedule, finds upcoming Indian fes, Holidays whose date is in [today, today+within_days]. String compare works for I, For each upcoming holiday, ensure one greeting_card (per user) and one greeting_, schedule_greetings(), upcoming_holidays(), compute_metrics(), generate_analytics_insights(), generate_daily_plan() (+14 more)

### Community 2 - "Schemas & Outreach"
Cohesion: 0.1
Nodes (25): BaseModel, Ok, Shared response helpers. Mirrors the envelope the frontend `n8n.ts` already expe, Generic success envelope; endpoints extend it with their own fields., WF-10 (analytics) + WF-11 (daily action plan) — the 'growth advisor' brain.  Run, AnalyticsInsights, DailyPlan, Insight (+17 more)

### Community 3 - "App Entry, Features & KB Seed"
Cohesion: 0.09
Nodes (24): feature_vector(), feature_vector_from_lead(), label_for(), Shared feature engineering for lead scoring — used by both the heuristic and the, _main(), Seed the knowledge base.  Curated objection-handling bank + case studies that th, seed_knowledge_base(), lifespan() (+16 more)

### Community 4 - "LLM Gateway & Providers"
Cohesion: 0.12
Nodes (22): ProviderError, A downstream provider (Google, MSG91, Gallabox, OpenRouter, Supabase) failed., Gallabox WhatsApp client. Returns a real provider message id + status, or raises, send_whatsapp(), complete(), complete_json(), get_client(), OpenRouter LLM gateway with task→model routing and structured-output helpers.  E (+14 more)

### Community 5 - "Lead Discovery & Scoring"
Cohesion: 0.11
Nodes (15): discover_leads(), discover_leads_endpoint(), DiscoverLeadsRequest, DiscoverLeadsResponse, WF-01: Lead Discovery.  Pipeline: geocode PIN → Google Places nearby → keep only, _maybe_model(), Lead scoring.  Phase 2 ships the **cold-start heuristic** — transparent, explain, Heuristic blend. Higher = hotter lead.      - category prior: some verticals con (+7 more)

### Community 6 - "RAG Embeddings"
Cohesion: 0.15
Nodes (13): embed_one(), Embedder, FastEmbedEmbedder, get_embedder(), HashingEmbedder, Text embeddings for the knowledge base.  Primary: `fastembed` (BAAI/bge-small-en, Deterministic bag-of-hashed-tokens embedding, L2-normalized. Cheap, offline, goo, Protocol (+5 more)

### Community 7 - "Strategy Agent (LangGraph)"
Cohesion: 0.19
Nodes (12): Completeness gate used by the agent's critique step., AgentState, _build_graph(), _build_prompt(), _critique(), _make_gather(), WF-05 upgrade: an agentic strategy researcher built on LangGraph.  Instead of n8, Returns (strategy, trace). `trace` is persisted to agent_runs for observability. (+4 more)

### Community 8 - "Messaging SMS/WhatsApp"
Cohesion: 0.28
Nodes (10): _log(), WF-06 / WF-07: SMS & WhatsApp sending.  Correctness fix vs n8n: we only report s, _resolve(), send_sms(), send_sms_endpoint(), send_whatsapp(), send_whatsapp_endpoint(), SendMessageResponse (+2 more)

### Community 9 - "External Integrations"
Cohesion: 0.18
Nodes (8): Google Custom Search — used by the strategy agent to research local competitors., Returns [{title, snippet, link}]. Empty list when CSE isn't configured or on err, search(), geocode_pin(), PIN-code geocoding via OpenStreetMap Nominatim (free, same source WF-01 used)., MSG91 SMS client. Returns a real provider message id + status, or raises Provide, _safe_json(), send_sms()

### Community 10 - "Website Generator"
Cohesion: 0.27
Nodes (8): _default_template(), generate_website(), generate_website_endpoint(), GenerateWebsiteRequest, GenerateWebsiteResponse, WF-03: Website Generator (draft).  Generates SEO + landing copy for a converted, Structured LLM output for SEO copy., WebsiteSeo

### Community 11 - "Budget Guard"
Cohesion: 0.27
Nodes (4): BudgetTracker, Spend tracking + soft budget cap so the $20 OpenRouter credit can't be blown sil, Call before an LLM request; refuse once the cap is hit., BudgetExceededError

### Community 12 - "Config / Settings"
Cohesion: 0.33
Nodes (4): BaseSettings, get_settings(), Centralized settings. Reads .env once and exposes a cached `settings` singleton., Settings

### Community 13 - "RAG Package Init"
Cohesion: 0.67
Nodes (1): RAG package: embeddings, pgvector store, and a knowledge-base retrieval helper.

### Community 14 - "Health Endpoint"
Cohesion: 0.67
Nodes (1): Liveness + readiness.

## Knowledge Gaps
- **25 isolated node(s):** `FastAPI entrypoint.  Mounts every endpoint on the SAME `/webhook/*` paths n8n us`, `Centralized settings. Reads .env once and exposes a cached `settings` singleton.`, `Uniform error handling.  The cardinal rule (a bug in the n8n version): NEVER rep`, `Base application error -> structured JSON response.`, `A downstream provider (Google, MSG91, Gallabox, OpenRouter, Supabase) failed.` (+20 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `RAG Package Init`** (3 nodes): `__init__.py`, `RAG package: embeddings, pgvector store, and a knowledge-base retrieval helper.`, `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Health Endpoint`** (3 nodes): `health()`, `Liveness + readiness.`, `health.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SupabaseREST` connect `Growth Advisor & Greetings` to `Auth, Errors & Call Log`, `Schemas & Outreach`, `App Entry, Features & KB Seed`, `LLM Gateway & Providers`, `Lead Discovery & Scoring`, `RAG Embeddings`, `Strategy Agent (LangGraph)`, `Messaging SMS/WhatsApp`, `External Integrations`, `Website Generator`?**
  _High betweenness centrality (0.351) - this node is a cross-community bridge._
- **Why does `ProviderError` connect `LLM Gateway & Providers` to `Auth, Errors & Call Log`, `Growth Advisor & Greetings`, `App Entry, Features & KB Seed`, `RAG Embeddings`, `Messaging SMS/WhatsApp`, `External Integrations`?**
  _High betweenness centrality (0.184) - this node is a cross-community bridge._
- **Why does `complete_json()` connect `LLM Gateway & Providers` to `Growth Advisor & Greetings`, `RAG Embeddings`, `Strategy Agent (LangGraph)`, `Website Generator`, `Budget Guard`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Are the 24 inferred relationships involving `SupabaseREST` (e.g. with `WF-10 (analytics) + WF-11 (daily action plan) — the 'growth advisor' brain.  Run` and `AgentState`) actually correct?**
  _`SupabaseREST` has 24 INFERRED edges - model-reasoned connections that need verification._
- **Are the 24 inferred relationships involving `ProviderError` (e.g. with `OpenRouter LLM gateway with task→model routing and structured-output helpers.  E` and `Plain text completion. Returns the assistant message content.`) actually correct?**
  _`ProviderError` has 24 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `AppError` (e.g. with `WF-08: Call Log Manager. Records call outcomes — feeds the best-time-to-contact` and `WF-06 / WF-07: SMS & WhatsApp sending.  Correctness fix vs n8n: we only report s`) actually correct?**
  _`AppError` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `NotFoundError` (e.g. with `WF-08: Call Log Manager. Records call outcomes — feeds the best-time-to-contact` and `WF-06 / WF-07: SMS & WhatsApp sending.  Correctness fix vs n8n: we only report s`) actually correct?**
  _`NotFoundError` has 12 INFERRED edges - model-reasoned connections that need verification._