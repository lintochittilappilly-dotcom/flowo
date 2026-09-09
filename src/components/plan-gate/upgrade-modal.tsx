import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PLAN_FEATURES, type FeatureKey, type Plan, getPlanFeatures } from "@/lib/plan-features";

const FEATURE_LABELS: Record<FeatureKey, { name: string; description: string }> = {
  ai_content_generation: { name: "AI Content Generation", description: "Generate social media posts with AI" },
  content_calendar: { name: "Content Calendar", description: "Visual calendar for scheduling posts" },
  basic_analytics: { name: "Basic Analytics", description: "Core engagement metrics and charts" },
  advanced_analytics: { name: "Advanced Analytics", description: "Platform breakdown, top posts, and comparisons" },
  comments_manager: { name: "Comments Manager", description: "Manage and reply to comments across platforms" },
  trends_page: { name: "Trends Page", description: "Discover trending topics in your industry" },
  brand_voice_training: { name: "Brand Voice Training", description: "Train AI to write in your brand voice" },
  bulk_scheduling: { name: "Bulk Scheduling", description: "Schedule multiple posts at once" },
  white_label_reports: { name: "White-Label Reports", description: "Generate branded analytics reports" },
  api_access: { name: "API Access", description: "Programmatic access via REST API" },
  priority_support: { name: "Priority Support", description: "Dedicated support with faster response times" },
  custom_posting_times: { name: "Custom Posting Times", description: "Set optimal posting times per platform" },
  team_collaboration: { name: "Team Collaboration", description: "Invite team members to collaborate" },
  export_analytics: { name: "Export Analytics", description: "Export reports as PDF and CSV" },
  ai_image_generation: { name: "AI Image Generation", description: "Generate images for posts with AI" },
  campaign_generator: { name: "Campaign Generator", description: "Generate a full month of content at once" },
};

/**
 * Find the cheapest plan that actually has this feature enabled.
 * Falls back to getNextPlan logic if no feature specified.
 */
function getRequiredPlanForFeature(currentPlan: string, feature?: FeatureKey): Plan | null {
  if (!feature) {
    // No feature specified — just show next plan
    if (currentPlan === 'starter') return 'pro';
    if (currentPlan === 'pro') return 'agency';
    return null;
  }

  const planOrder: Plan[] = ['starter', 'pro', 'agency'];
  const currentIdx = planOrder.indexOf(currentPlan as Plan);

  // Find the first plan AFTER current that has this feature
  for (let i = currentIdx + 1; i < planOrder.length; i++) {
    const plan = planOrder[i];
    if (PLAN_FEATURES[plan].features[feature]) {
      return plan;
    }
  }

  return null;
}

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature?: FeatureKey;
  currentPlan: string;
}

export function UpgradeModal({ open, onClose, feature, currentPlan }: UpgradeModalProps) {
  const navigate = useNavigate();
  const targetPlanKey = getRequiredPlanForFeature(currentPlan, feature);

  if (!targetPlanKey) {
    // Agency user — shouldn't see this
    return (
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4" onClick={onClose}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-[24px] border border-border bg-card p-6 shadow-2xl"
            >
              <div className="text-center">
                <Sparkles className="mx-auto h-10 w-10 text-primary" />
                <h3 className="mt-3 font-heading text-lg font-bold text-foreground">You're on our highest plan!</h3>
                <p className="mt-1 text-sm text-muted-foreground">You have access to all features.</p>
                <button onClick={onClose} className="mt-5 rounded-lg border border-border px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  const currentConfig = getPlanFeatures(currentPlan);
  const targetConfig = PLAN_FEATURES[targetPlanKey];
  const featureInfo = feature ? FEATURE_LABELS[feature] : null;

  // Features the target plan adds over current
  const newFeatures = (Object.keys(targetConfig.features) as FeatureKey[]).filter(
    (f) => targetConfig.features[f] && !currentConfig.features[f as FeatureKey]
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] rounded-[24px] border border-border bg-card shadow-2xl overflow-hidden"
          >
            {/* Gradient banner */}
            <div className="gradient-bg px-6 py-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
                <span className="font-heading text-sm font-bold text-primary-foreground">Unlock this feature</span>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Feature name */}
              {featureInfo && (
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground">{featureInfo.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {featureInfo.description} — available on the <span className="font-semibold text-foreground">{targetConfig.name}</span> plan.
                  </p>
                </div>
              )}

              {/* Plan comparison */}
              <div className="grid grid-cols-2 gap-3">
                {/* Current plan */}
                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Your Plan</p>
                  <p className="font-heading text-sm font-bold text-foreground">{currentConfig.name}</p>
                  <ul className="mt-3 space-y-1.5">
                    {(Object.keys(currentConfig.features) as FeatureKey[])
                      .filter((f) => currentConfig.features[f])
                      .slice(0, 5)
                      .map((f) => (
                        <li key={f} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Check className="h-3 w-3 text-muted-foreground shrink-0" />
                          {FEATURE_LABELS[f]?.name || f}
                        </li>
                      ))}
                  </ul>
                </div>

                {/* Target plan */}
                <div className="rounded-xl border-2 border-primary p-4">
                  <p className="text-xs font-semibold text-primary mb-2">Upgrade</p>
                  <p className="font-heading text-sm font-bold text-foreground">{targetConfig.name}</p>
                  <ul className="mt-3 space-y-1.5">
                    {newFeatures.slice(0, 5).map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                        <Check className="h-3 w-3 text-primary shrink-0" />
                        {FEATURE_LABELS[f]?.name || f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Price + buttons */}
              <div>
                <p className="text-center text-sm text-muted-foreground mb-3">
                  Starting at <span className="font-heading text-xl font-bold text-foreground">${targetConfig.price_monthly}</span>/month
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { onClose(); navigate("/settings?tab=billing"); }}
                    className="flex-1 rounded-lg gradient-bg py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
                  >
                    Upgrade to {targetConfig.name}
                  </button>
                  <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted">
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
