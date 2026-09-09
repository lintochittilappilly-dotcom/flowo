import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  canUseFeature,
  getLimit,
  isUnlimited,
  type FeatureKey,
  type LimitKey,
} from "@/lib/plan-features";

export function usePlanGate() {
  const { profile } = useAuth();
  const plan = profile?.plan ?? "starter";

  return {
    plan,
    can: (feature: FeatureKey) => canUseFeature(plan, feature),
    limit: (key: LimitKey) => getLimit(plan, key),
    unlimited: (key: LimitKey) => isUnlimited(plan, key),
    isStarter: plan === "starter",
    isPro: plan === "pro",
    isAgency: plan === "agency",
  };
}

interface UsageData {
  posts_generated: number;
  ai_images_generated: number;
  api_calls_made: number;
  month_year: string;
}

export function useUsageCheck() {
  const { user, profile } = useAuth();
  const plan = profile?.plan ?? "starter";
  const [usage, setUsage] = useState<UsageData>({
    posts_generated: 0,
    ai_images_generated: 0,
    api_calls_made: 0,
    month_year: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.rpc("get_current_usage", {
        p_user_id: user.id,
      });
      if (data) setUsage(data as unknown as UsageData);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const postsLimit = getLimit(plan, "posts_per_month");
  const imagesLimit = getLimit(plan, "ai_images_per_month");

  const postsPercent = isUnlimited(plan, "posts_per_month")
    ? 0
    : Math.min((usage.posts_generated / postsLimit) * 100, 100);
  const imagesPercent = isUnlimited(plan, "ai_images_per_month")
    ? 0
    : Math.min((usage.ai_images_generated / imagesLimit) * 100, 100);

  return {
    usage,
    loading,
    posts: {
      used: usage.posts_generated,
      limit: postsLimit,
      percent: postsPercent,
      isAtLimit: !isUnlimited(plan, "posts_per_month") && usage.posts_generated >= postsLimit,
      isNearLimit: postsPercent >= 80,
      isUnlimited: isUnlimited(plan, "posts_per_month"),
    },
    images: {
      used: usage.ai_images_generated,
      limit: imagesLimit,
      percent: imagesPercent,
      isAtLimit: !isUnlimited(plan, "ai_images_per_month") && usage.ai_images_generated >= imagesLimit,
      isNearLimit: imagesPercent >= 80,
      isUnlimited: isUnlimited(plan, "ai_images_per_month"),
    },
    incrementPosts: async () => {
      if (!user) return;
      await supabase.rpc("increment_usage", {
        p_user_id: user.id,
        p_field: "posts_generated",
        p_amount: 1,
      });
      setUsage((prev) => ({ ...prev, posts_generated: prev.posts_generated + 1 }));
    },
    incrementImages: async () => {
      if (!user) return;
      await supabase.rpc("increment_usage", {
        p_user_id: user.id,
        p_field: "ai_images_generated",
        p_amount: 1,
      });
      setUsage((prev) => ({ ...prev, ai_images_generated: prev.ai_images_generated + 1 }));
    },
  };
}
