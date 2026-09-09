# Supabase Setup Guide — Flowo

Complete step-by-step guide to set up the Flowo database, authentication, storage, Edge Functions, and cron jobs.

---

## 📋 Overview

Flowo uses Supabase as its complete backend infrastructure:
- **PostgreSQL Database**: 25+ tables with Row Level Security
- **Authentication**: Email/password + OAuth providers
- **Storage**: File uploads for images and brand assets  
- **Edge Functions**: 10 serverless functions for AI, billing, and automation
- **Real-time**: Live updates for team collaboration

## Step 1 — Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Choose your organization
4. Enter project name: `flowo-production`
5. Set a **strong database password** — save it securely
6. Choose region closest to your users
7. Click **"Create new project"** — wait 2-3 minutes for provisioning

## Step 2 — Get Your API Keys

1. Go to **Settings → API**
2. Copy these three values to your `.env` file:

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=your-project-id

# ⚠️ Service role key - keep secret, never expose client-side
# Add this to Supabase Edge Function secrets, not .env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 3 — Generate Token Encryption Key

This key encrypts social platform OAuth tokens stored in the database.

```bash
# Run this command to generate a secure encryption key
openssl rand -base64 32

# Copy the output - you'll need it for both .env and Supabase secrets
```

## Step 4 — Database Setup

### 4.1 — Enable Required Extensions

Go to **Database → Extensions** and enable:

| Extension | Purpose |
|-----------|---------|
| **pg_cron** | Scheduled jobs for auto-publishing posts |
| **pg_net** | HTTP requests from database to Edge Functions |
| **uuid-ossp** | UUID generation for primary keys |

Click the toggle to enable each extension.

### 4.2 — Create Core Tables

Go to **SQL Editor → New Query**. Run this SQL to create all tables:

