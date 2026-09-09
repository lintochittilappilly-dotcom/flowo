import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Menu, Search, Bell, User, LogOut, CreditCard, CheckCircle2, XCircle, Heart, AlertTriangle, Clock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardData, type Notification } from "@/hooks/useDashboardData";
import { supabase } from "@/integrations/supabase/client";

const pageNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/calendar": "Content Calendar",
  "/create": "Create Post",
  "/analytics": "Analytics",
  "/comments": "Comments",
  "/trends": "Trends",
  "/brands": "Brands",
  "/settings": "Settings",
  "/help": "Help & Support",
};

const notifIcons: Record<string, { icon: React.ElementType; color: string }> = {
  post_published: { icon: CheckCircle2, color: "text-success bg-success/10" },
  post_failed: { icon: XCircle, color: "text-destructive bg-destructive/10" },
  post_liked: { icon: Heart, color: "text-primary bg-primary/10" },
  platform_disconnected: { icon: AlertTriangle, color: "text-amber-500 bg-amber-100" },
  trial_ending: { icon: Clock, color: "text-primary bg-primary/10" },
};

const notifRoutes: Record<string, string> = {
  post_published: "/calendar",
  post_failed: "/calendar",
  post_liked: "/analytics",
  platform_disconnected: "/settings",
  trial_ending: "/settings",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

const DashboardHeader = ({ onMenuClick }: DashboardHeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const { notifications, refetch } = useDashboardData();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const pageName = pageNames[location.pathname] || "Dashboard";
  const initials = profile?.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U";
  const unreadCount = notifications.length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUser(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    refetch("notifications");
  };

  const markOneRead = async (notif: Notification) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id);
    refetch("notifications");
    const route = notifRoutes[notif.type] || "/dashboard";
    navigate(route);
    setShowNotifs(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="text-foreground/60 hover:text-foreground md:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="font-heading text-lg font-bold text-foreground sm:text-xl">{pageName}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Search className="h-[18px] w-[18px]" />
        </button>

        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowUser(false); }}
            className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute right-0 top-full mt-2 w-80 rounded-xl border bg-card shadow-lg sm:w-96"
              >
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <p className="font-heading text-sm font-bold text-foreground">Notifications</p>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs font-semibold text-primary hover:underline">Mark all as read</button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((n) => {
                      const cfg = notifIcons[n.type] || notifIcons.post_published;
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={n.id}
                          onClick={() => markOneRead(n)}
                          className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted"
                        >
                          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground">{n.title}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">{n.message}</p>
                          </div>
                          <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center py-8">
                      <Bell className="mb-2 h-8 w-8 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">You're all caught up!</p>
                    </div>
                  )}
                </div>
                <div className="border-t px-4 py-2 text-center">
                  <Link to="/dashboard" onClick={() => setShowNotifs(false)} className="text-xs font-semibold text-primary hover:underline">View All Notifications</Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => { setShowUser(!showUser); setShowNotifs(false); }}
            className="flex h-8 w-8 items-center justify-center rounded-full gradient-bg text-xs font-bold text-primary-foreground"
          >
            {initials}
          </button>
          <AnimatePresence>
            {showUser && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute right-0 top-full mt-2 w-56 rounded-md border border-border bg-card p-2 shadow-lg"
              >
                <div className="px-2 py-2">
                  <p className="font-heading text-sm font-semibold text-foreground">{profile?.full_name || "User"}</p>
                  <p className="text-xs capitalize text-muted-foreground">{profile?.plan || "starter"} plan</p>
                </div>
                <div className="my-1 h-px bg-border" />
                <Link to="/settings" onClick={() => setShowUser(false)} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground/70 hover:bg-muted hover:text-foreground">
                  <User className="h-4 w-4" /> Profile Settings
                </Link>
                <Link to="/settings" onClick={() => setShowUser(false)} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground/70 hover:bg-muted hover:text-foreground">
                  <CreditCard className="h-4 w-4" /> Billing
                </Link>
                <div className="my-1 h-px bg-border" />
                <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10">
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
