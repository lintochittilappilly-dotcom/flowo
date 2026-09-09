import { motion } from "framer-motion";

interface SectionBadgeProps {
  text: string;
  emoji?: string;
}

const SectionBadge = ({ text, emoji }: SectionBadgeProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="inline-flex items-center gap-1.5 rounded-pill bg-lavender px-4 py-1.5 font-heading text-sm font-semibold text-primary"
  >
    {emoji && <span>{emoji}</span>}
    {text}
  </motion.div>
);

export default SectionBadge;
