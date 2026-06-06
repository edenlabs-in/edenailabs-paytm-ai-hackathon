# Seriousprenuer — PRD v2.0 (Complete Feature Spec)
## 11 Features | 3 Phases | All Free-Tier APIs for MVP

---

## Platform Summary

**Seriousprenuer** is an end-to-end side-hustle platform that helps users:
1. Discover local Indian businesses with no website
2. Generate AI-powered outreach strategies
3. Contact business owners via calling/SMS/WhatsApp
4. Build and deploy landing pages
5. Manage social media, CRM, SEO, and analytics

---

## Phase Breakdown

| Phase | Features | Timeline | Cost |
|-------|----------|----------|------|
| **Phase 1 (MVP)** | 1. Auth + Onboarding, 2. Local Biz Discovery, 3. AI Strategy, 4. Outreach | Weeks 1-4 | $0 (all free APIs) |
| **Phase 2** | 5. Landing Page Builder, 6. Viral Case Studies, 7. Social Media Manager, 8. Mini CRM + Greetings | Weeks 5-8 | ~$50/mo |
| **Phase 3** | 9. SEO Module, 10. AI Analytics, 11. Daily Action Plan | Weeks 9-12 | ~$100/mo |

---

## FEATURE 1: AUTH + ONBOARDING

### Authentication
- **Provider:** Supabase Auth
- **Methods:** Email/password, Google OAuth, OTP via phone
- **Flow:** Signup → Email verify → Profile setup (name, city, phone) → Onboarding
- **Session:** JWT tokens, auto-refresh, persistent login

### Onboarding (9 Demo Voice-Over Shorts)
- **Format:** 30-45 second shorts (portrait 9:16 video)
- **Purpose:** Quick feature walkthroughs for users with short attention spans
- **Videos:**
  1. "Welcome to Seriousprenuer — Your Side Hustle Launchpad" (platform overview)
  2. "How to Find Businesses Near You" (pin code discovery)
  3. "Understanding the Business Dashboard" (leads overview)
  4. "AI Strategy — Let AI Plan Your Approach" (strategy generator)
  5. "Outreach Scripts That Convert" (calling + messaging)
  6. "Building Landing Pages in Minutes" (website builder)
  7. "Track Your Pipeline — Never Lose a Lead" (CRM)
  8. "Social Media on Autopilot" (social manager)
  9. "Your Growth Dashboard — AI Analytics" (analytics)
- **MVP Approach:** Create placeholder video thumbnails with auto-play animation. Voice-over generated via ElevenLabs API (free: ~10 min/month). For MVP, use static slides with AI voiceover.
- **Tech:** Store videos in Supabase Storage. Track which user has watched which video.
- **Free API:** ElevenLabs free tier (10 min/month) for generating 9 x 45sec = ~7 min of voiceover.

### ORA Chatbot
- **Provider:** ora.ai (free chatbot builder, 1-click creation)
- **Purpose:** In-app guidance assistant. Users can ask "How do I find leads?" etc.
- **Implementation:** Embed ORA chatbot widget via `<script>` tag or iframe
- **Fallback MVP:** Gemini-powered FAQ bot using Supabase Edge Functions
- **Personality:** Named "Sid" — friendly, knowledgeable, slightly witty Indian startup mentor

### Supabase Tables
- `profiles` (extended with onboarding_completed, videos_watched)
- `onboarding_progress` (user_id, video_id, watched, watched_at)

---

## FEATURE 2: LOCAL BIZ DISCOVERY

### Core Flow
1. User enters **Indian PIN code** (6 digits, e.g., 400053 for Andheri West)
2. System geocodes PIN → lat/lng using Google Geocoding API (free)
3. Google Places API (New) searches for businesses in that area
4. System filters: **ONLY businesses without a website**
5. Results displayed as cards with: name, category, address, phone, Google rating, Maps link
6. User can bookmark/add leads to pipeline

### Pin Code → Location Resolution
- Google Geocoding API: `address={pincode}, India` → returns lat/lng
- Free tier: $200/month credit (covers ~40,000 geocoding requests)

### Business Discovery
- Google Places API (New): `searchNearby` endpoint
- Filter by `includedTypes`: restaurant, beauty_salon, hardware_store, clinic, gym, etc.
- Check `websiteUri` field — if empty, it's a lead
- Double-verify via Google Custom Search API (100/day free)
- Results: up to 20 per search, paginated with `pageToken`

