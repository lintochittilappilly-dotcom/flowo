import { motion } from "framer-motion";
import { X } from "lucide-react";
import SectionBadge from "./SectionBadge";

const painPoints = [
  "You know you need to post consistently — but life gets in the way.",
  "You sit down to write a post and stare at a blank screen for 30 minutes.",
  "You post the same thing on every platform instead of tailoring content.",
  "You miss trending topics because you're too busy running your business.",
  "You hired a social media manager and spent $4,000/month for average results.",
  "You tried other scheduling tools but still had to write all the content yourself.",
];

const ProblemSection = () => (
  <section id="problem" className="bg-muted py-20 sm:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <SectionBadge text="The Problem" />
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-4 font-heading text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl"
        >
          Social Media Is Eating Your Time and Killing Your Growth
        </motion.h2>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Pain points */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-5"
        >
          {painPoints.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-3"
            >
              <X className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <p className="font-body text-base font-medium text-foreground/80">{p}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Consequence callout */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center"
        >
          <div className="rounded-lg border border-primary/20 bg-midnight p-8 shadow-lg shadow-primary/10 sm:p-10">
            <h3 className="font-heading text-xl font-bold text-primary-foreground sm:text-2xl">
              The result?
            </h3>
            <p className="mt-4 font-body text-base leading-relaxed text-primary-foreground/70">
              Inconsistent posting, low engagement, and competitors showing up every single day while you disappear for weeks. Your audience forgets about you, and the algorithm punishes you. The longer you wait, the harder it gets to catch up.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Transition line */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-16 text-center font-heading text-xl font-bold text-primary sm:text-2xl"
      >
        There is a better way. And it takes less than 5 minutes to set up.
      </motion.p>
    </div>
  </section>
);

export default ProblemSection;
