import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, Heart, FileText, TrendingUp, Download, Sparkles, Instagram, Linkedin, Twitter, Facebook, BarChart3, GitCompare } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { SkeletonCard, SkeletonChart } from "@/components/ui/loading-skeletons";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { syncAllPostAnalytics } from "@/services/analytics.service";
import { useBrandStore, getBrandColor } from "@/store/brand-store";
import BrandIndicator from "@/components/brand-indicator";
import NoBrandsState from "@/components/no-brands-state";
import { PlanGate } from "@/components/plan-gate/plan-gate";

type TimeRange = "7" | "30" | "90";
const formatNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : n.toString();
const RANGE_LABELS: Record<TimeRange, string> = { "7": "Last 7 Days", "30": "Last 30 Days", "90": "Last 90 Days" };

const platformBreakdownIcons: Record<string, React.ElementType> = { Instagram, LinkedIn: Linkedin, Twitter, Facebook };

interface BrandComparison {
  name: string;
  color: string;
  reach: number;
  engagements: number;
  posts: number;
  avgRate: number;
}

const AnalyticsPage = () => {
  const { user } = useAuth();
  const { activeBrand, allBrands, isLoading: brandLoading } = useBrandStore();
  const [range, setRange] = useState<TimeRange>("30");
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ totalReach: 0, totalEngagements: 0, followerGrowth: 0, totalPosts: 0, avgRate: 0 });
  const [platformBreakdown, setPlatformBreakdown] = useState<any[]>([]);
  const [topPosts, setTopPosts] = useState<any[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [comparisonData, setComparisonData] = useState<BrandComparison[]>([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  const brandId = activeBrand?.id;

  const fetchAnalytics = async () => {
    if (!user || !brandId) return;
    setLoading(true);

    const daysAgo = Number(range);
    const since = new Date(Date.now() - daysAgo * 86400000).toISOString();

    const { data: analytics } = await supabase
      .from("post_analytics")
      .select("*, posts!inner(platform, content, published_at, status, brand_id)")
      .eq("user_id", user.id)
      .eq("posts.brand_id", brandId)
      .gte("posts.published_at", since);

    const rows = (analytics as any[]) || [];

    const totalReach = rows.reduce((s, r) => s + (r.reach || 0), 0);
    const totalEngagements = rows.reduce((s, r) => s + (r.likes || 0) + (r.comments || 0) + (r.shares || 0), 0);
    const totalPosts = rows.length;
    const avgRate = totalPosts ? rows.reduce((s, r) => s + (r.engagement_rate || 0), 0) / totalPosts : 0;
    setKpis({ totalReach, totalEngagements, followerGrowth: Math.floor(totalReach * 0.05), totalPosts, avgRate: parseFloat(avgRate.toFixed(1)) });

    const grouped: Record<string, { reach: number; engagements: number }> = {};
    rows.forEach((r: any) => {
      const date = new Date(r.posts.published_at).toISOString().split("T")[0];
      if (!grouped[date]) grouped[date] = { reach: 0, engagements: 0 };
      grouped[date].reach += r.reach || 0;
      grouped[date].engagements += (r.likes || 0) + (r.comments || 0) + (r.shares || 0);
    });
    setChartData(Object.entries(grouped).map(([day, v]) => ({ day: new Date(day).toLocaleDateString("en-US", { month: "short", day: "numeric" }), reach: v.reach, engagements: v.engagements })));

    const byPlatform: Record<string, { posts: number; reach: number; engagements: number }> = {};
    rows.forEach((r: any) => {
      const p = r.posts.platform;
      if (!byPlatform[p]) byPlatform[p] = { posts: 0, reach: 0, engagements: 0 };
      byPlatform[p].posts++;
      byPlatform[p].reach += r.reach || 0;
      byPlatform[p].engagements += (r.likes || 0) + (r.comments || 0) + (r.shares || 0);
    });
    const maxRate = Math.max(...Object.values(byPlatform).map(v => v.posts ? (v.engagements / v.posts) : 0), 1);
    setPlatformBreakdown(Object.entries(byPlatform).map(([name, v]) => ({
      name, posts: v.posts, reach: formatNum(v.reach),
      rate: v.posts ? `${((v.engagements / v.reach) * 100).toFixed(1)}%` : "0%",
      rateNum: v.posts ? Math.round(((v.engagements / v.posts) / maxRate) * 100) : 0,
      icon: platformBreakdownIcons[name] || FileText,
    })));

    const sorted = [...rows].sort((a, b) => (b.engagement_rate || 0) - (a.engagement_rate || 0)).slice(0, 5);
    setTopPosts(sorted.map((r: any) => ({
      platform: r.posts.platform,
      text: r.posts.content?.slice(0, 60) + (r.posts.content?.length > 60 ? "..." : ""),
      engagements: (r.likes || 0) + (r.comments || 0) + (r.shares || 0),
      reach: formatNum(r.reach || 0),
    })));

    setLoading(false);
  };

  const fetchComparisonData = async () => {
    if (!user || allBrands.length < 2) return;
    setComparisonLoading(true);

    const daysAgo = Number(range);
    const since = new Date(Date.now() - daysAgo * 86400000).toISOString();

    const results: BrandComparison[] = [];

    for (const brand of allBrands) {
      const { data: analytics } = await supabase
        .from("post_analytics")
        .select("*, posts!inner(published_at, brand_id)")
        .eq("user_id", user.id)
        .eq("posts.brand_id", brand.id)
        .gte("posts.published_at", since);

      const rows = (analytics as any[]) || [];
      const reach = rows.reduce((s, r) => s + (r.reach || 0), 0);
      const engagements = rows.reduce((s, r) => s + (r.likes || 0) + (r.comments || 0) + (r.shares || 0), 0);
      const posts = rows.length;
      const avgRate = posts ? parseFloat((rows.reduce((s, r) => s + (r.engagement_rate || 0), 0) / posts).toFixed(1)) : 0;

      results.push({
        name: brand.name,
        color: getBrandColor(brand.color),
        reach,
        engagements,
        posts,
        avgRate,
      });
    }

    setComparisonData(results);
    setComparisonLoading(false);
  };

  useEffect(() => { fetchAnalytics(); }, [user, range, brandId]);

  useEffect(() => {
    if (compareMode) fetchComparisonData();
  }, [compareMode, range]);

  // Show no brands state
  if (!brandLoading && !activeBrand) {
    return <NoBrandsState />;
  }

  const handleSync = async () => {
    if (!user) return;
    setSyncing(true);
    const count = await syncAllPostAnalytics(user.id);
    toast.success(`Synced analytics for ${count} posts`);
    setSyncing(false);
    fetchAnalytics();
  };

  const handleExportPDF = async () => {
    setExporting(true);
    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Allow popups to export"); setExporting(false); return; }
    const html = `<!DOCTYPE html><html><head><title>Flowo Analytics — ${RANGE_LABELS[range]}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif;padding:40px;color:#1E1B2E}
      h1{font-size:24px;font-weight:800;margin-bottom:4px}.sub{color:#666;font-size:13px;margin-bottom:24px}
      .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:32px}
      .kpi{border:1px solid #e5e5e5;border-radius:8px;padding:16px}.kpi-v{font-size:22px;font-weight:700}
      .kpi-l{font-size:11px;color:#888;margin-top:2px}table{width:100%;border-collapse:collapse;margin-top:16px}
      th,td{padding:10px 16px;text-align:left;border-bottom:1px solid #eee;font-size:13px}
      th{font-weight:600;color:#888;font-size:11px;text-transform:uppercase}
      h2{font-size:16px;font-weight:700;margin-top:32px;margin-bottom:8px}
      .footer{margin-top:40px;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:16px}</style></head>
      <body><h1>✨ Flowo Analytics Report</h1><p class="sub">${RANGE_LABELS[range]} • ${new Date().toLocaleDateString()}</p>
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-v">${formatNum(kpis.totalReach)}</div><div class="kpi-l">Total Reach</div></div>
        <div class="kpi"><div class="kpi-v">${formatNum(kpis.totalEngagements)}</div><div class="kpi-l">Engagements</div></div>
        <div class="kpi"><div class="kpi-v">${kpis.totalPosts}</div><div class="kpi-l">Posts</div></div>
        <div class="kpi"><div class="kpi-v">${kpis.avgRate}%</div><div class="kpi-l">Avg Engagement Rate</div></div>
      </div>
      <h2>Platform Breakdown</h2><table><thead><tr><th>Platform</th><th>Posts</th><th>Reach</th><th>Rate</th></tr></thead>
      <tbody>${platformBreakdown.map(p => `<tr><td>${p.name}</td><td>${p.posts}</td><td>${p.reach}</td><td>${p.rate}</td></tr>`).join("")}</tbody></table>
      <div class="footer">Generated by Flowo • ${new Date().toLocaleString()}</div></body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
    toast.success("PDF ready");
    setExporting(false);
  };

  const kpiCards = [
    { icon: Eye, label: "Total Reach", value: formatNum(kpis.totalReach), color: "bg-primary/10 text-primary" },
    { icon: Heart, label: "Total Engagements", value: formatNum(kpis.totalEngagements), color: "bg-secondary/10 text-secondary" },
    { icon: FileText, label: "Total Posts", value: String(kpis.totalPosts), color: "bg-amber-100 text-amber-600" },
    { icon: TrendingUp, label: "Avg Engagement Rate", value: `${kpis.avgRate}%`, color: "bg-primary/10 text-primary" },
  ];

  if (loading && !compareMode) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex justify-between"><div className="h-6 w-24 rounded bg-muted animate-pulse" /><div className="h-8 w-40 rounded bg-muted animate-pulse" /></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>
        <SkeletonChart />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-lg font-bold text-foreground">Analytics</h2>
          {!compareMode && <BrandIndicator />}
          {compareMode && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <GitCompare className="h-3 w-3" /> Comparing All Brands
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {allBrands.length >= 2 && (
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-all ${
                compareMode
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-foreground hover:bg-muted"
              }`}
            >
              <GitCompare className="h-3.5 w-3.5" /> {compareMode ? "Single Brand" : "Compare Brands"}
            </button>
          )}
          <select value={range} onChange={e => setRange(e.target.value as TimeRange)} className="rounded-md border border-border bg-card px-3 py-1.5 font-body text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="7">Last 7 Days</option><option value="30">Last 30 Days</option><option value="90">Last 90 Days</option>
          </select>
          {!compareMode && (
            <>
              <button onClick={handleSync} disabled={syncing} className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50">
                <TrendingUp className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} /> {syncing ? "Syncing..." : "Sync"}
              </button>
              <PlanGate feature="export_analytics">
                <button onClick={handleExportPDF} disabled={exporting} className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50">
                  <Download className="h-3.5 w-3.5" /> Export PDF
                </button>
              </PlanGate>
            </>
          )}
        </div>
      </div>

      {/* Brand Comparison View */}
      {compareMode ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {comparisonLoading ? (
            <div className="space-y-4">
              <SkeletonChart />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-md border border-border bg-card p-5 shadow-sm">
                  <h3 className="font-heading text-sm font-bold text-foreground mb-4">Reach by Brand</h3>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData} barSize={32}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                        <Bar dataKey="reach" name="Reach" radius={[4, 4, 0, 0]}>
                          {comparisonData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="rounded-md border border-border bg-card p-5 shadow-sm">
                  <h3 className="font-heading text-sm font-bold text-foreground mb-4">Engagements by Brand</h3>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData} barSize={32}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                        <Bar dataKey="engagements" name="Engagements" radius={[4, 4, 0, 0]}>
                          {comparisonData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {comparisonData.map((brand, i) => (
                  <motion.div
                    key={brand.name}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-md border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                        style={{ backgroundColor: brand.color }}
                      >
                        {brand.name.split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <p className="font-heading text-sm font-bold text-foreground truncate">{brand.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Reach</p>
                        <p className="font-heading text-base font-bold text-foreground">{formatNum(brand.reach)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Engagements</p>
                        <p className="font-heading text-base font-bold text-foreground">{formatNum(brand.engagements)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Posts</p>
                        <p className="font-heading text-base font-bold text-foreground">{brand.posts}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Avg Rate</p>
                        <p className="font-heading text-base font-bold text-foreground">{brand.avgRate}%</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map((k, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-md border border-border bg-card p-4 shadow-sm">
                <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-md ${k.color}`}><k.icon className="h-4 w-4" /></div>
                <p className="font-heading text-xl font-bold text-foreground">{k.value}</p>
                <p className="text-[11px] text-muted-foreground">{k.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-md border border-border bg-card p-5 shadow-sm">
            <h3 className="font-heading text-sm font-bold text-foreground">Reach & Engagement Over Time</h3>
            <div className="mt-4 h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="reachG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(263 84% 51%)" stopOpacity={0.3} /><stop offset="100%" stopColor="hsl(263 84% 51%)" stopOpacity={0} /></linearGradient>
                      <linearGradient id="engG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(330 81% 60%)" stopOpacity={0.3} /><stop offset="100%" stopColor="hsl(330 81% 60%)" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="reach" stroke="hsl(263 84% 51%)" fill="url(#reachG)" strokeWidth={2} name="Reach" />
                    <Area type="monotone" dataKey="engagements" stroke="hsl(330 81% 60%)" fill="url(#engG)" strokeWidth={2} name="Engagements" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center">
                  <BarChart3 className="mb-3 h-12 w-12 text-muted-foreground/30" />
                  <p className="font-heading text-sm font-semibold text-muted-foreground">No analytics data yet</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">Publish your first post to see data here.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Platform breakdown — gated as advanced_analytics */}
          <PlanGate feature="advanced_analytics">
            <>
              {platformBreakdown.length > 0 && (
                <div className="rounded-md border border-border bg-card shadow-sm overflow-x-auto">
                  <div className="p-5 pb-0"><h3 className="font-heading text-sm font-bold text-foreground">Platform Breakdown</h3></div>
                  <table className="w-full min-w-[500px] text-left">
                    <thead><tr className="border-b border-border">
                      <th className="px-5 py-3 font-heading text-xs font-semibold text-muted-foreground">Platform</th>
                      <th className="px-5 py-3 font-heading text-xs font-semibold text-muted-foreground">Posts</th>
                      <th className="px-5 py-3 font-heading text-xs font-semibold text-muted-foreground">Reach</th>
                      <th className="px-5 py-3 font-heading text-xs font-semibold text-muted-foreground">Engagement Rate</th>
                    </tr></thead>
                    <tbody>
                      {platformBreakdown.map((p: any, i: number) => {
                        const Icon = p.icon;
                        return (
                          <tr key={p.name} className={i % 2 ? "bg-lavender/30" : ""}>
                            <td className="px-5 py-3 flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><span className="font-body text-sm font-medium text-foreground">{p.name}</span></td>
                            <td className="px-5 py-3 text-sm text-foreground">{p.posts}</td>
                            <td className="px-5 py-3 text-sm text-foreground">{p.reach}</td>
                            <td className="px-5 py-3"><div className="flex items-center gap-2"><div className="h-2 w-20 rounded-full bg-muted"><div className="h-2 rounded-full gradient-bg" style={{ width: `${p.rateNum}%` }} /></div><span className="text-xs font-semibold text-foreground">{p.rate}</span></div></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Top posts */}
              {topPosts.length > 0 && (
                <div className="rounded-md border border-border bg-card p-5 shadow-sm">
                  <h3 className="font-heading text-sm font-bold text-foreground mb-4">Top Performing Posts</h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {topPosts.map((p: any, i: number) => (
                      <div key={i} className="rounded-md border border-border p-3">
                        <span className="text-[10px] font-semibold text-primary">{p.platform}</span>
                        <p className="mt-1 text-xs text-foreground line-clamp-2">{p.text}</p>
                        <p className="mt-2 font-heading text-lg font-bold gradient-text">{p.engagements}</p>
                        <p className="text-[10px] text-muted-foreground">Reach: {p.reach}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          </PlanGate>

          {/* AI Insight */}
          <div className="flex items-start gap-3 rounded-md border-l-4 border-l-primary border border-border bg-card p-5 shadow-sm">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-heading text-sm font-bold text-foreground">AI Analytics Insight</p>
              <p className="mt-1 font-body text-sm text-muted-foreground">
                {kpis.totalPosts > 0
                  ? `Based on ${kpis.totalPosts} published posts, your average engagement rate is ${kpis.avgRate}%. ${platformBreakdown[0]?.name || "Your top platform"} is your strongest performer. Consider posting more consistently to increase reach.`
                  : "Start posting consistently and Flowo will analyze your performance and surface personalized insights here every week."}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