### Future: SQL Listings
- Once leads are stored in Supabase, users can sort/filter categorically
- Filters: category, rating, status, city, date added
- Full-text search on business_name and category

### n8n Workflow: WF-01-v2 (Lead Discovery)
```
Webhook → Geocode PIN → Places Nearby Search → Filter No-Website → CSE Verify → Score → Supabase Insert → Response
```

### Supabase Tables
- `leads` (business_name, category, address, city, pin_code, phone, google_rating, has_website, status, priority)
- `search_history` (user_id, pin_code, results_count, searched_at)

---

## FEATURE 3: AI STRATEGY GENERATOR

### Core Flow
1. User selects a lead from their pipeline
2. Clicks "Generate Strategy"
3. AI (Google Gemini) creates a custom business strategy/approach plan
4. Strategy includes: pitch angle, pricing suggestion, service recommendations, timeline
5. User can edit, save, and export the strategy

### AI Prompt Design
```
You are an experienced business development strategist for digital services in India.

Create a detailed approach strategy for pitching website/digital services to:
- Business: {business_name}
- Category: {category} (e.g., restaurant, salon, clinic)
- Location: {address}, {city}
- Google Rating: {rating}
- Has Website: No
- Phone: {phone}

Generate a comprehensive strategy in this JSON format:
{
  "executive_summary": "2-3 sentences on why this business needs a website",
  "pitch_angle": "The specific angle to use when approaching this BO",
  "competitor_analysis": "What their competitors are doing online",
  "service_package": {
    "recommended_services": ["website", "google_maps_optimization", "social_media_setup"],
    "pricing_suggestion": "₹X,XXX - ₹XX,XXX range",
    "timeline": "X days/weeks"
  },
  "outreach_approach": {
    "best_channel": "whatsapp/call/visit",
    "best_time": "morning/afternoon/evening",
    "key_talking_points": ["point1", "point2", "point3"]
  },
  "potential_objections": ["objection1", "objection2"],
  "objection_handlers": ["response1", "response2"],
  "revenue_estimate": "Expected revenue from this client",
  "difficulty_score": 1-5
}
```

### Manus.im Integration (Future)
- Manus API for deeper research — can browse web, analyze competitors, create reports
- MVP: Use Google Gemini (free) with well-crafted prompts
- Phase 2: Integrate Manus API for autonomous strategy research

### n8n Workflow: WF-05 (Strategy Generator)
```
Webhook → Get Lead → Build Prompt → Gemini API → Parse → Supabase Insert → Response
```

### Supabase Tables
- `strategies` (id, lead_id, user_id, content_json, status, created_at)

---

## FEATURE 4: OUTREACH MODULE

### 4A: CALLING MODULE

#### Script-Based Calling
- **5 Pre-defined Scripts** for different scenarios:
  1. **Cold Intro:** "Hi, I noticed your business doesn't have a website..."
  2. **Value Prop:** "Did you know 78% of customers search online before visiting..."
  3. **Competitor Alert:** "I noticed {competitor} in your area has a website getting..."
  4. **Free Offer:** "I'd like to build you a free sample landing page..."
  5. **Referral:** "A mutual contact suggested I reach out about your online presence..."
- Scripts are displayed as reading cards with teleprompter mode
- User calls manually, reads the script
- After call, log outcome (answered, voicemail, callback, not interested, interested)

#### AI Calling (ElevenLabs) — Future
- ElevenLabs Conversational AI API
- Free tier: ~10 min/month (enough for 10-12 demo calls)
- Clone user's voice or use preset Indian English voices
- MVP: Not included (manual calling with scripts only)
- Phase 2: ElevenLabs integration for automated demo calls

### 4B: SMS MODULE

#### Pre-defined Scripts (10 templates)
**Respecting character limits:**
- **Short (160 chars):** 3 templates
  1. "Hi {name}! We help businesses like {category} get found online. Free website demo? Reply YES. - Seriousprenuer"
  2. "Your neighbors are going digital! Get a professional website for {business_name}. Call us: {phone}. - Seriousprenuer"
  3. "{business_name}: 80% of customers search online first. Let's get you a website. Free consultation: {link}"

