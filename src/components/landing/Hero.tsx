import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, Star, Sparkles, X } from "lucide-react";
import dashboardMockup from "@/assets/dashboard-mockup.png";

const Hero = () => {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <section className="relative overflow-hidden bg-background pb-20 pt-12 sm:pt-16 lg:pt-20">
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full bg-primary/10 blur-[100px]" />
      <div className="pointer-events-none absolute -right-40 top-60 h-96 w-96 rounded-full bg-secondary/10 blur-[120px]" />
      <div className="pointer-events-none absolute left-1/2 top-40 h-4 w-4 rounded-full bg-primary/30" />
      <div className="pointer-events-none absolute left-[20%] top-60 h-3 w-3 rounded-full bg-secondary/40" />
      <div className="pointer-events-none absolute right-[25%] top-32 h-2 w-2 rounded-full bg-primary/50" />

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

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto max-w-4xl font-heading text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Your Entire Social Media Team.{" "}
          <span className="gradient-text">Powered by AI.</span>{" "}
          For $49/Month.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl font-body text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          Stop wasting 15 hours a week writing posts, scheduling content, and stressing about what to say. Flowo generates, schedules, and publishes your entire social media strategy — while you focus on running your business.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <Link
              to="/signup"
              className="gradient-bg inline-flex items-center gap-2 rounded-pill px-8 py-3.5 font-heading text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
            >
              Start Your Free 14-Day Trial <ArrowRight className="h-5 w-5" />
            </Link>
            <button
              onClick={() => setShowVideo(true)}
              className="inline-flex items-center gap-2 rounded-pill border-2 border-primary bg-transparent px-8 py-3.5 font-heading text-base font-bold text-primary transition-all duration-300 hover:bg-primary/5"
            >
              <Play className="h-4 w-4" /> Watch 2-Minute Demo
            </button>
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
              alt="Flowo AI Social Media Dashboard showing content calendar with posts for Instagram, LinkedIn, Twitter, and Facebook"
              className="w-full rounded-md sm:rounded-lg"
              loading="eager"
            />
          </div>
        </motion.div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideo && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVideo(false)}
              className="fixed inset-0 z-50 bg-foreground/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-foreground p-2"
            >
              <button onClick={() => setShowVideo(false)} className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card text-foreground shadow-lg">
                <X className="h-4 w-4" />
              </button>
              <div className="flex aspect-video items-center justify-center rounded-[16px] bg-midnight">
                <div className="text-center">
                  <Play className="mx-auto h-16 w-16 text-primary-foreground/50" />
                  <p className="mt-4 font-heading text-lg font-bold text-primary-foreground/70">Flowo Demo Video</p>
                  <p className="mt-1 text-sm text-primary-foreground/40">Video placeholder</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Hero;
