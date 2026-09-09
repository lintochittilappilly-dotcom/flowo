import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User, Check, X, Shield, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AuthBrandPanel from "@/components/auth/AuthBrandPanel";
import PasswordStrengthBar from "@/components/auth/PasswordStrengthBar";
import SEOHead from "@/components/seo-head";

const SignupPage = () => {
  return (
    <>
      <SEOHead title="Sign Up — Flowo" description="Create your free Flowo account. Get a 14-day trial with full Pro access. No credit card required." path="/signup" />
      <SignupPageInner />
    </>
  );
};

const SignupPageInner = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan");

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validations = {
    name: form.name.length >= 2,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email),
    password: form.password.length >= 8 && /[A-Z]/.test(form.password) && /[0-9]/.test(form.password),
    confirm: form.confirm === form.password && form.confirm.length > 0,
  };

  const allValid = Object.values(validations).every(Boolean) && agreed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid) return;
    setLoading(true);
    setError("");

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    navigate("/onboarding");
  };

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const FieldIcon = ({ valid, show }: { valid: boolean; show: boolean }) => {
    if (!show) return null;
    return valid ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-destructive" />;
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-8 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="mb-8 inline-block font-heading text-2xl font-bold text-primary">
            ✨ Flowo
          </Link>

          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Create your free account</h1>
          <p className="mt-2 font-body text-sm text-muted-foreground">
            Start your 14-day free trial. No credit card required.
          </p>

          {plan && (
            <div className="mt-3 flex items-center gap-2 rounded-md bg-lavender px-3 py-2">
              <Check className="h-4 w-4 text-primary" />
              <span className="font-body text-sm text-foreground">
                You selected the <strong className="text-primary capitalize">{plan}</strong> plan — 14 days free, no credit card required
              </span>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-2 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <X className="h-4 w-4 shrink-0" />
              {error}
              <button onClick={() => setError("")} className="ml-auto"><X className="h-3.5 w-3.5" /></button>
            </motion.div>
          )}

          {/* Google */}
          <button
            onClick={handleGoogleSignup}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-[10px] border border-border bg-card py-3 font-body text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="font-body text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="mb-1 block font-heading text-xs font-semibold text-foreground">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={form.name}
                  onChange={e => update("name", e.target.value)}
                  placeholder="Your full name"
                  className={`w-full rounded-[10px] border py-3 pl-10 pr-10 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    touched.name ? (validations.name ? "border-success" : "border-destructive") : "border-border"
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <FieldIcon valid={validations.name} show={!!touched.name} />
                </div>
              </div>
              {touched.name && !validations.name && (
                <p className="mt-1 text-[11px] text-destructive">Name must be at least 2 characters</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block font-heading text-xs font-semibold text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => update("email", e.target.value)}
                  placeholder="your@email.com"
                  className={`w-full rounded-[10px] border py-3 pl-10 pr-10 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    touched.email ? (validations.email ? "border-success" : "border-destructive") : "border-border"
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <FieldIcon valid={validations.email} show={!!touched.email} />
                </div>
              </div>
              {touched.email && !validations.email && (
                <p className="mt-1 text-[11px] text-destructive">Please enter a valid email</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1 block font-heading text-xs font-semibold text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={e => update("password", e.target.value)}
                  placeholder="At least 8 characters"
                  className={`w-full rounded-[10px] border py-3 pl-10 pr-10 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    touched.password ? (validations.password ? "border-success" : "border-destructive") : "border-border"
                  }`}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {touched.password && !validations.password && (
                <p className="mt-1 text-[11px] text-destructive">Must be 8+ chars with uppercase and number</p>
              )}
              <div className="mt-2">
                <PasswordStrengthBar password={form.password} />
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label className="mb-1 block font-heading text-xs font-semibold text-foreground">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={form.confirm}
                  onChange={e => update("confirm", e.target.value)}
                  placeholder="Re-enter your password"
                  className={`w-full rounded-[10px] border py-3 pl-10 pr-10 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    touched.confirm ? (validations.confirm ? "border-success" : "border-destructive") : "border-border"
                  }`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {touched.confirm && !validations.confirm && (
                <p className="mt-1 text-[11px] text-destructive">Passwords do not match</p>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
              />
              <span className="font-body text-xs text-muted-foreground">
                I agree to the{" "}
                <a href="#" target="_blank" className="font-semibold text-primary underline">Terms of Service</a>
                {" "}and{" "}
                <a href="#" target="_blank" className="font-semibold text-primary underline">Privacy Policy</a>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={!allValid || loading}
              className="flex w-full items-center justify-center gap-2 rounded-pill gradient-bg py-3.5 font-heading text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create My Free Account <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="mt-5 text-center font-body text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
          </p>

          {/* Trust badges */}
          <div className="mt-4 flex items-center justify-center gap-4">
            {[
              { icon: Lock, label: "No credit card required" },
              { icon: Shield, label: "256-bit SSL secure" },
              { icon: RefreshCw, label: "Cancel anytime" },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-1 text-muted-foreground">
                <b.icon className="h-3 w-3" />
                <span className="text-[10px]">{b.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel */}
      <AuthBrandPanel />
    </div>
  );
};

export default SignupPage;
