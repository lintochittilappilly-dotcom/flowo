import { useState, useEffect, forwardRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, Download, Loader2, Check, ArrowUpRight, Calendar, Zap, Crown,
  CheckCircle, Info, Trash2, Shield, Receipt, Mail, X, Lock, Sparkles, ArrowRight,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, getTrialDaysLeft, hasActiveAccess } from "@/contexts/AuthContext";
import {
  PLAN_CONFIG, PlanKey, DUMMY_SUBSCRIPTION,
  isUnlimited, getUsagePercent, getUsageColor,
} from "@/services/stripe.service";
import { openInvoice } from "@/lib/generate-invoice";

interface BillingTabProps {
  plan: string;
  postsCount: number;
  brandsCount: number;
  limits: { posts: number; brands: number };
  billingHistory: any[];
}

/* ── Trial Started Banner ── */
const TrialStartedBanner = ({ onGoToDashboard }: { onGoToDashboard: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 text-center"
  >
    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full gradient-bg">
      <Sparkles className="h-7 w-7 text-primary-foreground" />
    </div>
    <h3 className="font-heading text-xl font-bold text-foreground">🎉 Your 14-day free trial has started!</h3>
    <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
      You have full Pro access for the next 14 days. No credit card required.
    </p>
    <button
      onClick={onGoToDashboard}
      className="mt-4 inline-flex items-center gap-2 rounded-full gradient-bg px-8 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
    >
      Go to Dashboard <ArrowRight className="h-4 w-4" />
    </button>
  </motion.div>
);

/* ── Trial Expired Lock Screen ── */
const TrialExpiredBanner = () => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-6 rounded-2xl border border-destructive/20 bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent p-6 text-center"
  >
    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
      <Lock className="h-7 w-7 text-destructive" />
    </div>
    <h3 className="font-heading text-xl font-bold text-foreground">🔒 Your free trial has ended</h3>
    <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
      Your 14-day trial expired. Choose a plan below to unlock your dashboard and continue managing your social media.
    </p>
    <p className="mt-2 text-xs text-muted-foreground/70">
      All your brands, posts, and data are saved and waiting for you.
    </p>
  </motion.div>
);

