
-- Add missing columns to team_members
ALTER TABLE public.team_members 
  ADD COLUMN IF NOT EXISTS full_name varchar(255),
  ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{
    "dashboard": true,
    "calendar": true,
    "create_post": true,
    "analytics": false,
    "comments": true,
    "trends": true,
    "brands": false,
    "settings": false,
    "publish_posts": false,
    "delete_posts": false,
    "manage_team": false
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS invite_token varchar(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS invite_expires_at timestamp with time zone DEFAULT now() + interval '7 days',
  ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone;

-- Add member select policy (members can see their own record)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Members view own record'
  ) THEN
    CREATE POLICY "Members view own record"
      ON public.team_members FOR SELECT
      USING (auth.uid() = member_user_id);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS team_members_email_idx ON public.team_members(invited_email);
CREATE INDEX IF NOT EXISTS team_members_token_idx ON public.team_members(invite_token);

-- Team activity log table
CREATE TABLE IF NOT EXISTS public.team_activity (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  actor_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name varchar(255),
  action_type varchar(100) NOT NULL,
  description text NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.team_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view team activity"
  ON public.team_activity FOR SELECT USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners insert team activity"
  ON public.team_activity FOR INSERT WITH CHECK (auth.uid() = owner_user_id);

CREATE INDEX IF NOT EXISTS team_activity_owner_idx ON public.team_activity(owner_user_id, created_at DESC);
