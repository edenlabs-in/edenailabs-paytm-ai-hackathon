-- Seriousprenuer V2 — Schema Expansion for 11 Features
-- Run AFTER 001_initial_schema.sql
-- Version: 2.0.0

-- ============================================
-- PHASE 1: Features 1-4
-- ============================================

-- Extend profiles for onboarding
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'english';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gstin TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Onboarding video progress
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  video_id INTEGER NOT NULL CHECK (video_id BETWEEN 1 AND 9),
  video_title TEXT NOT NULL,
  watched BOOLEAN DEFAULT FALSE,
  watched_at TIMESTAMP WITH TIME ZONE,
  watch_duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

CREATE INDEX idx_onboarding_user ON onboarding_progress(user_id);

-- Search history for pin code discovery
CREATE TABLE IF NOT EXISTS search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pin_code TEXT NOT NULL CHECK (LENGTH(pin_code) = 6),
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  locality TEXT,
  city TEXT,
  state TEXT,
  results_count INTEGER DEFAULT 0,
  business_types TEXT[] DEFAULT '{}',
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_search_user ON search_history(user_id);
CREATE INDEX idx_search_pin ON search_history(pin_code);

-- Extend leads table for pin code
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pin_code TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7);

-- AI Strategies
CREATE TABLE IF NOT EXISTS strategies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content_json JSONB NOT NULL DEFAULT '{}',
  executive_summary TEXT,
  pitch_angle TEXT,
  recommended_services TEXT[],
  pricing_suggestion TEXT,
  difficulty_score INTEGER CHECK (difficulty_score BETWEEN 1 AND 5),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'used', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_strategies_lead ON strategies(lead_id);
CREATE INDEX idx_strategies_user ON strategies(user_id);

-- Outreach Scripts Library (pre-defined templates)
CREATE TABLE IF NOT EXISTS scripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('call', 'sms', 'whatsapp')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  char_count INTEGER GENERATED ALWAYS AS (LENGTH(content)) STORED,
  category TEXT DEFAULT 'general',
  language TEXT DEFAULT 'english',
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  success_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Call Logs
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  script_id UUID REFERENCES scripts(id),
  outcome TEXT NOT NULL CHECK (outcome IN ('answered', 'voicemail', 'callback', 'not_interested', 'interested', 'no_answer', 'wrong_number')),
  duration_seconds INTEGER DEFAULT 0,
  notes TEXT,
  follow_up_date DATE,
  called_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_call_logs_lead ON call_logs(lead_id);
CREATE INDEX idx_call_logs_user ON call_logs(user_id);

-- Extend outreach table
ALTER TABLE outreach ADD COLUMN IF NOT EXISTS script_id UUID REFERENCES scripts(id);
ALTER TABLE outreach ADD COLUMN IF NOT EXISTS whatsapp_template_name TEXT;
ALTER TABLE outreach ADD COLUMN IF NOT EXISTS preview_image_url TEXT;
ALTER TABLE outreach ADD COLUMN IF NOT EXISTS campaign_id TEXT;

-- ============================================
-- PHASE 2: Features 5-8
-- ============================================

-- Case Studies Library
CREATE TABLE IF NOT EXISTS case_studies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'linkedin', 'youtube', 'twitter')),
  business_type TEXT NOT NULL,
  business_name TEXT,
  location TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  before_metrics JSONB DEFAULT '{}',
  after_metrics JSONB DEFAULT '{}',
  key_takeaway TEXT,
  timeline TEXT,
  source_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_case_studies_platform ON case_studies(platform);
CREATE INDEX idx_case_studies_type ON case_studies(business_type);

-- Social Media Accounts
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'linkedin')),
  account_name TEXT,
  account_id TEXT,
  access_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_social_accounts_user ON social_accounts(user_id);

-- Social Media Posts
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  account_id UUID REFERENCES social_accounts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content_type TEXT DEFAULT 'post' CHECK (content_type IN ('post', 'reel', 'story', 'carousel')),
  caption TEXT,
  hashtags TEXT[],
  image_url TEXT,
  video_url TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'failed', 'cancelled')),
  engagement_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_social_posts_user ON social_posts(user_id);
CREATE INDEX idx_social_posts_scheduled ON social_posts(scheduled_at);

