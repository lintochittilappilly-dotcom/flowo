export const PLAN_FEATURES = {
  none: {
    name: 'None',
    price_monthly: 0,
    price_annual: 0,
    color: '#666666',
    limits: {
      brands: 0,
      social_accounts_per_brand: 0,
      posts_per_month: 0,
      ai_images_per_month: 0,
      team_members: 0,
      scheduled_posts_ahead_days: 0,
    },
    features: {
      ai_content_generation: false,
      content_calendar: false,
      basic_analytics: false,
      advanced_analytics: false,
      comments_manager: false,
      trends_page: false,
      brand_voice_training: false,
      bulk_scheduling: false,
      white_label_reports: false,
      api_access: false,
      priority_support: false,
      custom_posting_times: false,
      team_collaboration: false,
      export_analytics: false,
      ai_image_generation: false,
      campaign_generator: false,
    },
    platforms: [] as string[],
  },
  expired: {
    name: 'Expired',
    price_monthly: 0,
    price_annual: 0,
    color: '#666666',
    limits: {
      brands: 0,
      social_accounts_per_brand: 0,
      posts_per_month: 0,
      ai_images_per_month: 0,
      team_members: 0,
      scheduled_posts_ahead_days: 0,
    },
    features: {
      ai_content_generation: false,
      content_calendar: false,
      basic_analytics: false,
      advanced_analytics: false,
      comments_manager: false,
      trends_page: false,
      brand_voice_training: false,
      bulk_scheduling: false,
      white_label_reports: false,
      api_access: false,
      priority_support: false,
      custom_posting_times: false,
      team_collaboration: false,
      export_analytics: false,
      ai_image_generation: false,
      campaign_generator: false,
    },
    platforms: [] as string[],
  },
  trial: {
    name: 'Trial',
    price_monthly: 0,
    price_annual: 0,
    color: '#8B5CF6',
    limits: {
      brands: 3,
      social_accounts_per_brand: 10,
      posts_per_month: 500,
      ai_images_per_month: 200,
      team_members: 5,
      scheduled_posts_ahead_days: 90,
    },
    features: {
      ai_content_generation: true,
      content_calendar: true,
      basic_analytics: true,
      advanced_analytics: true,
      comments_manager: true,
      trends_page: true,
      brand_voice_training: true,
      bulk_scheduling: true,
      white_label_reports: false,
      api_access: false,
      priority_support: false,
      custom_posting_times: true,
      team_collaboration: false,
      export_analytics: true,
      ai_image_generation: true,
      campaign_generator: true,
    },
    platforms: ['instagram', 'linkedin', 'twitter', 'facebook', 'tiktok', 'pinterest'] as string[],
  },
  starter: {
    name: 'Starter',
    price_monthly: 49,
    price_annual: 39,
    color: '#6D28D9',
    limits: {
      brands: 1,
      social_accounts_per_brand: 3,
      posts_per_month: 100,
      ai_images_per_month: 50,
      team_members: 1,
      scheduled_posts_ahead_days: 30,
    },
    features: {
      ai_content_generation: true,
      content_calendar: true,
      basic_analytics: true,
      advanced_analytics: false,
      comments_manager: true,
      trends_page: true,
      brand_voice_training: true,
      bulk_scheduling: false,
      white_label_reports: false,
      api_access: false,
      priority_support: false,
      custom_posting_times: false,
      team_collaboration: false,
      export_analytics: false,
      ai_image_generation: true,
      campaign_generator: false,
    },
    platforms: ['instagram', 'linkedin', 'twitter'] as string[],
  },
  pro: {
    name: 'Pro',
    price_monthly: 99,
    price_annual: 79,
    color: '#EC4899',
    limits: {
      brands: 3,
      social_accounts_per_brand: 10,
      posts_per_month: 500,
      ai_images_per_month: 200,
      team_members: 5,
      scheduled_posts_ahead_days: 90,
    },
    features: {
      ai_content_generation: true,
      content_calendar: true,
      basic_analytics: true,
      advanced_analytics: true,
      comments_manager: true,
      trends_page: true,
      brand_voice_training: true,
      bulk_scheduling: true,
      white_label_reports: false,
      api_access: false,
      priority_support: false,
      custom_posting_times: true,
      team_collaboration: false,
      export_analytics: true,
      ai_image_generation: true,
      campaign_generator: true,
    },
    platforms: ['instagram', 'linkedin', 'twitter', 'facebook', 'tiktok', 'pinterest'] as string[],
  },
  agency: {
    name: 'Agency',
    price_monthly: 199,
    price_annual: 159,
    color: '#1E1B2E',
    limits: {
      brands: 999999,
      social_accounts_per_brand: 999999,
      posts_per_month: 999999,
      ai_images_per_month: 999999,
      team_members: 5,
      scheduled_posts_ahead_days: 365,
    },
    features: {
      ai_content_generation: true,
      content_calendar: true,
      basic_analytics: true,
      advanced_analytics: true,
      comments_manager: true,
      trends_page: true,
      brand_voice_training: true,
      bulk_scheduling: true,
      white_label_reports: true,
      api_access: true,
      priority_support: true,
      custom_posting_times: true,
      team_collaboration: true,
      export_analytics: true,
      ai_image_generation: true,
      campaign_generator: true,
    },
    platforms: ['instagram', 'linkedin', 'twitter', 'facebook', 'tiktok', 'pinterest'] as string[],
  },
} as const;

export type Plan = keyof typeof PLAN_FEATURES;
export type FeatureKey = keyof typeof PLAN_FEATURES.starter.features;
export type LimitKey = keyof typeof PLAN_FEATURES.starter.limits;

export function getPlanFeatures(plan: string) {
  return PLAN_FEATURES[plan as Plan] ?? PLAN_FEATURES.starter;
}

export function canUseFeature(plan: string, feature: FeatureKey): boolean {
  return getPlanFeatures(plan).features[feature] ?? false;
}

export function getLimit(plan: string, limit: LimitKey): number {
  return getPlanFeatures(plan).limits[limit] ?? 0;
}

export function isUnlimited(plan: string, limit: LimitKey): boolean {
  return getLimit(plan, limit) >= 999999;
}

export function getNextPlan(currentPlan: string): Plan | null {
  if (currentPlan === 'starter') return 'pro';
  if (currentPlan === 'pro') return 'agency';
  return null;
}

export function getPlanPlatforms(plan: string): readonly string[] {
  return getPlanFeatures(plan).platforms;
}
