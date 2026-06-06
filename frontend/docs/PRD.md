# Seriousprenuer — Product Requirements Document (PRD)
## Version 1.0 | MVP

---

## Abstract

**Seriousprenuer** is a side-hustle platform that helps users discover nearby local businesses (in India) that have no or weak online presence, send AI-crafted outreach messages, and deliver premium websites to those businesses — monetizing the gap between offline businesses and the digital world.

**Tagline:** Find Local Businesses, Pitch Websites, Get Paid

---

## Business Objectives

1. **Primary:** Enable solopreneurs/freelancers to find and close website deals with local Indian businesses
2. **Secondary:** Automate the lead-to-delivery pipeline (discovery → outreach → website generation → deployment)
3. **Tertiary:** Build a scalable SaaS platform that can expand to other services (SEO, social media management, etc.)

---

## KPIs

| KPI | Target (MVP) | Measurement |
|-----|-------------|-------------|
| User Signups | 100 in first month | Supabase auth counts |
| Leads Discovered | 500+ per user session | API response metrics |
| Outreach Sent | 50% of discovered leads | In-app tracking |
| Websites Generated | 10 per active user/month | Deployment logs |
| Conversion Rate | 5% lead-to-client | Pipeline tracking |

---

## Success Criteria

- Users can enter a city/area and get a list of businesses without websites
- AI generates persuasive outreach scripts (WhatsApp, SMS, Email)
- One-click website generation with industry-specific templates
- Deployed website with custom domain support
- User can track leads through a simple pipeline/CRM

---

## User Journeys

### Journey 1: Lead Discovery
1. User signs up / logs in
2. Enters city or locality (e.g., "Andheri West, Mumbai")
3. Platform surfaces businesses with weak/no online presence
4. User sees business name, category, address, phone, Google rating
5. User selects leads to add to pipeline

### Journey 2: AI Outreach
1. User selects a lead from pipeline
2. Chooses outreach channel (WhatsApp / SMS / Email)
3. AI generates persuasive pitch using Ogilvy-inspired copywriting
4. User reviews, edits, and sends
5. Response tracked in pipeline

### Journey 3: Website Delivery
1. User confirms a client deal
2. Enters business details (name, services, photos, contact)
3. Platform auto-generates a premium website
4. User previews and customizes
5. One-click deploy to live URL
6. Client handoff with branded report

---

## Scenarios

| Scenario | User Action | System Response |
|----------|------------|-----------------|
| New user signup | Enters email + password | Create account via Supabase Auth |
| Search leads | Enters "Dadar, Mumbai" | Returns 50+ businesses without websites |
| Generate outreach | Clicks "Generate WhatsApp pitch" | AI produces 3 script variants |
| Build website | Clicks "Create Website" for lead | Generates responsive site with SEO |
| Deploy site | Clicks "Deploy" | Site goes live at subdomain URL |

---

## User Flow

```
Landing Page → Sign Up → Dashboard
                            ├── Lead Discovery (Search by location)
                            │     └── Results → Add to Pipeline
                            ├── Pipeline/CRM
                            │     ├── Lead Details
                            │     ├── Generate Outreach (AI)
                            │     └── Track Status
                            ├── Website Builder
                            │     ├── Enter Business Info
                            │     ├── Choose Template
                            │     ├── Preview & Customize
                            │     └── Deploy
                            └── Settings / Profile
```

---

## Functional Requirements

### FR-01: Authentication
- Email/password signup and login via Supabase Auth
- Google OAuth integration
- Password reset flow
- Session management

### FR-02: Lead Discovery Engine
- Location-based business search
- Filter by: business type, Google rating, has/doesn't have website
- Business details: name, address, phone, category, Google Maps link
- Pagination and infinite scroll
- Save/bookmark leads

### FR-03: AI Outreach Generator
- Channel selection: WhatsApp, SMS, Email
- Multiple script variants per lead
- Customizable templates
- Copy-to-clipboard / direct send integration
- Outreach history tracking

### FR-04: Website Generator
- Industry-specific templates (restaurant, salon, retail, clinic, etc.)
- Auto-populate from business data
- Section editor (hero, about, services, contact, gallery)
- SEO meta tags auto-generation
- Responsive design (mobile-first)

### FR-05: Deployment Engine
- One-click deploy to subdomain
- Custom domain mapping
- SSL certificate auto-provisioning
- Analytics tracking code injection

### FR-06: Lead Pipeline/CRM
- Kanban-style board (New → Contacted → Interested → Client → Delivered)
- Lead notes and activity log
- Status updates and reminders
- Basic reporting/dashboard

---

## Model Requirements