```sql
-- User profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  full_name VARCHAR,
  email VARCHAR,
  plan VARCHAR DEFAULT 'starter',
  business_name VARCHAR,
  industry VARCHAR,
  role VARCHAR,
  business_size VARCHAR,
  brand_description TEXT,
  brand_tones VARCHAR[],
  sample_posts TEXT,
  connected_platforms VARCHAR[],
  active_brand_id UUID,
  completed_onboarding BOOLEAN DEFAULT false,
  shown_welcome_modal BOOLEAN DEFAULT false,
  dismissed_setup_checklist BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Brands table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR NOT NULL,
  brand_description TEXT,
  industry VARCHAR,
  business_size VARCHAR,
  role VARCHAR,
  tone VARCHAR[],
  sample_posts TEXT,
  color VARCHAR DEFAULT '#6D28D9',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Social accounts table (encrypted tokens)
CREATE TABLE public.social_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  platform VARCHAR NOT NULL,
  account_id VARCHAR,
  account_name VARCHAR,
  platform_user_id VARCHAR,
  platform_username VARCHAR,
  platform_profile_picture VARCHAR,
  platform_followers_count INTEGER DEFAULT 0,
  access_token TEXT, -- AES-256 encrypted
  refresh_token TEXT, -- AES-256 encrypted
  token_expires_at TIMESTAMPTZ,
  scopes VARCHAR[],
  is_active BOOLEAN DEFAULT true,
  needs_reconnect BOOLEAN DEFAULT false,
  error_message TEXT,
  connected_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  social_account_id UUID,
  platform VARCHAR NOT NULL,
  content TEXT NOT NULL,
  image_url VARCHAR,
  status VARCHAR DEFAULT 'draft', -- draft, scheduled, published, failed
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  platform_post_id VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Post analytics table
CREATE TABLE public.post_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  platform VARCHAR NOT NULL,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement_rate DECIMAL DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Comments cache table
CREATE TABLE public.comments_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  platform VARCHAR NOT NULL,
  platform_comment_id VARCHAR NOT NULL,
  comment_text TEXT NOT NULL,
  commenter_username VARCHAR,
  commenter_display_name VARCHAR,
  platform_created_at TIMESTAMPTZ,
  sentiment VARCHAR,
  is_replied BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  reply_text TEXT,
  ai_suggested_reply TEXT,
  replied_at TIMESTAMPTZ,
  reply_saved_locally BOOLEAN DEFAULT false,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Content drafts table (temporary AI generations)
CREATE TABLE public.content_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  platform VARCHAR NOT NULL,
  content TEXT NOT NULL,
  topic VARCHAR,
  tone VARCHAR,
  content_type VARCHAR,
  image_url VARCHAR,
  hashtags VARCHAR[],
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Brand voice profiles table
CREATE TABLE public.brand_voice_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  voice_profile TEXT NOT NULL,
  tone VARCHAR[],
  keywords VARCHAR[],
  forbidden_words VARCHAR[],
  sample_posts TEXT,
  last_trained_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Team members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  member_user_id UUID,
  invited_email VARCHAR NOT NULL,
  full_name VARCHAR,
  role VARCHAR DEFAULT 'editor',
  permissions JSONB DEFAULT '{"dashboard": true, "create_post": true, "publish_posts": false, "delete_posts": false, "calendar": true, "comments": true, "analytics": false, "trends": true, "brands": false, "settings": false, "manage_team": false}',
  status VARCHAR DEFAULT 'pending', -- pending, accepted, expired
  invite_token VARCHAR,
  invite_expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ
);

-- Team activity log table
CREATE TABLE public.team_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  actor_user_id UUID,
  actor_name VARCHAR,
  action_type VARCHAR NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scheduled jobs table
CREATE TABLE public.scheduled_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status VARCHAR DEFAULT 'pending', -- pending, processing, completed, failed
  attempts INTEGER DEFAULT 0,
  last_attempted_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- OAuth state management table
CREATE TABLE public.oauth_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  platform VARCHAR NOT NULL,
  state_token VARCHAR NOT NULL,
  code_verifier VARCHAR, -- PKCE for platforms that support it
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '10 minutes'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  related_post_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trend topics table (global, read-only for users)
CREATE TABLE public.trend_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic VARCHAR NOT NULL,
  industry VARCHAR NOT NULL,
  trend_score INTEGER DEFAULT 0,
  growth_percent INTEGER DEFAULT 0,
  trend_type VARCHAR DEFAULT 'hot_today',
  source VARCHAR,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours')
);

-- Saved trends table (user's saved trends)
CREATE TABLE public.saved_trends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic VARCHAR NOT NULL,
  industry VARCHAR,
  trend_score INTEGER DEFAULT 0,
  notes TEXT,
  is_posted BOOLEAN DEFAULT false,
  saved_at TIMESTAMPTZ DEFAULT now()
);

-- Usage tracking table
CREATE TABLE public.usage_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month_year VARCHAR NOT NULL, -- "2024-03"
  posts_generated INTEGER DEFAULT 0,
  ai_images_generated INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- Billing history table
CREATE TABLE public.billing_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL, -- cents
  currency VARCHAR DEFAULT 'usd',
  plan VARCHAR,
  status VARCHAR,
  stripe_invoice_id VARCHAR,
  invoice_url VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI insights table (weekly summaries)
CREATE TABLE public.ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  insight_type VARCHAR DEFAULT 'weekly_summary',
  insight_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- API keys table (for public API)
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR NOT NULL,
  key_prefix VARCHAR NOT NULL,
  key_hash VARCHAR NOT NULL,
  permissions JSONB DEFAULT '{"read": true, "write": true, "publish": false}',
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  total_requests INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- API rate limits table
CREATE TABLE public.api_rate_limits (
  key_hash VARCHAR NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER DEFAULT 1,
  PRIMARY KEY (key_hash, window_start)
);

-- API request logs table
CREATE TABLE public.api_request_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  api_key_id UUID,
  method VARCHAR NOT NULL,
  endpoint VARCHAR NOT NULL,
  request_body JSONB,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  error_message TEXT,
  ip_address VARCHAR,
  user_agent VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Generated images table
CREATE TABLE public.generated_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  image_type TEXT DEFAULT 'freeform',
  platform TEXT,
  style TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Brand activity table
CREATE TABLE public.brand_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  activity_type VARCHAR NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.3 — Row Level Security Policies

Run this SQL to enable RLS and create security policies:

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_activity ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Brands policies
CREATE POLICY "Users can manage own brands" ON public.brands FOR ALL USING (auth.uid() = user_id);

-- Social accounts policies
CREATE POLICY "Users can manage own social accounts" ON public.social_accounts FOR ALL USING (auth.uid() = user_id);

-- Posts policies
CREATE POLICY "Users can manage own posts" ON public.posts FOR ALL USING (auth.uid() = user_id);

-- Post analytics policies
CREATE POLICY "Users can manage own post analytics" ON public.post_analytics FOR ALL USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Users can manage own comments" ON public.comments_cache FOR ALL USING (auth.uid() = user_id);

-- Content drafts policies
CREATE POLICY "Users can manage own drafts" ON public.content_drafts FOR ALL USING (auth.uid() = user_id);

-- Brand voice profiles policies
CREATE POLICY "Users can manage own voice profiles" ON public.brand_voice_profiles FOR ALL USING (auth.uid() = user_id);

-- Team members policies
CREATE POLICY "Owners can manage their team" ON public.team_members FOR ALL USING (auth.uid() = owner_user_id);
CREATE POLICY "Members view own record" ON public.team_members FOR SELECT USING (auth.uid() = member_user_id);

-- Team activity policies
CREATE POLICY "Owners view team activity" ON public.team_activity FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "Owners insert team activity" ON public.team_activity FOR INSERT WITH CHECK (auth.uid() = owner_user_id);

-- Scheduled jobs policies
CREATE POLICY "Users can manage own jobs" ON public.scheduled_jobs FOR ALL USING (auth.uid() = user_id);

-- OAuth states policies
CREATE POLICY "Users can manage own oauth states" ON public.oauth_states FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Trend topics policies (read-only for all users)
CREATE POLICY "Anyone can read trends" ON public.trend_topics FOR SELECT USING (true);

-- Saved trends policies
CREATE POLICY "Users can manage own saved trends" ON public.saved_trends FOR ALL USING (auth.uid() = user_id);

-- Usage tracking policies
CREATE POLICY "Users can view own usage" ON public.usage_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own usage" ON public.usage_tracking FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON public.usage_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Billing history policies
CREATE POLICY "Users can view own billing" ON public.billing_history FOR SELECT USING (auth.uid() = user_id);

-- AI insights policies
CREATE POLICY "Users can manage own insights" ON public.ai_insights FOR ALL USING (auth.uid() = user_id);

-- API keys policies
CREATE POLICY "Users can manage own API keys" ON public.api_keys FOR ALL USING (auth.uid() = user_id);

-- API rate limits policies (service role only)
CREATE POLICY "Service role manages rate limits" ON public.api_rate_limits FOR ALL USING (true);

-- API request logs policies
CREATE POLICY "Users view own API logs" ON public.api_request_logs FOR SELECT USING (auth.uid() = user_id);

-- Generated images policies
CREATE POLICY "Users can manage own generated images" ON public.generated_images FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Brand activity policies
CREATE POLICY "Users can manage own brand activity" ON public.brand_activity FOR ALL USING (auth.uid() = user_id);
```

