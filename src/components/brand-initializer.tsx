import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandStore, type Brand } from "@/store/brand-store";

const DEFAULT_COLOR = "#6D28D9";

function mapBrand(b: any): Brand {
  return {
    id: b.id,
    name: b.name,
    industry: b.industry,
    color: b.color || DEFAULT_COLOR,
    tone: b.tone,
    is_default: b.is_default,
  };
}

export default function BrandInitializer() {
  const { user } = useAuth();
  const { activeBrand, setActiveBrand, setAllBrands, setIsLoading } = useBrandStore();

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const init = async () => {
      setIsLoading(true);

      // Fetch all brands
      const { data: brands } = await supabase
        .from("brands")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      const allBrands = (brands || []).map(mapBrand);
      setAllBrands(allBrands);

      if (allBrands.length === 0) {
        setActiveBrand(null as any);
        setIsLoading(false);
        return;
      }

      // Validate stored active brand still exists
      let resolvedBrand: Brand | null = null;

      if (activeBrand) {
        const stillExists = allBrands.find((b) => b.id === activeBrand.id);
        if (stillExists) {
          resolvedBrand = stillExists; // Use fresh data
        }
      }

      // If no valid stored brand, check profiles.active_brand_id
      if (!resolvedBrand) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("active_brand_id")
          .eq("id", user.id)
          .single();

        const profileBrandId = (profile as any)?.active_brand_id;
        if (profileBrandId) {
          resolvedBrand = allBrands.find((b) => b.id === profileBrandId) || null;
        }
      }

      // Fallback to first brand
      if (!resolvedBrand) {
        resolvedBrand = allBrands[0];
      }

      setActiveBrand(resolvedBrand);

      // Persist to profiles if needed
      supabase
        .from("profiles")
        .update({ active_brand_id: resolvedBrand.id } as any)
        .eq("id", user.id)
        .then(() => {});

      setIsLoading(false);
    };

    init();

    // Listen for brand changes in realtime
    const channel = supabase
      .channel("brand-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brands", filter: `user_id=eq.${user.id}` },
        async () => {
          const { data } = await supabase
            .from("brands")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true });
          setAllBrands((data || []).map(mapBrand));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return null;
}