### LLM Integration
- **Primary:** Google Gemini API (free tier) for outreach script generation
- **Fallback:** OpenAI GPT-3.5 Turbo (free credits)
- Prompt templates for each outreach channel
- Tone: Professional, persuasive, localized (Hindi/English)

---

## Data Requirements

### Data Sources
- Google Places API / Maps API (free tier) for business discovery
- Google Custom Search API for website existence verification
- Supabase PostgreSQL for user data, leads, pipeline

### Data Schema (Supabase)
- `users`: id, email, name, created_at
- `leads`: id, user_id, business_name, address, phone, category, google_rating, has_website, status, created_at
- `outreach`: id, lead_id, channel, content, sent_at, response_status
- `websites`: id, lead_id, template_id, content_json, deployed_url, created_at
- `pipeline`: id, lead_id, stage, notes, updated_at

---

## Prompt Requirements

### Outreach Prompt Template
```
You are an expert business development copywriter using Ogilvy's principles.
Write a {channel} message to pitch website services to {business_name}, 
a {category} in {location}. The message should:
- Be warm, professional, and locally relevant
- Reference their specific business type
- Highlight the value of having an online presence
- Include a clear CTA
- Be in {language} (Hindi/English/Hinglish)
Keep it under {word_limit} words.
```

---

## Testing & Measurement

- Unit tests via Vitest for all React components
- Integration tests for API calls (Supabase, Google APIs)
- E2E tests for critical user flows (signup → search → outreach → deploy)
- Performance benchmarks: page load < 2s, search results < 3s
- Error tracking and logging

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Google API rate limits | High | Medium | Implement caching, use n8n for rate limiting |
| Low conversion from outreach | Medium | High | A/B test outreach scripts, iterate on copy |
| Template quality perception | Medium | Medium | Invest in high-quality templates, get user feedback |
| Supabase free tier limits | Low | Medium | Monitor usage, plan upgrade path |

---

## Costs (MVP — Free Tier Strategy)

| Service | Free Tier | Paid Upgrade Path |
|---------|-----------|-------------------|
| Supabase | 500MB DB, 50K auth users | Pro @ $25/mo |
| Google Places API | $200 free credit/mo | Pay-per-use |
| Google Gemini API | Free tier available | Pay-per-token |
| n8n Cloud | 5 workflows, 2.5K executions | Starter @ €24/mo |
| Vercel/Netlify | 100GB bandwidth | Pro @ $20/mo |
| Lovable.dev | Free tier for frontend | Paid for more projects |

---

## Assumptions & Dependencies

1. Users have a smartphone with WhatsApp for outreach
2. Target market: Indian Tier 1 & 2 cities
3. Businesses are discoverable via Google Maps/Places
4. Users have basic English/Hindi literacy
5. Internet connectivity is reliable

---

## Compliance / Privacy / Legal

- GDPR-compliant data handling (Supabase manages EU data)
- No personal data scraping — all data from public Google APIs
- Terms of Service and Privacy Policy required before launch
- User consent for data storage
- Business data used only for lead generation purposes

---

## GTM / Rollout Plan

### Phase 1: MVP Launch (Weeks 1-4)
- Landing page live (DONE ✅)
- Core features: Lead discovery, AI outreach, basic website generator
- Invite-only beta with 50 users

### Phase 2: Public Beta (Weeks 5-8)
- Open registration
- Pipeline/CRM features
- Template library expansion
- User feedback integration

### Phase 3: Growth (Weeks 9-16)
- Referral program
- Premium templates marketplace
- Advanced analytics
- WhatsApp Business API integration
- Custom domain support

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Lovable.dev)                     │
│              React + Vite + Tailwind + shadcn/ui             │
│                   Hosted on Lovable/Vercel                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API / Webhooks
┌──────────────────────────▼──────────────────────────────────┐
│                    BACKEND (n8n.io)                           │
│         Workflow Automation + API Orchestration               │
│  ┌─────────┐  ┌──────────┐  ┌────────────┐  ┌───────────┐  │
│  │ Lead     │  │ Outreach │  │ Website    │  │ Pipeline  │  │
│  │ Discovery│  │ Generator│  │ Builder    │  │ Manager   │  │
│  └─────────┘  └──────────┘  └────────────┘  └───────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    DATABASE (Supabase)                        │
│              PostgreSQL + Auth + Storage + Realtime           │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    EXTERNAL APIs                             │
│  ┌──────────────┐  ┌───────────┐  ┌──────────────────────┐ │
│  │ Google Places │  │ Google    │  │ Google Gemini /      │ │
│  │ / Maps API   │  │ Custom    │  │ OpenAI (Outreach AI) │ │
│  │              │  │ Search    │  │                      │ │
│  └──────────────┘  └───────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```
