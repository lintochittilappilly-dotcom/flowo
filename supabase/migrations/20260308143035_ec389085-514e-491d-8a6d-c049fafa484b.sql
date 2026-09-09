
-- New tables for the full dashboard system

-- Table: scheduled_jobs
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  scheduled_at timestamp with time zone NOT NULL,
  status varchar(50) DEFAULT 'pending',
  attempts integer DEFAULT 0,
  last_attempted_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE POLICY "Users can manage own jobs" ON scheduled_jobs FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS scheduled_jobs_pending_idx ON scheduled_jobs(status, scheduled_at) WHERE status = 'pending';

-- Table: brand_voice_profiles
CREATE TABLE IF NOT EXISTS brand_voice_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  voice_profile text NOT NULL,
  tone text[],
  sample_posts text,
  keywords text[],
  forbidden_words text[],
  last_trained_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

CREATE POLICY "Users can manage own voice profiles" ON brand_voice_profiles FOR ALL USING (auth.uid() = user_id);

-- Table: content_drafts
CREATE TABLE IF NOT EXISTS content_drafts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  platform varchar(50) NOT NULL,
  content text NOT NULL,
  topic varchar(500),
  tone varchar(100),
  content_type varchar(100),
  image_url varchar(500),
  hashtags text[],
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT now() + interval '7 days'
);

CREATE POLICY "Users can manage own drafts" ON content_drafts FOR ALL USING (auth.uid() = user_id);

-- Table: comments_cache
CREATE TABLE IF NOT EXISTS comments_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  platform varchar(50) NOT NULL,
  platform_comment_id varchar(255) UNIQUE NOT NULL,
  commenter_username varchar(255),
  commenter_display_name varchar(255),
  comment_text text NOT NULL,
  sentiment varchar(50),
  ai_suggested_reply text,
  is_replied boolean DEFAULT false,
  is_flagged boolean DEFAULT false,
  is_hidden boolean DEFAULT false,
  platform_created_at timestamp with time zone,
  fetched_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

CREATE POLICY "Users can manage own comments" ON comments_cache FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS comments_cache_user_unread_idx ON comments_cache(user_id, is_replied);

-- Table: trend_topics (public, no user_id)
CREATE TABLE IF NOT EXISTS trend_topics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  industry varchar(100) NOT NULL,
  topic varchar(500) NOT NULL,
  trend_score integer DEFAULT 0,
  growth_percent integer DEFAULT 0,
  trend_type varchar(50) DEFAULT 'hot_today',
  source varchar(100),
  fetched_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT now() + interval '24 hours'
);

-- Allow anyone authenticated to read trends
CREATE POLICY "Anyone can read trends" ON trend_topics FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS trend_topics_industry_idx ON trend_topics(industry, trend_type);

-- Table: team_members
CREATE TABLE IF NOT EXISTS team_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  member_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  invited_email varchar(255) NOT NULL,
  role varchar(50) DEFAULT 'editor',
  status varchar(50) DEFAULT 'pending',
  invited_at timestamp with time zone DEFAULT now(),
  accepted_at timestamp with time zone
);

CREATE POLICY "Owners can manage their team" ON team_members FOR ALL USING (auth.uid() = owner_user_id);

-- Table: billing_history
CREATE TABLE IF NOT EXISTS billing_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_invoice_id varchar(255),
  amount integer NOT NULL,
  currency varchar(10) DEFAULT 'usd',
  plan varchar(50),
  status varchar(50),
  invoice_url varchar(500),
  created_at timestamp with time zone DEFAULT now()
);

CREATE POLICY "Users can view own billing" ON billing_history FOR SELECT USING (auth.uid() = user_id);
