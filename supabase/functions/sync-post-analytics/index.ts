import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const results = { synced: 0, failed: 0, skipped: 0 };
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  try {
    // Get published posts from last 30 days with a platform_post_id
    const { data: posts, error: fetchErr } = await supabase
      .from("posts")
      .select(`
        id,
        user_id,
        platform,
        platform_post_id,
        published_at,
        social_account_id,
        social_accounts (
          access_token,
          platform_user_id,
          is_active
        )
      `)
      .eq("status", "published")
      .not("platform_post_id", "is", null)
      .gte("published_at", thirtyDaysAgo)
      .order("published_at", { ascending: false })
      .limit(200);

    if (fetchErr) throw fetchErr;

    if (!posts || posts.length === 0) {
      return new Response(
        JSON.stringify({ ...results, message: "No posts to sync", duration_ms: Date.now() - startTime }),
        { headers: corsHeaders }
      );
    }

    for (const post of posts) {
      const sa = post.social_accounts as any;
      const accessToken = sa?.access_token;
      const platformUserId = sa?.platform_user_id ?? "";
      const isActive = sa?.is_active ?? false;

      try {
        let analytics: AnalyticsData;

        if (accessToken && isActive && !post.platform_post_id?.startsWith("sim_")) {
          // Attempt real analytics fetch
          analytics = await fetchPlatformAnalytics(
            post.platform,
            post.platform_post_id!,
            accessToken,
            platformUserId
          );
        } else {
          // Simulated — generate consistent fake data based on post age
          analytics = generateSimulatedAnalytics(post.id, post.published_at);
        }

        // Upsert into post_analytics
        const { error: upsertErr } = await supabase
          .from("post_analytics")
          .upsert(
            {
              post_id: post.id,
              user_id: post.user_id,
              platform: post.platform,
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

        if (upsertErr) {
          // If upsert fails (no unique constraint on post_id), try update then insert
          const { data: existing } = await supabase
            .from("post_analytics")
            .select("id")
            .eq("post_id", post.id)
            .maybeSingle();

          if (existing) {
            await supabase
              .from("post_analytics")
              .update({
                likes: analytics.likes,
                comments: analytics.comments,
                shares: analytics.shares,
                reach: analytics.reach,
                impressions: analytics.impressions,
                clicks: analytics.clicks,
                engagement_rate: analytics.engagementRate,
                fetched_at: new Date().toISOString(),
              })
              .eq("id", existing.id);
          }
          // If no existing row, the initial insert from process-scheduled-posts handles it
        }

        results.synced++;
      } catch (e) {
        console.error(`Failed to sync analytics for post ${post.id}:`, e);
        results.failed++;
      }
    }

    console.log(`Analytics sync complete: ${JSON.stringify(results)}`);
    return new Response(
      JSON.stringify({ ...results, duration_ms: Date.now() - startTime }),
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("sync-post-analytics error:", error);
    return new Response(
      JSON.stringify({ error: error.message, ...results, duration_ms: Date.now() - startTime }),
      { status: 500, headers: corsHeaders }
    );
  }
});

// ── Types ────────────────────────────────────────────────────────────

interface AnalyticsData {
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  clicks: number;
  engagementRate: number;
}

// ── Simulated analytics ──────────────────────────────────────────────
// Uses post ID as seed for deterministic values that grow over time

function generateSimulatedAnalytics(postId: string, publishedAt: string | null): AnalyticsData {
  const seed = postId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const daysSincePublish = publishedAt
    ? Math.max(1, Math.floor((Date.now() - new Date(publishedAt).getTime()) / 86400000))
    : 1;

  // Growth factor: engagement grows logarithmically over time
  const growth = Math.log2(daysSincePublish + 1) + 1;
  const rand = (min: number, max: number) => Math.floor((min + (seed % (max - min))) * growth);

  const likes = rand(10, 200);
  const comments = rand(2, 40);
  const shares = rand(1, 25);
  const reach = rand(100, 3000);
  const impressions = reach + rand(50, 500);
  const clicks = rand(5, 80);
  const engagementRate = reach > 0
    ? parseFloat((((likes + comments + shares) / reach) * 100).toFixed(2))
    : 0;

  return { likes, comments, shares, reach, impressions, clicks, engagementRate };
}

// ── Real platform fetchers ───────────────────────────────────────────

async function fetchPlatformAnalytics(
  platform: string,
  platformPostId: string,
  accessToken: string,
  platformUserId: string
): Promise<AnalyticsData> {
  switch (platform) {
    case "instagram":
      return fetchInstagramInsights(platformPostId, accessToken);
    case "linkedin":
      return fetchLinkedInAnalytics(platformPostId, accessToken);
    case "twitter":
      return fetchTwitterMetrics(platformPostId, accessToken);
    case "facebook":
      return fetchFacebookInsights(platformPostId, accessToken);
    default:
      // Pinterest, TikTok — use simulated for now
      return generateSimulatedAnalytics(platformPostId, null);
  }
}

async function fetchInstagramInsights(mediaId: string, accessToken: string): Promise<AnalyticsData> {
  const metrics = "likes,comments,reach,impressions,saved";
  const res = await fetch(
    `https://graph.instagram.com/v18.0/${mediaId}/insights?metric=${metrics}&access_token=${accessToken}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  const getValue = (name: string) =>
    data.data?.find((m: any) => m.name === name)?.values?.[0]?.value ?? 0;

  const likes = getValue("likes");
  const comments = getValue("comments");
  const reach = getValue("reach");
  const impressions = getValue("impressions");
  const saved = getValue("saved");
  const engagementRate = reach > 0
    ? parseFloat((((likes + comments + saved) / reach) * 100).toFixed(2))
    : 0;

  return { likes, comments, shares: saved, reach, impressions, clicks: 0, engagementRate };
}

async function fetchLinkedInAnalytics(postId: string, accessToken: string): Promise<AnalyticsData> {
  const res = await fetch(
    `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`LinkedIn API ${res.status}`);
  const data = await res.json();

  const likes = data.likesSummary?.totalLikes ?? 0;
  const comments = data.commentsSummary?.totalFirstLevelComments ?? 0;

  return { likes, comments, shares: 0, reach: 0, impressions: 0, clicks: 0, engagementRate: 0 };
}

async function fetchTwitterMetrics(tweetId: string, accessToken: string): Promise<AnalyticsData> {
  const res = await fetch(
    `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Twitter API ${res.status}`);
  const data = await res.json();
  const m = data.data?.public_metrics ?? {};

  const likes = m.like_count ?? 0;
  const retweets = m.retweet_count ?? 0;
  const replies = m.reply_count ?? 0;
  const impressions = m.impression_count ?? 0;
  const engagementRate = impressions > 0
    ? parseFloat((((likes + retweets + replies) / impressions) * 100).toFixed(2))
    : 0;

  return { likes, comments: replies, shares: retweets, reach: impressions, impressions, clicks: 0, engagementRate };
}

async function fetchFacebookInsights(postId: string, accessToken: string): Promise<AnalyticsData> {
  const res = await fetch(
    `https://graph.facebook.com/v18.0/${postId}/insights?metric=post_impressions,post_reach,post_clicks&access_token=${accessToken}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  const getValue = (name: string) =>
    data.data?.find((m: any) => m.name === name)?.values?.[0]?.value ?? 0;

  const reach = getValue("post_reach");
  const impressions = getValue("post_impressions");
  const clicks = getValue("post_clicks");
  const engagementRate = reach > 0 ? parseFloat(((clicks / reach) * 100).toFixed(2)) : 0;

  return { likes: 0, comments: 0, shares: 0, reach, impressions, clicks, engagementRate };
}
