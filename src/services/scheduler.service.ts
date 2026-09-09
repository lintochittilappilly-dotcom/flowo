// Scheduler service — manages post scheduling queue
import { supabase } from "@/integrations/supabase/client";
import { publishPost } from "./publish.service";

export async function processQueue(): Promise<number> {
  const now = new Date().toISOString();
  
  const { data: jobs } = await supabase
    .from("scheduled_jobs")
    .select("*, posts(*)")
    .eq("status", "pending")
    .lte("scheduled_at", now)
    .limit(50);

  if (!jobs?.length) return 0;

  const results = await Promise.allSettled(
    jobs.map(async (job: any) => {
      await supabase
        .from("scheduled_jobs")
        .update({ status: "processing", last_attempted_at: now, attempts: (job.attempts || 0) + 1 })
        .eq("id", job.id);

      const result = await publishPost(job.post_id, job.user_id);

      await supabase
        .from("scheduled_jobs")
        .update({
          status: result.success ? "completed" : "failed",
          error_message: result.error || null,
        })
        .eq("id", job.id);
    })
  );

  return results.length;
}
