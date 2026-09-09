import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, Calendar, PlusCircle, BarChart3, MessageSquare,
  Flame, Building, Settings, HelpCircle, LogOut, X, Instagram,
  Linkedin, Twitter, Music, ChevronsLeft, ChevronsRight, Sparkles, ImageIcon,
  Facebook, Pin, Globe
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import BrandSwitcher from "@/components/sidebar/brand-switcher";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: string;
  badgeColor?: string;
}

const staticNavItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutGrid, path: "/dashboard" },
  { label: "Content Calendar", icon: Calendar, path: "/calendar" },
  { label: "Create Post", icon: PlusCircle, path: "/create", badge: "New", badgeColor: "bg-secondary" },
  { label: "Analytics", icon: BarChart3, path: "/analytics" },
  { label: "Comments", icon: MessageSquare, path: "/comments" },
  { label: "Trends", icon: Flame, path: "/trends" },
  { label: "Image Gen", icon: ImageIcon, path: "/image-gen", badge: "AI", badgeColor: "bg-secondary" },
  { label: "Brands", icon: Building, path: "/brands" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

const platformIconMap: Record<string, React.ElementType> = {
  Instagram, LinkedIn: Linkedin, Twitter, Facebook, TikTok: Music, Pinterest: Pin,
};

interface ConnectedPlatform {
  name: string;
  icon: React.ElementType;
  accountName: string;
}

interface DashboardSidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const DashboardSidebar = ({ open, onClose, collapsed, onToggleCollapse }: DashboardSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const initials = profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U";
  const displayName = profile?.full_name || "User";
  const planLabel = profile?.plan ? `${profile.plan.charAt(0).toUpperCase()}${profile.plan.slice(1)} Plan` : "Starter Plan";

  // Fetch real unread comment count
  const [unreadCommentCount, setUnreadCommentCount] = useState(0);
  // Fetch connected platforms from social_accounts
  const [connectedPlatforms, setConnectedPlatforms] = useState<ConnectedPlatform[]>([]);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchCount = async () => {
      const { count } = await supabase
        .from("comments_cache")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("is_hidden", false)
        .eq("is_replied", false);
      setUnreadCommentCount(count || 0);
    };

    const fetchPlatforms = async () => {
      const { data } = await supabase
        .from("social_accounts")
        .select("platform, account_name")
        .eq("user_id", profile.id)
        .eq("is_active", true);
      if (data) {
        setConnectedPlatforms(
          data.map((a) => ({
            name: a.platform || "Unknown",
            icon: platformIconMap[a.platform || ""] || Globe,
            accountName: a.account_name || "",
          }))
        );
      }
    };

    fetchCount();
    fetchPlatforms();

    const commentsChannel = supabase
      .channel("sidebar-comments-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "comments_cache", filter: `user_id=eq.${profile.id}` }, () => fetchCount())
      .subscribe();

    const accountsChannel = supabase
      .channel("sidebar-social-accounts")
      .on("postgres_changes", { event: "*", schema: "public", table: "social_accounts", filter: `user_id=eq.${profile.id}` }, () => fetchPlatforms())
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(accountsChannel);
    };
  }, [profile?.id]);

  const navItems: NavItem[] = staticNavItems.map((item) => {
    if (item.path === "/comments" && unreadCommentCount > 0) {
      return { ...item, badge: String(unreadCommentCount), badgeColor: "bg-destructive" };
    }
    return item;
  });

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const expandedWidth = "w-[260px]";
  const collapsedWidth = "w-[68px]";

  const sidebarContent = (isCollapsed: boolean, isMobile = false) => (
    <div className="flex h-full flex-col bg-midnight text-primary-foreground">
      {/* Logo */}
      <div className={`flex items-center ${isCollapsed ? "justify-center px-2" : "justify-between px-5"} pt-5 pb-4`}>
        <Link to="/dashboard" className="flex items-center gap-2 font-heading text-xl font-bold text-primary-foreground">
          <Sparkles className="h-5 w-5 shrink-0 text-secondary" />
          {!isCollapsed && <span>Flowo</span>}
        </Link>
        {isMobile && (
          <button onClick={onClose} className="text-primary-foreground/50 hover:text-primary-foreground">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Brand Switcher */}
      <BrandSwitcher collapsed={isCollapsed} />

      <div className={`${isCollapsed ? "mx-2" : "mx-5"} h-px bg-primary-foreground/10`} />

      {/* User profile */}
      {isCollapsed ? (
        <div className="flex justify-center py-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-bg text-xs font-bold text-primary-foreground cursor-default">
                {initials}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-midnight text-primary-foreground border-primary-foreground/10">
              <p className="font-semibold">{displayName}</p>
              <p className="text-[10px] text-primary-foreground/60">{planLabel}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      ) : (
        <div className="px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-bg text-xs font-bold text-primary-foreground">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-semibold text-primary-foreground">{displayName}</p>
              <span className="rounded-pill bg-primary/30 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground/80">
                {planLabel}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className={`${isCollapsed ? "mx-2" : "mx-5"} h-px bg-primary-foreground/10`} />

      {/* Navigation */}
      <nav className={`flex-1 space-y-1 ${isCollapsed ? "px-2" : "px-3"} py-4 overflow-y-auto`}>
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          const linkContent = (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`group flex items-center ${isCollapsed ? "justify-center" : "gap-3"} rounded-md ${isCollapsed ? "px-0 py-2.5" : "px-3 py-2.5"} font-body text-sm font-medium transition-all duration-200 ${
                active
                  ? "gradient-bg text-primary-foreground shadow-md"
                  : "text-primary-foreground/50 hover:bg-primary-foreground/5 hover:text-primary-foreground"
              }`}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!isCollapsed && <span className="flex-1">{item.label}</span>}
              {!isCollapsed && item.badge && (
                <span className={`rounded-pill px-2 py-0.5 text-[10px] font-bold text-primary-foreground ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
              {isCollapsed && item.badge && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-destructive" />
              )}
            </Link>
          );

          if (isCollapsed) {
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <div className="relative">{linkContent}</div>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-midnight text-primary-foreground border-primary-foreground/10">
                  {item.label}
                  {item.badge && <span className="ml-2 text-[10px] text-secondary">{item.badge}</span>}
                </TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>

      <div className={`${isCollapsed ? "mx-2" : "mx-5"} h-px bg-primary-foreground/10`} />

      {/* Connected Platforms */}
      {!isCollapsed && connectedPlatforms.length > 0 && (
        <div className="px-5 py-4">
          <p className="mb-3 font-heading text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/30">
            Connected Platforms
          </p>
          <div className="space-y-2">
            {connectedPlatforms.map((p) => (
              <div key={p.name + p.accountName} className="flex items-center gap-2.5 text-sm">
                <p.icon className="h-4 w-4 text-primary-foreground/40" />
                <span className="flex-1 truncate text-primary-foreground/60">{p.accountName || p.name}</span>
                <span className="h-2 w-2 rounded-full bg-success" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!isCollapsed && connectedPlatforms.length === 0 && (
        <div className="px-5 py-4">
          <p className="mb-2 font-heading text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/30">
            Connected Platforms
          </p>
          <p className="text-[11px] text-primary-foreground/30">No platforms connected</p>
        </div>
      )}

      {isCollapsed && connectedPlatforms.length > 0 && (
        <div className="flex flex-col items-center gap-2 py-4">
          {connectedPlatforms.map((p) => (
            <Tooltip key={p.name + p.accountName}>
              <TooltipTrigger asChild>
                <div className="relative flex h-7 w-7 items-center justify-center rounded-md bg-primary-foreground/5">
                  <p.icon className="h-3.5 w-3.5 text-primary-foreground/40" />
                  <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-success" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-midnight text-primary-foreground border-primary-foreground/10">
                {p.name}{p.accountName ? ` — ${p.accountName}` : ""}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}

      <div className={`${isCollapsed ? "mx-2" : "mx-5"} h-px bg-primary-foreground/10`} />

      {/* Bottom actions */}
      <div className={`space-y-1 ${isCollapsed ? "px-2" : "px-3"} py-4`}>
        {isCollapsed ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/help" onClick={onClose} className="flex items-center justify-center rounded-md py-2 text-primary-foreground/50 transition-colors hover:text-primary-foreground">
                  <HelpCircle className="h-[18px] w-[18px]" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-midnight text-primary-foreground border-primary-foreground/10">Help & Support</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={handleLogout} className="flex w-full items-center justify-center rounded-md py-2 text-primary-foreground/50 transition-colors hover:text-destructive">
                  <LogOut className="h-[18px] w-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-midnight text-primary-foreground border-primary-foreground/10">Logout</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <>
            <Link to="/help" onClick={onClose} className="flex items-center gap-3 rounded-md px-3 py-2 font-body text-sm text-primary-foreground/50 transition-colors hover:text-primary-foreground">
              <HelpCircle className="h-[18px] w-[18px]" /> Help & Support
            </Link>
            <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-md px-3 py-2 font-body text-sm text-primary-foreground/50 transition-colors hover:text-destructive">
              <LogOut className="h-[18px] w-[18px]" /> Logout
            </button>
          </>
        )}
      </div>

      {/* Collapse toggle - desktop only */}
      {!isMobile && (
        <div className={`${isCollapsed ? "px-2" : "px-3"} pb-4`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleCollapse}
                className={`flex w-full items-center ${isCollapsed ? "justify-center" : "gap-3 px-3"} rounded-md py-2.5 font-body text-sm font-medium transition-all duration-200 border border-primary-foreground/10 bg-primary-foreground/5 text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground hover:border-primary-foreground/20`}
              >
                {isCollapsed ? <ChevronsRight className="h-[18px] w-[18px]" /> : <><ChevronsLeft className="h-[18px] w-[18px]" /><span>Collapse</span></>}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-1.5 text-xs">
              {isCollapsed ? "Expand" : "Collapse"} <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono">⌘B</kbd>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex ${collapsed ? collapsedWidth : expandedWidth} md:shrink-0 transition-all duration-300`}>
        <div className={`fixed inset-y-0 left-0 z-30 ${collapsed ? collapsedWidth : expandedWidth} overflow-y-auto border-r border-primary-foreground/5 transition-all duration-300`}>
          {sidebarContent(collapsed)}
        </div>
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-foreground/50 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`fixed inset-y-0 left-0 z-50 ${expandedWidth} md:hidden`}
            >
              {sidebarContent(false, true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default DashboardSidebar;
