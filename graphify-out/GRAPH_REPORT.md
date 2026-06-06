# Graph Report - graphify-corpus  (2026-06-04)

## Corpus Check
- Corpus is ~19,469 words - fits in a single context window. You may not need a graph.

## Summary
- 142 nodes · 199 edges · 10 communities detected
- Extraction: 85% EXTRACTED · 15% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Outreach & n8n Webhook Layer|Outreach & n8n Webhook Layer]]
- [[_COMMUNITY_App Shell & Core Frontend Features|App Shell & Core Frontend Features]]
- [[_COMMUNITY_Phase 3 SEO, Analytics & Daily Plan|Phase 3: SEO, Analytics & Daily Plan]]
- [[_COMMUNITY_Phase 2 Web, Social & Mini-CRM|Phase 2: Web, Social & Mini-CRM]]
- [[_COMMUNITY_Phase 1 Onboarding & AI Strategy|Phase 1: Onboarding & AI Strategy]]
- [[_COMMUNITY_Auth Pages & Lead Hooks|Auth Pages & Lead Hooks]]
- [[_COMMUNITY_Messaging Providers & Scripts|Messaging Providers & Scripts]]
- [[_COMMUNITY_Lead Discovery & Infra Stack|Lead Discovery & Infra Stack]]
- [[_COMMUNITY_Marketing, CAC & Audience Research|Marketing, CAC & Audience Research]]
- [[_COMMUNITY_Outreach Page Handlers|Outreach Page Handlers]]