- **Medium (306 chars):** 4 templates
  4-7. [Longer versions with more value proposition, social proof, and urgency]

- **Long (459 chars):** 3 templates
  8-10. [Detailed pitches with case studies, pricing hints, and multiple CTAs]

#### SMS API Integration Evaluation
| Provider | Free Tier | Per SMS (India) | API Quality | Verdict |
|----------|-----------|-----------------|-------------|---------|
| MSG91 | Trial credits | ₹0.12-0.20 | Excellent, Indian-first | ✅ Primary |
| Kapsystem | Trial | ₹0.15-0.25 | Good | Backup |
| Twilio | $15 credit | ₹0.04-0.08 | Best API docs | Alternative |
| SSD Web Solutions | Contact | Varies | Limited docs | Skip for MVP |

**MVP Choice:** MSG91 for SMS (best Indian pricing + API)

### 4C: WhatsApp MODULE

#### WhatsApp Business API Setup Flow
1. **Sign up with BSP:** MSG91 or Gallabox (7-day free trial)
2. **Meta Business Verification:** Requires GSTIN (you have MSME registration)
3. **Create Pre-approved Templates:** Submit message templates to Meta for approval
4. **Upload CSV Contacts:** Bulk import from Supabase leads export
5. **Send Campaigns:** Trigger via n8n workflows

#### WhatsApp Pricing (India, 2026)
- Marketing messages: ₹0.86-1.09 per message
- Utility messages: ₹0.145
- Service messages: FREE (within 24hr window)
- Free entry point (from CTWA ads): 72hr free window

#### AI Branding Preview Images
- When sending WhatsApp outreach, auto-generate a visual preview
- Use Gemini to generate image prompt → Google's Imagen or Canva API
- MVP: Use pre-made branded templates with dynamic text overlay (free)
- Phase 2: AI-generated custom visuals

#### 10 WhatsApp Scripts
Templates designed for Meta approval:
1. **Welcome Intro** — soft pitch with value prop
2. **Portfolio Showcase** — with sample website preview image
3. **Free Audit Offer** — "We analyzed your Google presence..."
4. **Competitor Comparison** — "See what {competitor} is doing online"
5. **Limited Time Offer** — urgency-driven
6. **Case Study Share** — success story from similar business
7. **Follow-Up 1** — gentle nudge after no reply
8. **Follow-Up 2** — add social proof
9. **Pricing Reveal** — after interest shown
10. **Closing Deal** — contract/agreement message

### n8n Workflows
- **WF-06:** SMS Outreach via MSG91 API
- **WF-07:** WhatsApp Campaign via MSG91/Gallabox API
- **WF-08:** Call Log Manager (logs outcomes to Supabase)

### Supabase Tables
- `outreach` (extended with call_duration, call_outcome, sms_status, wa_status)
- `scripts` (id, type[call/sms/wa], title, content, char_count, category, is_template)
- `call_logs` (id, lead_id, user_id, script_id, outcome, duration, notes, called_at)

---

## FEATURE 5: LANDING PAGE BUILDER (Phase 2)

### Core Flow
1. User selects a converted lead (status: "client")
2. Chooses industry template (restaurant, salon, clinic, etc.)
3. AI generates content using LLM prompts inspired by industry leaders
4. **Color Rule:** Use neighbouring palette colours, NEVER copy exact brand colours
5. Preview, customize, deploy

### Template Strategy
- **Inspiration:** Analyze top websites in the category via Gemini
- **Colour Algorithm:** Extract dominant colour from industry → shift hue ±15-30° for unique palette
- **Free Templates:** Build 6-8 industry templates with Tailwind CSS
- **No-Code Builder:** Drag-and-drop section editor in React

### n8n Workflow: WF-09 (Landing Page Generator)
### Supabase Tables: `websites`, `templates`

---

## FEATURE 6: VIRAL CASE STUDIES (Phase 2)

### Core Flow
1. Curated library of real viral IG/FB/LinkedIn reels that boosted businesses
2. Categorized by: industry, platform, result type (followers, sales, traffic)
3. Show B.O. these examples to build trust and set expectations
4. Key message: "Organic growth is real but NOT overnight"

### Content Library
- Store case study data in Supabase
- Fields: title, platform, business_type, before_metrics, after_metrics, video_url, key_takeaway, timeline
- Pre-populate with 20-30 real Indian business success stories
- Source from public IG/LinkedIn posts (with attribution)

