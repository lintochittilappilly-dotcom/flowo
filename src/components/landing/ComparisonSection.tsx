import { motion } from "framer-motion";
import { Check, X, AlertTriangle } from "lucide-react";
import SectionBadge from "./SectionBadge";

const Icon = ({ type }: { type: "yes" | "no" | "partial" }) => {
  if (type === "yes") return <Check className="h-5 w-5 text-success" />;
  if (type === "no") return <X className="h-5 w-5 text-destructive" />;
  return <AlertTriangle className="h-5 w-5 text-amber-500" />;
};

type CellType = "yes" | "no" | "partial" | string;

const rows: { feature: string; values: CellType[] }[] = [
  { feature: "AI Content Writing", values: ["yes", "partial", "no", "no", "no"] },
  { feature: "Auto Publishing", values: ["yes", "yes", "yes", "yes", "no"] },
  { feature: "Brand Voice Learning", values: ["yes", "partial", "no", "no", "no"] },
  { feature: "Trend Detection", values: ["yes", "no", "no", "partial", "no"] },
  { feature: "Analytics", values: ["yes", "yes", "partial", "yes", "no"] },
  { feature: "Monthly Cost", values: ["$49–$199", "$3,000+", "$15–$99", "$49–$739", "Free"] },
  { feature: "Time Per Month", values: ["30 min", "2 hrs", "15+ hrs", "15+ hrs", "40+ hrs"] },
];

const headers = ["Flowo", "Hiring Agency", "Buffer", "Hootsuite", "Doing It Yourself"];

const ComparisonSection = () => (
  <section className="bg-background py-20 sm:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <SectionBadge text="Why Flowo" />
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-4 font-heading text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl"
        >
          Why Smart Businesses Choose Flowo Over Every Other Option
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-4 max-w-2xl font-body text-base text-muted-foreground"
        >
          You have choices. Here's an honest comparison so you can decide with full information.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-14 overflow-x-auto rounded-lg bg-card shadow-card"
      >
        <table className="w-full min-w-[700px] text-left">
          <thead>
            <tr>
              <th className="px-5 py-4 font-heading text-sm font-bold text-foreground">Feature</th>
              {headers.map((h, i) => (
                <th
                  key={h}
                  className={`px-5 py-4 text-center font-heading text-sm font-bold ${
                    i === 0 ? "gradient-bg text-primary-foreground rounded-t-md" : "text-foreground"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <motion.tr
                key={row.feature}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: ri * 0.05 }}
                className={ri % 2 === 0 ? "bg-card" : "bg-lavender/50"}
              >
                <td className="px-5 py-3.5 font-body text-sm font-medium text-foreground">{row.feature}</td>
                {row.values.map((v, vi) => (
                  <td key={vi} className={`px-5 py-3.5 text-center ${vi === 0 ? "bg-primary/5" : ""}`}>
                    {v === "yes" || v === "no" || v === "partial" ? (
                      <span className="inline-flex justify-center"><Icon type={v} /></span>
                    ) : (
                      <span className={`font-body text-sm font-medium ${vi === 0 ? "text-primary font-bold" : "text-foreground/70"}`}>{v}</span>
                    )}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-8 rounded-lg border-2 border-primary/30 bg-card p-6 text-center sm:p-8"
      >
        <p className="font-heading text-base font-bold text-foreground sm:text-lg">
          Flowo gives you agency-quality results at a tool price — with zero time investment. It's the only option that wins on every single dimension that matters.
        </p>
      </motion.div>
    </div>
  </section>
);

export default ComparisonSection;
