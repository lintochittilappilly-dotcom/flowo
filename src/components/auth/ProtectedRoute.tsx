import { Navigate, useLocation } from "react-router-dom";
import { useAuth, hasActiveAccess } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

// Routes that don't require an active plan (only auth)
const BILLING_ONLY_ROUTES = ["/settings"];

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireActivePlan?: boolean;
}

const ProtectedRoute = ({ children, requireActivePlan = true }: ProtectedRouteProps) => {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Check if onboarding is completed
  if (profile && !profile.completed_onboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  // Check active access (trial or paid plan) for dashboard routes
  if (requireActivePlan && profile) {
    const isBillingRoute = BILLING_ONLY_ROUTES.some(
      route => location.pathname === route || location.pathname.startsWith(route + "/")
    );
    
    if (!isBillingRoute && !hasActiveAccess(profile)) {
      // No active plan — redirect to billing with expired reason
      return <Navigate to="/settings?tab=billing&reason=trial_expired" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
