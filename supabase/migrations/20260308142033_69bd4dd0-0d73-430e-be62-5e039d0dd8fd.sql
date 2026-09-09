
-- Add missing columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email varchar(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dismissed_setup_checklist boolean DEFAULT false;

-- Table: brands
CREATE TABLE IF NOT EXISTS brands (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name varchar(255) NOT NULL,
  industry varchar(100),
  role varchar(100),
  business_size varchar(50),
  tone text[],
  brand_description text,
  sample_posts text,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own brands" ON brands FOR ALL USING (auth.uid() = user_id);

-- Table: social_accounts
CREATE TABLE IF NOT EXISTS social_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  platform varchar(50) NOT NULL,
  account_name varchar(255),
  account_id varchar(255),
  access_token text,
  refresh_token text,
  token_expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  connected_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own social accounts" ON social_accounts FOR ALL USING (auth.uid() = user_id);

-- Table: posts
CREATE TABLE IF NOT EXISTS posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  social_account_id uuid REFERENCES social_accounts(id) ON DELETE SET NULL,
  platform varchar(50) NOT NULL,
  content text NOT NULL,
  image_url varchar(500),
  status varchar(50) DEFAULT 'draft',
  scheduled_at timestamp with time zone,
  published_at timestamp with time zone,
  platform_post_id varchar(255),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own posts" ON posts FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS posts_user_status_idx ON posts(user_id, status);
CREATE INDEX IF NOT EXISTS posts_scheduled_at_idx ON posts(user_id, scheduled_at);
CREATE INDEX IF NOT EXISTS posts_published_at_idx ON posts(user_id, published_at);

-- Table: post_analytics
CREATE TABLE IF NOT EXISTS post_analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  platform varchar(50) NOT NULL,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  reach integer DEFAULT 0,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  engagement_rate numeric(5,2) DEFAULT 0,
  fetched_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own post analytics" ON post_analytics FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS post_analytics_user_idx ON post_analytics(user_id);
CREATE INDEX IF NOT EXISTS post_analytics_post_idx ON post_analytics(post_id);

-- Table: ai_insights
CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  insight_text text NOT NULL,
  insight_type varchar(100) DEFAULT 'weekly_summary',
  week_start date NOT NULL,
  week_end date NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own insights" ON ai_insights FOR ALL USING (auth.uid() = user_id);

-- Table: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type varchar(100) NOT NULL,
  title varchar(255) NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  related_post_id uuid REFERENCES posts(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON notifications(user_id, is_read);

-- Function: get_dashboard_stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id uuid)
RETURNS json AS $$
DECLARE
  result json;
  current_week_reach bigint;
  previous_week_reach bigint;
  current_week_engagements bigint;
  previous_week_engagements bigint;
  reach_change numeric;
  engagement_change numeric;
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
    AND p.published_at >= date_trunc('week', now()) - interval '7 days'
    AND p.published_at < date_trunc('week', now());

  -- Calculate change percentages
  IF previous_week_reach > 0 THEN
    reach_change := ROUND(((current_week_reach - previous_week_reach)::numeric / previous_week_reach) * 100, 1);
  ELSE
    reach_change := 0;
  END IF;

  IF previous_week_engagements > 0 THEN
    engagement_change := ROUND(((current_week_engagements - previous_week_engagements)::numeric / previous_week_engagements) * 100, 1);
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