### Supabase Tables
- `case_studies` (id, title, platform, business_type, video_url, thumbnail_url, before_metrics, after_metrics, key_takeaway, timeline, source_url)

---

## FEATURE 7: SOCIAL MEDIA MANAGER (Phase 2)

### Core Flow
1. Connect client's IG/FB/LinkedIn accounts
2. AI generates post content (captions, hashtags, image prompts)
3. Schedule posts across platforms
4. Track engagement metrics

### Free API Strategy
- **Instagram/Facebook:** Meta Graph API (free)
- **LinkedIn:** LinkedIn Marketing API (free for posting)
- **AI Content:** Google Gemini (free) for captions + hashtags
- **Image Generation:** Gemini/Imagen for post visuals
- **Scheduling:** n8n cron workflows (free)

### Supabase Tables
- `social_accounts` (user_id, platform, access_token, account_name)
- `social_posts` (id, user_id, lead_id, platform, content, image_url, scheduled_at, posted_at, status, engagement_metrics)

---

## FEATURE 8: MINI CRM + GREETING SCHEDULER (Phase 2)

### Mini CRM
- Help B.O. create a simple contact database
- Fields: name, phone, email, type (existing/potential), last_contacted, notes
- Import from phone contacts CSV
- Tag system: VIP, New, Seasonal, etc.

### Greeting Scheduler
- On Day 1 of onboarding: create ALL holiday greeting cards for the year
- Indian holidays: Diwali, Holi, Eid, Christmas, Ganesh Chaturthi, Independence Day, Republic Day, Navratri, Onam, Pongal, Makar Sankranti, Raksha Bandhan, etc.
- Auto-generate greeting images using templates + AI
- Schedule WhatsApp delivery on each holiday
- **Pricing:** ₹50/season apart from API costs (4 seasons = ₹200/year)

### Supabase Tables
- `crm_contacts` (id, business_owner_id, name, phone, email, type, tags, notes)
- `greeting_cards` (id, holiday_name, holiday_date, template_id, image_url, message, status)
- `greeting_schedule` (id, card_id, contact_id, scheduled_at, sent_at, channel)

---

## FEATURE 9: SEO MODULE — Paid Credits (Phase 3)

