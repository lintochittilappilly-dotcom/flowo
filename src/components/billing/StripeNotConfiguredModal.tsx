import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface StripeNotConfiguredModalProps {
  open: boolean;
  onClose: () => void;
}

const ENV_VARS = `STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_MONTHLY_PRICE_ID=price_...
STRIPE_STARTER_ANNUAL_PRICE_ID=price_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_ANNUAL_PRICE_ID=price_...
STRIPE_AGENCY_MONTHLY_PRICE_ID=price_...
STRIPE_AGENCY_ANNUAL_PRICE_ID=price_...`;

const steps = [
  "Go to dashboard.stripe.com and create an account",
  "Get your API keys from Developers → API keys",
  "Create products for each plan and get the Price IDs",
];

const StripeNotConfiguredModal = ({ open, onClose }: StripeNotConfiguredModalProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ENV_VARS);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3 className="font-heading text-lg font-bold text-foreground">Stripe Not Configured Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              To enable real payments, add these secrets to your Supabase Edge Function secrets.
            </p>

            {/* Code block */}
            <div className="relative mt-4 rounded-lg bg-foreground/5 border border-border overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-[10px] font-semibold text-muted-foreground">Edge Function Secrets</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-primary hover:bg-primary/10 transition-colors"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="p-3 text-[11px] text-foreground/80 overflow-x-auto font-mono leading-relaxed">
                {ENV_VARS}
              </pre>
            </div>

            {/* Steps */}
            <div className="mt-4 space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full gradient-bg text-[10px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <p className="text-xs text-muted-foreground pt-0.5">{step}</p>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg gradient-bg py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                Got It
              </button>
              <a
                href="https://dashboard.stripe.com"
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Open Stripe <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StripeNotConfiguredModal;
