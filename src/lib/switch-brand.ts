import { supabase } from "@/integrations/supabase/client";
import type { Brand } from "@/store/brand-store";

/**
 * Switch the active brand:
 * 1. Update Zustand store instantly (UI responds immediately)
 * 2. Persist to Supabase in background (fire and forget)
 */
export function switchBrand(
  brand: Brand,
  setActiveBrand: (brand: Brand) => void,
  userId: string
) {
  // 1. Instant UI update
  setActiveBrand(brand);

  // 2. Background persist — no await
  supabase
    .from("profiles")
    .update({ active_brand_id: brand.id } as any)
    .eq("id", userId)
    .then(({ error }) => {
      if (error) console.warn("Failed to persist active_brand_id:", error.message);
    });
}
