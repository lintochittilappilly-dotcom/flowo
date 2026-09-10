-- Fix search_path for security
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
  FROM public.usage_tracking
  WHERE user_id = p_user_id AND month_year = v_month;
  
  RETURN coalesce(v_usage, jsonb_build_object(
    'posts_generated', 0,
    'ai_images_generated', 0,
    'api_calls_made', 0,
    'month_year', v_month
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id uuid,
  p_field varchar,
  p_amount integer DEFAULT 1
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.usage_tracking (user_id, month_year, posts_generated, ai_images_generated, api_calls_made)
  VALUES (
    p_user_id,
    to_char(now(), 'YYYY-MM'),
    CASE WHEN p_field = 'posts_generated' THEN p_amount ELSE 0 END,
    CASE WHEN p_field = 'ai_images_generated' THEN p_amount ELSE 0 END,
    CASE WHEN p_field = 'api_calls_made' THEN p_amount ELSE 0 END
  )
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET
    posts_generated = public.usage_tracking.posts_generated + 
      CASE WHEN p_field = 'posts_generated' THEN p_amount ELSE 0 END,
    ai_images_generated = public.usage_tracking.ai_images_generated + 
      CASE WHEN p_field = 'ai_images_generated' THEN p_amount ELSE 0 END,
    api_calls_made = public.usage_tracking.api_calls_made + 
      CASE WHEN p_field = 'api_calls_made' THEN p_amount ELSE 0 END,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;