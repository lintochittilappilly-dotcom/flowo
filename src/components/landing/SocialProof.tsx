import { motion } from "framer-motion";
import SectionBadge from "./SectionBadge";
import { useCountUp } from "@/hooks/useCountUp";

const stats = [
  { end: 2847, label: "Businesses using Flowo daily", sub: "From solo coaches to 50-person agencies", suffix: "", decimals: 0, format: true },
  { end: 94, label: "Report saving 10+ hours/week", sub: "Verified from post-signup survey", suffix: "%", decimals: 0, format: false },
  { end: 4.9, label: "Average customer rating", sub: "Based on 800+ verified reviews", suffix: "/5", decimals: 1, format: false },
  { end: 12, label: "Posts published through Flowo", sub: "Across all platforms combined", suffix: "M+", decimals: 0, format: false },
  { end: 3.2, label: "Average engagement increase", sub: "Compared to before using Flowo", suffix: "x", decimals: 1, format: false },
  { end: 14, label: "Average time to see results", sub: "Most users see growth in the first two weeks", suffix: " days", decimals: 0, format: false },
];

const StatCard = ({ stat }: { stat: typeof stats[0] }) => {
  const { count, ref } = useCountUp(stat.end, 2000, stat.decimals);
  const display = stat.format ? count.toLocaleString() : count;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-md bg-card p-6 shadow-card"
    >
      <div className="h-1 w-full rounded-t-md gradient-bg -mt-6 -mx-6 mb-5" style={{ width: "calc(100% + 3rem)" }} />
      <p className="font-heading text-3xl font-extrabold gradient-text sm:text-4xl">
        {display}{stat.suffix}
      </p>
      <p className="mt-2 font-heading text-sm font-bold text-foreground">{stat.label}</p>
      <p className="mt-1 font-body text-xs text-muted-foreground">{stat.sub}</p>
    </motion.div>
  );
};

const SocialProof = () => (
  <section className="bg-background py-20 sm:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <SectionBadge text="By The Numbers" />
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-4 font-heading text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl"
        >
          The Results Speak for Themselves
        </motion.h2>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s, i) => (
          <StatCard key={i} stat={s} />
        ))}
      </div>
    </div>
  </section>
);

export default SocialProof;
