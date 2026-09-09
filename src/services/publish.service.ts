// Master publishing orchestrator
import { supabase } from "@/integrations/supabase/client";
import { publishToplatform } from "./platform.service";
import { logBrandActivity } from "./brands.service";

const MAX_RETRIES = 3;
const BACKOFF_BASE = 1000;

export interface PublishPostResult {
  success: boolean;
  platformPostId?: string;
  simulated: boolean;
  error?: string;
}

export async function publishPost(postId: string, userId: string): Promise<PublishPostResult> {
  // Get the post
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("*, social_accounts(access_token, account_id)")
    .eq("id", postId)
    .single();

  if (postError || !post) {
    return { success: false, simulated: false, error: "Post not found" };
  }

  const accessToken = (post as any).social_accounts?.access_token;
  const accountId = (post as any).social_accounts?.account_id;

  let lastError = "";
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await publishToplatform(
        post.platform,
        post.content,
        accessToken,
        accountId,
        post.image_url || undefined
      );

      if (result.success) {
        // Update post status
        await supabase
          .from("posts")
          .update({
            status: "published",
            published_at: new Date().toISOString(),
            platform_post_id: result.platformPostId,
          })
          .eq("id", postId);

        // Log brand activity (fire-and-forget)
        logBrandActivity(post.brand_id, userId, "post_published", `Published a post on ${post.platform}`);

        return { success: true, platformPostId: result.platformPostId, simulated: result.simulated };
      }
    } catch (e: any) {
      lastError = e.message;
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, BACKOFF_BASE * Math.pow(2, attempt)));
      }
    }
  }

  // Mark as failed
  await supabase.from("posts").update({ status: "failed" }).eq("id", postId);

  // Create failure notification
  await supabase.from("notifications").insert({
    user_id: userId,
    type: "post_failed",
    title: "Post failed to publish",
    message: `Your ${post.platform} post failed to publish after ${MAX_RETRIES} attempts. Error: ${lastError}`,
    related_post_id: postId,
  });

  return { success: false, simulated: false, error: lastError };
}

export async function schedulePost(
  postId: string,
  userId: string,
  scheduledAt: string
): Promise<boolean> {
  const { error: postError } = await supabase
    .from("posts")
    .update({ status: "scheduled", scheduled_at: scheduledAt })
    .eq("id", postId);

  if (postError) return false;

  const { error: jobError } = await supabase.from("scheduled_jobs").insert({
    post_id: postId,
    user_id: userId,
    scheduled_at: scheduledAt,
    status: "pending",
  });

  // Log brand activity (fire-and-forget)
  const { data: post } = await supabase.from("posts").select("brand_id, platform").eq("id", postId).single();
  if (post) {
    const formattedDate = new Date(scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    logBrandActivity(post.brand_id, userId, "post_scheduled", `Scheduled a ${post.platform} post for ${formattedDate}`);
  }

  return !jobError;
}

export async function cancelScheduledPost(postId: string): Promise<boolean> {
  await supabase.from("scheduled_jobs").delete().eq("post_id", postId);
  await supabase.from("posts").update({ status: "draft", scheduled_at: null }).eq("id", postId);
  return true;
}
