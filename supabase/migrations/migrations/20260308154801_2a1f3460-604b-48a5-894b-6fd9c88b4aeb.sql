
CREATE TABLE IF NOT EXISTS saved_trends (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  topic varchar(500) NOT NULL,
  industry varchar(100),
  trend_score integer DEFAULT 0,
  notes text,
  is_posted boolean DEFAULT false,
  saved_at timestamp with time zone DEFAULT now()
);

ALTER TABLE saved_trends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved trends"
  ON saved_trends FOR ALL USING (auth.uid() = user_id);
