import { useState, useEffect } from "react";
import BillingTab from "@/components/settings/BillingTab";
import ConnectedAccountsTab from "@/components/settings/ConnectedAccountsTab";
import ApiAccessTab from "@/components/settings/ApiAccessTab";
import TeamMembersTab from "@/components/settings/TeamMembersTab";
import { motion } from "framer-motion";
import {
  Building, Clock, Link, Bell, CreditCard, Users, Lock, Code,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanGate } from "@/hooks/use-plan-gate";
import { UpgradeModal } from "@/components/plan-gate/upgrade-modal";
import { useUsageCheck } from "@/hooks/use-plan-gate";
import { getLimit } from "@/lib/plan-features";

const SettingsPage = () => {
  const { user, profile } = useAuth();
  const { plan, can, isAgency } = usePlanGate();
  const { posts: postsUsage, images: imagesUsage } = useUsageCheck();
  const [activeTab, setActiveTab] = useState("Brand Settings");
  const [saving, setSaving] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<any>(undefined);

  // Brand settings form
  const [brandName, setBrandName] = useState("");
  const [brandIndustry, setBrandIndustry] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [brandId, setBrandId] = useState<string | null>(null);

  // Handle tab from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "billing") setActiveTab("Billing");
    else if (tab === "connected-accounts") setActiveTab("Connected Accounts");
    else if (tab === "api-access") setActiveTab("API Access");
    else if (tab === "team") setActiveTab("Team Members");
  }, []);

  // Load brand
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: brands } = await supabase.from("brands").select("*").eq("user_id", user.id).limit(1);
      if (brands?.[0]) {
        setBrandName(brands[0].name);
        setBrandIndustry(brands[0].industry || "");
        setBrandDescription(brands[0].brand_description || "");
        setBrandId(brands[0].id);
      }
    };
    load();
  }, [user]);

  const handleSaveBrand = async () => {
    if (!user || !brandId) return;
    setSaving(true);
    await supabase.from("brands").update({ name: brandName, industry: brandIndustry, brand_description: brandDescription }).eq("id", brandId);
    toast.success("Changes saved!");
    setSaving(false);
  };

  // Billing data
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [postsCount, setPostsCount] = useState(0);
  const [brandsCount, setBrandsCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("billing_history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setBillingHistory(data || []));
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", user.id).then(({ count }) => setPostsCount(count || 0));
    supabase.from("brands").select("id", { count: "exact", head: true }).eq("user_id", user.id).then(({ count }) => setBrandsCount(count || 0));
  }, [user]);

  const planLimits = {
    posts: getLimit(plan, "posts_per_month"),
    brands: getLimit(plan, "brands"),
  };

  const tabs = [
    { label: "Brand Settings", icon: Building, locked: false },
    { label: "Posting Preferences", icon: Clock, locked: false },
    { label: "Connected Accounts", icon: Link, locked: false },
    { label: "Team Members", icon: Users, locked: !can("team_collaboration") },
    { label: "Notifications", icon: Bell, locked: false },
    { label: "API Access", icon: Code, locked: !can("api_access") },
    { label: "Billing", icon: CreditCard, locked: false },
  ];

  const handleTabClick = (tab: typeof tabs[0]) => {
    if (tab.locked) {
      setUpgradeFeature(tab.label === "Team Members" ? "team_collaboration" : "api_access");
      setShowUpgradeModal(true);
      return;
    }
    setActiveTab(tab.label);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
          {tabs.map(t => (
            <button
              key={t.label}
              onClick={() => handleTabClick(t)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-left font-body text-sm transition-all shrink-0 ${
                activeTab === t.label
                  ? "md:border-l-2 md:border-l-primary bg-lavender/50 font-semibold text-primary"
                  : t.locked
                  ? "text-muted-foreground/50 hover:text-muted-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {t.locked ? <Lock className="h-4 w-4 shrink-0" /> : <t.icon className="h-4 w-4 shrink-0" />}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="rounded-md border border-border bg-card p-5 shadow-sm sm:p-6">
          {activeTab === "Brand Settings" && (
            <div className="space-y-5">
              <h3 className="font-heading text-base font-bold text-foreground">Brand Settings</h3>
              <div><label className="font-heading text-xs font-semibold text-foreground">Business Name</label><input value={brandName} onChange={e => setBrandName(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
              <div><label className="font-heading text-xs font-semibold text-foreground">Industry</label><input value={brandIndustry} onChange={e => setBrandIndustry(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
              <div><label className="font-heading text-xs font-semibold text-foreground">Brand Description</label><textarea value={brandDescription} onChange={e => setBrandDescription(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[100px] resize-none" /></div>
              <button onClick={handleSaveBrand} disabled={saving} className="rounded-md gradient-bg px-6 py-2.5 font-heading text-sm font-bold text-primary-foreground transition-transform hover:scale-105 disabled:opacity-60">{saving ? "Saving..." : "Save Changes"}</button>
            </div>
          )}

          {activeTab === "Posting Preferences" && (
            <div className="space-y-6">
              <h3 className="font-heading text-base font-bold text-foreground">Posting Preferences</h3>
              <div className="space-y-3">
                <p className="font-heading text-xs font-semibold text-foreground">Preferred Posting Times</p>
                {["Instagram","LinkedIn","Twitter"].map(p => (
                  <div key={p} className="flex items-center gap-3"><span className="w-20 text-xs font-medium text-foreground">{p}</span><select className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">{["9:00 AM","10:00 AM","12:00 PM","2:00 PM","4:00 PM","6:00 PM"].map(t => <option key={t}>{t}</option>)}</select></div>
                ))}
              </div>
              <div>
                <p className="font-heading text-xs font-semibold text-foreground mb-2">Content Mix</p>
                {[{ label: "Educational", value: 40 },{ label: "Promotional", value: 25 },{ label: "Engagement", value: 20 },{ label: "Behind the Scenes", value: 15 }].map(c => (
                  <div key={c.label} className="flex items-center gap-3 mb-2"><span className="w-32 text-xs text-foreground">{c.label}</span><input type="range" min={0} max={100} defaultValue={c.value} className="flex-1 accent-primary" /><span className="w-10 text-right text-xs font-semibold text-foreground">{c.value}%</span></div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Connected Accounts" && (
            <ConnectedAccountsTab brandId={brandId} />
          )}

          {activeTab === "Team Members" && (
            <TeamMembersTab />
          )}

          {activeTab === "Notifications" && (
            <div className="space-y-6">
              <h3 className="font-heading text-base font-bold text-foreground">Notifications</h3>
              {[
                { group: "Email Notifications", items: ["Post Published Confirmation","Weekly Performance Report","Low Engagement Alert","Trend Alert","Trial Ending Reminder"] },
                { group: "In-App Notifications", items: ["Comment Received","Post Failed to Publish","New Follower Milestone","Scheduled Post Reminder"] },
              ].map(g => (
                <div key={g.group}>
                  <p className="font-heading text-xs font-semibold text-foreground mb-3">{g.group}</p>
                  <div className="space-y-3">{g.items.map((item, i) => (
                    <div key={item} className="flex items-center justify-between"><span className="text-sm text-foreground">{item}</span><div className={`relative h-6 w-11 rounded-full cursor-pointer ${i < 3 ? "bg-success" : "bg-muted"}`}><div className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-all ${i < 3 ? "right-0.5" : "left-0.5"}`} /></div></div>
                  ))}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "API Access" && (
            <ApiAccessTab />
          )}

          {activeTab === "Billing" && (
            <BillingTab
              plan={plan}
              postsCount={postsUsage.used}
              brandsCount={brandsCount}
              limits={planLimits}
              billingHistory={billingHistory}
            />
          )}
        </motion.div>
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={upgradeFeature}
        currentPlan={plan}
      />
    </div>
  );
};

export default SettingsPage;
