import { AlertTriangle, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface UsageBannerProps {
  used: number;
  limit: number;
  resourceName: string; // e.g. "posts", "AI images"
  isUnlimited?: boolean;
}

export function UsageBanner({ used, limit, resourceName, isUnlimited: unlimited }: UsageBannerProps) {
  const navigate = useNavigate();
  if (unlimited) return null;

  const percent = Math.min((used / limit) * 100, 100);
  const isAtLimit = used >= limit;
  const isNearLimit = percent >= 80;

  if (!isNearLimit) return null;

  const nextReset = new Date();
  nextReset.setMonth(nextReset.getMonth() + 1, 1);
  nextReset.setHours(0, 0, 0, 0);
  const resetLabel = nextReset.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  if (isAtLimit) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3"
      >
        <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-destructive">
            You've reached your monthly limit of {limit} {resourceName}.
          </p>
          <p className="text-[11px] text-muted-foreground">
            Resets on {resetLabel}.{" "}
            <button
              onClick={() => navigate("/settings?tab=billing")}
              className="font-semibold text-primary hover:underline"
            >
              Upgrade now
            </button>{" "}
            for more.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30"
    >
      <TrendingUp className="h-4 w-4 shrink-0 text-amber-600" />
      <p className="text-xs text-amber-800 dark:text-amber-200">
        You've used <span className="font-bold">{used} of {limit}</span> {resourceName} this month.
        Resets on {resetLabel}.
      </p>
    </motion.div>
  );
}

interface UsageChipProps {
  used: number;
  limit: number;
  isUnlimited?: boolean;
}

export function UsageChip({ used, limit, isUnlimited: unlimited }: UsageChipProps) {
  if (unlimited) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
        ∞ Unlimited
      </span>
    );
  }

  const percent = Math.min((used / limit) * 100, 100);
  const colorClass =
    percent >= 100
      ? "bg-destructive/10 text-destructive"
      : percent >= 80
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      : "bg-muted text-muted-foreground";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${colorClass}`}>
      {used}/{limit}
    </span>
  );
}
