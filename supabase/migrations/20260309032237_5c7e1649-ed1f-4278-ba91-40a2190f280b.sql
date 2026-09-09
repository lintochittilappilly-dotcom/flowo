
-- Add total_requests column to api_keys if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_keys' AND column_name='total_requests') THEN
    ALTER TABLE public.api_keys ADD COLUMN total_requests integer DEFAULT 0;
  END IF;
END $$;

-- API request logs table
CREATE TABLE IF NOT EXISTS public.api_request_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  api_key_id uuid REFERENCES public.api_keys(id) ON DELETE SET NULL,
  method varchar(10) NOT NULL,
  endpoint varchar(255) NOT NULL,
  status_code integer NOT NULL,
  response_time_ms integer,
  ip_address varchar(45),
  user_agent varchar(500),
  request_body jsonb,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS api_request_logs_user_idx ON public.api_request_logs(user_id, created_at DESC);

ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

-- RLS for api_request_logs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='api_request_logs' AND policyname='Users view own API logs') THEN
    CREATE POLICY "Users view own API logs" ON public.api_request_logs FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Rate limiting table
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  key_hash varchar(255) NOT NULL,
  window_start timestamp with time zone NOT NULL,
  request_count integer DEFAULT 1,
  PRIMARY KEY (key_hash, window_start)
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Increment API key total requests counter
CREATE OR REPLACE FUNCTION public.increment_api_key_requests(p_key_hash varchar)
RETURNS void AS $$
BEGIN
  UPDATE public.api_keys
  SET total_requests = COALESCE(total_requests, 0) + 1, last_used_at = now()
  WHERE key_hash = p_key_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