### Concept
- SEO offered as premium paid-credit feature
- Differentiate: **Google SEO** (traditional) vs **GPT SEO** (AI search optimization)
- Reference: [Gushwork.ai](https://www.gushwork.ai/) — "AI-Assisted SEO" by Nayrhit B (Co-founder, backed by Lightspeed & B Capital, $2M+ ARR)
- Key insight: Newer generation searches on ChatGPT/Perplexity, not just Google

### Google SEO Module
- On-page SEO audit (meta tags, headings, alt texts, speed)
- Keyword research (Google Keyword Planner API — free)
- Local SEO optimization (Google Business Profile tips)
- Backlink analysis (using free APIs)

### GPT SEO Module (Agentic SEO)
- Optimize content for AI search engines (ChatGPT, Perplexity, Gemini)
- Structured data / schema markup
- FAQ generation for AI snippet visibility
- Citation-optimized content

### Credit System
- 1 credit = 1 SEO audit or optimization
- Free: 3 credits on signup
- Paid: ₹99 for 10 credits, ₹249 for 30 credits

### Supabase Tables
- `seo_credits` (user_id, credits_remaining, credits_used, plan)
- `seo_audits` (id, website_id, audit_type, results_json, score, recommendations)

---

## FEATURE 10: AI ANALYTICS DASHBOARD (Phase 3)

### Real-Time Insights
- Total leads discovered, contacted, converted
- Conversion funnel visualization
- Revenue earned tracking
- Outreach success rates by channel

### AI Analysis (Gemini-powered)
- Pattern detection: "Your WhatsApp outreach converts 3x better than SMS"
- Timing suggestions: "Best time to contact restaurants is Tuesday 2-4 PM"
- Lead scoring: "Focus on these 5 high-intent leads this week"
- Growth advisor: Weekly AI summary with actionable recommendations

### n8n Workflow: WF-10 (Analytics Aggregator)
- Cron: runs daily at midnight
- Aggregates metrics from leads, outreach, websites tables
- Generates AI insights via Gemini
- Stores in analytics table

### Supabase Tables
- `analytics_daily` (date, user_id, leads_new, leads_contacted, leads_converted, outreach_sent, websites_deployed, revenue)
- `ai_insights` (id, user_id, insight_type, content, priority, is_read, created_at)

---

## FEATURE 11: DAILY ACTION PLAN — Subscription (Phase 3)

### Concept
- Weekly subscription service (₹99/week or ₹299/month)
- Instead of complex analytics, give B.O. a simple daily task list
- Each day: clear, actionable steps with specific targets

### Daily Plan Format
```
📋 YOUR DAILY ACTION PLAN — March 27, 2026

🎯 TODAY'S FOCUS: Restaurant Outreach in Andheri West

1. CONTACT THESE LEADS (High Intent):
   → Shree Krishna Bhavan (4.2★) — Call between 2-3 PM
   → Mumbai Spice Garden (3.8★) — WhatsApp the portfolio message
   → Café Mocha (4.5★) — Visit in person, bring case study

2. TODAY'S OFFER TO RUN:
   → "Free Google Maps Optimization" (works well for restaurants)

3. BEST AREA TO TARGET:
   → Andheri West, near Lokhandwala — 12 restaurants without websites

4. IDEAL ENGAGEMENT TIME:
   → 2:00 PM - 4:00 PM (post-lunch, before evening rush)

5. QUICK WIN:
   → Update your LinkedIn with yesterday's client testimonial
```

### n8n Workflow: WF-11 (Daily Plan Generator)
- Cron: runs 7:30 AM IST daily
- Analyzes user's leads, pipeline, and past performance
- Generates personalized plan via Gemini
- Sends via WhatsApp and in-app notification

### Supabase Tables
- `subscriptions` (user_id, plan, status, started_at, expires_at, amount)
- `daily_plans` (id, user_id, date, plan_json, sent_at, channel)

---

## COMPLETE FREE API STACK (MVP)

| Service | API | Free Tier | Used For |
|---------|-----|-----------|----------|
| Supabase | Auth + PostgreSQL | 500MB DB, 50K users | Auth, database, storage |
| Google Places API (New) | searchNearby | $200/mo credit | Lead discovery |
| Google Geocoding API | geocode | $200/mo credit | PIN code → lat/lng |
| Google Custom Search | search | 100/day | Website verification |
| Google Gemini 1.5 Flash | generateContent | 15 RPM, 1M tok/min | AI strategy, outreach, analytics |
| ElevenLabs | TTS | ~10 min/month | Onboarding voiceovers |
| ORA.ai | Chatbot | Free tier | In-app guidance chatbot |
| n8n Cloud | Workflows | 2,500 exec/month | All backend automation |
| MSG91 | SMS | Trial credits | SMS outreach (trial) |
| Gallabox | WhatsApp | 7-day free trial | WhatsApp outreach (trial) |
| Meta Graph API | IG/FB | Free | Social media posting |
| LinkedIn API | Marketing | Free | LinkedIn posting |

**Total MVP Cost: $0**

---

## ROUTING MAP: Frontend ↔ Backend ↔ DB

```
LOVABLE (React Frontend)
  │
  ├── Supabase SDK (Direct)
  │     ├── Auth (login/signup/session)
  │     ├── Realtime (live updates)
  │     ├── Storage (images/videos)
  │     └── Read queries (leads, pipeline, etc.)
  │
  └── n8n Webhooks (REST API)
        ├── POST /api/discover-leads     → WF-01 → Google Places → Supabase
        ├── POST /api/generate-strategy  → WF-05 → Gemini → Supabase
        ├── POST /api/generate-outreach  → WF-02 → Gemini → Supabase
        ├── POST /api/send-sms           → WF-06 → MSG91 → Supabase
        ├── POST /api/send-whatsapp      → WF-07 → Gallabox → Supabase
        ├── POST /api/log-call           → WF-08 → Supabase
        ├── POST /api/generate-website   → WF-03 → Gemini → Deploy
        ├── POST /api/update-pipeline    → WF-04 → Supabase
        ├── POST /api/generate-social    → WF-09 → Gemini → Supabase
        ├── GET  /api/analytics          → WF-10 → Gemini → Response
        └── GET  /api/daily-plan         → WF-11 → Gemini → Response
```