/* ── Professional "Contact Us" upgrade modal ── */
const UpgradeContactModal = ({ open, onClose, planName, price, interval }: {
  open: boolean; onClose: () => void; planName: string; price: number; interval: string;
}) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-bg">
              <Crown className="h-5 w-5 text-primary-foreground" />
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
          <h3 className="font-heading text-lg font-bold text-foreground">Upgrade to {planName}</h3>
          <p className="mt-1 text-2xl font-heading font-bold text-foreground">
            ${price}<span className="text-sm font-normal text-muted-foreground">/{interval === "annual" ? "mo" : "mo"}</span>
          </p>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Our team will be in touch to complete your upgrade. You can also reach us at{" "}
            <a href="mailto:billing@flowo.com" className="font-semibold text-primary hover:underline">billing@flowo.com</a>
          </p>
          <div className="mt-5 flex gap-3">
            <a
              href="mailto:billing@flowo.com?subject=Plan Upgrade Request&body=I'd like to upgrade to the ${planName} plan."
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg gradient-bg py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              <Mail className="h-3.5 w-3.5" /> Contact Us
            </a>
            <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
              Maybe Later
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const BillingTab = forwardRef<HTMLDivElement, BillingTabProps>(
  ({ plan, postsCount, brandsCount, limits, billingHistory: externalHistory }, ref) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, profile, refreshProfile } = useAuth();
    const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
    const [loading, setLoading] = useState<string | null>(null);
    const [portalLoading, setPortalLoading] = useState(false);
    const [subInfo, setSubInfo] = useState<any>(null);
    const [subLoading, setSubLoading] = useState(true);
    const [stripeConfigured, setStripeConfigured] = useState(false);
    const [showUpgradeContact, setShowUpgradeContact] = useState(false);
    const [upgradePlanTarget, setUpgradePlanTarget] = useState<PlanKey>("pro");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteInput, setDeleteInput] = useState("");
    const [cancelLoading, setCancelLoading] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [teamCount, setTeamCount] = useState(0);
    const [imageCount, setImageCount] = useState(0);
    const [billingHistory, setBillingHistory] = useState<any[]>([]);
    const [successBanner, setSuccessBanner] = useState(false);
    const [canceledBanner, setCanceledBanner] = useState(false);

    // Check URL params for trial_started, reason, success, cancel
    const trialJustStarted = searchParams.get("trial_started") === "true";
    const expiredReason = searchParams.get("reason") === "trial_expired";

    const returnUrl = `${window.location.origin}/settings?tab=billing`;
    const currentPlan = (plan as PlanKey) || "starter";
    const planConfig = PLAN_CONFIG[currentPlan] || PLAN_CONFIG.starter;
    const planLimits = planConfig.limits;

    // Calculate trial days left
    const daysLeft = profile ? getTrialDaysLeft(profile) : 0;
    const isOnTrial = profile?.plan === "trial" && hasActiveAccess(profile);
    const isTrialExpired = profile?.plan === "trial" && !hasActiveAccess(profile) || profile?.plan === "expired";

    // Check URL params for success/cancel
    useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("success") === "true") {
        setSuccessBanner(true);
        refreshProfile();
        // Clean up URL
        params.delete("success");
        window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
        setTimeout(() => setSuccessBanner(false), 5000);
      }
      if (params.get("canceled") === "true") {
        setCanceledBanner(true);
        params.delete("canceled");
        window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
        setTimeout(() => setCanceledBanner(false), 4000);
      }
    }, []);

    // Fetch subscription + billing history
    useEffect(() => {
      const fetchData = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) { setSubLoading(false); return; }

          const { data, error } = await supabase.functions.invoke("stripe-billing", {
            body: { action: "get_subscription", return_url: returnUrl },
          });

          if (!error && data) {
            setSubInfo(data);
            if (data.subscription_id && !data.subscription_id.startsWith("sub_dummy")) {
              setStripeConfigured(true);
            }
          }

          // Fetch real billing history only
          const { data: history } = await supabase
            .from("billing_history")
            .select("*")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false })
            .limit(12);

          setBillingHistory(
            (history && history.length > 0) ? history
            : (externalHistory && externalHistory.length > 0) ? externalHistory
            : []
          );

          const { count: tc } = await supabase
            .from("team_members")
            .select("id", { count: "exact", head: true })
            .eq("owner_user_id", session.user.id);
          setTeamCount(tc ?? 0);

          const { count: ic } = await supabase
            .from("generated_images")
            .select("id", { count: "exact", head: true })
            .eq("user_id", session.user.id);
          setImageCount(ic ?? 0);
        } catch (e) {
          console.error("Failed to fetch billing data:", e);
          setBillingHistory([]);
        } finally {
          setSubLoading(false);
        }
      };
      fetchData();
    }, []);

    const handleUpgrade = async (planKey: string) => {
      if (planKey === plan) return;

      if (!stripeConfigured) {
        setUpgradePlanTarget(planKey as PlanKey);
        setShowUpgradeContact(true);
        return;
      }

      setLoading(planKey);
      try {
        const { data, error } = await supabase.functions.invoke("stripe-billing", {
          body: { action: "create_checkout", plan: planKey, interval, return_url: returnUrl },
        });
        if (error) throw error;
        if (data?.url) {
          window.location.href = data.url;
        } else {
          setUpgradePlanTarget(planKey as PlanKey);
          setShowUpgradeContact(true);
        }
      } catch (e: any) {
        toast.error(e.message || "Checkout failed");
      } finally {
        setLoading(null);
      }
    };

    const handleManageBilling = async () => {
      if (!stripeConfigured) {
        setUpgradePlanTarget(currentPlan);
        setShowUpgradeContact(true);
        return;
      }

      setPortalLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("stripe-billing", {
          body: { action: "customer_portal", return_url: returnUrl },
        });
        if (error) throw error;
        if (data?.url) {
          window.location.href = data.url;
        } else {
          setShowUpgradeContact(true);
        }
      } catch (e: any) {
        toast.error(e.message || "Portal failed");
      } finally {
        setPortalLoading(false);
      }
    };

    const handleCancelSubscription = async () => {
      if (!stripeConfigured) {
        setUpgradePlanTarget(currentPlan);
        setShowUpgradeContact(true);
        return;
      }
      if (currentPlan === "trial") return;
      setCancelLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("stripe-billing", {
          body: { action: "cancel_subscription", return_url: returnUrl },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        if (data?.success) {
          toast.success("Subscription canceled. You'll retain access until the end of your billing period.");
          setSubInfo((prev: any) => ({ ...prev, cancel_at_period_end: true }));
          setShowCancelConfirm(false);
          refreshProfile();
        }
      } catch (e: any) {
        toast.error(e.message || "Failed to cancel subscription");
      } finally {
        setCancelLoading(false);
      }
    };

    const handleExportCSV = () => {
      if (billingHistory.length === 0) return;
      const rows = billingHistory.map((inv) => ({
        Date: inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "N/A",
        Plan: inv.plan || "Unknown",
        Amount: `$${((inv.amount ?? 0) / 100).toFixed(2)}`,
        Status: inv.status || "paid",
      }));
      const csv = [Object.keys(rows[0]).join(","), ...rows.map((r) => Object.values(r).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "flowo-billing-history.csv"; a.click();
      URL.revokeObjectURL(url);
      toast.success("Billing history exported");
    };

    const renewalDate = subInfo?.current_period_end
      ? new Date(subInfo.current_period_end * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : new Date(DUMMY_SUBSCRIPTION.current_period_end * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    const isAgency = currentPlan === "agency";

    const usageItems = [
      { label: "Posts Created", used: postsCount, limit: planLimits.posts, icon: Zap },
      { label: "Brand Profiles", used: brandsCount, limit: planLimits.brands, icon: Calendar },
      ...(isAgency ? [{ label: "Team Members", used: teamCount, limit: planLimits.team_members, icon: Shield }] : []),
      { label: "AI Images", used: imageCount, limit: planLimits.images, icon: CreditCard },
    ];

    const targetConfig = PLAN_CONFIG[upgradePlanTarget] || PLAN_CONFIG.pro;
    const targetPrice = interval === "annual" ? targetConfig.annual_price : targetConfig.monthly_price;

    if (subLoading) {
      return (
        <div ref={ref} className="space-y-6">
          <div className="h-6 w-48 rounded bg-muted animate-pulse" />
          <div className="h-40 rounded-xl bg-muted/50 animate-pulse" />
          <div className="h-24 rounded-xl bg-muted/50 animate-pulse" />
          <div className="grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-60 rounded-xl bg-muted/50 animate-pulse" />)}
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className="space-y-6">
        {/* Trial Started Banner */}
        {trialJustStarted && !isTrialExpired && (
          <TrialStartedBanner onGoToDashboard={() => navigate("/dashboard")} />
        )}

        {/* Trial Expired Lock Banner */}
        {(expiredReason || isTrialExpired) && !trialJustStarted && (
          <TrialExpiredBanner />
        )}

        {/* Trial Status Info (for active trial users) */}
        {isOnTrial && !trialJustStarted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4"
          >
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">
                {daysLeft} day{daysLeft !== 1 ? "s" : ""} left in your trial
              </p>
              <p className="text-xs text-muted-foreground">You have full Pro access. Upgrade anytime to keep it.</p>
            </div>
          </motion.div>
        )}

        {/* Success/Cancel banners */}
        {successBanner && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/5 p-4">
            <CheckCircle className="h-5 w-5 text-success shrink-0" />
            <div>
              <p className="text-sm font-bold text-success">Payment successful! 🎉</p>
              <p className="text-xs text-success/80">Welcome to the {plan} plan</p>
            </div>
          </motion.div>
        )}
        {canceledBanner && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <Info className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">No worries — your plan has not changed.</p>
          </motion.div>
        )}

        {/* Section 2 — Current Plan Card */}
        <div className="rounded-xl border border-border bg-gradient-to-br from-card to-muted/30 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg">
                <Crown className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading text-sm font-bold text-foreground capitalize">{currentPlan} Plan</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${subInfo?.cancel_at_period_end ? "bg-amber-100 text-amber-700" : "bg-success/10 text-success"}`}>
                    {subInfo?.cancel_at_period_end ? "Canceling" : "Active"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Renews {renewalDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-border bg-muted p-0.5">
              <button onClick={() => setInterval("monthly")} className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${interval === "monthly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                Monthly
              </button>
              <button onClick={() => setInterval("annual")} className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${interval === "annual" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                Annual <span className="text-success">-20%</span>
              </button>
            </div>
          </div>
          <p className="mt-3 font-heading text-3xl font-bold text-foreground">
            ${planConfig[interval === "annual" ? "annual_price" : "monthly_price"]}
            <span className="text-base font-normal text-muted-foreground">/month</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {currentPlan !== "agency" && (
              <button onClick={() => handleUpgrade(currentPlan === "starter" ? "pro" : "agency")} className="flex items-center gap-1.5 rounded-lg gradient-bg px-4 py-2 text-xs font-bold text-primary-foreground transition-transform hover:scale-[1.02]">
                Upgrade Plan <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
            >
              {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
              Manage Subscription
            </button>
          </div>
        </div>

        {/* Section 3 — Plan Comparison Cards */}
        <div>
          <p className="font-heading text-xs font-semibold text-foreground mb-3">
            {isOnTrial || isTrialExpired ? "Choose a plan to continue" : currentPlan === "starter" ? "Upgrade your plan" : "Change plan"}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {(["starter", "pro", "agency"] as const).map((key) => {
              const p = PLAN_CONFIG[key];
              const isCurrent = key === currentPlan && !isOnTrial && !isTrialExpired;
              const price = interval === "annual" ? p.annual_price : p.monthly_price;
              const isPopular = "popular" in p && p.popular;
              const isRecommended = (isOnTrial || isTrialExpired) && key === "pro";
              return (
                <motion.div
                  key={key}
                  whileHover={{ y: -2 }}
                  className={`relative rounded-xl border p-4 transition-all ${
                    isCurrent ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" 
                    : isRecommended ? "border-primary ring-2 ring-primary/40 bg-primary/5" 
                    : "border-border bg-card hover:border-primary/30"
                  } ${isPopular && !isRecommended ? "ring-1 ring-primary/30" : ""}`}
                >
                  {isRecommended && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full gradient-bg px-3 py-0.5 text-[10px] font-bold text-primary-foreground">
                      Recommended
                    </div>
                  )}
                  {isPopular && !isRecommended && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full gradient-bg px-3 py-0.5 text-[10px] font-bold text-primary-foreground">
                      Most Popular
                    </div>
                  )}
                  <p className="font-heading text-sm font-bold text-foreground">{p.name}</p>
                  <p className="mt-1 font-heading text-2xl font-bold text-foreground">
                    ${price}<span className="text-xs font-normal text-muted-foreground">/mo</span>
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Check className="h-3 w-3 text-success shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleUpgrade(key)}
                    disabled={isCurrent || loading === key}
                    className={`mt-4 w-full rounded-lg py-2 text-xs font-bold transition-all ${
                      isCurrent 
                        ? "border border-primary/30 bg-primary/5 text-primary cursor-default" 
                        : isRecommended 
                        ? "gradient-bg text-primary-foreground hover:scale-[1.02] disabled:opacity-50 shadow-lg"
                        : "gradient-bg text-primary-foreground hover:scale-[1.02] disabled:opacity-50"
                    }`}
                  >
                    {loading === key ? (
                      <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                    ) : isCurrent ? (
                      "Current Plan"
                    ) : isOnTrial || isTrialExpired ? (
                      <>Start with {p.name} <ArrowUpRight className="inline h-3 w-3 ml-1" /></>
                    ) : (
                      <>Upgrade <ArrowUpRight className="inline h-3 w-3 ml-1" /></>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Section 4 — Usage This Month */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="font-heading text-xs font-semibold text-foreground mb-4">Usage This Month</p>
          <div className="space-y-4">
            {usageItems.map((u) => {
              const unlimited = isUnlimited(u.limit);
              const percent = getUsagePercent(u.used, u.limit);
              const barColor = getUsageColor(percent);
              return (
                <div key={u.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 text-foreground">
                      <u.icon className="h-3.5 w-3.5 text-muted-foreground" /> {u.label}
                    </span>
                    {unlimited ? (
                      <span className="text-xs font-semibold text-primary">Unlimited</span>
                    ) : (
                      <span className="text-muted-foreground">{u.used}/{u.limit}</span>
                    )}
                  </div>
                  {!unlimited && (
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className={`h-2 rounded-full ${barColor} transition-all duration-500`} style={{ width: `${percent}%` }} />
                    </div>
                  )}
                  {!unlimited && percent >= 95 && (
                    <p className="mt-1 text-[10px] text-destructive font-semibold">
                      Almost at limit —{" "}
                      <button onClick={() => handleUpgrade(currentPlan === "starter" ? "pro" : "agency")} className="text-primary hover:underline">upgrade now</button>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 5 — Billing History */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-heading text-xs font-semibold text-foreground">Billing History</p>
            {billingHistory.length > 0 && (
              <button onClick={handleExportCSV} className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline">
                <Download className="h-3 w-3" /> Export CSV
              </button>
            )}
          </div>

          {billingHistory.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <Receipt className="mx-auto h-8 w-8 text-muted-foreground/30" />
              <p className="mt-3 text-sm font-semibold text-muted-foreground">No invoices yet</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Your billing history will appear here after your first payment.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground">Date</th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground">Plan</th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground">Amount</th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground">Status</th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.map((inv: any, i: number) => (
                    <tr key={inv.id || i} className={i % 2 ? "bg-muted/20" : ""}>
                      <td className="px-3 py-2 text-xs text-foreground">
                        {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground capitalize">{inv.plan ?? "pro"}</td>
                      <td className="px-3 py-2 text-xs font-semibold text-foreground">${((inv.amount ?? 0) / 100).toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${inv.status === "paid" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                          {inv.status === "paid" ? "Paid" : "Failed"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => openInvoice(
                            inv,
                            profile?.full_name || "Customer",
                            profile?.email || user?.email || "",
                            profile?.business_name || undefined,
                          )}
                          className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                        >
                          <FileText className="h-3 w-3" /> Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 6 — Danger Zone */}
        <div className="rounded-xl border border-destructive/20 bg-card p-5">
          <p className="font-heading text-sm font-bold text-destructive mb-4">Danger Zone</p>
          <div className="space-y-4">
            {/* Cancel Subscription - only show for paid plans */}
            {["starter", "pro", "agency"].includes(currentPlan) ? (
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Cancel Subscription</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Your plan will remain active until the end of the current billing period.</p>
                </div>
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={cancelLoading}
                  className="shrink-0 rounded-lg border border-destructive/30 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-40"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Cancel Subscription</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    You're on a free trial. No subscription to cancel — your trial will end automatically.
                  </p>
                </div>
                <span className="shrink-0 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted-foreground">
                  No subscription
                </span>
              </div>
            )}
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Delete Account</p>
                <p className="text-xs text-muted-foreground mt-0.5">Permanently delete your account and all data. This cannot be undone.</p>
              </div>
              <button onClick={() => setShowDeleteConfirm(true)} className="shrink-0 rounded-lg border border-destructive/30 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/5">
                <Trash2 className="inline h-3 w-3 mr-1" /> Delete
              </button>
            </div>
          </div>
        </div>

        {/* Cancel Subscription Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowCancelConfirm(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl"
            >
              <div className="text-center mb-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 mb-3">
                  <Shield className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="font-heading text-base font-bold text-foreground">Cancel Subscription?</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Your <span className="font-semibold capitalize">{currentPlan}</span> plan will remain active until the end of your current billing period. After that, you'll lose access to premium features.
                </p>
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={() => setShowCancelConfirm(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold text-foreground hover:bg-muted">
                  Keep Plan
                </button>
                <button
                  disabled={cancelLoading}
                  onClick={handleCancelSubscription}
                  className="flex-1 rounded-lg bg-destructive py-2 text-sm font-bold text-destructive-foreground disabled:opacity-50"
                >
                  {cancelLoading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Yes, Cancel"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowDeleteConfirm(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl"
            >
              <div className="text-center mb-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-3">
                  <Trash2 className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="font-heading text-base font-bold text-foreground">Delete Account?</h3>
                <p className="text-xs text-muted-foreground mt-1">Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm</p>
              </div>
              <input
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="Type DELETE"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-destructive/30"
              />
              <div className="mt-4 flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold text-foreground hover:bg-muted">Cancel</button>
                <button
                  disabled={deleteInput !== "DELETE"}
                  onClick={async () => {
                    try {
                      const { data, error } = await supabase.functions.invoke("stripe-billing", {
                        body: { action: "delete_account", return_url: returnUrl },
                      });
                      if (error) throw error;
                      if (data?.error) throw new Error(data.error);
                      if (data?.success) {
                        toast.success("Account deleted successfully. Redirecting...");
                        setShowDeleteConfirm(false);
                        setDeleteInput("");
                        // Sign out and redirect
                        await supabase.auth.signOut();
                        window.location.href = "/";
                      }
                    } catch (e: any) {
                      toast.error(e.message || "Failed to delete account");
                      setShowDeleteConfirm(false);
                      setDeleteInput("");
                    }
                  }}
                  className="flex-1 rounded-lg bg-destructive py-2 text-sm font-bold text-destructive-foreground disabled:opacity-40"
                >
                  Delete Forever
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Professional upgrade contact modal */}
        <UpgradeContactModal
          open={showUpgradeContact}
          onClose={() => setShowUpgradeContact(false)}
          planName={targetConfig.name}
          price={targetPrice}
          interval={interval}
        />
      </div>
    );
  }
);

BillingTab.displayName = "BillingTab";

export default BillingTab;
