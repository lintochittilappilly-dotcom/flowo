import { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import WelcomeModal from "./WelcomeModal";
import TrialBanner from "./TrialBanner";
import BrandInitializer from "@/components/brand-initializer";
import ErrorBoundary from "@/components/error-boundary";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTeamMemberStore } from "@/store/team-member-store";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const { setMemberContext } = useTeamMemberStore();

  const toggleCollapse = useCallback(() => setCollapsed(c => !c), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleCollapse]);

  // Detect team member session
  useEffect(() => {
    if (!user?.id) return;
    const detect = async () => {
      const { data: membership } = await supabase
        .from("team_members")
        .select("owner_user_id, role, permissions, status")
        .eq("member_user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (membership) {
        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", membership.owner_user_id)
          .single();

        setMemberContext({
          ownerUserId: membership.owner_user_id,
          role: membership.role ?? "editor",
          permissions: (membership.permissions as Record<string, boolean>) ?? {},
          ownerName: ownerProfile?.full_name ?? undefined,
        });

        // Update last_active_at
        supabase
          .from("team_members")
          .update({ last_active_at: new Date().toISOString() } as any)
          .eq("member_user_id", user.id)
          .then(() => {});
      }

      // Process pending invite from localStorage
      const pendingToken = localStorage.getItem("flowo_invite_token");
      if (pendingToken) {
        localStorage.removeItem("flowo_invite_token");
        await supabase
          .from("team_members")
          .update({
            member_user_id: user.id,
            status: "active",
            accepted_at: new Date().toISOString(),
          } as any)
          .eq("invite_token", pendingToken);
      }
    };
    detect();
  }, [user?.id, setMemberContext]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TrialBanner />
      <div className="flex flex-1">
        <BrandInitializer />
        <DashboardSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(c => !c)}
        />
        <div className="flex flex-1 flex-col md:ml-0">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
      <WelcomeModal />
    </div>
  );
};

export default DashboardLayout;
