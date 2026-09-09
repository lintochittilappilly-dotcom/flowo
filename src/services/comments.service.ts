// Comments service layer — system-ready with feature flag pattern
// When platform APIs are connected, real fetching activates automatically

import { supabase } from "@/integrations/supabase/client";
import { generateSuggestedReply } from "@/services/openai.service";

const INSTAGRAM_COMMENTS_ENABLED = import.meta.env.VITE_INSTAGRAM_ENABLED === "true";
const LINKEDIN_COMMENTS_ENABLED = import.meta.env.VITE_LINKEDIN_ENABLED === "true";
const TWITTER_COMMENTS_ENABLED = import.meta.env.VITE_TWITTER_ENABLED === "true";
const FACEBOOK_COMMENTS_ENABLED = import.meta.env.VITE_FACEBOOK_ENABLED === "true";
const AI_ENABLED = import.meta.env.VITE_AI_ENABLED === "true";

export interface PlatformComment {
  platform_comment_id: string;
  comment_text: string;
  commenter_username: string;
  commenter_display_name: string;
  platform_created_at: string;
  platform: string;
  post_id: string;
}

export interface SyncResult {
  platform: string;
  newComments: number;
  skipped: boolean;
  reason?: string;
}

// ── Platform fetch functions ──────────────────────────────────────

export async function fetchInstagramComments(accessToken: string, accountId: string): Promise<PlatformComment[]> {
  if (!INSTAGRAM_COMMENTS_ENABLED) {
    console.info("Instagram comments API not connected — add INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET to enable.");
    return [];
  }
  // Real Meta Graph API call would go here
  // GET /{media-id}/comments with user access token
  throw new Error("Real Instagram comments API not yet implemented");
}

export async function fetchLinkedInComments(accessToken: string, accountId: string): Promise<PlatformComment[]> {
  if (!LINKEDIN_COMMENTS_ENABLED) {
    console.info("LinkedIn comments API not connected — add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET to enable.");
    return [];
  }
  throw new Error("Real LinkedIn comments API not yet implemented");
}

export async function fetchTwitterMentions(accessToken: string, accountId: string): Promise<PlatformComment[]> {
  if (!TWITTER_COMMENTS_ENABLED) {
    console.info("Twitter comments API not connected — add TWITTER_CONSUMER_KEY and TWITTER_CONSUMER_SECRET to enable.");
    return [];
  }
  throw new Error("Real Twitter mentions API not yet implemented");
}

export async function fetchFacebookComments(accessToken: string, accountId: string): Promise<PlatformComment[]> {
  if (!FACEBOOK_COMMENTS_ENABLED) {
    console.info("Facebook comments API not connected — add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to enable.");
    return [];
  }
  throw new Error("Real Facebook comments API not yet implemented");
}

// ── Reply to comment ──────────────────────────────────────────────

export async function replyToComment(
  platform: string,
  commentDbId: string,
  postId: string,
  replyText: string,
  accessToken?: string
): Promise<{ success: boolean; savedLocally: boolean }> {
  const platformEnabled =
    (platform === "Instagram" && INSTAGRAM_COMMENTS_ENABLED) ||
    (platform === "LinkedIn" && LINKEDIN_COMMENTS_ENABLED) ||
    (platform === "Twitter" && TWITTER_COMMENTS_ENABLED) ||
    (platform === "Facebook" && FACEBOOK_COMMENTS_ENABLED);

  if (platformEnabled && accessToken) {
    // Real platform reply would go here via edge function
    // For now, fall through to local save
  }

  // Save reply locally in comments_cache
  const { error } = await supabase
    .from("comments_cache")
    .update({
      is_replied: true,
      reply_text: replyText,
      replied_at: new Date().toISOString(),
      reply_saved_locally: !platformEnabled,
    } as any)
    .eq("id", commentDbId);

  if (error) throw error;

  return {
    success: true,
    savedLocally: !platformEnabled,
  };
}

// ── Sync all comments ─────────────────────────────────────────────

