import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/seo-head";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    setSent(true);
    setCountdown(60);

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <>
      <SEOHead title="Forgot Password — Flowo" description="Reset your Flowo account password. We'll send you a secure link to create a new one." path="/forgot-password" />
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[460px] rounded-[20px] bg-card p-8 shadow-lg sm:p-10"
      >
        <Link to="/" className="mb-6 inline-block font-heading text-2xl font-bold text-primary">
          ✨ Flowo
        </Link>

        {!sent ? (
          <>
            <h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl">Reset your password</h1>
            <p className="mt-2 font-body text-sm text-muted-foreground">
              Enter your email address and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-[10px] border border-border py-3 pl-10 pr-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <button
                type="submit"
                disabled={!email || loading}
                className="flex w-full items-center justify-center gap-2 rounded-pill gradient-bg py-3 font-heading text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
              <Check className="h-7 w-7 text-success" />
            </div>
            <h2 className="mt-4 font-heading text-xl font-bold text-foreground">Check your email</h2>
            <p className="mt-2 font-body text-sm text-muted-foreground">
              We sent a password reset link to the email address you entered. Check your inbox and click the link to reset your password.
            </p>
            <button
              onClick={handleSubmit}
              disabled={countdown > 0}
              className="mt-4 font-body text-sm font-semibold text-primary disabled:text-muted-foreground"
            >
              {countdown > 0 ? `Resend in ${countdown}s` : "Resend email"}
            </button>
          </div>
        )}

        <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 font-body text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>
      </motion.div>
    </div>
    </>
  );
};

export default ForgotPasswordPage;
