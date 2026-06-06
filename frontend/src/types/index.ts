/* ── Supabase row types ── */

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  plan: 'free' | 'starter' | 'pro';
  onboarding_completed: boolean;
  onboarding_step: number;
  preferred_language: string;
  created_at: string;
}

export interface Lead {
  id: string;
  user_id: string;
  business_name: string;
  category: string | null;
  address: string | null;
  city: string | null;
  pin_code: string | null;
  phone: string | null;
  email: string | null;
  google_rating: number | null;
  google_place_id: string | null;
  google_maps_url: string | null;
  has_website: boolean;
  website_url: string | null;
  source: string;
  status: LeadStatus;
  priority: number;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'client'
  | 'delivered'
  | 'lost';

export interface Strategy {
  id: string;
  lead_id: string;
  user_id: string;
  content_json: Record<string, unknown>;
  executive_summary: string | null;
  pitch_angle: string | null;
  recommended_services: string[];
  pricing_suggestion: string | null;
  difficulty_score: number | null;
  status: string;
  created_at: string;
}

export interface Script {
  id: string;
  type: 'call' | 'sms' | 'whatsapp';
  title: string;
  content: string;
  char_count: number;
  category: string;
  language: string;
  variables: string[];
  is_active: boolean;
  usage_count: number;
  success_rate: number;
}

export interface CallLog {
  id: string;
  lead_id: string;
  user_id: string;
  script_id: string | null;
  outcome: string;
  duration_seconds: number;
  notes: string | null;
  follow_up_date: string | null;
  called_at: string;
}

export interface Outreach {
  id: string;
  lead_id: string;
  user_id: string;
  channel: 'whatsapp' | 'sms' | 'email';
  content: string;
  language: string;
  variant: number;
  sent: boolean;
  sent_at: string | null;
  response_status: string;
  created_at: string;
}

export interface SearchHistory {
  id: string;
  user_id: string;
  pin_code: string;
  locality: string | null;
  city: string | null;
  state: string | null;
  results_count: number;
  searched_at: string;
}

export interface OnboardingVideo {
  id: number;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  watched: boolean;
}

export const ONBOARDING_VIDEOS: OnboardingVideo[] = [
  { id: 1, title: 'Welcome to PAYTM', description: 'Your side-hustle launchpad — platform overview', duration: '0:35', thumbnail: '', watched: false },
  { id: 2, title: 'Find Businesses Near You', description: 'Pin code discovery walkthrough', duration: '0:40', thumbnail: '', watched: false },
  { id: 3, title: 'Understanding Your Dashboard', description: 'Leads overview and navigation', duration: '0:30', thumbnail: '', watched: false },
  { id: 4, title: 'AI Strategy — Let AI Plan', description: 'Generate business approach plans', duration: '0:45', thumbnail: '', watched: false },
  { id: 5, title: 'Outreach Scripts That Convert', description: 'Calling, SMS, and WhatsApp tools', duration: '0:40', thumbnail: '', watched: false },
  { id: 6, title: 'Building Landing Pages', description: 'Create websites in minutes', duration: '0:35', thumbnail: '', watched: false },
  { id: 7, title: 'Track Your Pipeline', description: 'Never lose a lead with CRM', duration: '0:30', thumbnail: '', watched: false },
  { id: 8, title: 'Social Media on Autopilot', description: 'AI-generated posting', duration: '0:35', thumbnail: '', watched: false },
  { id: 9, title: 'AI Analytics & Growth', description: 'Your growth dashboard', duration: '0:40', thumbnail: '', watched: false },
];
