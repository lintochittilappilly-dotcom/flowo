import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Rocket, Sparkles, Check, User, Users, Building, UsersRound,
  Briefcase, Smile, Laugh, Flame, Star, BookOpen, Instagram, Linkedin, Twitter,
  Facebook, Music, Pin, Loader2, AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const industries = [
  "Restaurant & Food", "E-commerce & Retail", "Health & Fitness", "Real Estate",
  "Technology & SaaS", "Coaching & Consulting", "Beauty & Wellness", "Finance & Accounting",
  "Education", "Travel & Hospitality", "Creative & Design", "Other"
];

const roles = ["Business Owner", "Marketing Manager", "Freelancer", "Agency Owner", "Content Creator", "Other"];

const sizes = [
  { label: "Just Me", icon: User, value: "solo" },
  { label: "Small Team (2-10)", icon: Users, value: "small" },
  { label: "Medium (11-50)", icon: UsersRound, value: "medium" },
  { label: "Large (50+)", icon: Building, value: "large" },
];

const toneOptions = [
  { emoji: Briefcase, name: "Professional", desc: "Authoritative and trustworthy" },
  { emoji: Smile, name: "Friendly", desc: "Warm and approachable" },
  { emoji: Laugh, name: "Witty", desc: "Humorous and clever" },
  { emoji: Flame, name: "Bold", desc: "Direct and confident" },
  { emoji: Star, name: "Inspirational", desc: "Motivating and uplifting" },
  { emoji: BookOpen, name: "Educational", desc: "Informative and helpful" },
];

const platformOptions = [
  { name: "Instagram", icon: Instagram, desc: "Best for visual content and stories", color: "text-pink-500" },
  { name: "LinkedIn", icon: Linkedin, desc: "Best for professional and B2B content", color: "text-blue-600" },
  { name: "Twitter", icon: Twitter, desc: "Best for news and real-time engagement", color: "text-sky-500" },
  { name: "Facebook", icon: Facebook, desc: "Best for community and local business", color: "text-indigo-600" },
  { name: "TikTok", icon: Music, desc: "Best for short video content", color: "text-foreground" },
  { name: "Pinterest", icon: Pin, desc: "Best for lifestyle and e-commerce", color: "text-red-600" },
];

const contentOptions = [
  { label: "Promote my product or service", desc: "Showcase what you offer and why people should buy" },
  { label: "Share tips and education", desc: "Teach your audience something valuable" },
  { label: "Build brand awareness", desc: "Help people get to know your brand story" },
  { label: "Announce something new", desc: "New product, event, or update" },
  { label: "Let AI decide ✨", desc: "Flowo will create the best mix for your brand" },
];

