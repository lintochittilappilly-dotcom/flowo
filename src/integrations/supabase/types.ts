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
      ai_insights: {
        Row: {
          created_at: string | null
          id: string
          insight_text: string
          insight_type: string | null
          is_read: boolean | null
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          insight_text: string
          insight_type?: string | null
          is_read?: boolean | null
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string | null
          id?: string
          insight_text?: string
          insight_type?: string | null
          is_read?: boolean | null
          user_id?: string
          week_end?: string
          week_start?: string
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
      api_keys: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: Json | null
          total_requests: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          permissions?: Json | null
          total_requests?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: Json | null
          total_requests?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_rate_limits: {
        Row: {
          key_hash: string
          request_count: number | null
          window_start: string
        }
        Insert: {
          key_hash: string
          request_count?: number | null
          window_start: string
        }
        Update: {
          key_hash?: string
          request_count?: number | null
          window_start?: string
        }
        Relationships: []
      }
      api_request_logs: {
        Row: {
          api_key_id: string | null
          created_at: string | null
          endpoint: string
          error_message: string | null
          id: string
          ip_address: string | null
          method: string
          request_body: Json | null
          response_time_ms: number | null
          status_code: number
          user_agent: string | null
          user_id: string
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method: string
          request_body?: Json | null
          response_time_ms?: number | null
          status_code: number
          user_agent?: string | null
          user_id: string
        }
        Update: {
          api_key_id?: string | null
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method?: string
          request_body?: Json | null
          response_time_ms?: number | null
          status_code?: number
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_request_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_history: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          invoice_url: string | null
          plan: string | null
          status: string | null
          stripe_invoice_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_url?: string | null
          plan?: string | null
          status?: string | null
          stripe_invoice_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_url?: string | null
          plan?: string | null
          status?: string | null
          stripe_invoice_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_activity: {
        Row: {
          activity_type: string
          brand_id: string
          created_at: string | null
          description: string
          id: string
          user_id: string
        }
        Insert: {
          activity_type: string
          brand_id: string
          created_at?: string | null
          description: string
          id?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          brand_id?: string
          created_at?: string | null
          description?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_activity_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_voice_profiles: {
        Row: {
          brand_id: string
          created_at: string | null
          forbidden_words: string[] | null
          id: string
          keywords: string[] | null
          last_trained_at: string | null
          sample_posts: string | null
          tone: string[] | null
          user_id: string
          voice_profile: string
        }
        Insert: {
          brand_id: string
          created_at?: string | null
          forbidden_words?: string[] | null
          id?: string
          keywords?: string[] | null
          last_trained_at?: string | null
          sample_posts?: string | null
          tone?: string[] | null
          user_id: string
          voice_profile: string
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          forbidden_words?: string[] | null
          id?: string
          keywords?: string[] | null
          last_trained_at?: string | null
          sample_posts?: string | null
          tone?: string[] | null
          user_id?: string
          voice_profile?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_voice_profiles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_voice_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          brand_description: string | null
          business_size: string | null
          color: string | null
          created_at: string | null
          id: string
          industry: string | null
          is_default: boolean | null
          name: string
          role: string | null
          sample_posts: string | null
          tone: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brand_description?: string | null
          business_size?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          is_default?: boolean | null
          name: string
          role?: string | null
          sample_posts?: string | null
          tone?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          brand_description?: string | null
          business_size?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          is_default?: boolean | null
          name?: string
          role?: string | null
          sample_posts?: string | null
          tone?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments_cache: {
        Row: {
          ai_suggested_reply: string | null
          comment_text: string
          commenter_display_name: string | null
          commenter_username: string | null
          created_at: string | null
          fetched_at: string | null
          id: string
          is_flagged: boolean | null
          is_hidden: boolean | null
          is_replied: boolean | null
          platform: string
          platform_comment_id: string
          platform_created_at: string | null
          post_id: string
          replied_at: string | null
          reply_saved_locally: boolean | null
          reply_text: string | null
          sentiment: string | null
          user_id: string
        }
        Insert: {
          ai_suggested_reply?: string | null
          comment_text: string
          commenter_display_name?: string | null
          commenter_username?: string | null
          created_at?: string | null
          fetched_at?: string | null
          id?: string
          is_flagged?: boolean | null
          is_hidden?: boolean | null
          is_replied?: boolean | null
          platform: string
          platform_comment_id: string
          platform_created_at?: string | null
          post_id: string
          replied_at?: string | null
          reply_saved_locally?: boolean | null
          reply_text?: string | null
          sentiment?: string | null
          user_id: string
        }
        Update: {
          ai_suggested_reply?: string | null
          comment_text?: string
          commenter_display_name?: string | null
          commenter_username?: string | null
          created_at?: string | null
          fetched_at?: string | null
          id?: string
          is_flagged?: boolean | null
          is_hidden?: boolean | null
          is_replied?: boolean | null
          platform?: string
          platform_comment_id?: string
          platform_created_at?: string | null
          post_id?: string
          replied_at?: string | null
          reply_saved_locally?: boolean | null
          reply_text?: string | null
          sentiment?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_cache_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_cache_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_drafts: {
        Row: {
          brand_id: string
          content: string
          content_type: string | null
          created_at: string | null
          expires_at: string | null
          hashtags: string[] | null
          id: string
          image_url: string | null
          platform: string
          tone: string | null
          topic: string | null
          user_id: string
        }
        Insert: {
          brand_id: string
          content: string
          content_type?: string | null
          created_at?: string | null
          expires_at?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          platform: string
          tone?: string | null
          topic?: string | null
          user_id: string
        }
        Update: {
          brand_id?: string
          content?: string
          content_type?: string | null
          created_at?: string | null
          expires_at?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          platform?: string
          tone?: string | null
          topic?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_drafts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_images: {
        Row: {
          created_at: string
          id: string
          image_type: string
          image_url: string
          platform: string | null
          prompt: string
          storage_path: string | null
          style: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_type?: string
          image_url: string
          platform?: string | null
          prompt: string
          storage_path?: string | null
          style?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_type?: string
          image_url?: string
          platform?: string | null
          prompt?: string
          storage_path?: string | null
          style?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          related_post_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          related_post_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_post_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_post_id_fkey"
            columns: ["related_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_states: {
        Row: {
          brand_id: string
          code_verifier: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          platform: string
          state_token: string
          user_id: string
        }
        Insert: {
          brand_id: string
          code_verifier?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          platform: string
          state_token: string
          user_id: string
        }
        Update: {
          brand_id?: string
          code_verifier?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          platform?: string
          state_token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_states_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_states_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_analytics: {
        Row: {
          clicks: number | null
          comments: number | null
          created_at: string | null
          engagement_rate: number | null
          fetched_at: string | null
          id: string
          impressions: number | null
          likes: number | null
          platform: string
          post_id: string
          reach: number | null
          shares: number | null
          user_id: string
        }
        Insert: {
          clicks?: number | null
          comments?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          fetched_at?: string | null
          id?: string
          impressions?: number | null
          likes?: number | null
          platform: string
          post_id: string
          reach?: number | null
          shares?: number | null
          user_id: string
        }
        Update: {
          clicks?: number | null
          comments?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          fetched_at?: string | null
          id?: string
          impressions?: number | null
          likes?: number | null
          platform?: string
          post_id?: string
          reach?: number | null
          shares?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          brand_id: string
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          platform: string
          platform_post_id: string | null
          published_at: string | null
          scheduled_at: string | null
          social_account_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brand_id: string
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          platform: string
          platform_post_id?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          social_account_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          brand_id?: string
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          platform?: string
          platform_post_id?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          social_account_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_brand_id: string | null
          brand_description: string | null
          brand_tones: string[] | null
          business_name: string | null
          business_size: string | null
          completed_onboarding: boolean | null
          connected_platforms: string[] | null
          created_at: string
          dismissed_setup_checklist: boolean | null
          email: string | null
          full_name: string | null
          id: string
          industry: string | null
          plan: string | null
          role: string | null
          sample_posts: string | null
          shown_welcome_modal: boolean | null
          trial_ends_at: string | null
          trial_expired: boolean | null
          updated_at: string | null
        }
        Insert: {
          active_brand_id?: string | null
          brand_description?: string | null
          brand_tones?: string[] | null
          business_name?: string | null
          business_size?: string | null
          completed_onboarding?: boolean | null
          connected_platforms?: string[] | null
          created_at?: string
          dismissed_setup_checklist?: boolean | null
          email?: string | null
          full_name?: string | null
          id: string
          industry?: string | null
          plan?: string | null
          role?: string | null
          sample_posts?: string | null
          shown_welcome_modal?: boolean | null
          trial_ends_at?: string | null
          trial_expired?: boolean | null
          updated_at?: string | null
        }
        Update: {
          active_brand_id?: string | null
          brand_description?: string | null
          brand_tones?: string[] | null
          business_name?: string | null
          business_size?: string | null
          completed_onboarding?: boolean | null
          connected_platforms?: string[] | null
          created_at?: string
          dismissed_setup_checklist?: boolean | null
          email?: string | null
          full_name?: string | null
          id?: string
          industry?: string | null
          plan?: string | null
          role?: string | null
          sample_posts?: string | null
          shown_welcome_modal?: boolean | null
          trial_ends_at?: string | null
          trial_expired?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_brand_id_fkey"
            columns: ["active_brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_trends: {
        Row: {
          id: string
          industry: string | null
          is_posted: boolean | null
          notes: string | null
          saved_at: string | null
          topic: string
          trend_score: number | null
          user_id: string
        }
        Insert: {
          id?: string
          industry?: string | null
          is_posted?: boolean | null
          notes?: string | null
          saved_at?: string | null
          topic: string
          trend_score?: number | null
          user_id: string
        }
        Update: {
          id?: string
          industry?: string | null
          is_posted?: boolean | null
          notes?: string | null
          saved_at?: string | null
          topic?: string
          trend_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_trends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_jobs: {
        Row: {
          attempts: number | null
          created_at: string | null
          error_message: string | null
          id: string
          last_attempted_at: string | null
          post_id: string
          scheduled_at: string
          status: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_attempted_at?: string | null
          post_id: string
          scheduled_at: string
          status?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_attempted_at?: string | null
          post_id?: string
          scheduled_at?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_jobs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
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
          brand_id: string
          connected_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          needs_reconnect: boolean | null
          platform: string
          platform_followers_count: number | null
          platform_profile_picture: string | null
          platform_user_id: string | null
          platform_username: string | null
          refresh_token: string | null
          scopes: string[] | null
          token_expires_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string | null
          brand_id: string
          connected_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          needs_reconnect?: boolean | null
          platform: string
          platform_followers_count?: number | null
          platform_profile_picture?: string | null
          platform_user_id?: string | null
          platform_username?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string | null
          brand_id?: string
          connected_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          needs_reconnect?: boolean | null
          platform?: string
          platform_followers_count?: number | null
          platform_profile_picture?: string | null
          platform_user_id?: string | null
          platform_username?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
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
      team_activity: {
        Row: {
          action_type: string
          actor_name: string | null
          actor_user_id: string | null
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          owner_user_id: string
        }
        Insert: {
          action_type: string
          actor_name?: string | null
          actor_user_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          owner_user_id: string
        }
        Update: {
          action_type?: string
          actor_name?: string | null
          actor_user_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          owner_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_activity_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_activity_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          accepted_at: string | null
          full_name: string | null
          id: string
          invite_expires_at: string | null
          invite_token: string | null
          invited_at: string | null
          invited_email: string
          last_active_at: string | null
          member_user_id: string | null
          owner_user_id: string
          permissions: Json | null
          role: string | null
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          full_name?: string | null
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_at?: string | null
          invited_email: string
          last_active_at?: string | null
          member_user_id?: string | null
          owner_user_id: string
          permissions?: Json | null
          role?: string | null
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          full_name?: string | null
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_at?: string | null
          invited_email?: string
          last_active_at?: string | null
          member_user_id?: string | null
          owner_user_id?: string
          permissions?: Json | null
          role?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_member_user_id_fkey"
            columns: ["member_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trend_topics: {
        Row: {
          expires_at: string | null
          fetched_at: string | null
          growth_percent: number | null
          id: string
          industry: string
          source: string | null
          topic: string
          trend_score: number | null
          trend_type: string | null
        }
        Insert: {
          expires_at?: string | null
          fetched_at?: string | null
          growth_percent?: number | null
          id?: string
          industry: string
          source?: string | null
          topic: string
          trend_score?: number | null
          trend_type?: string | null
        }
        Update: {
          expires_at?: string | null
          fetched_at?: string | null
          growth_percent?: number | null
          id?: string
          industry?: string
          source?: string | null
          topic?: string
          trend_score?: number | null
          trend_type?: string | null
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          ai_images_generated: number | null
          api_calls_made: number | null
          created_at: string | null
          id: string
          month_year: string
          posts_generated: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_images_generated?: number | null
          api_calls_made?: number | null
          created_at?: string | null
          id?: string
          month_year: string
          posts_generated?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_images_generated?: number | null
          api_calls_made?: number | null
          created_at?: string | null
          id?: string
          month_year?: string
          posts_generated?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_user_id_fkey"
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
      cleanup_expired_oauth_states: { Args: never; Returns: undefined }
      get_current_usage: { Args: { p_user_id: string }; Returns: Json }
      get_dashboard_stats: { Args: { p_user_id: string }; Returns: Json }
      has_active_access: { Args: { p_user_id: string }; Returns: boolean }
      increment_api_key_requests: {
        Args: { p_key_hash: string }
        Returns: undefined
      }
      increment_usage: {
        Args: { p_amount?: number; p_field: string; p_user_id: string }
        Returns: undefined
      }
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
