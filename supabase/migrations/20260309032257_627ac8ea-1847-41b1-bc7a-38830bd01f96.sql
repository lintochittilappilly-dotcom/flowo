
-- Fix RLS on api_rate_limits: service role only (no user access needed)
CREATE POLICY "Service role manages rate limits" ON public.api_rate_limits FOR ALL USING (true);

-- Fix search_path on increment_api_key_requests
CREATE OR REPLACE FUNCTION public.increment_api_key_requests(p_key_hash varchar)
RETURNS void AS $$
BEGIN
  UPDATE public.api_keys
  SET total_requests = COALESCE(total_requests, 0) + 1, last_used_at = now()
  WHERE key_hash = p_key_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
