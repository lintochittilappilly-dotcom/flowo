
-- OAuth state table for CSRF protection during OAuth flow
CREATE TABLE IF NOT EXISTS public.oauth_states (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  platform varchar(50) NOT NULL,
  state_token varchar(255) UNIQUE NOT NULL,
  code_verifier varchar(255),
  expires_at timestamp with time zone DEFAULT now() + interval '10 minutes',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own oauth states"
  ON public.oauth_states FOR ALL USING (auth.uid() = user_id);

-- Add new columns to social_accounts for full OAuth support
ALTER TABLE public.social_accounts
  ADD COLUMN IF NOT EXISTS platform_user_id varchar(255),
  ADD COLUMN IF NOT EXISTS platform_username varchar(255),
  ADD COLUMN IF NOT EXISTS platform_profile_picture varchar(500),
  ADD COLUMN IF NOT EXISTS platform_followers_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scopes text[],
  ADD COLUMN IF NOT EXISTS last_used_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS needs_reconnect boolean DEFAULT false;

-- Cleanup function for expired oauth states
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM public.oauth_states WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
