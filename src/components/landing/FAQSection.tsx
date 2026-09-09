import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import SectionBadge from "./SectionBadge";

const faqs = [
  { q: "Do I need any social media or marketing experience to use Flowo?", a: "Absolutely not. Flowo was built specifically for busy business owners who aren't marketers. If you can answer 4 simple questions about your business and click a button, you can use Flowo. Most customers generate their first full month of content within 8 minutes of signing up." },
  { q: "Will the AI posts actually sound like me or will they sound robotic?", a: "This is the question we hear most — and the answer surprises people. Flowo builds a brand voice profile from your input and learns your tone, style, and vocabulary. The more you use it, the better it gets. Over 90% of customers say they can't tell the difference between AI-written posts and their own writing after the first week." },
  { q: "Which social media platforms does Flowo support?", a: "Flowo currently supports Instagram, Facebook, LinkedIn, Twitter/X, TikTok, and Pinterest. You can connect as many accounts as your plan allows and manage all of them from one single dashboard." },
  { q: "Can I review posts before they go live?", a: "Yes, always. Auto-publish is completely optional. You can review and approve every single post before it goes live, or you can turn on full auto-publish and let Flowo handle everything. You're always in control." },
  { q: "What happens to my content if I cancel?", a: "You keep everything. All your generated content, your brand voice profile, your analytics history, and your scheduled posts are yours. You can export everything as a CSV or PDF before you leave. We'll never hold your data hostage." },
  { q: "How is Flowo different from Buffer or Hootsuite?", a: "Buffer and Hootsuite are scheduling tools. They help you post content that you write yourself. Flowo writes the content for you, then schedules it, then analyzes it, then tells you how to improve. It replaces your entire social media workflow — not just one step of it." },
  { q: "Can I use Flowo for multiple businesses or clients?", a: "Yes. The Pro plan supports 3 brand profiles and the Agency plan supports unlimited profiles. Agency users typically manage all their clients from one dashboard, and many resell Flowo as their own social media management service." },
  { q: "Is my data and social media account information secure?", a: "Yes. Flowo uses 256-bit SSL encryption on all data, never stores your social media passwords, uses official OAuth connections for all platforms, and never shares or sells your data to third parties. Your account security is our highest priority." },
];

const FAQSection = () => {
  const [open, setOpen] = useState(0);

  return (
    <section className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <SectionBadge text="Common Questions" />
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-4 font-heading text-3xl font-bold text-foreground sm:text-4xl"
          >
            Everything You Want to Know Before You Start
          </motion.h2>
        </div>

        <div className="mt-12 space-y-4">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className={`rounded-md border bg-card shadow-sm transition-all duration-300 ${isOpen ? "border-l-4 border-l-primary border-t-border border-r-border border-b-border" : "border-border"}`}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-heading text-sm font-bold text-foreground sm:text-base">{faq.q}</span>
                  <Plus className={`h-5 w-5 shrink-0 text-primary transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 font-body text-sm leading-relaxed text-muted-foreground">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
