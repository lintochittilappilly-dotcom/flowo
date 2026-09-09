-- Monthly usage tracking — resets on 1st of every month
CREATE TABLE IF NOT EXISTS usage_tracking (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  month_year varchar(7) NOT NULL,
  posts_generated integer DEFAULT 0,
  ai_images_generated integer DEFAULT 0,
  api_calls_made integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, month_year)
);

ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON usage_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON usage_tracking FOR UPDATE USING (auth.uid() = user_id);

-- API keys table — for Agency plan users
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name varchar(100) NOT NULL,
  key_hash varchar(255) UNIQUE NOT NULL,
  key_prefix varchar(20) NOT NULL,
  last_used_at timestamp with time zone,
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  permissions jsonb DEFAULT '{"read": true, "write": true, "publish": false}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own API keys"
  ON api_keys FOR ALL USING (auth.uid() = user_id);

-- Function to get current month usage
CREATE OR REPLACE FUNCTION get_current_usage(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_month varchar(7);
  v_usage jsonb;
BEGIN
  v_month := to_char(now(), 'YYYY-MM');
  
  SELECT jsonb_build_object(
    'posts_generated', coalesce(posts_generated, 0),
    'ai_images_generated', coalesce(ai_images_generated, 0),
    'api_calls_made', coalesce(api_calls_made, 0),
    'month_year', v_month
  )
  INTO v_usage
  FROM usage_tracking
  WHERE user_id = p_user_id AND month_year = v_month;
  
  RETURN coalesce(v_usage, jsonb_build_object(
    'posts_generated', 0,
    'ai_images_generated', 0,
    'api_calls_made', 0,
    'month_year', v_month
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id uuid,
  p_field varchar,
  p_amount integer DEFAULT 1
)
RETURNS void AS $$
BEGIN
  INSERT INTO usage_tracking (user_id, month_year, posts_generated, ai_images_generated, api_calls_made)
  VALUES (
    p_user_id,
    to_char(now(), 'YYYY-MM'),
    CASE WHEN p_field = 'posts_generated' THEN p_amount ELSE 0 END,
    CASE WHEN p_field = 'ai_images_generated' THEN p_amount ELSE 0 END,
    CASE WHEN p_field = 'api_calls_made' THEN p_amount ELSE 0 END
  )
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET
    posts_generated = usage_tracking.posts_generated + 
      CASE WHEN p_field = 'posts_generated' THEN p_amount ELSE 0 END,
    ai_images_generated = usage_tracking.ai_images_generated + 
      CASE WHEN p_field = 'ai_images_generated' THEN p_amount ELSE 0 END,
    api_calls_made = usage_tracking.api_calls_made + 
      CASE WHEN p_field = 'api_calls_made' THEN p_amount ELSE 0 END,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;