const postCounts = [5, 7, 10, 14];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);

  // Step 1
  const [businessName, setBusinessName] = useState("");
  const [role, setRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [businessSize, setBusinessSize] = useState("");

  // Step 2
  const [selectedTones, setSelectedTones] = useState<string[]>([]);
  const [brandDesc, setBrandDesc] = useState("");
  const [samplePosts, setSamplePosts] = useState("");

  // Step 3
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [skippedPlatforms, setSkippedPlatforms] = useState(false);

  // Step 4
  const [contentGoal, setContentGoal] = useState("Let AI decide ✨");
  const [postCount, setPostCount] = useState(7);
  const [generating, setGenerating] = useState(false);
  const [genPhase, setGenPhase] = useState(0);
  const [genProgress, setGenProgress] = useState(0);
  const [genDone, setGenDone] = useState(false);

  const progress = (step / 4) * 100;

  const canContinue = () => {
    if (step === 1) return businessName && role && industry && businessSize;
    if (step === 2) return selectedTones.length > 0;
    if (step === 3) return connectedPlatforms.length > 0 || skippedPlatforms;
    return true;
  };

  const handleConnect = (name: string) => {
    setConnecting(name);
    setTimeout(() => {
      setConnectedPlatforms(prev => [...prev, name]);
      setConnecting(null);
    }, 1500);
  };

  const handleDisconnect = (name: string) => {
    setConnectedPlatforms(prev => prev.filter(p => p !== name));
  };

  const handleGenerate = () => {
    setGenerating(true);
    setGenPhase(0);
    setGenProgress(0);

    const phases = [0, 700, 1400, 2100];
    phases.forEach((delay, i) => {
      setTimeout(() => setGenPhase(i), delay);
    });

    const progressInterval = setInterval(() => {
      setGenProgress(prev => {
        if (prev >= 100) { clearInterval(progressInterval); return 100; }
        return prev + 3.33;
      });
    }, 100);

    setTimeout(() => {
      clearInterval(progressInterval);
      setGenProgress(100);
      setGenDone(true);
    }, 3000);
  };

  const handleComplete = async () => {
    if (!user) return;

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    await supabase.from("profiles").update({
      completed_onboarding: true,
      business_name: businessName,
      industry,
      role,
      business_size: businessSize,
      brand_tones: selectedTones,
      brand_description: brandDesc || null,
      sample_posts: samplePosts || null,
      connected_platforms: connectedPlatforms,
      // Activate 14-day trial
      plan: "trial",
      trial_ends_at: trialEndsAt.toISOString(),
      trial_expired: false,
    }).eq("id", user.id);

    await refreshProfile();
    // Redirect to billing with trial_started flag to show welcome banner
    navigate("/settings?tab=billing&trial_started=true", { replace: true });
  };

  const genMessages = [
    "Building your brand voice profile...",
    "Generating platform-specific posts...",
    "Scheduling your content calendar...",
    "Almost there..."
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Progress bar */}
      <div className="h-1 w-full bg-muted">
        <motion.div
          className="h-1 gradient-bg"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="mx-auto max-w-[640px] px-4 py-8 sm:py-12">
        {/* Logo */}
        <div className="mb-6 text-center">
          <span className="font-heading text-2xl font-bold text-primary">✨ Flowo</span>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                s < step ? "gradient-bg text-primary-foreground" :
                s === step ? "gradient-bg text-primary-foreground shadow-md" :
                "bg-muted text-muted-foreground"
              }`}>
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 4 && <div className={`h-px w-8 ${s < step ? "gradient-bg" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="rounded-[20px] bg-card p-6 shadow-lg sm:p-8"
          >
            {/* Step badge */}
            <span className="mb-4 inline-block rounded-pill bg-lavender px-3 py-1 font-heading text-xs font-semibold text-primary">
              Step {step} of 4
            </span>

            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">Tell us about your business</h2>
                  <p className="mt-1 font-body text-sm text-muted-foreground">This helps Flowo create content that perfectly represents your brand.</p>
                </div>

                <div>
                  <label className="mb-1 block font-heading text-xs font-semibold text-foreground">Business Name</label>
                  <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Bloom Skincare Co"
                    className="w-full rounded-[10px] border border-border py-3 px-4 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>

                <div>
                  <label className="mb-1 block font-heading text-xs font-semibold text-foreground">Your Role</label>
                  <select value={role} onChange={e => setRole(e.target.value)}
                    className="w-full rounded-[10px] border border-border py-3 px-4 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option value="">Select your role</option>
                    {roles.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-heading text-xs font-semibold text-foreground">Industry</label>
                  <select value={industry} onChange={e => setIndustry(e.target.value)}
                    className="w-full rounded-[10px] border border-border py-3 px-4 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option value="">Select your industry</option>
                    {industries.map(ind => <option key={ind}>{ind}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block font-heading text-xs font-semibold text-foreground">Business Size</label>
                  <div className="grid grid-cols-2 gap-3">
                    {sizes.map(s => (
                      <button key={s.value} onClick={() => setBusinessSize(s.value)}
                        className={`flex items-center gap-3 rounded-[10px] border p-3 text-left transition-all ${
                          businessSize === s.value ? "border-primary bg-lavender ring-2 ring-primary/30" : "border-border hover:border-primary/40"
                        }`}>
                        <s.icon className={`h-5 w-5 ${businessSize === s.value ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="font-body text-sm font-medium text-foreground">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">What's your brand personality?</h2>
                  <p className="mt-1 font-body text-sm text-muted-foreground">Your brand voice makes every post sound authentically like you.</p>
                </div>

                <div>
                  <label className="mb-2 block font-heading text-xs font-semibold text-foreground">Choose your brand tone</label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {toneOptions.map(t => {
                      const selected = selectedTones.includes(t.name);
                      return (
                        <button key={t.name}
                          onClick={() => setSelectedTones(prev => selected ? prev.filter(x => x !== t.name) : [...prev, t.name])}
                          className={`relative rounded-[10px] border p-3 text-left transition-all ${
                            selected ? "gradient-bg text-primary-foreground border-transparent" : "border-border hover:border-primary/40"
                          }`}>
                          {selected && <Check className="absolute right-2 top-2 h-4 w-4" />}
                          <t.emoji className={`h-5 w-5 ${selected ? "text-primary-foreground" : "text-muted-foreground"}`} />
                          <p className={`mt-1 font-heading text-sm font-bold ${selected ? "" : "text-foreground"}`}>{t.name}</p>
                          <p className={`text-[11px] ${selected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{t.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-heading text-xs font-semibold text-foreground">Describe your brand in your own words <span className="text-muted-foreground">(optional)</span></label>
                  <textarea value={brandDesc} onChange={e => setBrandDesc(e.target.value)}
                    placeholder="We are a sustainable skincare brand that helps busy women feel confident without toxic chemicals..."
                    className="w-full rounded-[10px] border border-border py-3 px-4 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[80px] resize-none" />
                </div>

                <div>
                  <label className="mb-1 block font-heading text-xs font-semibold text-foreground">Paste 2-3 of your best social media posts <span className="text-muted-foreground">(optional)</span></label>
                  <textarea value={samplePosts} onChange={e => setSamplePosts(e.target.value)}
                    placeholder="Paste your posts here..."
                    className="w-full rounded-[10px] border border-border py-3 px-4 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[80px] resize-none" />
                  <p className="mt-1 text-[11px] text-muted-foreground">Optional but highly recommended. This helps our AI match your exact writing style.</p>
                </div>

                <div className="rounded-md border-l-4 border-l-primary bg-lavender/50 p-3">
                  <p className="font-body text-xs text-muted-foreground">💡 The more you share here, the better your AI-generated content will sound like you.</p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">Connect your social accounts</h2>
                  <p className="mt-1 font-body text-sm text-muted-foreground">Connect at least one platform to start publishing.</p>
                </div>

                <div className="space-y-3">
                  {platformOptions.map(p => {
                    const connected = connectedPlatforms.includes(p.name);
                    const isConnecting = connecting === p.name;
                    return (
                      <div key={p.name} className="flex items-center gap-3 rounded-[12px] border border-border p-3 sm:p-4">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted ${p.color}`}>
                          <p.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-heading text-sm font-bold text-foreground">{p.name}</p>
                          <p className="text-[11px] text-muted-foreground">{p.desc}</p>
                        </div>
                        {connected ? (
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-xs font-semibold text-success">
                              <Check className="h-3.5 w-3.5" /> Connected
                            </span>
                            <button onClick={() => handleDisconnect(p.name)} className="text-[11px] text-muted-foreground hover:text-destructive">
                              Disconnect
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConnect(p.name)}
                            disabled={isConnecting}
                            className="rounded-md border border-primary px-4 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/5 disabled:opacity-50"
                          >
                            {isConnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Connect"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {connectedPlatforms.length === 0 && !skippedPlatforms && (
                  <button onClick={() => setSkippedPlatforms(true)} className="text-xs text-muted-foreground hover:text-foreground">
                    I'll connect platforms later. Skip for now →
                  </button>
                )}

                {skippedPlatforms && connectedPlatforms.length === 0 && (
                  <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      You can connect your platforms anytime from Settings, but you'll need at least one connected to start publishing.
                    </p>
                  </div>
                )}
              </div>
            )}

            {step === 4 && !generating && !genDone && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">Let's generate your first week of content</h2>
                  <p className="mt-1 font-body text-sm text-muted-foreground">Tell us what to post about and watch the AI build your content calendar in seconds.</p>
                </div>

                <div>
                  <label className="mb-2 block font-heading text-xs font-semibold text-foreground">What do you want to post about?</label>
                  <div className="space-y-2">
                    {contentOptions.map(c => (
                      <button key={c.label} onClick={() => setContentGoal(c.label)}
                        className={`flex w-full items-start gap-3 rounded-[10px] border p-3 text-left transition-all ${
                          contentGoal === c.label ? "border-primary bg-lavender ring-2 ring-primary/30" : "border-border hover:border-primary/40"
                        }`}>
                        <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
                          contentGoal === c.label ? "border-primary bg-primary" : "border-muted-foreground"
                        }`}>
                          {contentGoal === c.label && <div className="h-full w-full rounded-full border-2 border-primary-foreground" />}
                        </div>
                        <div>
                          <p className="font-heading text-sm font-semibold text-foreground">{c.label}</p>
                          <p className="text-[11px] text-muted-foreground">{c.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-heading text-xs font-semibold text-foreground">Number of posts</label>
                  <div className="flex gap-2">
                    {postCounts.map(c => (
                      <button key={c} onClick={() => setPostCount(c)}
                        className={`flex-1 rounded-pill py-2 text-xs font-bold transition-all ${
                          postCount === c ? "gradient-bg text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"
                        }`}>
                        {c} posts
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleGenerate}
                  className="relative w-full overflow-hidden rounded-pill gradient-bg py-4 font-heading text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent animate-[shimmer_2s_infinite]" style={{ transform: "skewX(-20deg)" }} />
                  <span className="relative flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4" /> Generate My First Week
                  </span>
                </button>
              </div>
            )}

            {step === 4 && generating && !genDone && (
              <div className="space-y-6 py-8 text-center">
                <Sparkles className="mx-auto h-10 w-10 animate-pulse text-primary" />
                <h2 className="font-heading text-xl font-bold text-foreground">AI is generating your content</h2>
                <div className="space-y-2">
                  {genMessages.map((msg, i) => (
                    <motion.p key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: genPhase >= i ? 1 : 0, y: genPhase >= i ? 0 : 10 }}
                      className="font-body text-sm text-muted-foreground">
                      {msg}
                    </motion.p>
                  ))}
                </div>
                <div className="mx-auto h-2 w-full max-w-xs rounded-full bg-muted">
                  <motion.div className="h-2 rounded-full gradient-bg"
                    animate={{ width: `${Math.min(genProgress, 100)}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>
            )}

            {step === 4 && genDone && (
              <div className="space-y-5 py-4 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10 }}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10"
                >
                  <Check className="h-8 w-8 text-success" />
                </motion.div>
                <h2 className="font-heading text-xl font-bold text-foreground">Your first week is ready! 🎉</h2>
                <p className="font-body text-sm text-muted-foreground">
                  We generated {postCount} posts across your connected platforms. Your content calendar is live and ready to review.
                </p>
                <div className="flex justify-center gap-3">
                  {connectedPlatforms.slice(0, 3).map(p => {
                    const plat = platformOptions.find(x => x.name === p);
                    if (!plat) return null;
                    return (
                      <div key={p} className="rounded-md border border-border bg-muted/50 px-3 py-2 text-[11px]">
                        <plat.icon className="mx-auto h-4 w-4 text-primary mb-1" />
                        <span className="text-muted-foreground">Post ready</span>
                      </div>
                    );
                  })}
                </div>
                <button onClick={handleComplete}
                  className="inline-flex items-center gap-2 rounded-pill gradient-bg px-8 py-3.5 font-heading text-sm font-bold text-primary-foreground shadow-lg transition-transform hover:scale-105">
                  <Rocket className="h-4 w-4" /> Let's Go 🚀
                </button>
              </div>
            )}

            {/* Navigation */}
            {!(step === 4 && (generating || genDone)) && (
              <div className="mt-6 flex items-center justify-between">
                {step > 1 ? (
                  <button onClick={() => setStep(step - 1)}
                    className="flex items-center gap-1.5 rounded-md border border-border px-4 py-2 font-body text-sm font-semibold text-foreground hover:bg-muted">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                ) : <div />}
                {step < 4 && (
                  <button onClick={() => setStep(step + 1)} disabled={!canContinue()}
                    className="flex items-center gap-1.5 rounded-pill gradient-bg px-6 py-2.5 font-heading text-sm font-bold text-primary-foreground shadow-md transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100">
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingPage;
