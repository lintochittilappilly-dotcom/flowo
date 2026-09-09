import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Instagram, Linkedin, Twitter, BarChart3, FileText, X, LayoutGrid, List,
  TrendingUp, Eye, Heart, Sparkles, Loader2, MoreVertical, Star, Trash2, Copy,
  Edit3, Calendar, ChevronRight, AlertTriangle, Link as LinkIcon, Check, Lock
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { PLAN_FEATURES, type Plan, getLimit, isUnlimited as isUnlimitedFn } from "@/lib/plan-features";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SkeletonCard } from "@/components/ui/loading-skeletons";
import {
  createBrand, updateBrand, deleteBrand, getBrandStats, trainBrandVoice,
  setDefaultBrand, getBrandActivity, type BrandStats, type BrandActivity
} from "@/services/brands.service";

const platformIconMap: Record<string, React.ElementType> = { Instagram, LinkedIn: Linkedin, Twitter };
const gradients = [
  "from-primary to-secondary",
  "from-emerald-500 to-teal-400",
  "from-blue-600 to-blue-400",
  "from-amber-500 to-orange-400",
  "from-pink-500 to-rose-400",
  "from-violet-500 to-purple-400",
];
const industryOptions = [
  "Beauty & Wellness", "Health & Fitness", "Technology & SaaS", "E-commerce & Retail",
  "Food & Beverage", "Real Estate", "Coaching & Consulting", "Finance & Accounting",
  "Education", "Travel & Hospitality", "Marketing & Advertising", "Healthcare & Medical",
  "Legal Services", "Entertainment & Media", "Non-Profit & NGO", "Automotive",
  "Construction & Architecture", "Fashion & Apparel", "Sports & Recreation",
  "Agriculture & Farming", "Other"
];
const toneOptions = ["Professional", "Casual", "Witty", "Bold", "Inspirational", "Educational", "Empathetic", "Authoritative"];
const colorSwatches = ["#6D28D9", "#EC4899", "#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#14B8A6", "#F97316", "#64748B", "#A855F7"];