### 4.4 — Database Functions

Create helper functions for the application:

```sql
-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get dashboard statistics
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  current_week_reach BIGINT;
  previous_week_reach BIGINT;
  current_week_engagements BIGINT;
  previous_week_engagements BIGINT;
  reach_change NUMERIC;
  engagement_change NUMERIC;
BEGIN
  -- Current week stats
  SELECT 
    COALESCE(SUM(pa.reach), 0),
    COALESCE(SUM(pa.likes + pa.comments + pa.shares), 0)
  INTO current_week_reach, current_week_engagements
  FROM posts p
  LEFT JOIN post_analytics pa ON pa.post_id = p.id
  WHERE p.user_id = p_user_id
    AND p.status = 'published'
    AND p.published_at >= date_trunc('week', now());

  -- Previous week stats
  SELECT 
    COALESCE(SUM(pa.reach), 0),
    COALESCE(SUM(pa.likes + pa.comments + pa.shares), 0)
  INTO previous_week_reach, previous_week_engagements
  FROM posts p
  LEFT JOIN post_analytics pa ON pa.post_id = p.id
  WHERE p.user_id = p_user_id
    AND p.status = 'published'
    AND p.published_at >= date_trunc('week', now()) - INTERVAL '7 days'
    AND p.published_at < date_trunc('week', now());

  -- Calculate percentage changes
  IF previous_week_reach > 0 THEN
    reach_change := ROUND(((current_week_reach - previous_week_reach)::NUMERIC / previous_week_reach) * 100, 1);
  ELSE
    reach_change := 0;
  END IF;

  IF previous_week_engagements > 0 THEN
    engagement_change := ROUND(((current_week_engagements - previous_week_engagements)::NUMERIC / previous_week_engagements) * 100, 1);
  ELSE
    engagement_change := 0;
  END IF;

  SELECT json_build_object(
    'total_reach_this_week', current_week_reach,
    'total_engagements_this_week', current_week_engagements,
    'posts_published_this_week', (
      SELECT COUNT(*) FROM posts 
      WHERE user_id = p_user_id AND status = 'published' 
      AND published_at >= date_trunc('week', now())
    ),
    'posts_scheduled_upcoming', (
      SELECT COUNT(*) FROM posts 
      WHERE user_id = p_user_id AND status = 'scheduled' 
      AND scheduled_at > now()
    ),
    'reach_change_percent', reach_change,
    'engagement_change_percent', engagement_change
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get current usage for plan limits
CREATE OR REPLACE FUNCTION public.get_current_usage(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_month VARCHAR(7);
  v_usage JSONB;
BEGIN
  v_month := to_char(now(), 'YYYY-MM');
  
  SELECT jsonb_build_object(
    'posts_generated', COALESCE(posts_generated, 0),
    'ai_images_generated', COALESCE(ai_images_generated, 0),
    'api_calls_made', COALESCE(api_calls_made, 0),
    'month_year', v_month
  )
  INTO v_usage
  FROM public.usage_tracking
  WHERE user_id = p_user_id AND month_year = v_month;
  
  RETURN COALESCE(v_usage, jsonb_build_object(
    'posts_generated', 0,
    'ai_images_generated', 0,
    'api_calls_made', 0,
    'month_year', v_month
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Increment usage tracking
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id UUID,
  p_field VARCHAR,
  p_amount INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.usage_tracking (user_id, month_year, posts_generated, ai_images_generated, api_calls_made)
  VALUES (
    p_user_id,
    to_char(now(), 'YYYY-MM'),
    CASE WHEN p_field = 'posts_generated' THEN p_amount ELSE 0 END,
    CASE WHEN p_field = 'ai_images_generated' THEN p_amount ELSE 0 END,
    CASE WHEN p_field = 'api_calls_made' THEN p_amount ELSE 0 END
  )
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET
    posts_generated = public.usage_tracking.posts_generated + 
      CASE WHEN p_field = 'posts_generated' THEN p_amount ELSE 0 END,
    ai_images_generated = public.usage_tracking.ai_images_generated + 
      CASE WHEN p_field = 'ai_images_generated' THEN p_amount ELSE 0 END,
    api_calls_made = public.usage_tracking.api_calls_made + 
      CASE WHEN p_field = 'api_calls_made' THEN p_amount ELSE 0 END,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Increment API key usage
CREATE OR REPLACE FUNCTION public.increment_api_key_requests(p_key_hash VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE public.api_keys
  SET total_requests = COALESCE(total_requests, 0) + 1, last_used_at = now()
  WHERE key_hash = p_key_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Cleanup expired OAuth states
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.oauth_states WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### 4.5 — Database Triggers

Create triggers for automatic functionality:

```sql
-- Auto-create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_brands
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_posts
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

