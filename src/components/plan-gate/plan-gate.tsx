import { useState, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { usePlanGate } from "@/hooks/use-plan-gate";
import { UpgradeModal } from "./upgrade-modal";
import type { FeatureKey } from "@/lib/plan-features";

interface PlanGateProps {
  feature: FeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PlanGate({ feature, children, fallback }: PlanGateProps) {
  const { can, plan } = usePlanGate();
  const [showModal, setShowModal] = useState(false);

  if (can(feature)) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="relative cursor-pointer"
      >
        <div className="pointer-events-none select-none opacity-40 blur-[1px]">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-full bg-card/90 border border-border px-4 py-2 shadow-lg backdrop-blur-sm">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Upgrade to unlock</span>
          </div>
        </div>
      </div>

      <UpgradeModal
        open={showModal}
        onClose={() => setShowModal(false)}
        feature={feature}
        currentPlan={plan}
      />
    </>
  );
}
