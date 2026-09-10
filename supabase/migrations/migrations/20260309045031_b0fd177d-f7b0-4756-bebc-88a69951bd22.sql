-- Add trial columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS trial_expired BOOLEAN DEFAULT false;

-- Update existing users with starter plan to stay as starter (paid users)
-- Update users with no plan or null plan to 'expired' so they must choose a plan
UPDATE profiles
SET plan = 'expired'
WHERE plan IS NULL OR plan = '' OR plan = 'none';

-- Function to check if user has active access
CREATE OR REPLACE FUNCTION has_active_access(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  user_plan varchar;
  trial_end timestamp with time zone;
  trial_exp boolean;
BEGIN
  SELECT plan, trial_ends_at, trial_expired
  INTO user_plan, trial_end, trial_exp
  FROM profiles
  WHERE id = p_user_id;

  -- Paid plans always have access
  IF user_plan IN ('starter', 'pro', 'agency') THEN
    RETURN true;
  END IF;

  -- Trial: check if still active
  IF user_plan = 'trial' THEN
    IF trial_exp = true THEN
      RETURN false;
    END IF;
    IF trial_end IS NOT NULL AND trial_end > now() THEN
      RETURN true;
    END IF;
    RETURN false;
  END IF;

  -- No plan or expired
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;