interface Brand {
  id: string;
  name: string;
  industry: string;
  initials: string;
  color: string;
  colorHex: string;
  is_default: boolean;
  tone: string[];
  brand_description: string;
  sample_posts: string;
  stats: BrandStats;
  platforms: { icon: React.ElementType; name: string }[];
  activities: BrandActivity[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function activityDotColor(type: string): string {
  if (type === "post_published") return "bg-success";
  if (type === "voice_trained") return "bg-primary";
  if (type === "platform_connected") return "bg-blue-500";
  if (type === "brand_created") return "bg-secondary";
  return "bg-muted-foreground";
}

const BrandsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [creating, setCreating] = useState(false);
  const [training, setTraining] = useState(false);
  const [voiceProfile, setVoiceProfile] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Edit slide-over state
  const [editBrand, setEditBrand] = useState<Brand | null>(null);
  const [editName, setEditName] = useState("");
  const [editIndustry, setEditIndustry] = useState("");
  const [editTones, setEditTones] = useState<string[]>([]);
  const [editDesc, setEditDesc] = useState("");
  const [editSamples, setEditSamples] = useState("");
  const [saving, setSaving] = useState(false);
  const [editColor, setEditColor] = useState("#6D28D9");

  // Delete confirmation
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Form state
  const [formName, setFormName] = useState("");
  const [formIndustry, setFormIndustry] = useState("Beauty & Wellness");
  const [formColor, setFormColor] = useState(colorSwatches[0]);
  const [formTones, setFormTones] = useState<string[]>([]);
  const [formDesc, setFormDesc] = useState("");
  const [formSamplePosts, setFormSamplePosts] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Profile plan info
  const [plan, setPlan] = useState<string>("starter");
  const brandLimit = PLAN_FEATURES[plan as Plan]?.limits.brands ?? 1;
  const isUnlimitedBrands = brandLimit >= 999999;
  const atLimit = !isUnlimitedBrands && brands.length >= brandLimit;

  const fetchBrands = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get plan
    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
    if (profile?.plan) setPlan(profile.plan);

    const { data: brandsData } = await supabase
      .from("brands")
      .select("id, name, industry, is_default, tone, brand_description, sample_posts, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (brandsData && brandsData.length > 0) {
      const enriched: Brand[] = await Promise.all(
        brandsData.map(async (b: any, i: number) => {
          const [stats, accounts, activities] = await Promise.all([
            getBrandStats(b.id),
            supabase.from("social_accounts").select("platform").eq("brand_id", b.id).eq("is_active", true),
            getBrandActivity(b.id, 3),
          ]);

          const pIcons = (accounts.data || []).map((a: any) => ({
            icon: platformIconMap[a.platform] || FileText,
            name: a.platform,
          }));

          return {
            id: b.id,
            name: b.name,
            industry: b.industry || "General",
            initials: b.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
            color: gradients[i % gradients.length],
            colorHex: colorSwatches[i % colorSwatches.length],
            is_default: b.is_default || false,
            tone: b.tone || [],
            brand_description: b.brand_description || "",
            sample_posts: b.sample_posts || "",
            stats,
            platforms: pIcons,
            activities,
          };
        })
      );
      setBrands(enriched);
    } else {
      setBrands([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  const handleCreateBrand = async () => {
    if (!user || !formName.trim()) { toast.error("Enter a brand name"); return; }
    if (brands.length >= brandLimit) { toast.error("Brand limit reached. Upgrade your plan."); return; }
    setCreating(true);
    try {
      const brandId = await createBrand(
        user.id, formName, formIndustry, formTones, formSamplePosts, formDesc, brands.length === 0
      );

      if (formSamplePosts.trim() || formTones.length > 0) {
        setTraining(true);
        const vp = await trainBrandVoice(brandId, user.id, formName, formIndustry, formSamplePosts, formTones);
        setVoiceProfile(vp);
        setTraining(false);
      }

      toast.success("Brand created successfully!");
      setShowModal(false);
      resetForm();
      fetchBrands();
    } catch (e: any) {
      toast.error(e.message || "Failed to create brand");
    }
    setCreating(false);
  };

  const handleSetDefault = async (brandId: string) => {
    if (!user) return;
    await setDefaultBrand(brandId, user.id);
    toast.success("Default brand updated");
    setOpenMenuId(null);
    fetchBrands();
  };

  const handleOpenEdit = (brand: Brand) => {
    setEditBrand(brand);
    setEditName(brand.name);
    setEditIndustry(brand.industry);
    setEditTones(brand.tone);
    setEditDesc(brand.brand_description);
    setEditSamples(brand.sample_posts);
    setEditColor(brand.colorHex);
    setOpenMenuId(null);
  };

  const handleSaveEdit = async () => {
    if (!editBrand) return;
    setSaving(true);
    try {
      await updateBrand(editBrand.id, {
        name: editName,
        industry: editIndustry,
        tone: editTones,
        brand_description: editDesc,
        sample_posts: editSamples,
        color: editColor,
      });
      toast.success("Brand updated");
      setEditBrand(null);
      fetchBrands();
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
    setSaving(false);
  };

  const handleDeleteBrand = async () => {
    if (!deletingBrand) return;
    try {
      await deleteBrand(deletingBrand.id);
      toast.success("Brand deleted");
      setDeletingBrand(null);
      setDeleteConfirmText("");
      fetchBrands();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  };

  const resetForm = () => {
    setFormName(""); setFormIndustry("Beauty & Wellness"); setFormColor(colorSwatches[0]);
    setFormTones([]); setFormDesc(""); setFormSamplePosts(""); setVoiceProfile("");
    setStep(1);
  };

  const toggleTone = (t: string, setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    setter((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const usagePercent = isUnlimitedBrands ? 0 : Math.min(Math.round((brands.length / brandLimit) * 100), 100);
  const usageBarColor = usagePercent >= 100 ? "bg-destructive" : usagePercent >= 80 ? "bg-amber-500" : "bg-primary";

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-24 rounded-md bg-muted animate-pulse" />
            <div className="h-4 w-40 rounded-md bg-muted animate-pulse" />
          </div>
          <div className="h-10 w-36 rounded-md bg-muted animate-pulse" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1.5">
          <h2 className="font-heading text-xl font-bold text-foreground">Brands</h2>
          <p className="text-xs text-muted-foreground">
            You are using <span className="font-semibold text-foreground">{brands.length}</span> of{" "}
            <span className="font-semibold text-foreground">{isUnlimitedBrands ? "Unlimited" : brandLimit}</span> brand slot{brandLimit !== 1 ? "s" : ""}
          </p>
          {!isUnlimitedBrands && (
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full transition-all ${usageBarColor}`} style={{ width: `${usagePercent}%` }} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-[var(--radius-sm)] border border-border bg-card p-0.5">
            <button onClick={() => setLayout("grid")} className={`flex h-8 w-8 items-center justify-center rounded-sm transition-all ${layout === "grid" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button onClick={() => setLayout("list")} className={`flex h-8 w-8 items-center justify-center rounded-sm transition-all ${layout === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <List className="h-4 w-4" />
            </button>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => { if (atLimit) { setShowUpgradeModal(true); } else { setShowModal(true); resetForm(); } }}
                  className={`flex items-center gap-1.5 rounded-[var(--radius-sm)] px-4 py-2.5 font-heading text-xs font-bold transition-transform ${atLimit ? "cursor-not-allowed bg-muted text-muted-foreground opacity-50" : "gradient-bg text-primary-foreground hover:scale-105"}`}
                >
                  <Plus className="h-4 w-4" /> Add New Brand
                </button>
              </TooltipTrigger>
              {atLimit && (
                <TooltipContent side="bottom">
                  <p>Upgrade your plan to add more brands</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Plan usage warning */}
      {usagePercent >= 80 && !isUnlimitedBrands && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-800 dark:text-amber-200">
            You are using <span className="font-bold">{brands.length} of {brandLimit}</span> brand slots.{" "}
            <button onClick={() => setShowUpgradeModal(true)} className="font-bold text-primary underline">Upgrade your plan</button> for more brands.
          </p>
        </motion.div>
      )}

      {/* Empty state */}
      {brands.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[16px] border-2 border-dashed border-border bg-card p-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-bg shadow-lg">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <p className="mt-5 font-heading text-lg font-bold text-foreground">No brands yet</p>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">Create your first brand profile to start generating on-brand content with AI</p>
          <button onClick={() => { setShowModal(true); resetForm(); }} className="mt-6 rounded-[var(--radius-sm)] gradient-bg px-8 py-3 font-heading text-sm font-bold text-primary-foreground transition-transform hover:scale-105">
            Create Your First Brand
          </button>
        </div>
      ) : layout === "grid" ? (
        /* Grid layout */
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-[16px] border border-border bg-card shadow-card transition-shadow hover:shadow-card-hover"
            >
              {/* Color header */}
              <div className={`relative h-20 bg-gradient-to-br ${b.color}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.15),transparent)]" />
                <div className="absolute left-4 top-3">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-heading text-base font-bold text-white">{b.name}</h3>
                    {i === 0 && (
                      <span className="rounded-full bg-lavender/90 px-2 py-0.5 text-[9px] font-bold text-primary backdrop-blur-sm">First Brand</span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/80">{b.industry}</p>
                </div>
                <div className="absolute right-3 top-3 flex items-center gap-1.5">
                  {b.is_default && (
                    <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                      <Star className="h-2.5 w-2.5" fill="currentColor" /> Default
                    </span>
                  )}
                  <div className="relative">
                    <button onClick={() => setOpenMenuId(openMenuId === b.id ? null : b.id)} className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                    <AnimatePresence>
                      {openMenuId === b.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          className="absolute right-0 top-9 z-20 w-44 rounded-[var(--radius-sm)] border border-border bg-card py-1 shadow-lg"
                        >
                          {!b.is_default && (
                            <button onClick={() => handleSetDefault(b.id)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted">
                              <Star className="h-3.5 w-3.5" /> Set as Default
                            </button>
                          )}
                          <button onClick={() => handleOpenEdit(b)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted">
                            <Edit3 className="h-3.5 w-3.5" /> Edit Brand
                          </button>
                          <button onClick={() => navigate(`/analytics?brand=${b.id}`)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted">
                            <BarChart3 className="h-3.5 w-3.5" /> View Analytics
                          </button>
                          <div className="my-1 h-px bg-border" />
                          <button onClick={() => { setDeletingBrand(b); setOpenMenuId(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/5">
                            <Trash2 className="h-3.5 w-3.5" /> Delete Brand
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5">
                {/* Connected platforms */}
                <div className="mt-4 flex items-center gap-1.5">
                  {b.platforms.length > 0 ? (
                    <>
                      {b.platforms.map((p, pi) => (
                        <div key={pi} className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background">
                          <p.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      ))}
                      <span className="ml-1 text-[10px] text-muted-foreground">{b.platforms.length} connected</span>
                    </>
                  ) : (
                    <button onClick={() => navigate("/settings")} className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-2.5 py-1 text-[10px] text-muted-foreground hover:border-primary hover:text-primary">
                      <Plus className="h-3 w-3" /> Connect Platform
                    </button>
                  )}
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-[var(--radius-sm)] bg-muted/50 px-2 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Calendar className="h-3 w-3 text-primary" />
                      <p className="font-heading text-sm font-bold text-foreground">{b.stats.postsThisMonth}</p>
                    </div>
                    <p className="mt-0.5 text-[9px] font-medium text-muted-foreground">Posts This Month</p>
                  </div>
                  <div className="rounded-[var(--radius-sm)] bg-muted/50 px-2 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Eye className="h-3 w-3 text-secondary" />
                      <p className="font-heading text-sm font-bold text-foreground">
                        {b.stats.totalReach > 1000 ? `${(b.stats.totalReach / 1000).toFixed(1)}K` : b.stats.totalReach}
                      </p>
                    </div>
                    <p className="mt-0.5 text-[9px] font-medium text-muted-foreground">Total Reach</p>
                  </div>
                  <div className="rounded-[var(--radius-sm)] bg-muted/50 px-2 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Heart className="h-3 w-3 text-success" />
                      <p className="font-heading text-sm font-bold text-foreground">{b.stats.avgEngagementRate}%</p>
                    </div>
                    <p className="mt-0.5 text-[9px] font-medium text-muted-foreground">Avg Engagement</p>
                  </div>
                </div>

                {/* Activity feed */}
                {b.activities.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    {b.activities.map((act) => (
                      <div key={act.id} className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${activityDotColor(act.activity_type)}`} />
                        <p className="flex-1 truncate text-[10px] text-muted-foreground">{act.description}</p>
                        <span className="shrink-0 text-[9px] text-muted-foreground/70">{timeAgo(act.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => navigate(`/create?brand=${b.id}`)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-lavender py-2.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/15"
                  >
                    <Sparkles className="h-3 w-3" /> Create Post
                  </button>
                  <button
                    onClick={() => navigate(`/analytics?brand=${b.id}`)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-lavender py-2.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/15"
                  >
                    <BarChart3 className="h-3 w-3" /> View Analytics
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Add brand card */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => { if (atLimit) { setShowUpgradeModal(true); } else { setShowModal(true); resetForm(); } }}
            className={`flex min-h-[360px] flex-col items-center justify-center rounded-[16px] border-2 border-dashed p-8 transition-all ${atLimit ? "border-border bg-muted/30 text-muted-foreground" : "border-border bg-card/50 text-muted-foreground hover:border-primary hover:text-primary"}`}
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${atLimit ? "bg-muted" : "gradient-bg"}`}>
              {atLimit ? <Lock className="h-6 w-6 text-muted-foreground" /> : <Plus className="h-6 w-6 text-primary-foreground" />}
            </div>
            <p className="mt-4 font-heading text-sm font-semibold">
              {atLimit ? "Upgrade to add more brands" : "Add New Brand"}
            </p>
          </motion.button>
        </div>
      ) : (
        /* List layout */
        <div className="space-y-3">
          {brands.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex flex-col gap-4 rounded-[16px] border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-4 sm:min-w-[220px]">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${b.color} text-sm font-bold text-primary-foreground shadow-md`}>
                  {b.initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-sm font-bold text-foreground">{b.name}</h3>
                    {b.is_default && <Star className="h-3 w-3 text-amber-500" fill="currentColor" />}
                    {i === 0 && (
                      <span className="rounded-full bg-lavender px-2 py-0.5 text-[9px] font-bold text-primary">First Brand</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{b.industry}</p>
                </div>
              </div>
              <div className="flex flex-1 flex-wrap items-center gap-5">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span className="font-heading text-sm font-bold text-foreground">{b.stats.postsThisMonth}</span>
                  <span className="text-[10px] text-muted-foreground">posts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-secondary" />
                  <span className="font-heading text-sm font-bold text-foreground">
                    {b.stats.totalReach > 1000 ? `${(b.stats.totalReach / 1000).toFixed(1)}K` : b.stats.totalReach}
                  </span>
                  <span className="text-[10px] text-muted-foreground">reach</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-success" />
                  <span className="font-heading text-sm font-bold text-foreground">{b.stats.avgEngagementRate}%</span>
                  <span className="text-[10px] text-muted-foreground">eng.</span>
                </div>
                {b.platforms.length > 0 && (
                  <div className="flex items-center gap-1">
                    {b.platforms.map((p, pi) => (
                      <div key={pi} className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background">
                        <p.icon className="h-3 w-3 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleOpenEdit(b)} className="rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted">
                  Edit
                </button>
                <button onClick={() => navigate(`/analytics?brand=${b.id}`)} className="rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted">
                  Analytics
                </button>
                <button onClick={() => navigate(`/create?brand=${b.id}`)} className="rounded-[var(--radius-sm)] gradient-bg px-3 py-1.5 text-[11px] font-bold text-primary-foreground hover:scale-[1.02]">
                  Create
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Upgrade Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showUpgradeModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowUpgradeModal(false)} className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 m-auto h-fit w-full max-w-md rounded-[24px] border border-border bg-card p-6 shadow-2xl mx-4 sm:mx-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-base font-bold text-foreground">Upgrade Your Plan</h3>
                <button onClick={() => setShowUpgradeModal(false)} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Your <span className="font-semibold capitalize text-foreground">{plan}</span> plan allows{" "}
                <span className="font-semibold text-foreground">{isUnlimitedBrands ? "unlimited" : brandLimit}</span> brand{brandLimit !== 1 ? "s" : ""}.
                You've used all available slots.
              </p>
              <div className="space-y-3 mb-6">
              {(["starter", "pro", "agency"] as Plan[]).map((p) => {
                  const cfg = PLAN_FEATURES[p];
                  const isCurrent = p === plan;
                  const limit = cfg.limits.brands;
                  return (
                    <div key={p} className={`flex items-center justify-between rounded-[var(--radius-sm)] border px-4 py-3 ${isCurrent ? "border-primary bg-lavender" : "border-border"}`}>
                      <div>
                        <p className={`text-sm font-semibold ${isCurrent ? "text-primary" : "text-foreground"}`}>{cfg.name}</p>
                        <p className="text-[11px] text-muted-foreground">{limit >= 999999 ? "Unlimited" : limit} brand{limit !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">${cfg.price_monthly}/mo</p>
                        {isCurrent && <p className="text-[10px] font-semibold text-primary">Current</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => { setShowUpgradeModal(false); navigate("/settings?tab=billing"); }}
                className="w-full rounded-[var(--radius-sm)] gradient-bg py-3 font-heading text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                Upgrade Now
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Create Brand Modal ───────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 m-auto h-fit w-full max-w-[560px] rounded-[24px] border border-border bg-card p-6 shadow-2xl mx-4 sm:mx-auto overflow-y-auto"
              style={{ maxHeight: "90vh" }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-heading text-base font-bold text-foreground">Add New Brand</h3>
                  <p className="text-[11px] text-muted-foreground">Step {step} of 3</p>
                </div>
                <button onClick={() => setShowModal(false)} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="mb-6 flex gap-1.5">
                {[1, 2, 3].map((s) => (
                  <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? "gradient-bg" : "bg-muted"}`} />
                ))}
              </div>

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div>
                      <label className="font-heading text-xs font-semibold text-foreground">Brand Name</label>
                      <input value={formName} onChange={(e) => setFormName(e.target.value)} className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Enter brand name" />
                    </div>
                    <div>
                      <label className="font-heading text-xs font-semibold text-foreground">Industry</label>
                      <select value={formIndustry} onChange={(e) => setFormIndustry(e.target.value)} className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                        {industryOptions.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="font-heading text-xs font-semibold text-foreground">Brand Color</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {colorSwatches.map((c) => (
                          <button key={c} onClick={() => setFormColor(c)} className={`h-8 w-8 rounded-full transition-transform ${formColor === c ? "scale-110 ring-2 ring-primary ring-offset-2" : "hover:scale-105"}`} style={{ backgroundColor: c }} />
                        ))}
                        <label className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-border hover:border-primary transition-colors" title="Custom color">
                          <span className="text-[10px] font-bold text-muted-foreground">+</span>
                          <input
                            type="color"
                            value={formColor}
                            onChange={(e) => setFormColor(e.target.value)}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          />
                        </label>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md" style={{ backgroundColor: formColor }} />
                        <span className="text-[11px] font-mono text-muted-foreground">{formColor}</span>
                      </div>
                    </div>
                    <div>
                      <label className="font-heading text-xs font-semibold text-foreground">Brand Description</label>
                      <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px] resize-none" placeholder="Briefly describe your brand..." />
                    </div>
                    <button onClick={() => setStep(2)} disabled={!formName.trim()} className="w-full rounded-[var(--radius-sm)] gradient-bg py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50">Continue</button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div>
                      <label className="font-heading text-xs font-semibold text-foreground">Brand Tone</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {toneOptions.map((t) => (
                          <button key={t} onClick={() => toggleTone(t, setFormTones)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${formTones.includes(t) ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground hover:border-primary"}`}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="font-heading text-xs font-semibold text-foreground">Paste Existing Posts</label>
                      <textarea value={formSamplePosts} onChange={(e) => setFormSamplePosts(e.target.value)} className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[100px] resize-none" placeholder="Paste 2-3 of your best posts to train AI voice..." />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setStep(1)} className="flex-1 rounded-[var(--radius-sm)] border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted">Back</button>
                      <button onClick={() => setStep(3)} className="flex-1 rounded-[var(--radius-sm)] gradient-bg py-2.5 text-sm font-bold text-primary-foreground">Continue</button>
                    </div>
                    <button onClick={() => { setFormSamplePosts(""); setFormTones([]); setStep(3); }} className="w-full text-center text-xs text-muted-foreground hover:text-primary">Skip for now</button>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-bg shadow-lg">
                      {training ? <Loader2 className="h-7 w-7 animate-spin text-primary-foreground" /> : creating ? <Loader2 className="h-7 w-7 animate-spin text-primary-foreground" /> : <Sparkles className="h-7 w-7 text-primary-foreground" />}
                    </div>
                    <p className="font-heading text-base font-bold text-foreground">
                      {training ? "AI is learning your brand voice..." : creating ? "Creating brand..." : "Ready to create your brand"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {training ? "This takes a few seconds" : "We'll analyze your inputs and build a custom AI voice profile."}
                    </p>
                    {voiceProfile && (
                      <div className="rounded-[var(--radius-sm)] border border-success/30 bg-success/5 p-3 text-left">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Check className="h-3.5 w-3.5 text-success" />
                          <span className="text-[10px] font-bold text-success">Generated</span>
                        </div>
                        <p className="text-xs text-foreground/70">{voiceProfile.slice(0, 200)}...</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => setStep(2)} disabled={creating || training} className="flex-1 rounded-[var(--radius-sm)] border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50">Back</button>
                      <button onClick={handleCreateBrand} disabled={creating || training} className="flex-1 rounded-[var(--radius-sm)] gradient-bg py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60">
                        {creating || training ? "Creating..." : "Create Brand"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Edit Brand Slide-Over ────────────────────────────── */}
      <AnimatePresence>
        {editBrand && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditBrand(null)} className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm" />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-[480px] overflow-y-auto border-l border-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border p-5">
                <h3 className="font-heading text-base font-bold text-foreground">Edit Brand</h3>
                <button onClick={() => setEditBrand(null)} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-5 p-5">
                <div>
                  <label className="font-heading text-xs font-semibold text-foreground">Brand Name</label>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="font-heading text-xs font-semibold text-foreground">Industry</label>
                  <select value={editIndustry} onChange={(e) => setEditIndustry(e.target.value)} className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {industryOptions.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-heading text-xs font-semibold text-foreground">Brand Color</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {colorSwatches.map((c) => (
                      <button key={c} onClick={() => setEditColor(c)} className={`h-8 w-8 rounded-full transition-transform ${editColor === c ? "scale-110 ring-2 ring-primary ring-offset-2" : "hover:scale-105"}`} style={{ backgroundColor: c }} />
                    ))}
                    <label className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-border hover:border-primary transition-colors" title="Custom color">
                      <span className="text-[10px] font-bold text-muted-foreground">+</span>
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      />
                    </label>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md" style={{ backgroundColor: editColor }} />
                    <span className="text-[11px] font-mono text-muted-foreground">{editColor}</span>
                  </div>
                </div>
                <div>
                  <label className="font-heading text-xs font-semibold text-foreground">Tones</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {toneOptions.map((t) => (
                      <button key={t} onClick={() => toggleTone(t, setEditTones)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${editTones.includes(t) ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground hover:border-primary"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="font-heading text-xs font-semibold text-foreground">Description</label>
                  <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px] resize-none" />
                </div>
                <div>
                  <label className="font-heading text-xs font-semibold text-foreground">Sample Posts</label>
                  <textarea value={editSamples} onChange={(e) => setEditSamples(e.target.value)} className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px] resize-none" />
                </div>
              </div>
              <div className="border-t border-border p-5 flex gap-3">
                <button onClick={() => { setDeletingBrand(editBrand); setEditBrand(null); }} className="rounded-[var(--radius-sm)] border border-destructive px-4 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/5">
                  Delete Brand
                </button>
                <div className="flex-1" />
                <button onClick={handleSaveEdit} disabled={saving} className="rounded-[var(--radius-sm)] gradient-bg px-6 py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-60">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Modal ────────────────────────── */}
      <AnimatePresence>
        {deletingBrand && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setDeletingBrand(null); setDeleteConfirmText(""); }} className="fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[70] m-auto h-fit w-full max-w-md rounded-[16px] border border-border bg-card p-6 shadow-2xl mx-4 sm:mx-auto"
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="mt-4 font-heading text-base font-bold text-foreground">Delete {deletingBrand.name}</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  This will permanently delete this brand and all its posts, scheduled content, and analytics data. This cannot be undone.
                </p>
                <div className="mt-4 w-full">
                  <label className="text-xs text-muted-foreground">Type <span className="font-bold text-foreground">{deletingBrand.name}</span> to confirm</label>
                  <input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="mt-1 w-full rounded-[var(--radius-sm)] border border-destructive/30 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/30"
                    placeholder={deletingBrand.name}
                  />
                </div>
                <div className="mt-5 flex w-full gap-3">
                  <button onClick={() => { setDeletingBrand(null); setDeleteConfirmText(""); }} className="flex-1 rounded-[var(--radius-sm)] border border-border py-2.5 text-xs font-semibold text-foreground hover:bg-muted">Cancel</button>
                  <button onClick={handleDeleteBrand} disabled={deleteConfirmText !== deletingBrand.name} className="flex-1 rounded-[var(--radius-sm)] bg-destructive py-2.5 text-xs font-bold text-destructive-foreground disabled:opacity-40">Delete Brand</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BrandsPage;
