import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Lock, Star, CreditCard, RefreshCw, DollarSign } from "lucide-react";

const items = [
  "Full access to all Pro features for 14 days",
  "AI generates your first month of content in minutes",
  "Connect all your platforms in under 5 minutes",
  "No credit card required to start",
  "Cancel with one click if it's not right for you",
];

const trustBadges = [
  { icon: Lock, label: "SSL Secure" },
  { icon: Star, label: "4.9/5 Rating" },
  { icon: CreditCard, label: "No Credit Card Needed" },
  { icon: RefreshCw, label: "Cancel Anytime" },
  { icon: DollarSign, label: "30-Day Money Back Guarantee" },
];

const FinalCTA = () => (
  <section className="relative overflow-hidden gradient-bg py-20 sm:py-28">
    {/* Decorative elements */}
    <div className="pointer-events-none absolute left-10 top-10 h-40 w-40 rounded-full bg-primary-foreground/5 blur-[60px]" />
    <div className="pointer-events-none absolute bottom-10 right-20 h-60 w-60 rounded-full bg-primary-foreground/5 blur-[80px]" />
    <div className="pointer-events-none absolute left-1/3 top-1/4 h-2 w-2 rounded-full bg-primary-foreground/20" />
    <div className="pointer-events-none absolute right-1/4 bottom-1/3 h-3 w-3 rounded-full bg-primary-foreground/15" />

    <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-heading text-3xl font-extrabold text-primary-foreground sm:text-4xl lg:text-5xl"
      >
        Your Competitors Are Posting Right Now. Are You?
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="mx-auto mt-4 max-w-2xl font-body text-base text-primary-foreground/80 sm:text-lg"
      >
        Every day you're not consistently showing up on social media is a day your competitors are stealing your potential customers. Publioxa gets you posting today — not next week when you finally find time to write content.
      </motion.p>

      {/* Feature list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="mx-auto mt-8 flex max-w-md flex-col gap-3 text-left"
      >
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 text-primary-foreground">
            <Check className="h-5 w-5 shrink-0 text-success" />
            <span className="font-body text-sm">{item}</span>
          </div>
        ))}
      </motion.div>

      {/* CTA Section — Mobile Optimized + Glow Ring + Micro Tilt + Pulse */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="mt-10 flex flex-col items-center sm:justify-center"
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
          {/* Glowing gradient ring */}
          <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-primary/30 to-primary-foreground/30 blur-xl opacity-60" />

          {/* CTA Button */}
          <motion.div
            whileHover={{ rotate: -1.5, scale: 1.06 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
          >
            <Link
              to="/signup"
              className="rounded-pill bg-card px-12 py-5 font-heading text-xl font-bold text-primary shadow-xl transition-all duration-300 hover:shadow-2xl sm:px-14 sm:py-5"
            >
              Start My Free 14-Day Trial Now
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Trust Badges — Staggered Animation */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.12 },
          },
        }}
        className="mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        {trustBadges.map((b) => (
          <motion.div
            key={b.label}
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex items-center gap-1 text-primary-foreground/70"
          >
            <b.icon className="h-4 w-4" />
            <span className="font-body text-xs">{b.label}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default FinalCTA;
