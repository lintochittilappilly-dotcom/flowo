
-- Add missing columns to comments_cache
ALTER TABLE comments_cache
  ADD COLUMN IF NOT EXISTS reply_text text,
  ADD COLUMN IF NOT EXISTS replied_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS reply_saved_locally boolean DEFAULT false;

-- Brand activity log
CREATE TABLE IF NOT EXISTS brand_activity (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type varchar(100) NOT NULL,
  description text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE brand_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own brand activity"
  ON brand_activity FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS brand_activity_brand_idx ON brand_activity(brand_id, created_at DESC);