### 4.6 — Indexes for Performance

Create indexes for frequently queried columns:

```sql
-- Indexes for better query performance
CREATE INDEX idx_brands_user_id ON public.brands (user_id);
CREATE INDEX idx_posts_user_id ON public.posts (user_id);
CREATE INDEX idx_posts_status ON public.posts (status);
CREATE INDEX idx_posts_scheduled_at ON public.posts (scheduled_at);
CREATE INDEX idx_social_accounts_user_id ON public.social_accounts (user_id);
CREATE INDEX idx_social_accounts_brand_id ON public.social_accounts (brand_id);
CREATE INDEX idx_post_analytics_post_id ON public.post_analytics (post_id);
CREATE INDEX idx_comments_cache_post_id ON public.comments_cache (post_id);
CREATE INDEX idx_team_members_owner_user_id ON public.team_members (owner_user_id);
CREATE INDEX idx_usage_tracking_user_month ON public.usage_tracking (user_id, month_year);
CREATE INDEX idx_oauth_states_expires_at ON public.oauth_states (expires_at);
```

## Step 5 — Configure Authentication

### 5.1 — Enable Email Authentication
1. Go to **Authentication → Providers**
2. Enable **Email** provider
3. Enable **Confirm email** for security

### 5.2 — Enable Google OAuth
1. In **Authentication → Providers**, enable **Google**
2. Go to [Google Cloud Console](https://console.cloud.google.com)
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
5. Copy Client ID and Secret to Supabase

### 5.3 — Configure Redirect URLs
In **Authentication → URL Configuration**, add these to Redirect URLs:
```
http://localhost:8080/auth/callback
https://yourdomain.com/auth/callback
https://yourdomain.com/invite/accept
```

### 5.4 — Customize Email Templates
In **Authentication → Email Templates**, update:
- **Confirm signup** template with Flowo branding
- **Invite user** template
- **Reset password** template

## Step 6 — Set Up Storage

### 6.1 — Create Storage Buckets

Go to **Storage** and create these buckets:

| Bucket Name | Public | Max File Size | Allowed Types |
|-------------|--------|---------------|---------------|
| `generated-images` | ✅ Yes | 10MB | image/jpeg, image/png, image/webp |
| `post-images` | ✅ Yes | 10MB | image/jpeg, image/png, image/webp, image/gif |
| `brand-assets` | ✅ Yes | 5MB | image/jpeg, image/png, image/svg+xml |

### 6.2 — Set Storage Policies

Run this SQL to set up storage security:

```sql
-- Users can upload to their own folder (folder name = user ID)
CREATE POLICY "Users upload own files" ON storage.objects 
  FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own files
CREATE POLICY "Users update own files" ON storage.objects 
  FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own files
CREATE POLICY "Users delete own files" ON storage.objects 
  FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Public read access for all buckets
CREATE POLICY "Public read access" ON storage.objects 
  FOR SELECT USING (bucket_id IN ('generated-images', 'post-images', 'brand-assets'));
```

## Step 7 — Deploy Edge Functions

### 7.1 — Install Supabase CLI

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Find your project ref in **Settings → General → Reference ID**.

### 7.2 — Set Edge Function Secrets

```bash
# Core secrets
supabase secrets set SUPABASE_URL="https://your-project.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
supabase secrets set TOKEN_ENCRYPTION_KEY="your-32-byte-base64-key"

# AI Services
supabase secrets set OPENAI_API_KEY="sk-your-openai-key"

# Stripe (optional)
supabase secrets set STRIPE_SECRET_KEY="sk_test_your-stripe-key"
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

# Platform-specific OAuth (add as needed)
supabase secrets set INSTAGRAM_APP_ID=""
supabase secrets set INSTAGRAM_APP_SECRET=""
supabase secrets set LINKEDIN_CLIENT_ID=""
supabase secrets set LINKEDIN_CLIENT_SECRET=""
supabase secrets set TWITTER_CLIENT_ID=""
supabase secrets set TWITTER_CLIENT_SECRET=""
supabase secrets set FACEBOOK_APP_ID=""
supabase secrets set FACEBOOK_APP_SECRET=""
supabase secrets set TIKTOK_CLIENT_KEY=""
supabase secrets set TIKTOK_CLIENT_SECRET=""
supabase secrets set PINTEREST_APP_ID=""
supabase secrets set PINTEREST_APP_SECRET=""

# Email service (optional)
supabase secrets set RESEND_API_KEY="re_your-resend-key"
```

### 7.3 — Deploy All Edge Functions

The project includes 10 Edge Functions:

- **api-keys**: API key management and rate limiting
- **api-v1**: Public API endpoints for third-party integrations
- **generate-image**: AI image generation with OpenAI DALL-E
- **generate-trend-content**: AI content generation based on trends
- **generate-weekly-insights**: Weekly AI performance reports
- **process-scheduled-posts**: Auto-publish scheduled posts to platforms
- **social-oauth**: Social platform OAuth and token management
- **stripe-billing**: Stripe checkout and subscription management
- **stripe-webhook**: Stripe webhook event processing
- **sync-post-analytics**: Fetch analytics from social platforms

Deploy all functions:

```bash
supabase functions deploy api-keys
supabase functions deploy api-v1
supabase functions deploy generate-image
supabase functions deploy generate-trend-content
supabase functions deploy generate-weekly-insights
supabase functions deploy process-scheduled-posts
supabase functions deploy social-oauth
supabase functions deploy stripe-billing
supabase functions deploy stripe-webhook
supabase functions deploy sync-post-analytics
```

Verify deployment in **Supabase Dashboard → Edge Functions**.

### 7.4 — Set Up Cron Jobs with pg_cron

Run this SQL to enable automated background tasks:

```sql
-- Set app settings for cron jobs
SELECT pg_catalog.set_config('app.supabase_url', 'https://your-project.supabase.co', false);
SELECT pg_catalog.set_config('app.service_role_key', 'your-service-role-key', false);

-- Auto-publish scheduled posts every minute
SELECT cron.schedule(
  'process-scheduled-posts',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/process-scheduled-posts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Sync post analytics every 6 hours
SELECT cron.schedule(
  'sync-post-analytics',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/sync-post-analytics',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Generate weekly insights every Monday at 9 AM UTC
SELECT cron.schedule(
  'generate-weekly-insights',
  '0 9 * * 1',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/generate-weekly-insights',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Cleanup expired OAuth states daily at midnight
SELECT cron.schedule(
  'cleanup-oauth-states',
  '0 0 * * *',
  $$
  SELECT public.cleanup_expired_oauth_states();
  $$
);

-- Expire trials daily at midnight UTC
-- Marks users whose 14-day trial has ended so they must choose a paid plan
SELECT cron.schedule(
  'expire-trials-daily',
  '0 0 * * *',
  $$
  UPDATE profiles
  SET plan = 'expired', trial_expired = true
  WHERE plan = 'trial'
    AND trial_ends_at < now()
    AND trial_expired = false;
  $$
);

-- Send trial expiry warning emails daily at 10 AM UTC
-- Emails users with 3 days and 1 day remaining on their trial
SELECT cron.schedule(
  'check-trial-expiry-daily',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://mguavdrifefyzswdiqww.supabase.co/functions/v1/check-trial-expiry',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ndWF2ZHJpZmVmeXpzd2RpcXd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NzIwNzIsImV4cCI6MjA4ODU0ODA3Mn0.vm6AGKdlSZDYa-0QKSiUh7lWqkC9Y9b9Pf_f-RmAKxk"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

Verify cron jobs are registered:
```sql
SELECT * FROM cron.job;
```

## Step 8 — Verify Setup

1. **Test Database Connection**: Visit your app and try to sign up
2. **Check Tables**: Go to **Supabase → Database → Tables** — all 25 tables should be visible
3. **Test Auth**: Create a test account and verify the profile is auto-created
4. **Test Storage**: Try uploading an image in the app
5. **Check Edge Functions**: Go to **Edge Functions** tab and verify all are deployed
6. **Test Cron Jobs**: Check **Edge Functions → Logs** for cron execution

## 🔧 Troubleshooting

### Common Issues

**"relation does not exist" error**
- Re-run the table creation SQL
- Check that RLS policies were created after tables

**Edge Function deployment fails**
- Verify you're linked to the correct project: `supabase projects list`
- Check your CLI is logged in: `supabase auth`

**Cron jobs not running**
- Verify pg_cron extension is enabled
- Check app settings are configured with correct URLs and keys
- Look at Edge Function logs for cron execution errors

**Authentication not working**
- Check redirect URLs match exactly (including http vs https)
- Verify the handle_new_user trigger exists
- Test with email confirmation disabled first

**Storage uploads failing**
- Verify bucket policies are created correctly
- Check file size and type restrictions
- Ensure bucket is marked as public

### Getting Help

- 📖 [Supabase Documentation](https://supabase.com/docs)
- 💬 [Supabase Discord](https://discord.supabase.com)
- 🐛 Check Edge Function logs in the Supabase dashboard
- 🔍 Use the Supabase SQL editor to query tables directly

---

**Your Supabase backend is now fully configured! 🎉**

Next steps: Configure [Stripe billing](./STRIPE_SETUP.md) and [social platform connections](./API_CONNECT.md).
