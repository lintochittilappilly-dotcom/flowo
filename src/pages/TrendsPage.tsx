import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, TrendingUp, Calendar, Sparkles, ArrowUp, Loader2, RefreshCw,
  Bookmark, Share2, X, Check, Clock, Trash2, Info,
  Instagram, Linkedin, Twitter, Facebook, FileText, ExternalLink, AlertCircle, RotateCcw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import GenerateDialog from "@/components/trends/GenerateDialog";
import {
  getTrendingTopics, fetchTrendingTopics, getUpcomingDates,
  generatePostFromTrend, generateCampaign,
  saveTrend, unsaveTrend, getSavedTrends, clearAllSavedTrends, toggleTrendPosted
} from "@/services/trends.service";
import { useBrandStore } from "@/store/brand-store";
import BrandIndicator from "@/components/brand-indicator";

const industries = [
  "All Industries", "Beauty & Wellness", "Health & Fitness", "Technology & SaaS",
  "E-commerce & Retail", "Food & Beverage", "Real Estate", "Coaching & Consulting",
  "Finance & Accounting", "Education", "Travel & Hospitality", "Marketing & Advertising",
  "Healthcare & Medical",
];

const TRENDS_ENABLED = import.meta.env.VITE_TRENDS_ENABLED === "true";

interface Topic {
  id: string;
  topic: string;
  growth: number;
  source: string;
  trend_type: string;
  industry: string;
  trend_score: number;
}

interface UpcomingDate {
  date: string;
  event: string;
  category: string;
}

interface SavedTrend {
  id: string;
  topic: string;
  industry: string;
  is_posted: boolean;
  saved_at: string;
}

