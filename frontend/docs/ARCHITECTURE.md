# Seriousprenuer — System Architecture & Technical Blueprint
## Version 1.0 | MVP

---

## System Overview

Seriousprenuer uses a **3-layer architecture** optimized for rapid MVP development using free-tier services:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Lovable.dev (React + Vite + Tailwind + shadcn/ui) | User interface, landing page, dashboard |
| **Backend/Orchestration** | n8n.io (Self-hosted or Cloud) | Workflow automation, API orchestration, business logic |
| **Database** | Supabase (PostgreSQL + Auth + Storage) | Data persistence, authentication, real-time subscriptions |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
│                   React SPA (Lovable.dev)                        │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Landing  │ │ Dashboard │ │ Pipeline │ │ Website Builder  │  │
│  │ Page     │ │ + Search  │ │ CRM      │ │ + Templates      │  │
│  └──────────┘ └───────────┘ └──────────┘ └──────────────────┘  │
└────────────┬────────────────────────┬───────────────────────────┘
             │ Supabase SDK           │ n8n Webhooks (REST)
             │ (Auth + DB + Realtime) │
     ┌───────▼────────┐      ┌───────▼──────────────────────┐
     │   SUPABASE      │      │       n8n.io WORKFLOWS       │
     │                 │      │                              │
     │ • Auth (JWT)    │◄────►│ WF-01: Lead Discovery        │
     │ • PostgreSQL    │      │   → Google Places API        │
     │ • Storage       │      │   → Google Custom Search     │
     │ • Realtime      │      │   → Supabase Insert          │
     │ • Edge Functions│      │                              │
     │ • Row Level Sec │      │ WF-02: AI Outreach           │
     └────────────────┘      │   → Google Gemini API        │
                              │   → Template Engine          │
                              │   → Supabase Update          │
                              │                              │
                              │ WF-03: Website Generator      │
                              │   → Template Selection        │
                              │   → Content Population        │
                              │   → Vercel/Netlify Deploy     │
                              │                              │
                              │ WF-04: Pipeline Manager       │
                              │   → Status Updates            │
                              │   → Notification Triggers     │
                              └──────────────────────────────┘
```

---

## Frontend Architecture

### Current State (V1 - Landing Page) ✅
- Pure React SPA built with Lovable.dev
- Vite + TypeScript + Tailwind CSS + shadcn/ui
- Deployed on Lovable's hosting
- GitHub repo: `sach2much/serious-prenuer`

### Target State (V2 - Full App)

```
src/
├── assets/                    # Images, icons
├── components/
│   ├── landing/               # Landing page sections (existing)
│   ├── dashboard/             # Dashboard components (NEW)
│   │   ├── DashboardLayout.tsx
│   │   ├── SearchBar.tsx
│   │   ├── LeadCard.tsx
│   │   └── StatsOverview.tsx
│   ├── pipeline/              # CRM Pipeline (NEW)
│   │   ├── PipelineBoard.tsx
│   │   ├── PipelineColumn.tsx
│   │   ├── LeadDetailModal.tsx
│   │   └── ActivityLog.tsx
│   ├── outreach/              # AI Outreach (NEW)
│   │   ├── OutreachGenerator.tsx
│   │   ├── ScriptPreview.tsx
│   │   ├── ChannelSelector.tsx
│   │   └── OutreachHistory.tsx
│   ├── website-builder/       # Website Builder (NEW)
│   │   ├── TemplateGallery.tsx
│   │   ├── SiteEditor.tsx
│   │   ├── SitePreview.tsx
│   │   └── DeployButton.tsx
│   ├── auth/                  # Auth components (NEW)
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── AuthGuard.tsx
│   └── ui/                    # shadcn/ui components (existing)
├── hooks/
│   ├── use-mobile.tsx
│   ├── use-toast.ts
│   ├── useAuth.ts             # Supabase auth hook (NEW)
│   ├── useLeads.ts            # Lead queries (NEW)
│   ├── usePipeline.ts         # Pipeline queries (NEW)
│   └── useN8n.ts              # n8n webhook calls (NEW)
├── lib/
│   ├── utils.ts
│   ├── supabase.ts            # Supabase client (NEW)
│   └── n8n.ts                 # n8n API helper (NEW)
├── pages/
│   ├── Index.tsx              # Landing page (existing)
│   ├── NotFound.tsx           # 404 (existing)
│   ├── Login.tsx              # Auth page (NEW)
│   ├── Signup.tsx             # Auth page (NEW)
│   ├── Dashboard.tsx          # Main dashboard (NEW)
│   ├── Pipeline.tsx           # CRM Pipeline (NEW)
│   ├── Outreach.tsx           # AI Outreach (NEW)
│   ├── WebsiteBuilder.tsx     # Website Builder (NEW)
│   └── Settings.tsx           # User settings (NEW)
├── types/
│   └── index.ts               # TypeScript types (NEW)
└── contexts/
    └── AuthContext.tsx         # Auth context provider (NEW)
