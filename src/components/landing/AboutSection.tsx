import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Sprout, Search } from "lucide-react";
import { Instagram, Linkedin, Twitter } from "lucide-react";
import SectionBadge from "./SectionBadge";

const values = [
  { icon: Sparkles, heading: "Simplicity over complexity", desc: "Every feature is designed to save you time, not create more work." },
  { icon: TrendingUp, heading: "Results over vanity metrics", desc: "We optimize for engagement and revenue, not just follower counts." },
  { icon: Sprout, heading: "Your growth over our revenue", desc: "We'd rather you succeed on a lower plan than overpay on a higher one." },
  { icon: Search, heading: "Transparency over fine print", desc: "No hidden fees, no long contracts, no surprises. Ever." },
];

const AboutSection = () => (
  <section className="bg-background py-20 sm:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <SectionBadge text="Our Mission" />
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-4 font-heading text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl"
        >
          We Built Flowo Because Small Businesses Deserve a Fair Fight
        </motion.h2>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-center rounded-lg bg-midnight p-12"
        >
          <div className="flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/20">
              <Instagram className="h-8 w-8 text-secondary" />
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/20">
              <Linkedin className="h-8 w-8 text-primary" />
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/20">
              <Twitter className="h-8 w-8 text-accent-foreground" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex flex-col justify-center"
        >
          <p className="font-body text-base leading-relaxed text-muted-foreground">
            Most social media tools were built for enterprise companies with dedicated marketing teams. Small business owners were left behind — forced to choose between spending thousands on agencies or wasting hours doing it themselves.
          </p>
          <p className="mt-4 font-body text-base leading-relaxed text-muted-foreground">
            Flowo was built to change that. We believe every business owner deserves world-class social media presence — without world-class prices.
          </p>
        </motion.div>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((v, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="rounded-md bg-card p-5 shadow-card"
          >
            <v.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-2 font-heading text-sm font-bold text-foreground">{v.heading}</h3>
            <p className="mt-1 font-body text-xs text-muted-foreground">{v.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default AboutSection;
