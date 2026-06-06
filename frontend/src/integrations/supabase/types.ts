export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          action: string
          created_at: string | null
          details: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          content: string
          created_at: string | null
          data_json: Json | null
          id: string
          insight_type: string
          is_dismissed: boolean | null
          is_read: boolean | null
          priority: string | null
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          data_json?: Json | null
          id?: string
          insight_type: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          priority?: string | null
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          data_json?: Json | null
          id?: string
          insight_type?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          priority?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_daily: {
        Row: {
          best_channel: string | null
          best_time: string | null
          created_at: string | null
          date: string
          id: string
          leads_contacted: number | null
          leads_converted: number | null
          leads_new: number | null
          outreach_replied: number | null
          outreach_sent: number | null
          revenue_earned: number | null
          user_id: string
          websites_deployed: number | null
        }
        Insert: {
          best_channel?: string | null
          best_time?: string | null
          created_at?: string | null
          date: string
          id?: string
          leads_contacted?: number | null
          leads_converted?: number | null
          leads_new?: number | null
          outreach_replied?: number | null
          outreach_sent?: number | null
          revenue_earned?: number | null
          user_id: string
          websites_deployed?: number | null
        }
        Update: {
          best_channel?: string | null
          best_time?: string | null
          created_at?: string | null
          date?: string
          id?: string
          leads_contacted?: number | null
          leads_converted?: number | null
          leads_new?: number | null
          outreach_replied?: number | null
          outreach_sent?: number | null
          revenue_earned?: number | null
          user_id?: string
          websites_deployed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_daily_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          called_at: string | null
          duration_seconds: number | null
          follow_up_date: string | null
          id: string
          lead_id: string
          notes: string | null
          outcome: string
          script_id: string | null
          user_id: string
        }
        Insert: {
          called_at?: string | null
          duration_seconds?: number | null
          follow_up_date?: string | null
          id?: string
          lead_id: string
          notes?: string | null
          outcome: string
          script_id?: string | null
          user_id: string
        }
        Update: {
          called_at?: string | null
          duration_seconds?: number | null
          follow_up_date?: string | null
          id?: string
          lead_id?: string
          notes?: string | null
          outcome?: string
          script_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_studies: {
        Row: {
          after_metrics: Json | null
          before_metrics: Json | null
          business_name: string | null
          business_type: string
          created_at: string | null
          id: string
          is_featured: boolean | null
          key_takeaway: string | null
          location: string | null
          platform: string
          source_url: string | null
          thumbnail_url: string | null
          timeline: string | null
          title: string
          video_url: string | null
        }
        Insert: {
          after_metrics?: Json | null
          before_metrics?: Json | null
          business_name?: string | null
          business_type: string
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          key_takeaway?: string | null
          location?: string | null
          platform: string
          source_url?: string | null
          thumbnail_url?: string | null
          timeline?: string | null
          title: string
          video_url?: string | null
        }
        Update: {
          after_metrics?: Json | null
          before_metrics?: Json | null
          business_name?: string | null
          business_type?: string
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          key_takeaway?: string | null
          location?: string | null
          platform?: string
          source_url?: string | null
          thumbnail_url?: string | null
          timeline?: string | null
          title?: string
          video_url?: string | null
        }
        Relationships: []
      }
      crm_contacts: {
        Row: {
          business_owner_id: string
          contact_type: string | null
          created_at: string | null
          email: string | null
          id: string
          last_contacted_at: string | null
          name: string
          notes: string | null
          phone: string | null
          tags: string[] | null
          user_id: string
        }
        Insert: {
          business_owner_id: string
          contact_type?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          user_id: string
        }
        Update: {
          business_owner_id?: string
          contact_type?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_business_owner_id_fkey"
            columns: ["business_owner_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_plans: {
        Row: {
          best_area: string | null
          best_time: string | null
          channel: string | null
          completed_tasks: number | null
          created_at: string | null
          date: string
          focus_area: string | null
          id: string
          offer_of_the_day: string | null
          plan_json: Json
          sent_at: string | null
          target_leads: Json | null
          total_tasks: number | null
          user_id: string
        }
        Insert: {
          best_area?: string | null
          best_time?: string | null
          channel?: string | null
          completed_tasks?: number | null
          created_at?: string | null
          date: string
          focus_area?: string | null
          id?: string
          offer_of_the_day?: string | null
          plan_json?: Json
          sent_at?: string | null
          target_leads?: Json | null
          total_tasks?: number | null
          user_id: string
        }
        Update: {
          best_area?: string | null
          best_time?: string | null
          channel?: string | null
          completed_tasks?: number | null
          created_at?: string | null
          date?: string
          focus_area?: string | null
          id?: string
          offer_of_the_day?: string | null
          plan_json?: Json
          sent_at?: string | null
          target_leads?: Json | null
          total_tasks?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      greeting_cards: {
        Row: {
          business_owner_id: string | null
          created_at: string | null
          holiday_date: string
          holiday_name: string
          id: string
          image_url: string | null
          message: string | null
          status: string | null
          template_id: string | null
          user_id: string
        }
        Insert: {
          business_owner_id?: string | null
          created_at?: string | null
          holiday_date: string
          holiday_name: string
          id?: string
          image_url?: string | null
          message?: string | null
          status?: string | null
          template_id?: string | null
          user_id: string
        }
        Update: {
          business_owner_id?: string | null
          created_at?: string | null
          holiday_date?: string
          holiday_name?: string
          id?: string
          image_url?: string | null
          message?: string | null
          status?: string | null
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "greeting_cards_business_owner_id_fkey"
            columns: ["business_owner_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "greeting_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      greeting_schedule: {
        Row: {
          card_id: string
          channel: string | null
          contact_id: string
          created_at: string | null
          id: string
          scheduled_at: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          card_id: string
          channel?: string | null
          contact_id: string
          created_at?: string | null
          id?: string
          scheduled_at: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          card_id?: string
          channel?: string | null
          contact_id?: string
          created_at?: string | null
          id?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "greeting_schedule_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "greeting_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "greeting_schedule_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      holiday_calendar: {
        Row: {
          date: string
          id: string
          name: string
          religion: string | null
          template_message: string | null
          type: string | null
          year: number | null
        }
        Insert: {
          date: string
          id?: string
          name: string
          religion?: string | null
          template_message?: string | null
          type?: string | null
          year?: number | null
        }
        Update: {
          date?: string
          id?: string
          name?: string
          religion?: string | null
          template_message?: string | null
          type?: string | null
          year?: number | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          address: string | null
          business_name: string
          category: string | null
          city: string | null
          created_at: string | null
          email: string | null
          google_maps_url: string | null
          google_place_id: string | null
          google_rating: number | null
          has_website: boolean | null
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          phone: string | null
          pin_code: string | null
          priority: number | null
          source: string | null
          state: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          category?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          google_maps_url?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          has_website?: boolean | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          phone?: string | null
          pin_code?: string | null
          priority?: number | null
          source?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          category?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          google_maps_url?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          has_website?: boolean | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          phone?: string | null
          pin_code?: string | null
          priority?: number | null
          source?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          video_id: number
          video_title: string
          watch_duration_seconds: number | null
          watched: boolean | null
          watched_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          video_id: number
          video_title: string
          watch_duration_seconds?: number | null
          watched?: boolean | null
          watched_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          video_id?: number
          video_title?: string
          watch_duration_seconds?: number | null
          watched?: boolean | null
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach: {
        Row: {
          campaign_id: string | null
          channel: string
          content: string
          created_at: string | null
          id: string
          language: string | null
          lead_id: string
          preview_image_url: string | null
          response_status: string | null
          script_id: string | null
          sent: boolean | null
          sent_at: string | null
          tone: string | null
          user_id: string
          variant: number | null
          whatsapp_template_name: string | null
        }
        Insert: {
          campaign_id?: string | null
          channel: string
          content: string
          created_at?: string | null
          id?: string
          language?: string | null
          lead_id: string
          preview_image_url?: string | null
          response_status?: string | null
          script_id?: string | null
          sent?: boolean | null
          sent_at?: string | null
          tone?: string | null
          user_id: string
          variant?: number | null
          whatsapp_template_name?: string | null
        }
        Update: {
          campaign_id?: string | null
          channel?: string
          content?: string
          created_at?: string | null
          id?: string
          language?: string | null
          lead_id?: string
          preview_image_url?: string | null
          response_status?: string | null
          script_id?: string | null
          sent?: boolean | null
          sent_at?: string | null
          tone?: string | null
          user_id?: string
          variant?: number | null
          whatsapp_template_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string | null
          full_name: string | null
          gstin: string | null
          id: string
          leads_discovered: number | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          phone: string | null
          plan: string | null
          preferred_language: string | null
          updated_at: string | null
          websites_created: number | null
          whatsapp_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          full_name?: string | null
          gstin?: string | null
          id: string
          leads_discovered?: number | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          phone?: string | null
          plan?: string | null
          preferred_language?: string | null
          updated_at?: string | null
          websites_created?: number | null
          whatsapp_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          full_name?: string | null
          gstin?: string | null
          id?: string
          leads_discovered?: number | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          phone?: string | null
          plan?: string | null
          preferred_language?: string | null
          updated_at?: string | null
          websites_created?: number | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      scripts: {
        Row: {
          category: string | null
          char_count: number | null
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          language: string | null
          success_rate: number | null
          title: string
          type: string
          usage_count: number | null
          variables: string[] | null
        }
        Insert: {
          category?: string | null
          char_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          success_rate?: number | null
          title: string
          type: string
          usage_count?: number | null
          variables?: string[] | null
        }
        Update: {
          category?: string | null
          char_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          success_rate?: number | null
          title?: string
          type?: string
          usage_count?: number | null
          variables?: string[] | null
        }
        Relationships: []
      }
      search_history: {
        Row: {
          business_types: string[] | null
          city: string | null
          id: string
          latitude: number | null
          locality: string | null
          longitude: number | null
          pin_code: string
          results_count: number | null
          searched_at: string | null
          state: string | null
          user_id: string
        }
        Insert: {
          business_types?: string[] | null
          city?: string | null
          id?: string
          latitude?: number | null
          locality?: string | null
          longitude?: number | null
          pin_code: string
          results_count?: number | null
          searched_at?: string | null
          state?: string | null
          user_id: string
        }
        Update: {
          business_types?: string[] | null
          city?: string | null
          id?: string
          latitude?: number | null
          locality?: string | null
          longitude?: number | null
          pin_code?: string
          results_count?: number | null
          searched_at?: string | null
          state?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_audits: {
        Row: {
          audit_type: string
          created_at: string | null
          credits_used: number | null
          id: string
          recommendations: Json | null
          results_json: Json | null
          score: number | null
          user_id: string
          website_id: string | null
        }
        Insert: {
          audit_type: string
          created_at?: string | null
          credits_used?: number | null
          id?: string
          recommendations?: Json | null
          results_json?: Json | null
          score?: number | null
          user_id: string
          website_id?: string | null
        }
        Update: {
          audit_type?: string
          created_at?: string | null
          credits_used?: number | null
          id?: string
          recommendations?: Json | null
          results_json?: Json | null
          score?: number | null
          user_id?: string
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_audits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_audits_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_credits: {
        Row: {
          created_at: string | null
          credits_remaining: number | null
          credits_used: number | null
          id: string
          last_purchased_at: string | null
          plan: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_remaining?: number | null
          credits_used?: number | null
          id?: string
          last_purchased_at?: string | null
          plan?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_remaining?: number | null
          credits_used?: number | null
          id?: string
          last_purchased_at?: string | null
          plan?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          access_token: string | null
          account_id: string | null
          account_name: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          lead_id: string | null
          platform: string
          token_expires_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          lead_id?: string | null
          platform: string
          token_expires_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          lead_id?: string | null
          platform?: string
          token_expires_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          account_id: string | null
          caption: string | null
          content_type: string | null
          created_at: string | null
          engagement_metrics: Json | null
          hashtags: string[] | null
          id: string
          image_url: string | null
          lead_id: string | null
          platform: string
          posted_at: string | null
          scheduled_at: string | null
          status: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          account_id?: string | null
          caption?: string | null
          content_type?: string | null
          created_at?: string | null
          engagement_metrics?: Json | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          lead_id?: string | null
          platform: string
          posted_at?: string | null
          scheduled_at?: string | null
          status?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          account_id?: string | null
          caption?: string | null
          content_type?: string | null
          created_at?: string | null
          engagement_metrics?: Json | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          lead_id?: string | null
          platform?: string
          posted_at?: string | null
          scheduled_at?: string | null
          status?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      strategies: {
        Row: {
          content_json: Json
          created_at: string | null
          difficulty_score: number | null
          executive_summary: string | null
          id: string
          lead_id: string
          pitch_angle: string | null
          pricing_suggestion: string | null
          recommended_services: string[] | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content_json?: Json
          created_at?: string | null
          difficulty_score?: number | null
          executive_summary?: string | null
          id?: string
          lead_id: string
          pitch_angle?: string | null
          pricing_suggestion?: string | null
          recommended_services?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content_json?: Json
          created_at?: string | null
          difficulty_score?: number | null
          executive_summary?: string | null
          id?: string
          lead_id?: string
          pitch_angle?: string | null
          pricing_suggestion?: string | null
          recommended_services?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategies_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          cancelled_at: string | null
          created_at: string | null
          currency: string | null
          expires_at: string
          feature: string
          id: string
          plan: string
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          cancelled_at?: string | null
          created_at?: string | null
          currency?: string | null
          expires_at: string
          feature: string
          id?: string
          plan: string
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          cancelled_at?: string | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string
          feature?: string
          id?: string
          plan?: string
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          category: string
          created_at: string | null
          css_template: string | null
          description: string | null
          html_template: string | null
          id: string
          is_premium: boolean | null
          name: string
          preview_url: string | null
          sections: Json | null
        }
        Insert: {
          category: string
          created_at?: string | null
          css_template?: string | null
          description?: string | null
          html_template?: string | null
          id: string
          is_premium?: boolean | null
          name: string
          preview_url?: string | null
          sections?: Json | null
        }
        Update: {
          category?: string
          created_at?: string | null
          css_template?: string | null
          description?: string | null
          html_template?: string | null
          id?: string
          is_premium?: boolean | null
          name?: string
          preview_url?: string | null
          sections?: Json | null
        }
        Relationships: []
      }
      websites: {
        Row: {
          business_details: Json | null
          business_name: string
          content_json: Json | null
          created_at: string | null
          custom_css: string | null
          deployed_url: string | null
          id: string
          lead_id: string | null
          preview_url: string | null
          seo_meta: Json | null
          status: string | null
          template_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_details?: Json | null
          business_name: string
          content_json?: Json | null
          created_at?: string | null
          custom_css?: string | null
          deployed_url?: string | null
          id?: string
          lead_id?: string | null
          preview_url?: string | null
          seo_meta?: Json | null
          status?: string | null
          template_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_details?: Json | null
          business_name?: string
          content_json?: Json | null
          created_at?: string | null
          custom_css?: string | null
          deployed_url?: string | null
          id?: string
          lead_id?: string | null
          preview_url?: string | null
          seo_meta?: Json | null
          status?: string | null
          template_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "websites_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "websites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