```

---

## Backend Architecture (n8n.io)

### Workflow 1: Lead Discovery
```
Trigger: Webhook (POST /api/discover-leads)
  ├── Input: { location, radius, business_type, user_id }
  ├── Step 1: Google Places API — Nearby Search
  │     └── Find businesses in location with type filter
  ├── Step 2: Google Custom Search API
  │     └── Check if each business has a website (search "business name + website")
  ├── Step 3: Filter & Enrich
  │     └── Score leads (no website = high priority)
  ├── Step 4: Supabase Insert
  │     └── Batch insert leads into `leads` table
  └── Response: { leads: [...], count, search_metadata }
```

### Workflow 2: AI Outreach Generator
```
Trigger: Webhook (POST /api/generate-outreach)
  ├── Input: { lead_id, channel, language, user_id }
  ├── Step 1: Supabase Query
  │     └── Get lead details (business_name, category, location)
  ├── Step 2: Google Gemini API
  │     └── Generate 3 script variants using prompt template
  ├── Step 3: Supabase Insert
  │     └── Save scripts to `outreach` table
  └── Response: { scripts: [variant1, variant2, variant3] }
```

### Workflow 3: Website Generator
```
Trigger: Webhook (POST /api/generate-website)
  ├── Input: { lead_id, template_id, business_details, user_id }
  ├── Step 1: Template Selection
  │     └── Load industry-specific HTML/React template
  ├── Step 2: Content Population
  │     └── Inject business data into template
  ├── Step 3: SEO Generation (Gemini)
  │     └── Generate meta tags, descriptions, alt texts
  ├── Step 4: Build & Deploy
  │     └── Deploy to Vercel/Netlify via API
  ├── Step 5: Supabase Update
  │     └── Save deployed URL and status
  └── Response: { website_url, preview_url, status }
```

### Workflow 4: Pipeline Manager
```
Trigger: Webhook (POST /api/update-pipeline)
  ├── Input: { lead_id, new_stage, notes, user_id }
  ├── Step 1: Supabase Update
  │     └── Update pipeline stage + timestamp
  ├── Step 2: Activity Log
  │     └── Insert activity entry
  ├── Step 3: Notifications (optional)
  │     └── Send reminder if lead stale for 3+ days
  └── Response: { success, updated_lead }
```

---

## Database Schema (Supabase PostgreSQL)

```sql
-- Users table (managed by Supabase Auth, extended with profiles)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  city TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  category TEXT,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  google_rating NUMERIC(2,1),
  google_maps_url TEXT,
  has_website BOOLEAN DEFAULT FALSE,
  website_url TEXT,
  source TEXT DEFAULT 'google_places',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'client', 'delivered', 'lost')),
  priority INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Outreach messages
CREATE TABLE outreach (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email')),
  content TEXT NOT NULL,
  language TEXT DEFAULT 'english',
  variant INTEGER DEFAULT 1,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  response_status TEXT DEFAULT 'pending' CHECK (response_status IN ('pending', 'sent', 'delivered', 'read', 'replied', 'no_response')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated websites
CREATE TABLE websites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  template_id TEXT,
  business_details JSONB,
  content_json JSONB,
  seo_meta JSONB,
  deployed_url TEXT,
  preview_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'preview', 'deployed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pipeline activity log
CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own leads" ON leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own leads" ON leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leads" ON leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own outreach" ON outreach FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own outreach" ON outreach FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own websites" ON websites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own websites" ON websites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own activities" ON activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## API Endpoints (n8n Webhooks)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/discover-leads` | POST | Search for local businesses |
| `/api/generate-outreach` | POST | Generate AI outreach scripts |
| `/api/generate-website` | POST | Build and deploy a website |
| `/api/update-pipeline` | POST | Update lead pipeline stage |
| `/api/get-templates` | GET | List available website templates |
| `/api/deploy-website` | POST | Deploy generated website |

---

## Free Tier API Budget

| API | Free Allocation | Usage per User/Month |
|-----|----------------|---------------------|
| Google Places API | $200 credit/mo (~5,000 requests) | ~200 searches |
| Google Custom Search | 100 searches/day | ~3,000/mo |
| Google Gemini 1.5 Flash | 15 RPM, 1M tokens/min | ~500 outreach scripts |
| Supabase | 500MB DB, 5GB bandwidth | Sufficient for MVP |
| n8n Cloud | 2,500 executions/mo | ~2,500 workflow runs |
| Vercel | 100GB bandwidth, 6000 min build | ~50 site deployments |

---

## Integration Flow

```
User Action → React Frontend → Supabase (auth check)
                                    │
                              n8n Webhook ← REST call
                                    │
                              Google APIs (Places, Gemini, CSE)
                                    │
                              Supabase ← results stored
                                    │
                              React ← Supabase Realtime subscription
                                    │
                              UI Updated automatically
```

---

## Security Considerations

1. **Authentication:** Supabase JWT tokens for all API calls
2. **Row Level Security:** All tables enforce user-scoped access
3. **API Keys:** Stored in n8n credentials (never exposed to frontend)
4. **CORS:** Configured to allow only Lovable/Vercel domains
5. **Rate Limiting:** n8n workflows implement per-user rate limits
6. **Input Sanitization:** All user inputs validated with Zod
