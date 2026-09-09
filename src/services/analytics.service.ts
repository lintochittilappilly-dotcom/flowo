// Analytics service — syncs and aggregates analytics data
import { supabase } from "@/integrations/supabase/client";
import { getPostAnalytics } from "./platform.service";

export async function syncPostAnalytics(postId: string, userId: string, platform: string): Promise<void> {
  const analytics = await getPostAnalytics(platform, postId);

  await supabase.from("post_analytics").upsert(
    {
      post_id: postId,
      user_id: userId,
      platform,
      likes: analytics.likes,
      comments: analytics.comments,
      shares: analytics.shares,
      reach: analytics.reach,
      impressions: analytics.impressions,
      clicks: analytics.clicks,
      engagement_rate: analytics.engagementRate,
      fetched_at: new Date().toISOString(),
    },
    { onConflict: "post_id" }
  );
}

export async function syncAllPostAnalytics(userId: string): Promise<number> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, platform, post_analytics(fetched_at)")
    .eq("user_id", userId)
    .eq("status", "published");

  if (!posts) return 0;

  const stale = posts.filter((p: any) => {
    const a = Array.isArray(p.post_analytics) ? p.post_analytics[0] : p.post_analytics;
    return !a || !a.fetched_at || a.fetched_at < oneHourAgo;
  });

  await Promise.all(stale.map((p: any) => syncPostAnalytics(p.id, userId, p.platform)));
  return stale.length;
}
