import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
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

      {/* Floating Premium Particles */}
      <motion.div
        style={{ y: particlesY }}
        className="absolute left-1/2 top-40 -z-10 h-8 w-8 rounded-full bg-primary/40 blur-md"
        animate={{ y: [0, -30, 0], rotate: [0, 8, 0], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        style={{ y: particlesY }}
        className="absolute left-[30%] top-56 -z-10 h-5 w-5 rounded-full bg-secondary/40 blur-sm"
        animate={{ y: [0, -20, 0], rotate: [0, -6, 0], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        style={{ y: particlesY }}
        className="absolute right-[35%] top-48 -z-10 h-6 w-6 rounded-full bg-primary/50 blur-md"
        animate={{ y: [0, -35, 0], rotate: [0, 10, 0], opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
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

        {/* Ambient Spotlight Sweep */}
        <motion.div
          className="absolute left-0 top-0 h-full w-full pointer-events-none -z-10"
          animate={{ x: ["-40%", "140%"] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-2xl" />
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

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <motion.div className="relative">

            {/* Premium Gradient Ribbons */}
            <div className="absolute inset-0 -z-20 pointer-events-none">
              <div className="absolute -top-10 left-1/2 h-40 w-[140%] -translate-x-1/2 rotate-[8deg] bg-gradient-to-r from-primary/20 via-pink-400/10 to-primary-foreground/20 blur-3xl opacity-60" />
              <div className="absolute top-10 left-1/2 h-40 w-[140%] -translate-x-1/2 -rotate-[6deg] bg-gradient-to-r from-primary-foreground/20 via-purple-400/10 to-primary/20 blur-3xl opacity-50" />
            </div>

            {/* Glow Ring */}
            <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-primary/30 to-primary-foreground/30 blur-xl opacity-60" />

            {/* Glass Morphism CTA */}
            <motion.div
              whileHover={{ rotate: -1.5, scale: 1
