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

  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  const AI_ENABLED = !!OPENAI_API_KEY;

  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 86400000);
  const weekStartISO = weekStart.toISOString();
  const weekEndISO = now.toISOString();
  const weekStartDate = weekStart.toISOString().split("T")[0];
  const weekEndDate = now.toISOString().split("T")[0];

  const results = { generated: 0, skipped: 0, errors: 0 };

  try {
    // Get all users who published posts in the last week
    const { data: activeUsers } = await supabase
      .from("posts")
      .select("user_id")
      .eq("status", "published")
      .gte("published_at", weekStartISO)
      .order("user_id");

    if (!activeUsers || activeUsers.length === 0) {
      return new Response(
        JSON.stringify({ ...results, message: "No active users this week", duration_ms: Date.now() - startTime }),
        { headers: corsHeaders }
      );
    }

    // Deduplicate
    const uniqueUserIds = [...new Set(activeUsers.map((u) => u.user_id))];

    for (const userId of uniqueUserIds) {
      try {
        // Check if insight already exists for this week
        const { data: existing } = await supabase
          .from("ai_insights")
          .select("id")
          .eq("user_id", userId)
          .gte("week_start", weekStartDate)
          .maybeSingle();

        if (existing) {
          results.skipped++;
          continue;
        }

        // Gather week's posts + analytics
        const { data: weekPosts } = await supabase
          .from("posts")
          .select(`
            id, platform, content, published_at,
            post_analytics (likes, comments, shares, reach, impressions, engagement_rate)
          `)
          .eq("user_id", userId)
          .eq("status", "published")
          .gte("published_at", weekStartISO);

        if (!weekPosts || weekPosts.length === 0) {
          results.skipped++;
          continue;
        }

        // Aggregate stats
        const totalPosts = weekPosts.length;
        const analytics = weekPosts.flatMap((p) => (p.post_analytics as any[]) ?? []);
        const totalReach = analytics.reduce((s, a) => s + (a.reach ?? 0), 0);
        const totalEngagements = analytics.reduce(
          (s, a) => s + (a.likes ?? 0) + (a.comments ?? 0) + (a.shares ?? 0),
          0
        );
        const avgEngagementRate =
          analytics.length > 0
            ? (analytics.reduce((s, a) => s + (a.engagement_rate ?? 0), 0) / analytics.length).toFixed(2)
            : "0";

        // Platform breakdown
        const platformCounts = weekPosts.reduce((acc, p) => {
          acc[p.platform] = (acc[p.platform] ?? 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "social media";

        // Best performing post
        const bestPost = weekPosts.reduce((best, post) => {
          const pReach = ((post.post_analytics as any[])?.[0]?.reach ?? 0);
          const bReach = ((best?.post_analytics as any[])?.[0]?.reach ?? 0);
          return pReach > bReach ? post : best;
        }, weekPosts[0]);

        let insightText: string;
        let insightType: string;

        if (AI_ENABLED) {
          const prompt = `You are an expert social media analyst for a platform called Flowo.
Analyze this user's social media performance for the past week and provide ONE specific, actionable insight in 2-3 sentences.

Week Stats:
- Total posts published: ${totalPosts}
- Total reach: ${totalReach.toLocaleString()}
- Total engagements: ${totalEngagements.toLocaleString()}
- Average engagement rate: ${avgEngagementRate}%
- Most active platform: ${topPlatform} (${platformCounts[topPlatform]} posts)
- Best post snippet: "${(bestPost?.content ?? "").substring(0, 100)}..."

Write a specific, encouraging, and actionable insight. Focus on what worked and one thing to try next week. Be conversational. Start with "This week" or "Your content".`;

          try {
            const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                max_tokens: 150,
                temperature: 0.7,
                messages: [{ role: "user", content: prompt }],
              }),
            });

            const aiData = await aiRes.json();
            insightText =
              aiData.choices?.[0]?.message?.content?.trim() ??
              generateTemplateInsight(totalPosts, totalReach, topPlatform, avgEngagementRate);
            insightType = "ai_generated";
          } catch {
            insightText = generateTemplateInsight(totalPosts, totalReach, topPlatform, avgEngagementRate);
            insightType = "template_generated";
          }
        } else {
          insightText = generateTemplateInsight(totalPosts, totalReach, topPlatform, avgEngagementRate);
          insightType = "template_generated";
        }

        // Save insight
        await supabase.from("ai_insights").insert({
          user_id: userId,
          insight_text: insightText,
          insight_type: insightType,
          week_start: weekStartDate,
          week_end: weekEndDate,
          is_read: false,
        });

        // Create notification
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "weekly_insight",
          title: "Your weekly performance insight is ready",
          message: insightText.substring(0, 150) + (insightText.length > 150 ? "..." : ""),
        });

        results.generated++;
      } catch (userErr) {
        console.error(`Failed insight for user ${userId}:`, userErr);
        results.errors++;
      }
    }

    console.log(`Weekly insights complete: ${JSON.stringify(results)}`);
    return new Response(
      JSON.stringify({ ...results, duration_ms: Date.now() - startTime }),
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("generate-weekly-insights error:", error);
    return new Response(
      JSON.stringify({ error: error.message, ...results, duration_ms: Date.now() - startTime }),
      { status: 500, headers: corsHeaders }
    );
  }
});

// ── Template insights (no OpenAI fallback) ───────────────────────────

function generateTemplateInsight(
  totalPosts: number,
  totalReach: number,
  topPlatform: string,
  avgEngagementRate: string
): string {
  const templates = [
    `This week your ${topPlatform} content reached ${totalReach.toLocaleString()} people with an average engagement rate of ${avgEngagementRate}%. Your consistency with ${totalPosts} posts is building momentum — try experimenting with a question or poll next week to boost comments.`,
    `Your content this week showed strong performance on ${topPlatform}. With ${totalPosts} posts published you're maintaining great consistency. Consider posting at peak hours (9am or 7pm) to maximize your reach even further.`,
    `Great week! Your ${topPlatform} posts are resonating well with your audience. To keep the momentum going, try mixing in behind-the-scenes content or a customer story — these tend to drive 2x more engagement.`,
    `This week you published ${totalPosts} posts and reached ${totalReach.toLocaleString()} people. Your ${topPlatform} content is your strongest channel right now. Focus on that platform and add one strong call-to-action per post to drive more clicks.`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}
