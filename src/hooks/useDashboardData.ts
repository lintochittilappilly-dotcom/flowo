import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandStore } from "@/store/brand-store";

export interface DashboardStats {
  total_reach_this_week: number;
  total_engagements_this_week: number;
  posts_published_this_week: number;
  posts_scheduled_upcoming: number;
  reach_change_percent: number;
  engagement_change_percent: number;
}

export interface ScheduledPost {
  id: string;
  platform: string;
  content: string;
  scheduled_at: string;
}

export interface RecentPost {
  id: string;
  platform: string;
  content: string;
  published_at: string;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  engagement_rate: number;
}

export interface ChartDataPoint {
  date: string;
  reach: number;
  engagements: number;
}

export interface SocialAccount {
  id: string;
  platform: string;
  account_name: string | null;
  is_active: boolean;
  brand_id: string;
}

export interface AIInsight {
  id: string;
  insight_text: string;
  insight_type: string;
  is_read: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_post_id: string | null;
  created_at: string;
}

interface DashboardData {
  stats: DashboardStats;
  scheduledPosts: ScheduledPost[];
  recentPosts: RecentPost[];
  chartData: ChartDataPoint[];
  aiInsight: AIInsight | null;
  socialAccounts: SocialAccount[];
  notifications: Notification[];
  isLoading: boolean;
  errors: Record<string, string>;
  refetch: (key?: string) => void;
}

const defaultStats: DashboardStats = {
  total_reach_this_week: 0,
  total_engagements_this_week: 0,
  posts_published_this_week: 0,
  posts_scheduled_upcoming: 0,
  reach_change_percent: 0,
  engagement_change_percent: 0,
};

