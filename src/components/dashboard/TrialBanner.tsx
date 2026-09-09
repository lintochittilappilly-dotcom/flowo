import { Link } from "react-router-dom";
import { Sparkles, Clock, AlertTriangle } from "lucide-react";
import { useAuth, getTrialDaysLeft, hasActiveAccess } from "@/contexts/AuthContext";

const TrialBanner = () => {
  const { profile } = useAuth();
  
  if (!profile) return null;
  
  const plan = profile.plan ?? "none";
  
  // Don't show for paid users
  if (["starter", "pro", "agency"].includes(plan)) return null;
  
  // Don't show if not on trial
  if (plan !== "trial") return null;
  
  // Check if trial is still active
  if (!hasActiveAccess(profile)) return null;
  
  const daysLeft = getTrialDaysLeft(profile);
  
  // Color changes as trial runs out
  const isUrgent = daysLeft <= 3;
  const isWarning = daysLeft <= 7 && daysLeft > 3;

  return (
    <div 
      className={`w-full px-4 py-2.5 flex items-center justify-center gap-3 text-sm ${
        isUrgent 
          ? "bg-destructive text-destructive-foreground" 
          : isWarning 
          ? "bg-amber-500 text-white"
          : "gradient-bg text-primary-foreground"
      }`}
    >
      {isUrgent ? (
        <AlertTriangle className="h-4 w-4" />
      ) : isWarning ? (
        <Clock className="h-4 w-4" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      <span className="font-medium">
        {daysLeft === 0
          ? "⚠️ Your trial expires today"
          : daysLeft === 1
          ? "⚠️ Your trial expires tomorrow"
          : `✨ ${daysLeft} days left in your free trial`
        }
      </span>
      <Link 
        to="/settings?tab=billing" 
        className={`font-bold underline-offset-2 hover:underline ${
          isUrgent || isWarning ? "text-white" : "text-primary-foreground"
        }`}
      >
        Upgrade Now
      </Link>
    </div>
  );
};

export default TrialBanner;
