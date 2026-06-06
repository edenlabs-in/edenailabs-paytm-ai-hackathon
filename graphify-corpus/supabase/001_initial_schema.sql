-- Seriousprenuer MVP — Database Schema
-- Run this in Supabase SQL Editor
-- Version: 1.0.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  city TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro')),
  leads_discovered INTEGER DEFAULT 0,
  websites_created INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- LEADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  business_name TEXT NOT NULL,
  category TEXT,
  address TEXT,
  city TEXT,
  state TEXT DEFAULT 'Maharashtra',
  phone TEXT,
  email TEXT,
  google_rating NUMERIC(2,1),
  google_place_id TEXT,
  google_maps_url TEXT,
  has_website BOOLEAN DEFAULT FALSE,
  website_url TEXT,
  source TEXT DEFAULT 'google_places',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'client', 'delivered', 'lost')),
  priority INTEGER DEFAULT 0 CHECK (priority BETWEEN 0 AND 5),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast user queries
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_city ON leads(city);

-- ============================================
-- OUTREACH TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS outreach (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email')),
  content TEXT NOT NULL,
  language TEXT DEFAULT 'english' CHECK (language IN ('english', 'hindi', 'hinglish', 'marathi')),
  variant INTEGER DEFAULT 1,
  tone TEXT DEFAULT 'professional' CHECK (tone IN ('professional', 'casual', 'persuasive', 'friendly')),
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  response_status TEXT DEFAULT 'pending' CHECK (response_status IN ('pending', 'sent', 'delivered', 'read', 'replied', 'no_response')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_outreach_lead_id ON outreach(lead_id);
CREATE INDEX idx_outreach_user_id ON outreach(user_id);

-- ============================================
-- WEBSITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS websites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  template_id TEXT NOT NULL,
  business_name TEXT NOT NULL,
  business_details JSONB DEFAULT '{}',
  content_json JSONB DEFAULT '{}',
  seo_meta JSONB DEFAULT '{}',
  custom_css TEXT,
  deployed_url TEXT,
  preview_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'preview', 'deployed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_websites_user_id ON websites(user_id);

-- ============================================
-- ACTIVITIES TABLE (Pipeline Log)
-- ============================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activities_lead_id ON activities(lead_id);
CREATE INDEX idx_activities_user_id ON activities(user_id);

-- ============================================
-- TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  preview_url TEXT,
  html_template TEXT,
  css_template TEXT,
  sections JSONB DEFAULT '[]',
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default templates
INSERT INTO templates (id, name, category, description, sections) VALUES
  ('restaurant-01', 'Restaurant Classic', 'restaurant', 'Clean restaurant template with menu, gallery, and reservation CTA', '["hero","about","menu","gallery","contact","footer"]'),
  ('salon-01', 'Beauty Salon Modern', 'salon', 'Elegant salon template with services, pricing, and booking', '["hero","services","pricing","gallery","testimonials","contact","footer"]'),
  ('retail-01', 'Retail Store', 'retail', 'Product-focused retail template with catalog and store info', '["hero","products","about","store-info","contact","footer"]'),
  ('clinic-01', 'Medical Clinic', 'clinic', 'Professional clinic template with doctors, services, and appointment booking', '["hero","services","doctors","testimonials","appointment","contact","footer"]'),
  ('gym-01', 'Fitness Studio', 'gym', 'Energetic gym template with classes, trainers, and membership plans', '["hero","classes","trainers","pricing","gallery","contact","footer"]'),
  ('generic-01', 'Business Basic', 'generic', 'Versatile template for any local business', '["hero","about","services","testimonials","contact","footer"]')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
-- Templates are public read
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Leads policies
CREATE POLICY "Users can view own leads" ON leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own leads" ON leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leads" ON leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own leads" ON leads FOR DELETE USING (auth.uid() = user_id);

-- Outreach policies
CREATE POLICY "Users can view own outreach" ON outreach FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own outreach" ON outreach FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own outreach" ON outreach FOR UPDATE USING (auth.uid() = user_id);

-- Websites policies
CREATE POLICY "Users can view own websites" ON websites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own websites" ON websites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own websites" ON websites FOR UPDATE USING (auth.uid() = user_id);

-- Activities policies
CREATE POLICY "Users can view own activities" ON activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Templates are readable by everyone
CREATE POLICY "Templates are public" ON templates FOR SELECT USING (true);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_leads BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_websites BEFORE UPDATE ON websites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