export function useDashboardData(): DashboardData {
  const { user } = useAuth();
  const { activeBrand } = useBrandStore();
  const brandId = activeBrand?.id;

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setError = (key: string, msg: string) => setErrors(prev => ({ ...prev, [key]: msg }));
  const clearError = (key: string) => setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });

  const fetchStats = useCallback(async () => {
    if (!user) return;
    clearError("stats");
    try {
      const { data, error } = await supabase.rpc("get_dashboard_stats", { p_user_id: user.id });
      if (error) throw error;
      setStats(data as unknown as DashboardStats || defaultStats);
    } catch (e: any) {
      setError("stats", e.message);
      setStats(defaultStats);
    }
  }, [user]);

  const fetchScheduledPosts = useCallback(async () => {
    if (!user) return;
    clearError("scheduled");
    try {
      let query = supabase
        .from("posts")
        .select("id, platform, content, scheduled_at")
        .eq("user_id", user.id)
        .eq("status", "scheduled")
        .gt("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(5);
      if (brandId) query = query.eq("brand_id", brandId);
      const { data, error } = await query;
      if (error) throw error;
      setScheduledPosts((data as ScheduledPost[]) || []);
    } catch (e: any) {
      setError("scheduled", e.message);
    }
  }, [user, brandId]);

  const fetchRecentPosts = useCallback(async () => {
    if (!user) return;
    clearError("recent");
    try {
      let query = supabase
        .from("posts")
        .select("id, platform, content, published_at, post_analytics(likes, comments, shares, reach, engagement_rate)")
        .eq("user_id", user.id)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(5);
      if (brandId) query = query.eq("brand_id", brandId);
      const { data, error } = await query;
      if (error) throw error;
      const mapped: RecentPost[] = ((data as any[]) || []).map((p: any) => {
        const a = Array.isArray(p.post_analytics) ? p.post_analytics[0] : p.post_analytics;
        return {
          id: p.id, platform: p.platform, content: p.content, published_at: p.published_at,
          likes: a?.likes || 0, comments: a?.comments || 0, shares: a?.shares || 0,
          reach: a?.reach || 0, engagement_rate: a?.engagement_rate || 0,
        };
      });
      setRecentPosts(mapped);
    } catch (e: any) {
      setError("recent", e.message);
    }
  }, [user, brandId]);

  const fetchChartData = useCallback(async () => {
    if (!user) return;
    clearError("chart");
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      let query = supabase
        .from("posts")
        .select("published_at, post_analytics(reach, likes, comments, shares)")
        .eq("user_id", user.id)
        .eq("status", "published")
        .gte("published_at", thirtyDaysAgo.toISOString())
        .order("published_at", { ascending: true });
      if (brandId) query = query.eq("brand_id", brandId);
      const { data, error } = await query;
      if (error) throw error;

      const grouped: Record<string, { reach: number; engagements: number }> = {};
      ((data as any[]) || []).forEach((p: any) => {
        const date = new Date(p.published_at).toISOString().split("T")[0];
        if (!grouped[date]) grouped[date] = { reach: 0, engagements: 0 };
        const a = Array.isArray(p.post_analytics) ? p.post_analytics[0] : p.post_analytics;
        if (a) {
          grouped[date].reach += a.reach || 0;
          grouped[date].engagements += (a.likes || 0) + (a.comments || 0) + (a.shares || 0);
        }
      });
      setChartData(Object.entries(grouped).map(([date, vals]) => ({ date, reach: vals.reach, engagements: vals.engagements })));
    } catch (e: any) {
      setError("chart", e.message);
    }
  }, [user, brandId]);

  const fetchAIInsight = useCallback(async () => {
    if (!user) return;
    clearError("insight");
    try {
      const { data, error } = await supabase
        .from("ai_insights")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      setAiInsight(data as AIInsight | null);
    } catch (e: any) {
      setError("insight", e.message);
    }
  }, [user]);

  const fetchSocialAccounts = useCallback(async () => {
    if (!user) return;
    clearError("accounts");
    try {
      let query = supabase
        .from("social_accounts")
        .select("id, platform, account_name, is_active, brand_id")
        .eq("user_id", user.id);
      if (brandId) query = query.eq("brand_id", brandId);
      const { data, error } = await query;
      if (error) throw error;
      setSocialAccounts((data as SocialAccount[]) || []);
    } catch (e: any) {
      setError("accounts", e.message);
    }
  }, [user, brandId]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    clearError("notifications");
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      setNotifications((data as Notification[]) || []);
    } catch (e: any) {
      setError("notifications", e.message);
    }
  }, [user]);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    await Promise.all([
      fetchStats(), fetchScheduledPosts(), fetchRecentPosts(),
      fetchChartData(), fetchAIInsight(), fetchSocialAccounts(), fetchNotifications(),
    ]);
    setIsLoading(false);
  }, [user, fetchStats, fetchScheduledPosts, fetchRecentPosts, fetchChartData, fetchAIInsight, fetchSocialAccounts, fetchNotifications]);

  const refetch = useCallback((key?: string) => {
    if (!key) { fetchAll(); return; }
    const map: Record<string, () => Promise<void>> = {
      stats: fetchStats, scheduled: fetchScheduledPosts, recent: fetchRecentPosts,
      chart: fetchChartData, insight: fetchAIInsight, accounts: fetchSocialAccounts, notifications: fetchNotifications,
    };
    map[key]?.();
  }, [fetchAll, fetchStats, fetchScheduledPosts, fetchRecentPosts, fetchChartData, fetchAIInsight, fetchSocialAccounts, fetchNotifications]);

  // Refetch when brand changes
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channelName = `dashboard-realtime-${user.id}-${Date.now()}`;
    const channel = supabase.channel(channelName);
    
    channel
      .on("postgres_changes", { event: "*", schema: "public", table: "posts", filter: `user_id=eq.${user.id}` }, () => {
        fetchStats(); fetchScheduledPosts(); fetchRecentPosts();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        fetchNotifications();
      });
    
    channel.subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchStats, fetchScheduledPosts, fetchRecentPosts, fetchNotifications]);

  return {
    stats: stats || defaultStats, scheduledPosts, recentPosts, chartData,
    aiInsight, socialAccounts, notifications, isLoading, errors, refetch,
  };
}