## God Nodes (most connected - your core abstractions)
1. `Auth Provider / useAuth Context` - 12 edges
2. `App Root Router` - 11 edges
3. `callN8n()` - 9 edges
4. `getJwt()` - 9 edges
5. `n8n Webhook Helper Module` - 9 edges
6. `Outreach Page (Call/SMS/WhatsApp)` - 8 edges
7. `Supabase Client` - 8 edges
8. `useLeads / useLeadsByStatus Hook` - 8 edges
9. `discoverLeads()` - 7 edges
10. `updatePipeline()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `generateWebsite()` --shares_data_with--> `Supabase Table: websites`  [INFERRED]
  C:\Users\danielsargunar\OneDrive\Documents\GitHub\edenailabs-paytm-ai-hackathon\graphify-corpus\app\n8n.ts → graphify-corpus/app/supabase-types.ts
- `handleSend()` --calls--> `sendSms()`  [INFERRED]
  C:\Users\danielsargunar\OneDrive\Documents\GitHub\edenailabs-paytm-ai-hackathon\graphify-corpus\app\Outreach.tsx → C:\Users\danielsargunar\OneDrive\Documents\GitHub\edenailabs-paytm-ai-hackathon\graphify-corpus\app\n8n.ts
- `handleLogCall()` --calls--> `logCall()`  [INFERRED]
  C:\Users\danielsargunar\OneDrive\Documents\GitHub\edenailabs-paytm-ai-hackathon\graphify-corpus\app\Outreach.tsx → C:\Users\danielsargunar\OneDrive\Documents\GitHub\edenailabs-paytm-ai-hackathon\graphify-corpus\app\n8n.ts
- `handleSearch()` --calls--> `discoverLeads()`  [INFERRED]
  C:\Users\danielsargunar\OneDrive\Documents\GitHub\edenailabs-paytm-ai-hackathon\graphify-corpus\app\Discover.tsx → C:\Users\danielsargunar\OneDrive\Documents\GitHub\edenailabs-paytm-ai-hackathon\graphify-corpus\app\n8n.ts
- `Login()` --calls--> `useAuth()`  [INFERRED]
  C:\Users\danielsargunar\OneDrive\Documents\GitHub\edenailabs-paytm-ai-hackathon\graphify-corpus\app\Login.tsx → C:\Users\danielsargunar\OneDrive\Documents\GitHub\edenailabs-paytm-ai-hackathon\graphify-corpus\app\useAuth.tsx

## Hyperedges (group relationships)
- **Authentication Flow (signup, login, provider, supabase)** — login_page, signup_page, authcontext_provider, supabase_client, tbl_profiles [INFERRED 0.85]
- **Pages Triggering n8n Webhooks via Helper** — discover_page, outreach_page, pipeline_page, strategy_page, n8n_helper [INFERRED 0.80]
- **Outreach Channels (call, SMS, WhatsApp, AI script gen)** — n8n_logcall, n8n_sendsms, n8n_sendwhatsapp, n8n_generateoutreach [INFERRED 0.80]
- **Outreach Channels (Call/SMS/WhatsApp)** — wf_06_sms_outreach, wf_07_whatsapp_campaign, wf_08_call_log_manager, api_msg91, api_gallabox [INFERRED 0.85]
- **Phase 1 MVP Features** — prd_feat_auth_onboarding, prd_feat_local_biz_discovery, prd_feat_ai_strategy, prd_feat_outreach [INFERRED 0.90]
- **Google API Stack** — api_google_places, api_google_geocoding, api_google_custom_search, api_google_gemini [INFERRED 0.90]

## Communities

### Community 0 - "Outreach & n8n Webhook Layer"
Cohesion: 0.21
Nodes (19): handleSearch(), Feature: Multi-Channel Outreach, callN8n(), discoverLeads(), generateOutreach(), generateStrategy(), generateWebsite(), getJwt() (+11 more)

### Community 1 - "App Shell & Core Frontend Features"
Cohesion: 0.19
Nodes (20): App Root Router, Auth Provider / useAuth Context, Dashboard Page, Discover Leads Page, Feature: AI Strategy Generation, Feature: Authentication, Feature: Lead Discovery, Feature: Sales Pipeline / CRM (+12 more)

### Community 2 - "Phase 3: SEO, Analytics & Daily Plan"
Cohesion: 0.13
Nodes (16): Google Gemini API, Gushwork.ai (Agentic SEO), Feature 10: AI Analytics Dashboard, Feature 11: Daily Action Plan, Feature 9: SEO Module, Phase 3, Vercel, Table: analytics_daily (+8 more)

### Community 3 - "Phase 2: Web, Social & Mini-CRM"
Cohesion: 0.13
Nodes (15): LinkedIn API, Meta Graph API, Colour Rule (Neighbouring Palette), Feature 5: Landing Page Builder, Feature 8: Mini CRM + Greetings, Feature 7: Social Media Manager, Feature 6: Viral Case Studies, Phase 2 (+7 more)

### Community 4 - "Phase 1: Onboarding & AI Strategy"
Cohesion: 0.15
Nodes (13): ElevenLabs API, Manus.im, ORA.ai, AI India Mission / Feb 26 AI Summit Grants, MANUS.im Strategy Plan, ORA Chatbot (Sid), Short Attention Span Rationale, Feature 3: AI Strategy Generator (+5 more)

### Community 5 - "Auth Pages & Lead Hooks"
Cohesion: 0.2
Nodes (7): Login(), Settings(), Signup(), ProtectedRoute(), useAuth(), useLeads(), useLeadsByStatus()

### Community 6 - "Messaging Providers & Scripts"
Cohesion: 0.22
Nodes (10): Gallabox, Kapsystem, MSG91, DLT Compliance Rationale, Feature 4: Outreach (Call/SMS/WhatsApp), Supabase Table: scripts, useScripts Hook, WF-06 SMS Outreach (+2 more)

### Community 7 - "Lead Discovery & Infra Stack"
Cohesion: 0.22
Nodes (9): Google Custom Search API, Google Geocoding API, Google Places API, PIN Code Targeting, Feature 2: Local Biz Discovery, Lovable.dev, n8n.io, Supabase (+1 more)

### Community 8 - "Marketing, CAC & Audience Research"
Cohesion: 0.25
Nodes (8): 5 Ad Awareness Stages, ATMA NIRBHAR (Self-Reliance Hook), Marketing & CAC Strategy, Local Indian Vendors (Target Customer), Meta Andromeda / Meta GEM Ad Systems, Reddit Complaints Scraper / Survey Agent, redditmap (anvaka map-of-reddit), Seriouspreneur Platform

### Community 9 - "Outreach Page Handlers"
Cohesion: 0.5
Nodes (2): handleLogCall(), handleSend()

## Knowledge Gaps
- **39 isolated node(s):** `Landing Page (Index)`, `404 Not Found Page`, `Supabase Database Types`, `Supabase Table: activities`, `Feature: Multi-Channel Outreach` (+34 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Outreach Page Handlers`** (4 nodes): `handleCopy()`, `handleLogCall()`, `handleSend()`, `Outreach.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Google Gemini API` connect `Phase 3: SEO, Analytics & Daily Plan` to `Phase 1: Onboarding & AI Strategy`?**
  _High betweenness centrality (0.181) - this node is a cross-community bridge._
- **Why does `WF-03 Website Generator` connect `Phase 3: SEO, Analytics & Daily Plan` to `Phase 2: Web, Social & Mini-CRM`?**
  _High betweenness centrality (0.159) - this node is a cross-community bridge._
- **Why does `Feature 5: Landing Page Builder` connect `Phase 2: Web, Social & Mini-CRM` to `Phase 3: SEO, Analytics & Daily Plan`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **What connects `Landing Page (Index)`, `404 Not Found Page`, `Supabase Database Types` to the rest of the system?**
  _39 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Phase 3: SEO, Analytics & Daily Plan` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `Phase 2: Web, Social & Mini-CRM` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._