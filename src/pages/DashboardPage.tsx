import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Eye, Heart, Calendar, Clock, TrendingUp, TrendingDown, Sparkles, BarChart3,
  Flame, Sparkle, Plug, CheckCircle2, AlertTriangle, ArrowRight, FileText,
  Share2, Instagram, Linkedin, Twitter, Facebook, Youtube, CircleAlert,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardData, type DashboardStats, type ChartDataPoint } from "@/hooks/useDashboardData";
import { useBrandStore } from "@/store/brand-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SkeletonCard, SkeletonChart, SkeletonList } from "@/components/ui/loading-skeletons";
import NoBrandsState from "@/components/no-brands-state";
import BrandIndicator from "@/components/brand-indicator";

// ── Helpers ──
const formatNum = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));
const truncate = (s: string, len: number) => (s.length > len ? s.slice(0, len) + "…" : s);
const timeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};
const formatDate = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " at " +
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};
const formatChartDate = (d: string, short: boolean) => {
  const date = new Date(d);
  return short
    ? date.toLocaleDateString("en-US", { weekday: "short" })
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const platformIcons: Record<string, React.ElementType> = {
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  youtube: Youtube,
  tiktok: Flame,
};
const platformColors: Record<string, string> = {
  instagram: "bg-pink-100 text-pink-600",
  linkedin: "bg-blue-100 text-blue-600",
  twitter: "bg-sky-100 text-sky-600",
  facebook: "bg-indigo-100 text-indigo-600",
  youtube: "bg-red-100 text-red-600",
  tiktok: "bg-foreground/10 text-foreground",
};

// ── Error widget ──
const WidgetError = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="flex items-center gap-2 rounded-md bg-destructive/5 px-3 py-2">
    <CircleAlert className="h-4 w-4 text-destructive" />
    <span className="flex-1 text-xs text-destructive">Failed to load. </span>
    <button onClick={onRetry} className="text-xs font-semibold text-destructive underline">Retry</button>
  </div>
);