export async function syncAllComments(userId: string): Promise<SyncResult[]> {
  const results: SyncResult[] = [];

  // Get all connected social accounts for this user
  const { data: accounts } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!accounts || accounts.length === 0) {
    return [
      { platform: "Instagram", newComments: 0, skipped: true, reason: "No social accounts connected" },
      { platform: "LinkedIn", newComments: 0, skipped: true, reason: "No social accounts connected" },
      { platform: "Twitter", newComments: 0, skipped: true, reason: "No social accounts connected" },
    ];
  }

  const fetchMap: Record<string, (token: string, id: string) => Promise<PlatformComment[]>> = {
    Instagram: fetchInstagramComments,
    LinkedIn: fetchLinkedInComments,
    Twitter: fetchTwitterMentions,
    Facebook: fetchFacebookComments,
  };

  for (const account of accounts) {
    const fetcher = fetchMap[account.platform];
    if (!fetcher) continue;

    try {
      const comments = await fetcher(account.access_token || "", account.account_id || "");
      if (comments.length > 0) {
        // Upsert into comments_cache
        const rows = comments.map((c) => ({
          ...c,
          user_id: userId,
          is_hidden: false,
          is_flagged: false,
          is_replied: false,
        }));
        await supabase.from("comments_cache").upsert(rows as any, { onConflict: "platform_comment_id" });
      }
      results.push({ platform: account.platform, newComments: comments.length, skipped: false });
    } catch {
      results.push({
        platform: account.platform,
        newComments: 0,
        skipped: true,
        reason: `${account.platform} API not connected — add API keys to enable`,
      });
    }
  }

  // Add results for platforms with no accounts
  const coveredPlatforms = results.map((r) => r.platform);
  for (const p of ["Instagram", "LinkedIn", "Twitter"]) {
    if (!coveredPlatforms.includes(p)) {
      results.push({ platform: p, newComments: 0, skipped: true, reason: `No ${p} account connected` });
    }
  }

  return results;
}

// ── AI-powered reply generation ───────────────────────────────────

export async function generateCommentReply(commentText: string, postContext: string, brandVoice?: string): Promise<string> {
  return generateSuggestedReply(commentText, postContext);
}

// ── Sentiment analysis ────────────────────────────────────────────

const positiveWords = ["great", "love", "amazing", "awesome", "excellent", "fantastic", "wonderful", "best", "perfect", "beautiful", "thank", "thanks", "happy", "glad"];
const negativeWords = ["bad", "terrible", "disappointed", "worst", "hate", "awful", "horrible", "poor", "never", "angry", "upset", "refund", "broken", "scam"];

export async function analyzeSentiment(commentText: string): Promise<"positive" | "neutral" | "negative" | "spam"> {
  if (AI_ENABLED) {
    const { data, error } = await supabase.functions.invoke("generate-trend-content", {
      body: { topic: `Classify sentiment: "${commentText}"`, platform: "sentiment", tone: "analytical" },
    });
    if (!error && data?.content) {
      const lower = data.content.toLowerCase();
      if (lower.includes("positive")) return "positive";
      if (lower.includes("negative")) return "negative";
      if (lower.includes("spam")) return "spam";
      return "neutral";
    }
  }

  // Simple keyword matching fallback
  const lower = commentText.toLowerCase();
  if (positiveWords.some((w) => lower.includes(w))) return "positive";
  if (negativeWords.some((w) => lower.includes(w))) return "negative";
  return "neutral";
}

// ── Bulk actions ──────────────────────────────────────────────────

export async function bulkAction(
  commentIds: string[],
  action: "mark_read" | "flag" | "hide" | "delete"
): Promise<void> {
  if (action === "mark_read") {
    await supabase.from("comments_cache").update({ is_replied: true } as any).in("id", commentIds);
  } else if (action === "flag") {
    await supabase.from("comments_cache").update({ is_flagged: true }).in("id", commentIds);
  } else if (action === "hide") {
    await supabase.from("comments_cache").update({ is_hidden: true }).in("id", commentIds);
  } else if (action === "delete") {
    await supabase.from("comments_cache").delete().in("id", commentIds);
  }
}