-- Mini CRM Contacts (for Business Owner's clients)
CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_owner_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  contact_type TEXT DEFAULT 'potential' CHECK (contact_type IN ('existing', 'potential', 'vip', 'churned')),
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_crm_contacts_bo ON crm_contacts(business_owner_id);
CREATE INDEX idx_crm_contacts_user ON crm_contacts(user_id);

-- Greeting Cards
CREATE TABLE IF NOT EXISTS greeting_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  business_owner_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  holiday_name TEXT NOT NULL,
  holiday_date DATE NOT NULL,
  template_id TEXT,
  image_url TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'scheduled', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_greeting_cards_date ON greeting_cards(holiday_date);

-- Greeting Schedule (individual sends)
CREATE TABLE IF NOT EXISTS greeting_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES greeting_cards(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE NOT NULL,
  channel TEXT DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'sms', 'email')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_greeting_schedule_time ON greeting_schedule(scheduled_at);

-- ============================================
-- PHASE 3: Features 9-11
-- ============================================

-- SEO Credits
CREATE TABLE IF NOT EXISTS seo_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  credits_remaining INTEGER DEFAULT 3,
  credits_used INTEGER DEFAULT 0,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro')),
  last_purchased_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEO Audits
CREATE TABLE IF NOT EXISTS seo_audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  audit_type TEXT NOT NULL CHECK (audit_type IN ('google_seo', 'gpt_seo', 'full')),
  results_json JSONB DEFAULT '{}',
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  recommendations JSONB DEFAULT '[]',
  credits_used INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics (daily aggregates)
CREATE TABLE IF NOT EXISTS analytics_daily (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  leads_new INTEGER DEFAULT 0,
  leads_contacted INTEGER DEFAULT 0,
  leads_converted INTEGER DEFAULT 0,
  outreach_sent INTEGER DEFAULT 0,
  outreach_replied INTEGER DEFAULT 0,
  websites_deployed INTEGER DEFAULT 0,
  revenue_earned NUMERIC(10,2) DEFAULT 0,
  best_channel TEXT,
  best_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_analytics_user_date ON analytics_daily(user_id, date);

-- AI Insights
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('pattern', 'suggestion', 'alert', 'weekly_summary', 'growth_tip')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  data_json JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_insights_user ON ai_insights(user_id);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('weekly', 'monthly', 'quarterly')),
  feature TEXT NOT NULL CHECK (feature IN ('daily_action_plan', 'seo_pro', 'premium')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'trial')),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);