// ── Chart tooltip ──
const ChartTooltipContent = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg">
      <p className="mb-1 font-heading text-xs font-bold text-foreground">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{formatNum(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { activeBrand, isLoading: brandLoading } = useBrandStore();
  const {
    stats, scheduledPosts, recentPosts, chartData, aiInsight,
    socialAccounts, isLoading, errors, refetch,
  } = useDashboardData();

  const [chartRange, setChartRange] = useState<7 | 30>(30);
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  const filteredChartData = useMemo(() => {
    if (chartRange === 30) return chartData;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return chartData.filter((d) => new Date(d.date) >= cutoff);
  }, [chartData, chartRange]);

  // Chart insight chips
  const chartInsights = useMemo(() => {
    if (!chartData.length) return { bestDay: "—", peakTime: "—", topPlatform: "—" };
    const byDay: Record<string, number> = {};
    chartData.forEach((d) => {
      const day = new Date(d.date).toLocaleDateString("en-US", { weekday: "long" });
      byDay[day] = (byDay[day] || 0) + d.engagements;
    });
    const bestDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
    return { bestDay, peakTime: "2:00 PM", topPlatform: "—" };
  }, [chartData]);

  const hasCompletedOnboarding = profile?.completed_onboarding;
  const hasSocialAccounts = socialAccounts.length > 0;
  const hasPosts = recentPosts.length > 0 || scheduledPosts.length > 0;
  const setupSteps = [hasCompletedOnboarding, hasSocialAccounts, hasPosts];
  const setupComplete = setupSteps.every(Boolean);
  const showSetup = !setupComplete && !profile?.dismissed_setup_checklist;

  const dismissSetup = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ dismissed_setup_checklist: true } as any).eq("id", user.id);
    refetch();
  };

  const markInsightRead = async () => {
    if (!aiInsight) return;
    await supabase.from("ai_insights").update({ is_read: true }).eq("id", aiInsight.id);
    toast.success("Insight marked as read");
    refetch("insight");
  };

  // Today's date
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // No brands state
  if (!brandLoading && !activeBrand) return <NoBrandsState />;

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="animate-pulse space-y-2">
          <div className="h-7 w-48 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <SkeletonChart className="lg:col-span-3" />
          <div className="space-y-6 lg:col-span-2">
            <SkeletonList count={5} />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  const kpiCards = [
    { icon: Eye, label: "Total Reach This Week", value: stats.total_reach_this_week, change: stats.reach_change_percent, color: "bg-primary/10 text-primary" },
    { icon: Heart, label: "Total Engagements", value: stats.total_engagements_this_week, change: stats.engagement_change_percent, color: "bg-success/10 text-success" },
    { icon: Calendar, label: "Posts Published", value: stats.posts_published_this_week, change: null, color: "bg-amber-100 text-amber-600" },
    { icon: Clock, label: "Scheduled Upcoming", value: stats.posts_scheduled_upcoming, change: null, color: "bg-primary/10 text-primary" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              {timeOfDay()}, {firstName}
            </h2>
            <BrandIndicator />
          </div>
          <p className="mt-1 font-body text-sm text-muted-foreground">
            {!hasSocialAccounts && !hasPosts
              ? <>Let's get you set up. <Link to="/settings" className="font-medium text-primary hover:underline">Connect your first platform <ArrowRight className="inline h-3 w-3" /></Link></>
              : <>Showing data for <span className="font-semibold text-primary">{activeBrand?.name}</span></>}
          </p>
        </div>
        <p className="font-body text-sm text-muted-foreground">{todayFormatted}</p>
      </motion.div>

      {/* Onboarding checklist */}
      {showSetup && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="h-1 w-full gradient-bg" />
          <div className="p-6">
            <h3 className="font-heading text-lg font-bold text-foreground">Get started with Flowo</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                { done: hasCompletedOnboarding, label: "Complete your profile", link: "/onboarding" },
                { done: hasSocialAccounts, label: "Connect a social platform", link: "/settings" },
                { done: hasPosts, label: "Create your first post", link: "/create" },
              ].map((step) => (
                <div key={step.label} className="flex items-center gap-3 rounded-lg border p-4">
                  {step.done
                    ? <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                    : <div className="h-5 w-5 shrink-0 rounded-full border-2 border-muted-foreground/30" />}
                  <span className={`flex-1 font-body text-sm ${step.done ? "text-muted-foreground line-through" : "text-foreground font-medium"}`}>{step.label}</span>
                  {!step.done && <Link to={step.link} className="text-xs font-semibold text-primary hover:underline">Go</Link>}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full gradient-bg transition-all" style={{ width: `${(setupSteps.filter(Boolean).length / 3) * 100}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{setupSteps.filter(Boolean).length}/3 steps complete</p>
            </div>
            {setupComplete && (
              <div className="mt-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="font-heading text-sm font-bold text-foreground">You're all set up!</span>
                <button onClick={dismissSetup} className="ml-auto text-xs text-muted-foreground hover:text-foreground">Dismiss</button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      {errors.stats && <WidgetError message={errors.stats} onRetry={() => refetch("stats")} />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border bg-card p-5 shadow-sm" style={{ minHeight: 120 }}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className={`font-heading text-2xl font-bold ${s.value === 0 ? "text-muted-foreground" : "text-foreground"}`}>{formatNum(s.value)}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
            {s.change !== null && (
              <div className="mt-3 flex items-center gap-1">
                {s.change >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-success" /> : <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
                <span className={`text-xs font-semibold ${s.change >= 0 ? "text-success" : "text-destructive"}`}>{s.change > 0 ? "+" : ""}{s.change}%</span>
                <span className="text-xs text-muted-foreground">vs last week</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left — 65% */}
        <div className="space-y-6 lg:col-span-3">
          {/* Engagement Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-base font-bold text-foreground">Engagement Over Time</h3>
              <div className="flex rounded-pill bg-muted p-0.5">
                {([7, 30] as const).map((r) => (
                  <button key={r} onClick={() => setChartRange(r)} className={`rounded-pill px-3 py-1 text-xs font-semibold transition-colors ${chartRange === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    {r} Days
                  </button>
                ))}
              </div>
            </div>
            {errors.chart && <WidgetError message={errors.chart} onRetry={() => refetch("chart")} />}
            <div className="mt-4 h-56 sm:h-64">
              {filteredChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredChartData}>
                    <defs>
                      <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(263 84% 51%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(263 84% 51%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(330 81% 60%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(330 81% 60%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatChartDate(v, chartRange === 7)} />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={formatNum} />
                    <ReTooltip content={<ChartTooltipContent />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="reach" stroke="hsl(263 84% 51%)" strokeWidth={2} fill="url(#reachGrad)" name="Reach" />
                    <Area type="monotone" dataKey="engagements" stroke="hsl(330 81% 60%)" strokeWidth={2} fill="url(#engGrad)" name="Engagements" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center">
                  <BarChart3 className="mb-3 h-12 w-12 text-muted-foreground/30" />
                  <p className="font-heading text-sm font-semibold text-muted-foreground">No data yet</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">Your engagement data will appear here after your first post is published.</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {[
                { label: "Best Day", value: chartInsights.bestDay },
                { label: "Peak Time", value: chartInsights.peakTime },
                { label: "Top Platform", value: chartInsights.topPlatform },
              ].map((c) => (
                <span key={c.label} className="rounded-pill bg-lavender px-3 py-1 text-xs font-medium text-primary">
                  <strong>{c.label}:</strong> {c.value}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Recent Post Performance */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="font-heading text-base font-bold text-foreground">Recent Post Performance</h3>
            {errors.recent && <WidgetError message={errors.recent} onRetry={() => refetch("recent")} />}
            {recentPosts.length > 0 ? (
              <div className="mt-4 divide-y">
                {recentPosts.map((p) => {
                  const Icon = platformIcons[p.platform.toLowerCase()] || FileText;
                  const color = platformColors[p.platform.toLowerCase()] || "bg-muted text-foreground";
                  return (
                    <div key={p.id} className="flex items-center gap-3 py-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{truncate(p.content, 50)}</p>
                        <p className="text-[11px] text-muted-foreground">{formatDate(p.published_at)}</p>
                      </div>
                      <div className="hidden items-center gap-3 sm:flex">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><Heart className="h-3 w-3" /> {p.likes}</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><Eye className="h-3 w-3" /> {formatNum(p.reach)}</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><Share2 className="h-3 w-3" /> {p.shares}</span>
                      </div>
                      <span className="shrink-0 font-heading text-sm font-bold text-primary">{p.engagement_rate}%</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center py-6">
                <FileText className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="font-heading text-sm font-semibold text-muted-foreground">No published posts yet</p>
                <Link to="/create" className="mt-3 font-body text-sm font-semibold text-primary hover:underline">Create Your First Post</Link>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right — 35% */}
        <div className="space-y-6 lg:col-span-2">
          {/* Scheduled This Week */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="font-heading text-base font-bold text-foreground">Scheduled This Week</h3>
            {errors.scheduled && <WidgetError message={errors.scheduled} onRetry={() => refetch("scheduled")} />}
            {scheduledPosts.length > 0 ? (
              <div className="mt-4 space-y-3">
                {scheduledPosts.map((p) => {
                  const Icon = platformIcons[p.platform.toLowerCase()] || FileText;
                  const color = platformColors[p.platform.toLowerCase()] || "bg-muted text-foreground";
                  return (
                    <div key={p.id} className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">{truncate(p.content, 45)}</p>
                        <p className="text-[10px] text-muted-foreground">{formatDate(p.scheduled_at)}</p>
                      </div>
                      <span className="shrink-0 rounded-pill bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Scheduled</span>
                    </div>
                  );
                })}
                {stats.posts_scheduled_upcoming > 5 && (
                  <Link to="/calendar" className="block text-center text-xs font-semibold text-primary hover:underline">View All</Link>
                )}
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center py-6">
                <Calendar className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="font-heading text-sm font-semibold text-muted-foreground">No posts scheduled yet</p>
                <Link to="/create" className="mt-3 inline-flex items-center gap-1 rounded-pill bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                  <Sparkles className="h-3 w-3" /> Generate Content
                </Link>
              </div>
            )}
          </motion.div>

          {/* Connected Platforms */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="font-heading text-base font-bold text-foreground">Connected Platforms</h3>
            {errors.accounts && <WidgetError message={errors.accounts} onRetry={() => refetch("accounts")} />}
            {socialAccounts.length > 0 ? (
              <div className="mt-4 space-y-3">
                {socialAccounts.map((a) => {
                  const Icon = platformIcons[a.platform.toLowerCase()] || FileText;
                  const color = platformColors[a.platform.toLowerCase()] || "bg-muted text-foreground";
                  return (
                    <div key={a.id} className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium capitalize text-foreground">{a.platform}</p>
                        {a.account_name && <p className="text-[11px] text-muted-foreground">@{a.account_name}</p>}
                      </div>
                      <span className={`rounded-pill px-2.5 py-0.5 text-[10px] font-semibold ${a.is_active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                        {a.is_active ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center py-6">
                <Plug className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="font-heading text-sm font-semibold text-muted-foreground">No platforms connected</p>
                <Link to="/settings" className="mt-3 inline-flex items-center gap-1 rounded-pill border border-primary px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/5">
                  Connect Your First Platform
                </Link>
              </div>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="font-heading text-base font-bold text-foreground">Quick Actions</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { icon: Sparkles, label: "Generate Post", path: "/create" },
                { icon: Calendar, label: "View Calendar", path: "/calendar" },
                { icon: BarChart3, label: "Analytics", path: "/analytics" },
                { icon: Flame, label: "Trends", path: "/trends" },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.path)}
                  className="flex flex-col items-center gap-1.5 rounded-lg bg-lavender p-3 text-primary transition-all duration-200 hover:gradient-bg hover:text-primary-foreground"
                >
                  <a.icon className="h-5 w-5" />
                  <span className="text-[11px] font-semibold">{a.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* AI Insight */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="flex flex-col gap-4 rounded-xl border-l-4 border-l-primary border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <div className="flex items-center gap-3">
              <p className="font-heading text-sm font-bold text-foreground">AI Insight of the Week</p>
              {aiInsight && (
                <button onClick={markInsightRead} className="text-[11px] text-muted-foreground hover:text-foreground">Mark as Read</button>
              )}
            </div>
            <p className="mt-1 font-body text-sm text-muted-foreground">
              {aiInsight?.insight_text || "Start posting consistently and Flowo will analyze your performance and surface personalized insights here every week."}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/create?type=strategy")}
          className="shrink-0 rounded-pill border border-primary px-4 py-2 font-heading text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Generate Action Plan
        </button>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
