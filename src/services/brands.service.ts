// Brands service layer — fully functional with Supabase
import { supabase } from "@/integrations/supabase/client";
import { generateBrandVoice } from "@/services/openai.service";

export interface BrandStats {
  postsThisMonth: number;
  totalReach: number;
  avgEngagementRate: number;
}

export interface BrandActivity {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
}

// ── CRUD ──────────────────────────────────────────────────────────

export async function createBrand(
  userId: string,
  name: string,
  industry: string,
  tones: string[],
  samplePosts: string,
  brandDescription?: string,
  isDefault?: boolean
): Promise<string> {
  const { data, error } = await supabase
    .from("brands")
    .insert({
      user_id: userId,
      name,
      industry,
      tone: tones,
      sample_posts: samplePosts,
      brand_description: brandDescription || "",
      is_default: isDefault || false,
    })
    .select("id")
    .single();

  if (error) throw error;

  // Create default voice profile
  await supabase.from("brand_voice_profiles").insert({
    brand_id: data.id,
    user_id: userId,
    voice_profile: `Default voice profile for ${name}`,
    tone: tones,
    sample_posts: samplePosts,
  });

  // Log activity
  await logBrandActivity(data.id, userId, "brand_created", `Brand "${name}" was created`);

  return data.id;
}

export async function updateBrand(
  brandId: string,
  updates: {
    name?: string;
    industry?: string;
    tone?: string[];
    sample_posts?: string;
    brand_description?: string;
    color?: string;
  }
): Promise<void> {
  const { error } = await supabase
    .from("brands")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", brandId);

  if (error) throw error;

  // Log activity (fire-and-forget) — get user_id from brand
  supabase.from("brands").select("user_id").eq("id", brandId).single().then(({ data }) => {
    if (data) logBrandActivity(brandId, data.user_id, "brand_updated", "Brand settings updated");
  });
}

export async function deleteBrand(brandId: string): Promise<void> {
  // Cascade handles posts, social_accounts, brand_voice_profiles via FK
  const { error } = await supabase.from("brands").delete().eq("id", brandId);
  if (error) throw error;
}

// ── Stats ─────────────────────────────────────────────────────────

export async function getBrandStats(brandId: string): Promise<BrandStats> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Posts this month
  const { count: postsCount } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("brand_id", brandId)
    .eq("status", "published")
    .gte("published_at", startOfMonth.toISOString());

  // Analytics
  const { data: analytics } = await supabase
    .from("post_analytics")
    .select("reach, engagement_rate")
    .in(
      "post_id",
      (await supabase.from("posts").select("id").eq("brand_id", brandId)).data?.map((p: any) => p.id) || []
    );

  const totalReach = (analytics || []).reduce((s, a: any) => s + (a.reach || 0), 0);
  const avgRate = analytics?.length
    ? (analytics as any[]).reduce((s, a) => s + (a.engagement_rate || 0), 0) / analytics.length
    : 0;

  return {
    postsThisMonth: postsCount || 0,
    totalReach,
    avgEngagementRate: parseFloat(avgRate.toFixed(1)),
  };
}

// ── Brand Voice Training ──────────────────────────────────────────

export async function trainBrandVoice(
  brandId: string,
  userId: string,
  businessName: string,
  industry: string,
  samplePosts: string,
  tones: string[]
): Promise<string> {
  const voiceProfile = await generateBrandVoice(businessName, industry, samplePosts, tones);

  await supabase
    .from("brand_voice_profiles")
    .upsert(
      {
        brand_id: brandId,
        user_id: userId,
        voice_profile: voiceProfile,
        tone: tones,
        sample_posts: samplePosts,
        last_trained_at: new Date().toISOString(),
      },
      { onConflict: "brand_id" }
    );

  await logBrandActivity(brandId, userId, "voice_trained", "Brand voice was trained with AI");

  return voiceProfile;
}

// ── Default brand ─────────────────────────────────────────────────

export async function setDefaultBrand(brandId: string, userId: string): Promise<void> {
  // Set all to false
  await supabase.from("brands").update({ is_default: false }).eq("user_id", userId);
  // Set selected to true
  await supabase.from("brands").update({ is_default: true }).eq("id", brandId);
}

// ── Activity log ──────────────────────────────────────────────────

export async function logBrandActivity(
  brandId: string,
  userId: string,
  activityType: string,
  description: string
): Promise<void> {
  await supabase.from("brand_activity").insert({
    brand_id: brandId,
    user_id: userId,
    activity_type: activityType,
    description,
  } as any);
}

export async function getBrandActivity(brandId: string, limit = 3): Promise<BrandActivity[]> {
  const { data } = await supabase
    .from("brand_activity")
    .select("id, activity_type, description, created_at")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false })
    .limit(limit) as any;

  return data || [];
}