-- Daily Action Plans
CREATE TABLE IF NOT EXISTS daily_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  plan_json JSONB NOT NULL DEFAULT '{}',
  focus_area TEXT,
  target_leads JSONB DEFAULT '[]',
  offer_of_the_day TEXT,
  best_area TEXT,
  best_time TEXT,
  completed_tasks INTEGER DEFAULT 0,
  total_tasks INTEGER DEFAULT 5,
  sent_at TIMESTAMP WITH TIME ZONE,
  channel TEXT DEFAULT 'in_app' CHECK (channel IN ('in_app', 'whatsapp', 'email', 'push')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_plans_user_date ON daily_plans(user_id, date);

-- ============================================
-- RLS POLICIES for new tables
-- ============================================

ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE greeting_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE greeting_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;

-- User-scoped policies (all tables)
CREATE POLICY "own_data" ON onboarding_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON search_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON strategies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "public_read" ON scripts FOR SELECT USING (true);
CREATE POLICY "own_data" ON call_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "public_read" ON case_studies FOR SELECT USING (true);
CREATE POLICY "own_data" ON social_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON social_posts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON crm_contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON greeting_cards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data_via_card" ON greeting_schedule FOR ALL
  USING (EXISTS (SELECT 1 FROM greeting_cards gc WHERE gc.id = card_id AND gc.user_id = auth.uid()));
CREATE POLICY "own_data" ON seo_credits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON seo_audits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON analytics_daily FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON ai_insights FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON daily_plans FOR ALL USING (auth.uid() = user_id);

-- Updated_at triggers for new tables
CREATE TRIGGER set_updated_at_strategies BEFORE UPDATE ON strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED DATA: Pre-defined Scripts
-- ============================================

-- Call Scripts (5)
INSERT INTO scripts (type, title, content, category, language, variables) VALUES
('call', 'Cold Intro', 'Hi, I''m {user_name}. I noticed {business_name} doesn''t have a website yet. In today''s digital age, over 80% of customers search online before visiting a business. I specialize in creating professional websites for {category} businesses like yours. Could I show you a quick demo? It''ll take just 2 minutes.', 'cold_outreach', 'english', '{user_name,business_name,category}'),
('call', 'Value Prop', 'Hello! I''m calling because I help local {category} businesses get found online. Did you know that businesses with a website get 3x more customer inquiries? I''ve helped businesses like yours in {city} increase their walk-ins by 40% just by having a professional online presence. Can I share how?', 'value', 'english', '{category,city}'),
('call', 'Competitor Alert', 'Hi {bo_name}, I''m {user_name}. I was researching {category} businesses in {city} and noticed that most of your competitors already have websites and are getting customers through Google. {business_name} is missing out on potential customers who are searching online. I can help you catch up quickly. Interested?', 'competitive', 'english', '{bo_name,user_name,category,city,business_name}'),
('call', 'Free Offer', 'Good afternoon! I''m offering a completely free sample landing page to {category} businesses in {city}. There''s no commitment — I''ll build a preview of what your website could look like, and you can decide if you want to go live with it. It''s my way of introducing my services. Shall I go ahead?', 'free_trial', 'english', '{category,city}'),
('call', 'Referral', 'Hi {bo_name}, I''m {user_name}. I recently built a website for a {category} business nearby and they''ve seen great results. They suggested I reach out to you since {business_name} could benefit from the same. Would you be open to a quick chat about getting your business online?', 'referral', 'english', '{bo_name,user_name,category,business_name}');

-- SMS Scripts - Short (160 chars)
INSERT INTO scripts (type, title, content, category, language, variables) VALUES
('sms', 'Quick Intro (160)', 'Hi {bo_name}! We help {category} businesses get found online. Free website demo for {business_name}? Reply YES. -Seriousprenuer', 'cold_short', 'english', '{bo_name,category,business_name}'),
('sms', 'Competitor Alert (160)', 'Your neighbours are going digital! Get a professional website for {business_name}. Free consultation. Call: {user_phone} -Seriousprenuer', 'competitive_short', 'english', '{business_name,user_phone}'),
('sms', 'Stats Hook (160)', '{business_name}: 80% of customers search online first. Get your website up in 48hrs. Free demo: {link} -Seriousprenuer', 'stats_short', 'english', '{business_name,link}');

-- SMS Scripts - Medium (306 chars)
INSERT INTO scripts (type, title, content, category, language, variables) VALUES
('sms', 'Value Story (306)', 'Hi {bo_name}, I recently helped a {category} in {city} get their first website. Within 2 weeks they got 15 new customer calls just from Google search! {business_name} could see similar results. I''d love to create a free mockup for you. Reply YES or call {user_phone}. -Seriousprenuer', 'value_medium', 'english', '{bo_name,category,city,business_name,user_phone}'),
('sms', 'Problem-Solution (306)', 'Did you know? 9 out of 10 people search online before visiting a local business. Without a website, {business_name} is invisible to these customers. I build affordable, professional websites for {category} businesses. Free demo available now. Reply DEMO. -Seriousprenuer', 'problem_medium', 'english', '{business_name,category}'),
('sms', 'Social Proof (306)', 'Hi {bo_name}! I''ve built websites for 10+ {category} businesses in {city}. Average result: 3x more customer inquiries in the first month. {business_name} is next in line for a free professional website mockup. Interested? Reply YES or call {user_phone}. -Seriousprenuer', 'social_medium', 'english', '{bo_name,category,city,business_name,user_phone}'),
('sms', 'Urgency (306)', 'SPECIAL OFFER for {city} businesses: I''m creating FREE website mockups for {category} businesses this week only. {business_name} can get a professional site live within 48 hours. Limited to 5 businesses. Reserve your spot — reply NOW. -Seriousprenuer', 'urgency_medium', 'english', '{city,category,business_name}');

-- SMS Scripts - Long (459 chars)
INSERT INTO scripts (type, title, content, category, language, variables) VALUES
('sms', 'Full Pitch (459)', 'Hi {bo_name}, I''m {user_name} from Seriousprenuer. I help local businesses build their online presence. I noticed {business_name} ({category} in {city}) doesn''t have a website yet. Here''s what I offer: Professional website design, Google Maps optimization, and social media setup. Starting at just ₹4,999. I''ve helped 10+ businesses in your area. Free mockup available. Call me at {user_phone} or reply YES. Let''s get {business_name} online!', 'full_long', 'english', '{bo_name,user_name,business_name,category,city,user_phone}'),
('sms', 'Case Study (459)', 'Hi {bo_name}! Quick story: {similar_business} in {city} had no website. After we built them one, they got 25 new customers in the first month and increased revenue by 30%. {business_name} could see the same results. I''d love to create a free demo for you. It takes 2 days to build, costs nothing to try. Visit {link} to see the demo or call {user_phone}. -Seriousprenuer', 'casestudy_long', 'english', '{bo_name,similar_business,city,business_name,link,user_phone}'),
('sms', 'Problem-Agitate-Solve (459)', 'Hi {bo_name}, every day customers near {business_name} search Google for "{category} near me" — but they can''t find you because you don''t have a website. Meanwhile, your competitors are getting those calls. The fix? A professional website that shows up on Google. I specialize in this. Free mockup in 48hrs. No risk. Reply WEBSITE or call {user_phone}. Let''s fix this today. -Seriousprenuer', 'pas_long', 'english', '{bo_name,business_name,category,user_phone}');

-- WhatsApp Scripts (10)
INSERT INTO scripts (type, title, content, category, language, variables) VALUES
('whatsapp', 'Welcome Intro', 'Hi {bo_name} 👋

I''m {user_name}, and I help local businesses like {business_name} build a professional online presence.

Did you know that 9 out of 10 customers search online before visiting a business? A great website can bring you more walk-ins and calls.

I''d love to show you a quick demo. When would be a good time to chat? 🙂', 'cold_outreach', 'english', '{bo_name,user_name,business_name}'),
('whatsapp', 'Portfolio Showcase', 'Hi {bo_name}! 👋

Check out this sample website I created for a {category} business similar to yours 👆

This is what {business_name} could look like online — professional, modern, and optimized for Google search.

I can build something similar for you. Free demo, no commitment. Interested?', 'portfolio', 'english', '{bo_name,category,business_name}'),
('whatsapp', 'Free Audit Offer', 'Hi {bo_name},

I just analyzed {business_name}''s online presence and found some insights:

❌ No website found
❌ Missing from Google Search results
⚠️ Google Maps listing could be optimized
✅ Good Google rating: {google_rating}⭐

I can help fix all of this. Want me to create a free action plan for {business_name}?', 'audit', 'english', '{bo_name,business_name,google_rating}'),
('whatsapp', 'Competitor Comparison', 'Hi {bo_name},

I noticed that other {category} businesses in {city} already have websites and are showing up on Google when customers search for "{category} near me."

{business_name} isn''t appearing in those searches yet — which means you''re missing potential customers every day.

I can help you change that. Want to see how? 📊', 'competitive', 'english', '{bo_name,category,city,business_name}'),
('whatsapp', 'Limited Time Offer', 'Hi {bo_name}! 🎯

This week I''m offering FREE website mockups to {category} businesses in {city}.

What you get:
✅ Professional design tailored to {business_name}
✅ Mobile-friendly layout
✅ Google Maps integration
✅ Contact form and click-to-call

Limited to 5 businesses only. Reply YES to reserve your spot! 🚀', 'urgency', 'english', '{bo_name,category,city,business_name}'),
('whatsapp', 'Case Study Share', 'Hi {bo_name}! 📈

Quick success story: A {category} business in {city} went from ZERO online presence to getting 20+ new customer calls per month — just from having a website.

Their secret? A professional site that shows up when people search Google.

{business_name} could see similar results. Want me to share more details?', 'case_study', 'english', '{bo_name,category,city,business_name}'),
('whatsapp', 'Follow-Up 1', 'Hi {bo_name} 👋

Just following up on my earlier message about creating a website for {business_name}.

I understand you''re busy running your business. No pressure at all — but I''d love to share a quick 2-min demo whenever you have a moment.

Would this week work for a brief chat? 🙂', 'followup', 'english', '{bo_name,business_name}'),
('whatsapp', 'Follow-Up 2 (Social Proof)', 'Hi {bo_name},

Just wanted to share — I recently helped 3 {category} businesses in {city} launch their websites, and they''re already seeing more customer inquiries.

I still have a spot available for {business_name} this week. The demo is completely free and takes just 10 minutes.

Shall I set it up? 📱', 'followup_social', 'english', '{bo_name,category,city,business_name}'),
('whatsapp', 'Pricing Reveal', 'Hi {bo_name}! 😊

Since you showed interest, here''s what I offer for {business_name}:

📌 *Starter Package* — ₹4,999
   • Professional 5-page website
   • Mobile responsive
   • Google Maps integration
   • Basic SEO setup

📌 *Growth Package* — ₹9,999
   • Everything in Starter
   • Social media setup
   • Google Business Profile optimization
   • 3 months support

Which option interests you? Or I can customize a package! 💬', 'pricing', 'english', '{bo_name,business_name}'),
('whatsapp', 'Closing Deal', 'Hi {bo_name}! 🤝

Great news — the website design for {business_name} is ready to begin!

To get started, I just need:
1. ✅ Your business logo (or I''ll design one)
2. ✅ 5-10 photos of your business
3. ✅ List of your services/menu
4. ✅ Your preferred contact details

I''ll have the first draft ready in 48 hours. Let''s do this! 🚀', 'closing', 'english', '{bo_name,business_name}')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: Indian Holidays for Greeting Cards
-- ============================================
CREATE TABLE IF NOT EXISTS holiday_calendar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT DEFAULT 'national' CHECK (type IN ('national', 'religious', 'regional', 'cultural', 'business')),
  religion TEXT,
  template_message TEXT,
  year INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM date)) STORED
);

INSERT INTO holiday_calendar (name, date, type, religion, template_message) VALUES
('Republic Day', '2026-01-26', 'national', NULL, 'Wishing you a Happy Republic Day! Jai Hind 🇮🇳 — from {business_name}'),
('Maha Shivaratri', '2026-02-17', 'religious', 'hindu', 'Wishing you a blessed Maha Shivaratri! Om Namah Shivaya 🙏 — from {business_name}'),
('Holi', '2026-03-17', 'cultural', 'hindu', 'Happy Holi! May your life be filled with colours of joy! 🎨 — from {business_name}'),
('Eid ul-Fitr', '2026-03-30', 'religious', 'muslim', 'Eid Mubarak! Wishing you peace and happiness! 🌙 — from {business_name}'),
('Ram Navami', '2026-04-06', 'religious', 'hindu', 'Happy Ram Navami! Jai Shri Ram 🙏 — from {business_name}'),
('Ambedkar Jayanti', '2026-04-14', 'national', NULL, 'Remembering Dr. B.R. Ambedkar on his birth anniversary. Jai Bhim! — from {business_name}'),
('Independence Day', '2026-08-15', 'national', NULL, 'Happy Independence Day! Vande Mataram 🇮🇳 — from {business_name}'),
('Raksha Bandhan', '2026-08-12', 'cultural', 'hindu', 'Happy Raksha Bandhan! Celebrating the bond of love! 🎀 — from {business_name}'),
('Janmashtami', '2026-08-22', 'religious', 'hindu', 'Happy Janmashtami! Hare Krishna 🙏 — from {business_name}'),
('Ganesh Chaturthi', '2026-08-27', 'religious', 'hindu', 'Ganpati Bappa Morya! Happy Ganesh Chaturthi! 🐘 — from {business_name}'),
('Onam', '2026-09-06', 'regional', 'hindu', 'Happy Onam! Wishing you prosperity and joy! 🌻 — from {business_name}'),
('Gandhi Jayanti', '2026-10-02', 'national', NULL, 'Remembering Mahatma Gandhi on his birth anniversary. Be the change! 🕊️ — from {business_name}'),
('Navratri Start', '2026-10-01', 'religious', 'hindu', 'Happy Navratri! May Goddess Durga bless you! 🙏 — from {business_name}'),
('Dussehra', '2026-10-10', 'cultural', 'hindu', 'Happy Dussehra! May good triumph over evil! 🏹 — from {business_name}'),
('Diwali', '2026-10-20', 'cultural', 'hindu', 'Happy Diwali! May this festival of lights bring you joy and prosperity! 🪔✨ — from {business_name}'),
('Guru Nanak Jayanti', '2026-11-08', 'religious', 'sikh', 'Happy Guru Nanak Jayanti! Waheguru Ji Ka Khalsa 🙏 — from {business_name}'),
('Christmas', '2026-12-25', 'cultural', 'christian', 'Merry Christmas! Wishing you love, peace, and joy! 🎄 — from {business_name}'),
('New Year', '2027-01-01', 'cultural', NULL, 'Happy New Year 2027! Wishing you success and happiness! 🎉 — from {business_name}')
ON CONFLICT DO NOTHING;

ALTER TABLE holiday_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON holiday_calendar FOR SELECT USING (true);
