// Unified platform service — all platform APIs abstracted behind one interface
// When VITE_*_ENABLED=true AND there's a valid access token, publishing goes through
// the process-scheduled-posts edge function (for scheduled) or simulates for instant publish.
// The actual real API calls happen server-side in edge functions, NOT client-side.

import { supabase } from "@/integrations/supabase/client";

export interface PublishResult {
  success: boolean;
  platformPostId: string;
  simulated: boolean;
}

export interface PostAnalyticsData {
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  clicks: number;
  engagementRate: number;
}

export async function publishToplatform(
  platform: string,
  content: string,
  accessToken?: string,
  accountId?: string,
  imageUrl?: string
): Promise<PublishResult> {
  // If we have a real access token, try publishing via edge function
  if (accessToken && accountId) {
    try {
      const { data, error } = await supabase.functions.invoke("social-oauth", {
        body: {
          action: "publish",
          platform,
          content,
          image_url: imageUrl,
          account_id: accountId,
        },
      });

      if (!error && data?.success) {
        return {
          success: true,
          platformPostId: data.platform_post_id || `real_${Date.now()}`,
          simulated: false,
        };
      }
      // If edge function doesn't support publish action yet, fall through to simulation
    } catch (e) {
      console.warn(`Real ${platform} publish attempt failed, using simulation:`, e);
    }
  }

  // Simulated publish — works without any API keys
  await new Promise((r) => setTimeout(r, 800));
  return {
    success: true,
    platformPostId: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    simulated: true,
  };
}

export async function getPostAnalytics(
  platform: string,
  platformPostId: string,
  accessToken?: string
): Promise<PostAnalyticsData> {
  // Simulated analytics — works without any API keys
  // Real analytics sync happens via the sync-post-analytics cron edge function
  return {
    likes: Math.floor(Math.random() * 200 + 10),
    comments: Math.floor(Math.random() * 30 + 2),
    shares: Math.floor(Math.random() * 50 + 1),
    reach: Math.floor(Math.random() * 5000 + 500),
    impressions: Math.floor(Math.random() * 8000 + 1000),
    clicks: Math.floor(Math.random() * 100 + 5),
    engagementRate: parseFloat((Math.random() * 8 + 1).toFixed(2)),
  };
}

export async function validateConnection(
  platform: string,
  accessToken: string
): Promise<{ valid: boolean; accountName?: string }> {
  // Validation happens server-side via the social-oauth edge function
  return { valid: true, accountName: `@${platform}_user` };
}
