import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useAnimationControls,
} from "framer-motion";
import { ArrowRight, Star, Sparkles } from "lucide-react";
import dashboardMockup from "@/assets/dashboard-mockup.png";

const Hero = () => {
  /* -----------------------------
     AI Typing Animation (Premium)
  ------------------------------ */
  const fullText = "Powered by AI.";
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 70);
    return () => clearInterval(interval);
  }, []);

  /* -----------------------------
     Scroll-triggered Parallax
  ------------------------------ */
  const { scrollY } = useScroll();
  const headlineY = useTransform(scrollY, [0, 300], [0, -24]);
  const subY = useTransform(scrollY, [0, 300], [0, -12]);
  const particlesY = useTransform(scrollY, [0, 300], [0, -36]);

  return (
    <section className="relative overflow-hidden bg-background pb-20 pt-12 sm:pt-16 lg:pt-20">

      {/* Floating CTA Particles (FIXED Z-INDEX) */}
<motion.div
  className="absolute -top-8 left-1/2 h-4 w-4 rounded-full bg-primary/50 blur-md z-30"
  animate={{ y: [0, -18, 0], opacity: [0.3, 0.7, 0.3], rotate: [0, 12, 0] }}
  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
/>

<motion.div
  className="absolute top-10 left-[30%] h-3 w-3 rounded-full bg-secondary/50 blur-md z-30"
  animate={{ y: [0, -14, 0], opacity: [0.2, 0.6, 0.2], rotate: [0, -10, 0] }}
  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
/>

<motion.div
  className="absolute top-6 right-[25%] h-5 w-5 rounded-full bg-primary/60 blur-lg z-30"
  animate={{ y: [0, -22, 0], opacity: [0.4, 0.9, 0.4], rotate: [0, 15, 0] }}
  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
/>

      <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-1.5 rounded-pill bg-lavender px-4 py-1.5 font-heading text-sm font-semibold text-primary"
        >
          <Sparkles className="mr-1 inline h-3.5 w-3.5" /> Trusted by 2,000+ growing businesses
        </motion.div>

        {/* Headline with Parallax + Typing */}
        <motion.h1
          style={{ y: headlineY }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto max-w-4xl font-heading text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Your Entire Social Media Team.{" "}
          <span className="gradient-text">{typedText}</span>{" "}
          For $49/Month.
        </motion.h1>

        {/* Subtitle with Parallax */}
        <motion.p
          style={{ y: subY }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl font-body text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          Stop wasting 15 hours a week writing posts, scheduling content, and stressing about what to say. Publioxa generates, schedules, and publishes your entire social media strategy — while you focus on running your business.
        </motion.p>

       {/* Premium CTA */}
<motion.div
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.3 }}
  className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
>
  <motion.div
    className="relative"
    animate={{ scale: [1, 1.03, 1] }}
    transition={{
      duration: 3.2,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  >

    {/* 🔥 Floating Premium Objects */}
    <motion.div
      className="absolute -top-8 left-1/2 h-4 w-4 rounded-full bg-primary/50 blur-md z-30"
      animate={{ y: [0, -18, 0], opacity: [0.3, 0.7, 0.3], rotate: [0, 12, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute top-10 left-[30%] h-3 w-3 rounded-full bg-secondary/50 blur-md z-30"
      animate={{ y: [0, -14, 0], opacity: [0.2, 0.6, 0.2], rotate: [0, -10, 0] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute top-6 right-[25%] h-5 w-5 rounded-full bg-primary/60 blur-lg z-30"
      animate={{ y: [0, -22, 0], opacity: [0.4, 0.9, 0.4], rotate: [0, 15, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* Glow Ring */}
    <div className="absolute inset-0 z-10 rounded-full bg-gradient-to-r from-primary/30 to-primary-foreground/30 blur-xl opacity-60" />

    {/* Premium Gradient Ribbons */}
    <div className="absolute inset-0 -z-20 pointer-events-none">
      <div className="absolute -top-10 left-1/2 h-40 w-[140%] -translate-x-1/2 rotate-[8deg] bg-gradient-to-r from-primary/20 via-pink-400/10 to-primary-foreground/20 blur-3xl opacity-60" />
      <div className="absolute top-10 left-1/2 h-40 w-[140%] -translate-x-1/2 -rotate-[6deg] bg-gradient-to-r from-primary-foreground/20 via-purple-400/10 to-primary/20 blur-3xl opacity-50" />
    </div>

    {/* Button */}
    <motion.div
      whileHover={{ rotate: -1.5, scale: 1.06 }}
      transition={{ type: "spring", stiffness: 200, damping: 12 }}
    >
      <Link
  to="/signup"
  style={{ position: "relative", zIndex: 50 }}
  className="gradient-bg inline-flex items-center gap-2 rounded-pill px-12 py-5 font-heading text-xl font-bold text-primary-foreground shadow-xl shadow-primary/25 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/40"
>
  Start Your Free 14-Day Trial <ArrowRight className="h-5 w-5" />
</Link>
    </motion.div>
  </motion.div>
</motion.div>

        {/* Trust line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-5 font-body text-sm text-muted-foreground"
        >
          No credit card required · Cancel anytime · Setup in 4 minutes
        </motion.p>

        {/* Rating */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-3 flex items-center justify-center gap-1.5"
        >
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
          ))}
          <span className="ml-1 font-body text-sm text-muted-foreground">
            Rated 4.9/5 by 800+ customers
          </span>
        </motion.div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative mx-auto mt-12 max-w-5xl"
        >
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-lg bg-primary/10 blur-[60px]" />
          <div className="animate-float rounded-lg border border-border bg-card p-2 shadow-card-hover sm:rounded-xl sm:p-3">
            <img
              src={dashboardMockup}
              alt="Publioxa AI Social Media Dashboard"
              className="w-full rounded-md sm:rounded-lg"
              loading="eager"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
