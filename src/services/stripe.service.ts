// Stripe service layer — system-ready with feature flag pattern
// Real Stripe activates when keys are added to Supabase Edge Function secrets

export const PLAN_CONFIG = {
  none: {
    name: "None",
    monthly_price: 0,
    annual_price: 0,
    limits: { posts: 0, brands: 0, team_members: 0, images: 0 },
    features: ["No active plan"],
  },
  expired: {
    name: "Expired",
    monthly_price: 0,
    annual_price: 0,
    limits: { posts: 0, brands: 0, team_members: 0, images: 0 },
    features: ["Trial ended - choose a plan"],
  },
  trial: {
    name: "Trial",
    monthly_price: 0,
    annual_price: 0,
    limits: { posts: 500, brands: 3, team_members: 5, images: 200 },
    features: ["Full Pro access for 14 days", "3 brand profiles", "10 social accounts", "500 AI posts/month", "Advanced analytics"],
  },
  starter: {
    name: "Starter",
    monthly_price: 49,
    annual_price: 39,
    limits: { posts: 100, brands: 1, team_members: 1, images: 50 },
    features: ["1 brand profile", "3 social accounts", "100 AI posts/month", "Basic analytics"],
  },
  pro: {
    name: "Pro",
    monthly_price: 99,
    annual_price: 79,
    popular: true,
    limits: { posts: 500, brands: 3, team_members: 5, images: 200 },
    features: ["3 brand profiles", "10 social accounts", "500 AI posts/month", "Advanced analytics", "Trend alerts", "AI image generator"],
  },
  agency: {
    name: "Agency",
    monthly_price: 199,
    annual_price: 159,
    limits: { posts: 999999, brands: 999999, team_members: 5, images: 999999 },
    features: ["Unlimited brands", "Unlimited accounts", "Unlimited AI posts", "White-label reports", "Dedicated support", "API access"],
  },
} as const;

export type PlanKey = keyof typeof PLAN_CONFIG;

// Dummy subscription data — used when Stripe is not connected
export const DUMMY_SUBSCRIPTION = {
  subscription_id: "sub_dummy_12345",
  status: "active" as const,
  plan: "pro",
  current_period_end: Math.floor(Date.now() / 1000) + 15 * 24 * 60 * 60,
  cancel_at_period_end: false,
  interval: "month" as const,
};

// Dummy billing history
export const DUMMY_INVOICES = [
  {
    id: "inv_dummy_001",
    amount: 9900,
    currency: "usd",
    plan: "pro",
    status: "paid",
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    invoice_url: null,
  },
  {
    id: "inv_dummy_002",
    amount: 9900,
    currency: "usd",
    plan: "pro",
    status: "paid",
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    invoice_url: null,
  },
  {
    id: "inv_dummy_003",
    amount: 9900,
    currency: "usd",
    plan: "pro",
    status: "paid",
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    invoice_url: null,
  },
];

export function isUnlimited(value: number): boolean {
  return value >= 999999;
}

export function getUsagePercent(used: number, limit: number): number {
  if (isUnlimited(limit)) return 0;
  return Math.min((used / limit) * 100, 100);
}

export function getUsageColor(percent: number): string {
  if (percent >= 95) return "bg-destructive";
  if (percent >= 80) return "bg-amber-500";
  return "gradient-bg";
}
