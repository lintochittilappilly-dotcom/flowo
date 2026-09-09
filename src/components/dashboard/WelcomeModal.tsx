import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const CONFETTI_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--success))",
  "#FBBF24",
  "#60A5FA",
  "#F472B6",
];

const ConfettiPiece = ({ index }: { index: number }) => {
  const left = Math.random() * 100;
  const delay = Math.random() * 0.6;
  const duration = 1.8 + Math.random() * 1.2;
  const rotation = Math.random() * 720 - 360;
  const size = 6 + Math.random() * 6;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const isCircle = index % 3 === 0;

  return (
    <motion.div
      initial={{ y: -20, x: 0, opacity: 1, rotate: 0, scale: 1 }}
      animate={{
        y: [0, 300 + Math.random() * 200],
        x: [0, (Math.random() - 0.5) * 160],
        opacity: [1, 1, 0],
        rotate: rotation,
        scale: [1, 0.6],
      }}
      transition={{ duration, delay, ease: "easeOut" }}
      className="pointer-events-none absolute top-0"
      style={{
        left: `${left}%`,
        width: size,
        height: isCircle ? size : size * 2.5,
        borderRadius: isCircle ? "50%" : "2px",
        backgroundColor: color,
      }}
    />
  );
};

const WelcomeModal = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [show, setShow] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  useEffect(() => {
    if (!user?.id) return;

    async function checkWelcomeModal() {
      const { data: p } = await supabase
        .from("profiles")
        .select("shown_welcome_modal, completed_onboarding")
        .eq("id", user!.id)
        .single();

      if (p && p.completed_onboarding && !p.shown_welcome_modal) {
        setShow(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);

        // Mark as shown immediately — prevents re-show on refresh
        await supabase
          .from("profiles")
          .update({ shown_welcome_modal: true })
          .eq("id", user!.id);
      }
    }

    checkWelcomeModal();
  }, [user?.id]);

  const handleClose = async () => {
    setShow(false);
    await refreshProfile();
  };

  const platformCount = profile?.connected_platforms?.length || 0;

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed inset-0 z-50 m-auto h-fit w-full max-w-[520px] overflow-hidden rounded-[24px] bg-card p-8 shadow-2xl"
          >
            {/* Confetti layer */}
            {showConfetti && (
              <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
                {Array.from({ length: 50 }).map((_, i) => (
                  <ConfettiPiece key={i} index={i} />
                ))}
              </div>
            )}

            <button onClick={handleClose} className="absolute right-4 top-4 z-20 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>

            {/* Gradient header */}
            <div className="mx-auto -mt-2 mb-6 flex h-24 w-full items-center justify-center rounded-[16px] gradient-bg">
              <span className="text-4xl">✨🎉</span>
            </div>

            <h2 className="text-center font-heading text-2xl font-bold text-foreground">
              Welcome to Flowo, {firstName}!
            </h2>
            <p className="mt-2 text-center font-body text-sm text-muted-foreground">
              Your AI social media team is ready. Here's what we set up for you:
            </p>

            <div className="mt-6 space-y-3">
              {[
                `Brand voice profile created for ${profile?.business_name || "your business"}`,
                "7 posts generated and scheduled for this week",
                `${platformCount} social platform${platformCount !== 1 ? "s" : ""} connected`,
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10">
                    <Check className="h-3.5 w-3.5 text-success" />
                  </div>
                  <span className="font-body text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleClose}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-pill gradient-bg py-3.5 font-heading text-sm font-bold text-primary-foreground shadow-lg transition-all hover:scale-[1.02]"
            >
              Explore My Dashboard <ArrowRight className="h-4 w-4" />
            </button>

            <button className="mt-3 w-full text-center font-body text-sm text-muted-foreground hover:text-primary">
              Watch a 2-minute tour
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WelcomeModal;