const platformIcons: Record<string, React.ElementType> = {
  Instagram, LinkedIn: Linkedin, Twitter, Facebook
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDateShort(dateStr: string): { month: string; day: string } {
  const d = new Date(dateStr);
  return {
    month: d.toLocaleDateString("en", { month: "short" }).toUpperCase(),
    day: String(d.getDate()),
  };
}

function isWithin7Days(dateStr: string): boolean {
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

const categoryColors: Record<string, string> = {
  Shopping: "text-secondary",
  Awareness: "text-primary",
  Holiday: "text-success",
  Business: "text-foreground",
};

// ── Skeleton card ─────────────────────────────────────────────────
function TrendSkeleton() {
  return (
    <div className="rounded-[12px] border border-border bg-card p-4 shadow-card animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-7 w-7 rounded-md bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-3 w-1/3 rounded bg-muted" />
        </div>
      </div>
      <div className="mt-3 h-8 w-full rounded-md bg-muted" />
    </div>
  );
}

const TrendsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeBrand } = useBrandStore();
  const [loading, setLoading] = useState(true);
  const [industry, setIndustry] = useState("All Industries");

  // Set industry from active brand on mount
  useEffect(() => {
    if (activeBrand?.industry) {
      const matchedIndustry = industries.find(
        (ind) => ind.toLowerCase() === activeBrand.industry?.toLowerCase()
      );
      if (matchedIndustry) {
        setIndustry(matchedIndustry);
      }
    }
  }, [activeBrand?.industry]);
  const [hotTopics, setHotTopics] = useState<Topic[]>([]);
  const [risingTopics, setRisingTopics] = useState<Topic[]>([]);
  const [upcomingDates, setUpcomingDates] = useState<UpcomingDate[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTopic, setDialogTopic] = useState("");

  // Inline generate state
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState<{ id: string; content: string; platform: string } | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Saved trends
  const [savedTopics, setSavedTopics] = useState<Set<string>>(new Set());
  const [savedTrends, setSavedTrends] = useState<SavedTrend[]>([]);
  const [savedPanelOpen, setSavedPanelOpen] = useState(false);

  // Campaign generator
  const [campaignTopic, setCampaignTopic] = useState("");
  const [campaignPosts, setCampaignPosts] = useState(7);
  const [campaignPlatforms, setCampaignPlatforms] = useState<string[]>(["Instagram", "LinkedIn", "Twitter"]);
  const [campaignGenerating, setCampaignGenerating] = useState(false);
  const [campaignStep, setCampaignStep] = useState(0);
  const [campaignResults, setCampaignResults] = useState<({ platform: string; content: string; suggested_scheduled_at: string } | null)[] | null>(null);
  const [campaignError, setCampaignError] = useState("");
  const [retryingIndex, setRetryingIndex] = useState<number | null>(null);

  // Connected platforms from social_accounts
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);

  // Upcoming dates
  const [showAllDates, setShowAllDates] = useState(false);
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [dateDialogEvent, setDateDialogEvent] = useState<UpcomingDate | null>(null);
  const [dateDialogPlatforms, setDateDialogPlatforms] = useState<string[]>(["Instagram"]);
  const [dateDialogNotes, setDateDialogNotes] = useState("");

  // Banner
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try { return localStorage.getItem("flowo_trends_banner") === "true"; } catch { return false; }
  });

  // Stale timer
  const [isStale, setIsStale] = useState(false);
  const staleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch data ──────────────────────────────────────────────────

  const fetchData = useCallback(async (ind?: string) => {
    setLoading(true);
    const selected = ind || industry;
    const effectiveIndustry = selected === "All Industries" ? "Technology & SaaS" : selected;

    try {
      const [hot, rising] = await Promise.all([
        getTrendingTopics(effectiveIndustry, "hot_today"),
        getTrendingTopics(effectiveIndustry, "rising_this_week"),
      ]);

      const mapTopics = (data: any[]): Topic[] =>
        data.map((t) => ({
          id: t.id,
          topic: t.topic,
          growth: t.growth_percent || 0,
          source: t.source || "Curated",
          trend_type: t.trend_type,
          industry: t.industry,
          trend_score: t.trend_score || 0,
        }));

      setHotTopics(mapTopics(hot));
      setRisingTopics(mapTopics(rising));

      const latest = [...hot, ...rising].reduce((max: string, t: any) => (t.fetched_at > max ? t.fetched_at : max), "");
      setLastUpdated(latest || "");

      setUpcomingDates(getUpcomingDates());
    } catch (e) {
      console.error("Failed to fetch trends:", e);
    }
    setLoading(false);

    // Reset stale timer
    if (staleTimer.current) clearTimeout(staleTimer.current);
    setIsStale(false);
    staleTimer.current = setTimeout(() => setIsStale(true), 30 * 60 * 1000);
  }, [industry]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch saved trends
  useEffect(() => {
    if (!user) return;
    getSavedTrends(user.id).then((data) => {
      setSavedTrends(data);
      setSavedTopics(new Set(data.map((t: any) => t.topic)));
    });
  }, [user]);

  // Fetch connected platforms from social_accounts
  useEffect(() => {
    if (!user) return;
    supabase
      .from("social_accounts")
      .select("platform")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const platforms = [...new Set(data.map((a: any) => {
            const p = a.platform as string;
            return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
          }))];
          setConnectedPlatforms(platforms);
          // Pre-select connected platforms for campaign
          setCampaignPlatforms(platforms.slice(0, 3));
        }
      });
  }, [user]);

  // ── Handlers ────────────────────────────────────────────────────

  const handleRefresh = async () => {
    setRefreshing(true);
    const effectiveIndustry = industry === "All Industries" ? "Technology & SaaS" : industry;
    await Promise.all([
      fetchTrendingTopics(effectiveIndustry, "hot_today"),
      fetchTrendingTopics(effectiveIndustry, "rising_this_week"),
    ]);
    toast.success(TRENDS_ENABLED ? "Trends refreshed from API" : "Trends refreshed with curated data");
    setRefreshing(false);
    fetchData();
  };

  const handleInlineGenerate = async (topicId: string, topicText: string) => {
    if (!user) return;
    setGeneratingId(topicId);
    setGeneratedPreview(null);

    try {
      const brandId = activeBrand?.id || "";
      const content = await generatePostFromTrend(topicText, brandId, "Instagram");
      setGeneratedPreview({ id: topicId, content: content ?? "", platform: "Instagram" });
    } catch (e) {
      console.error("Inline generate failed:", e);
      toast.error("Failed to generate post");
    } finally {
      setGeneratingId(null);
    }

    // Auto-collapse after 8 seconds
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => setGeneratedPreview(null), 8000);
  };

  const handleSaveTrend = async (topic: string, ind: string, score: number) => {
    if (!user) return;
    if (savedTopics.has(topic)) {
      const existing = savedTrends.find((t) => t.topic === topic);
      if (existing) {
        await unsaveTrend(existing.id);
        setSavedTrends((prev) => prev.filter((t) => t.id !== existing.id));
        setSavedTopics((prev) => { const n = new Set(prev); n.delete(topic); return n; });
        toast.success("Unsaved");
      }
    } else {
      await saveTrend(user.id, topic, ind, score);
      const updated = await getSavedTrends(user.id);
      setSavedTrends(updated);
      setSavedTopics(new Set(updated.map((t: any) => t.topic)));
      toast.success("Trend saved");
    }
  };

  const handleCopyTopic = (topic: string) => {
    navigator.clipboard.writeText(topic);
    toast.success("Copied to clipboard");
  };

  const handleCampaignGenerate = async () => {
    if (!campaignTopic.trim()) {
      setCampaignError("Enter a campaign topic");
      return;
    }
    if (!user) return;

    setCampaignError("");
    setCampaignGenerating(true);
    setCampaignResults(null);
    setCampaignStep(0);

    const stepInterval = setInterval(() => {
      setCampaignStep((prev) => Math.min(prev + 1, 2));
    }, 800);

    try {
      // Use active brand from store
      const brandId = activeBrand?.id || "";
      const results = await generateCampaign(campaignTopic, brandId, campaignPosts, campaignPlatforms);

      // Keep nulls in array so we can show "failed" cards with retry
      const withNulls: ({ platform: string; content: string; suggested_scheduled_at: string } | null)[] =
        Array.isArray(results)
          ? results.map((p) =>
              p &&
              typeof (p as any).platform === "string" &&
              typeof (p as any).content === "string" &&
              typeof (p as any).suggested_scheduled_at === "string"
                ? (p as { platform: string; content: string; suggested_scheduled_at: string })
                : null
            )
          : [];

      if (withNulls.length === 0) {
        setCampaignError("No posts were generated — please try again.");
        setCampaignResults(null);
        return;
      }

      setCampaignResults(withNulls);
    } catch (e) {
      console.error("Campaign generation failed:", e);
      setCampaignError("Campaign generation failed — please try again.");
      setCampaignResults(null);
    } finally {
      clearInterval(stepInterval);
      setCampaignGenerating(false);
    }
  };

  const handleRetryPost = async (index: number) => {
    if (!user || !campaignResults) return;
    setRetryingIndex(index);
    try {
      const brandId = activeBrand?.id || "";
      const platform = campaignPlatforms[index % campaignPlatforms.length];
      const content = await generatePostFromTrend(campaignTopic, brandId, platform);
      const scheduleDate = new Date();
      scheduleDate.setDate(scheduleDate.getDate() + index);
      scheduleDate.setHours(9, 0, 0, 0);
      setCampaignResults((prev) => {
        if (!prev) return prev;
        const next = [...prev];
        next[index] = { platform, content, suggested_scheduled_at: scheduleDate.toISOString() };
        return next;
      });
      toast.success("Post regenerated");
    } catch {
      toast.error("Retry failed — please try again");
    } finally {
      setRetryingIndex(null);
    }
  };

  const handleDateGenerate = (d: UpcomingDate) => {
    setDateDialogEvent(d);
    setDateDialogNotes(`Write a post about ${d.event}`);
    setDateDialogPlatforms(["Instagram"]);
    setDateDialogOpen(true);
  };

  const handleDateDialogGenerate = () => {
    if (!dateDialogEvent) return;
    setDateDialogOpen(false);
    setDialogTopic(`Content for ${dateDialogEvent.event} on ${new Date(dateDialogEvent.date).toLocaleDateString()}: ${dateDialogNotes}`);
    setDialogOpen(true);
  };

  const dismissBanner = () => {
    setBannerDismissed(true);
    try { localStorage.setItem("flowo_trends_banner", "true"); } catch { /* ignore */ }
  };

  const toggleCampaignPlatform = (p: string) => {
    setCampaignPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };

  // ── Render ──────────────────────────────────────────────────────

  const visibleDates = showAllDates ? upcomingDates : upcomingDates.slice(0, 15);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-24 rounded-md bg-muted animate-pulse" />
            <div className="h-4 w-64 rounded-md bg-muted animate-pulse" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {[1, 2, 3].map((col) => (
            <div key={col} className="space-y-3">
              <div className="h-5 w-32 rounded bg-muted animate-pulse" />
              {[1, 2, 3, 4, 5].map((i) => <TrendSkeleton key={i} />)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-xl font-bold text-foreground">Trends</h2>
            <BrandIndicator />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">Discover what is trending in your industry and generate posts instantly</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={industry}
            onChange={(e) => { setIndustry(e.target.value); fetchData(e.target.value); }}
            className="rounded-[var(--radius-sm)] border border-border bg-card px-3 py-2 font-body text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {industries.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
          </select>

          {lastUpdated && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" /> Updated {timeAgo(lastUpdated)}
            </span>
          )}

          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>

          <button onClick={() => setSavedPanelOpen(true)} className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted relative">
            <Bookmark className="h-3.5 w-3.5" /> Saved
            {savedTrends.length > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full gradient-bg text-[8px] font-bold text-primary-foreground">
                {savedTrends.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Stale banner */}
      {isStale && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-amber-200 bg-amber-50 px-4 py-2">
          <RefreshCw className="h-3.5 w-3.5 text-amber-600" />
          <p className="text-xs text-amber-800">Trends may be outdated —{" "}
            <button onClick={handleRefresh} className="font-bold text-primary hover:underline">click to refresh</button>
          </p>
        </motion.div>
      )}

      {/* API status banner */}
      {!bannerDismissed && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 rounded-[var(--radius-sm)] border px-4 py-3 ${TRENDS_ENABLED ? "border-success/30 bg-success/5" : "border-amber-200 bg-amber-50"}`}>
          <Info className={`h-4 w-4 shrink-0 mt-0.5 ${TRENDS_ENABLED ? "text-success" : "text-amber-600"}`} />
          <p className={`flex-1 text-xs ${TRENDS_ENABLED ? "text-success" : "text-amber-800"}`}>
            {TRENDS_ENABLED
              ? <>Real-time trends powered by API <span className="inline-block h-1.5 w-1.5 rounded-full bg-success ml-1" /></>
              : <>Showing curated trends for your industry. <button className="font-bold text-primary hover:underline">Connect Tavily or SerpAPI</button> for real-time trending data.</>
            }
          </p>
          <button onClick={dismissBanner} className={`shrink-0 ${TRENDS_ENABLED ? "text-success/50 hover:text-success" : "text-amber-400 hover:text-amber-600"}`}><X className="h-3.5 w-3.5" /></button>
        </motion.div>
      )}

      {/* Three Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Column 1 — Hot Today */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Flame className="h-4 w-4 text-destructive" />
            <h3 className="font-heading text-sm font-semibold text-foreground">Hot Today</h3>
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[9px] font-bold text-destructive">Today</span>
          </div>
          <div className="space-y-3">
            {hotTopics.length === 0 ? (
              <div className="flex flex-col items-center rounded-[12px] border-2 border-dashed border-border bg-card p-8 text-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 font-heading text-xs font-semibold text-muted-foreground">No trends found</p>
                <button onClick={handleRefresh} className="mt-2 text-[10px] font-semibold text-primary hover:underline">Refresh</button>
              </div>
            ) : hotTopics.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-[12px] border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md gradient-bg font-heading text-xs font-bold text-primary-foreground">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-sm font-semibold text-foreground leading-snug">{t.topic}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-destructive">
                        <ArrowUp className="h-3 w-3" /> +{t.growth}%
                      </span>
                      <span className="text-[9px] text-muted-foreground">searches today</span>
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[8px] text-muted-foreground">{t.source}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <button
                    onClick={() => handleInlineGenerate(t.id, t.topic)}
                    disabled={generatingId === t.id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full gradient-bg py-1.5 text-[11px] font-bold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
                  >
                    {generatingId === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    Generate Post
                  </button>
                  <button
                    onClick={() => handleSaveTrend(t.topic, t.industry, t.trend_score)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${savedTopics.has(t.topic) ? "bg-primary/10 text-primary" : "bg-lavender text-muted-foreground hover:text-primary"}`}
                  >
                    <Bookmark className="h-3.5 w-3.5" fill={savedTopics.has(t.topic) ? "currentColor" : "none"} />
                  </button>
                  <button onClick={() => handleCopyTopic(t.topic)} className="flex h-8 w-8 items-center justify-center rounded-full bg-lavender text-muted-foreground hover:text-primary transition-colors">
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Inline preview */}
                <AnimatePresence>
                  {generatedPreview?.id === t.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 rounded-[var(--radius-sm)] border border-success/30 bg-success/5 p-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Check className="h-3 w-3 text-success" />
                          <span className="text-[10px] font-bold text-success">Generated</span>
                        </div>
                        <p className="text-xs text-foreground/80 line-clamp-3">{generatedPreview.content.slice(0, 150)}...</p>
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => navigate("/create")} className="rounded-md bg-primary/10 px-3 py-1 text-[10px] font-semibold text-primary hover:bg-primary/20">
                            <ExternalLink className="inline h-3 w-3 mr-1" />View in Create
                          </button>
                          <button onClick={() => setGeneratedPreview(null)} className="text-[10px] text-muted-foreground hover:text-foreground">Dismiss</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Column 2 — Rising This Week */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <ArrowUp className="h-4 w-4 text-amber-500" />
            <h3 className="font-heading text-sm font-semibold text-foreground">Rising This Week</h3>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">This Week</span>
          </div>
          <div className="space-y-3">
            {risingTopics.length === 0 ? (
              <div className="flex flex-col items-center rounded-[12px] border-2 border-dashed border-border bg-card p-8 text-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 font-heading text-xs font-semibold text-muted-foreground">No rising trends</p>
              </div>
            ) : risingTopics.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 + 0.1 }}
                className="rounded-[12px] border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-100 font-heading text-xs font-bold text-amber-700">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-sm font-semibold text-foreground leading-snug">{t.topic}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600">
                        <ArrowUp className="h-3 w-3" /> +{t.growth}%
                      </span>
                      <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[8px] font-semibold text-amber-600">Rising</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <button
                    onClick={() => handleInlineGenerate(t.id, t.topic)}
                    disabled={generatingId === t.id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-primary py-1.5 text-[11px] font-bold text-primary transition-colors hover:bg-primary/5 disabled:opacity-60"
                  >
                    {generatingId === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    Generate Post
                  </button>
                  <button
                    onClick={() => handleSaveTrend(t.topic, t.industry, t.trend_score)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${savedTopics.has(t.topic) ? "bg-primary/10 text-primary" : "bg-lavender text-muted-foreground hover:text-primary"}`}
                  >
                    <Bookmark className="h-3.5 w-3.5" fill={savedTopics.has(t.topic) ? "currentColor" : "none"} />
                  </button>
                  <button onClick={() => handleCopyTopic(t.topic)} className="flex h-8 w-8 items-center justify-center rounded-full bg-lavender text-muted-foreground hover:text-primary transition-colors">
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <AnimatePresence>
                  {generatedPreview?.id === t.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="mt-3 rounded-[var(--radius-sm)] border border-success/30 bg-success/5 p-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Check className="h-3 w-3 text-success" />
                          <span className="text-[10px] font-bold text-success">Generated</span>
                        </div>
                        <p className="text-xs text-foreground/80 line-clamp-3">{generatedPreview.content.slice(0, 150)}...</p>
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => navigate("/create")} className="rounded-md bg-primary/10 px-3 py-1 text-[10px] font-semibold text-primary hover:bg-primary/20">
                            <ExternalLink className="inline h-3 w-3 mr-1" />View in Create
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Column 3 — Upcoming Dates */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h3 className="font-heading text-sm font-semibold text-foreground">Upcoming Dates</h3>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">Next 60 Days</span>
          </div>
          <div className="space-y-2">
            {visibleDates.length === 0 ? (
              <div className="flex flex-col items-center rounded-[12px] border-2 border-dashed border-border bg-card p-8 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 font-heading text-xs font-semibold text-muted-foreground">No upcoming dates</p>
              </div>
            ) : visibleDates.map((d, i) => {
              const { month, day } = formatDateShort(d.date);
              const urgent = isWithin7Days(d.date);
              return (
                <motion.div
                  key={`${d.date}-${d.event}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 + 0.2 }}
                  className="flex items-center gap-3 rounded-[12px] border border-border bg-card p-3 shadow-card transition-shadow hover:shadow-card-hover"
                  style={{ minHeight: 70 }}
                >
                  <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[var(--radius-sm)] ${urgent ? "gradient-bg text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                    <span className="text-[8px] font-bold leading-tight">{month}</span>
                    <span className="text-base font-bold leading-tight">{day}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-xs font-semibold text-foreground truncate">{d.event}</p>
                    <p className={`text-[10px] ${categoryColors[d.category] || "text-muted-foreground"}`}>{d.category}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDateGenerate(d)} className="flex h-7 items-center gap-1 rounded-full gradient-bg px-2.5 text-[9px] font-bold text-primary-foreground">
                      <Sparkles className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleSaveTrend(`Content for ${d.event}`, "", 0)}
                      className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${savedTopics.has(`Content for ${d.event}`) ? "bg-primary/10 text-primary" : "bg-lavender text-muted-foreground hover:text-primary"}`}
                    >
                      <Bookmark className="h-3 w-3" fill={savedTopics.has(`Content for ${d.event}`) ? "currentColor" : "none"} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
            {upcomingDates.length > 15 && !showAllDates && (
              <button onClick={() => setShowAllDates(true)} className="w-full text-center text-[11px] font-semibold text-primary hover:underline py-2">
                See all upcoming dates ({upcomingDates.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Generator */}
      <div className="relative overflow-hidden rounded-[16px] border border-border bg-card shadow-card">
        <div className="h-[3px] gradient-bg" />
        <div className="p-6">
          {!campaignResults ? (
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              {/* Left — Info */}
              <div className="lg:w-2/5">
                <span className="inline-flex items-center gap-1.5 rounded-full gradient-bg px-3 py-1 text-[10px] font-bold text-primary-foreground">
                  <Sparkles className="h-3 w-3" /> Campaign Generator
                </span>
                <h3 className="mt-3 font-heading text-lg font-bold text-foreground">Turn any topic into a full week of content</h3>
                <p className="mt-1.5 text-xs text-muted-foreground">Enter a topic or upcoming campaign and AI will generate a full week of posts across all your platforms, ready to schedule.</p>
              </div>

              {/* Right — Form */}
              <div className="flex-1 space-y-4">
                {campaignGenerating ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 py-4">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full gradient-bg rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 3, ease: "easeInOut" }}
                      />
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary animate-spin" />
                    </div>
                    <div className="text-center space-y-1">
                      {["Analyzing your campaign topic", "Generating posts for each platform", "Building your content calendar"].map((msg, idx) => (
                        <motion.p
                          key={idx}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: campaignStep >= idx ? 1 : 0.3, y: 0 }}
                          transition={{ delay: idx * 0.3 }}
                          className="text-xs text-muted-foreground"
                        >
                          {campaignStep >= idx && <Check className="inline h-3 w-3 text-success mr-1" />}
                          {msg}
                        </motion.p>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <>
                    <textarea
                      value={campaignTopic}
                      onChange={(e) => setCampaignTopic(e.target.value)}
                      placeholder="Black Friday sale — 30% off all products. Launching November 28."
                      className="w-full rounded-[var(--radius-sm)] border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      rows={3}
                    />
                    {campaignError && <p className="text-xs text-destructive">{campaignError}</p>}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        {[5, 7, 10].map((n) => (
                          <button
                            key={n}
                            onClick={() => setCampaignPosts(n)}
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${campaignPosts === n ? "gradient-bg text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                          >
                            {n} posts
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        {/* Use connected platforms; fall back to defaults if none */}
                        {(connectedPlatforms.length > 0
                          ? connectedPlatforms
                          : ["Instagram", "LinkedIn", "Twitter", "Facebook"]
                        ).map((p) => {
                          const key = p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
                          const normKey = key === "Linkedin" ? "LinkedIn" : key;
                          const Icon = platformIcons[normKey] || FileText;
                          return (
                            <button
                              key={p}
                              onClick={() => toggleCampaignPlatform(p)}
                              title={connectedPlatforms.length > 0 ? `${p} (connected)` : p}
                              className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${campaignPlatforms.includes(p) ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "bg-muted text-muted-foreground"}`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </button>
                          );
                        })}
                        {connectedPlatforms.length === 0 && (
                          <span className="text-[9px] text-muted-foreground ml-1">Connect accounts in Settings</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleCampaignGenerate}
                      className="w-full rounded-[var(--radius-sm)] gradient-bg py-3.5 font-heading text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.01] relative overflow-hidden group"
                      style={{ height: 52 }}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <Sparkles className="h-4 w-4" /> Generate Campaign
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Campaign results */
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-2 mb-4">
                <Check className="h-5 w-5 text-success" />
                <h3 className="font-heading text-base font-bold text-foreground">Your campaign is ready</h3>
                {campaignResults && campaignResults.some((p) => p === null) && (
                  <span className="ml-2 flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/5 px-2.5 py-0.5 text-[10px] font-semibold text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {campaignResults.filter((p) => p === null).length} failed
                  </span>
                )}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {(campaignResults ?? []).map((post, i) => {
                  if (!post || typeof post.content !== "string" || typeof post.platform !== "string") {
                    // Failed card with retry
                    return (
                      <div
                        key={`failed-${i}`}
                        className="min-w-[200px] flex-shrink-0 rounded-[12px] border border-destructive/20 bg-destructive/5 p-3 flex flex-col items-center justify-center gap-2"
                      >
                        <AlertCircle className="h-5 w-5 text-destructive/60" />
                        <p className="text-[10px] font-semibold text-destructive/80 text-center">Post {i + 1} failed to generate</p>
                        <button
                          onClick={() => handleRetryPost(i)}
                          disabled={retryingIndex === i}
                          className="flex items-center gap-1.5 rounded-full border border-destructive/30 px-3 py-1 text-[10px] font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                        >
                          {retryingIndex === i ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                          Retry
                        </button>
                      </div>
                    );
                  }

                  const Icon = platformIcons[post.platform] || FileText;
                  const preview = post.content.length > 100 ? `${post.content.slice(0, 100)}...` : post.content;

                  return (
                    <div
                      key={`${post.platform}-${post.suggested_scheduled_at}-${i}`}
                      className="min-w-[200px] flex-shrink-0 rounded-[12px] border border-border bg-background p-3"
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[10px] font-semibold text-foreground">{post.platform}</span>
                        <span className="ml-auto text-[9px] text-muted-foreground">Post {i + 1}</span>
                      </div>
                      <p className="text-[11px] text-foreground/80 line-clamp-3">{preview}</p>
                      <p className="mt-2 text-[9px] text-muted-foreground">
                        {new Date(post.suggested_scheduled_at).toLocaleDateString("en", {
                          weekday: "short", month: "short", day: "numeric",
                          hour: "numeric", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={() => navigate("/create")} className="rounded-[var(--radius-sm)] gradient-bg px-6 py-2.5 text-xs font-bold text-primary-foreground">
                  Review & Schedule All
                </button>
                <button onClick={() => { setCampaignResults(null); setCampaignTopic(""); }} className="rounded-[var(--radius-sm)] border border-border px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted">
                  Start Over
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Generate Dialog (existing component) */}
      <GenerateDialog open={dialogOpen} onClose={() => setDialogOpen(false)} trendTopic={dialogTopic} />

      {/* Date Generate Modal */}
      <AnimatePresence>
        {dateDialogOpen && dateDialogEvent && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDateDialogOpen(false)} className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 m-auto h-fit w-full max-w-md rounded-[16px] border border-border bg-card p-6 shadow-2xl mx-4 sm:mx-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-base font-bold text-foreground">Generate for {dateDialogEvent.event}</h3>
                <button onClick={() => setDateDialogOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{new Date(dateDialogEvent.date).toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Platforms</label>
                  <div className="mt-1.5 flex gap-1.5">
                    {["Instagram", "LinkedIn", "Twitter", "Facebook"].map((p) => {
                      const Icon = platformIcons[p] || FileText;
                      return (
                        <button
                          key={p}
                          onClick={() => setDateDialogPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])}
                          className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${dateDialogPlatforms.includes(p) ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "bg-muted text-muted-foreground"}`}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Notes</label>
                  <input
                    value={dateDialogNotes}
                    onChange={(e) => setDateDialogNotes(e.target.value)}
                    className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <button onClick={handleDateDialogGenerate} className="w-full rounded-[var(--radius-sm)] gradient-bg py-2.5 text-sm font-bold text-primary-foreground">
                  <Sparkles className="inline h-3.5 w-3.5 mr-1.5" /> Generate
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Saved Trends Panel */}
      <AnimatePresence>
        {savedPanelOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSavedPanelOpen(false)} className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm" />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-[400px] overflow-y-auto border-l border-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border p-5">
                <h3 className="font-heading text-base font-bold text-foreground">Saved Trends</h3>
                <button onClick={() => setSavedPanelOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <div className="p-5 space-y-3">
                {savedTrends.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <Bookmark className="h-10 w-10 text-muted-foreground/30" />
                    <p className="mt-3 font-heading text-sm font-semibold text-muted-foreground">No saved trends</p>
                    <p className="mt-1 text-xs text-muted-foreground">Bookmark trending topics to save them for later</p>
                  </div>
                ) : savedTrends.map((t) => (
                  <div key={t.id} className="rounded-[12px] border border-border bg-background p-3">
                    <p className="font-heading text-xs font-semibold text-foreground">{t.topic}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[9px] text-muted-foreground">Saved {timeAgo(t.saved_at)}</span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={t.is_posted}
                            onChange={() => {
                              toggleTrendPosted(t.id, !t.is_posted);
                              setSavedTrends((prev) => prev.map((s) => s.id === t.id ? { ...s, is_posted: !s.is_posted } : s));
                            }}
                            className="h-3.5 w-3.5 rounded border-border text-primary accent-primary"
                          />
                          <span className="text-[9px] text-muted-foreground">Posted</span>
                        </label>
                        <button
                          onClick={async () => {
                            await unsaveTrend(t.id);
                            setSavedTrends((prev) => prev.filter((s) => s.id !== t.id));
                            setSavedTopics((prev) => { const n = new Set(prev); n.delete(t.topic); return n; });
                            toast.success("Removed");
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSavedPanelOpen(false); setDialogTopic(t.topic); setDialogOpen(true); }}
                      className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                    >
                      <Sparkles className="h-3 w-3" /> Generate Post
                    </button>
                  </div>
                ))}
              </div>
              {savedTrends.length > 0 && (
                <div className="border-t border-border p-5">
                  <button
                    onClick={async () => {
                      if (!user) return;
                      if (!confirm("Clear all saved trends?")) return;
                      await clearAllSavedTrends(user.id);
                      setSavedTrends([]);
                      setSavedTopics(new Set());
                      toast.success("All saved trends cleared");
                    }}
                    className="w-full rounded-[var(--radius-sm)] border border-destructive py-2 text-xs font-semibold text-destructive hover:bg-destructive/5"
                  >
                    Clear All Saved
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrendsPage;
