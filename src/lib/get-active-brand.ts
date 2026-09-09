import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve the active brand ID for a given user.
 * Priority: explicit param > profiles.active_brand_id > first brand by created_at
 */
export async function getActiveBrandId(
  userId: string,
  requestBrandId?: string
): Promise<string | null> {
  if (requestBrandId) return requestBrandId;

  // Check profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("active_brand_id")
    .eq("id", userId)
    .single();

  if ((profile as any)?.active_brand_id) return (profile as any).active_brand_id;

  // Fallback to first brand
  const { data: firstBrand } = await supabase
    .from("brands")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  return firstBrand?.id ?? null;
}
