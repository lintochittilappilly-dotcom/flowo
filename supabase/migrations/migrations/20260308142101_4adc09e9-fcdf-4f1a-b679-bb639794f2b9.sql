
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
  SELECT 
    COALESCE(SUM(pa.reach), 0),
    COALESCE(SUM(pa.likes + pa.comments + pa.shares), 0)
  INTO current_week_reach, current_week_engagements
  FROM posts p
  LEFT JOIN post_analytics pa ON pa.post_id = p.id
  WHERE p.user_id = p_user_id
    AND p.status = 'published'
    AND p.published_at >= date_trunc('week', now());

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
