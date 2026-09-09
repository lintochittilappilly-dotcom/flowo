import { motion } from "framer-motion";
import { Building, Link, Sparkles, Send } from "lucide-react";
import SectionBadge from "./SectionBadge";

const steps = [
  {
    num: "01",
    icon: <Building className="h-8 w-8" />,
    heading: "Tell Us About Your Business",
    desc: "Answer 4 quick questions about your brand, industry, and tone of voice. Flowo builds a complete brand voice profile that makes every single post sound authentically like you — not a robot.",
    badge: "Takes 90 seconds",
  },
  {
    num: "02",
    icon: <Link className="h-8 w-8" />,
    heading: "Connect Your Social Accounts",
    desc: "Connect Instagram, LinkedIn, Twitter, Facebook, TikTok, and Pinterest in one click each. No technical setup, no developer needed. Just click connect and authorize.",
    badge: "Takes 60 seconds",
  },
  {
    num: "03",
    icon: <Sparkles className="h-8 w-8" />,
    heading: "Watch AI Build Your Content Calendar",
    desc: "Click one button and Flowo generates a full month of platform-specific, on-brand, engagement-optimized posts. Review them, tweak anything, then hit schedule. Done.",
    badge: "Takes 2 minutes",
  },
];

const HowItWorks = () => (
  <section id="how-it-works" className="bg-background py-20 sm:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <SectionBadge text="How It Works" />
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-4 font-heading text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl"
        >
          From Zero to a Month of Content in 4 Minutes Flat
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-4 max-w-2xl font-body text-base text-muted-foreground sm:text-lg"
        >
          Three steps. That's all it takes. No learning curve, no complicated setup, no social media expertise required.
        </motion.p>
      </div>

      <div className="relative mt-16 grid gap-8 lg:grid-cols-3">
        {/* Connecting line (desktop) */}
        <div className="pointer-events-none absolute left-0 right-0 top-24 hidden h-0.5 border-t-2 border-dashed border-primary/30 lg:block" style={{ left: "16.5%", right: "16.5%" }} />

        {steps.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
            className="group relative rounded-lg bg-card p-8 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
          >
            <span className="font-heading text-5xl font-extrabold gradient-text">{s.num}</span>
            <div className="mt-4 text-primary">{s.icon}</div>
            <h3 className="mt-4 font-heading text-xl font-bold text-foreground">{s.heading}</h3>
            <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            <span className="mt-4 inline-block rounded-pill bg-lavender px-3 py-1 text-xs font-semibold text-primary">
              {s.badge}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Result callout */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-14 rounded-lg gradient-bg px-6 py-8 text-center sm:px-12"
      >
        <p className="font-heading text-lg font-bold text-primary-foreground sm:text-xl">
          You just saved 15 hours of work. Your next 30 days of social media are handled. Go run your business. <Send className="ml-1 inline h-5 w-5" />
        </p>
      </motion.div>
    </div>
  </section>
);

export default HowItWorks;
