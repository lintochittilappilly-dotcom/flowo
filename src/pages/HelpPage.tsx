import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle, MessageSquare, Book, Video, Mail, ChevronDown,
  ExternalLink, Search, Sparkles, Zap, Shield, Users, X,
} from "lucide-react";
import { useLoadingSkeleton } from "@/hooks/useLoadingSkeleton";
import { SkeletonList } from "@/components/ui/loading-skeletons";
import { toast } from "sonner";

const faqs = [
  { q: "How do I connect my social media accounts?", a: "Go to Settings → Connected Platforms and click 'Connect' next to the platform you want to link. Follow the authorization steps to grant Flowo access." },
  { q: "How does AI content generation work?", a: "Our AI analyzes your brand voice, industry trends, and target audience to generate tailored content. Visit the Trends page and click 'Generate Post' on any trending topic, or use Create Post for custom content." },
  { q: "Can I schedule posts across multiple platforms?", a: "Yes! Use the Content Calendar to schedule posts across all your connected platforms. You can set different times for each platform or publish simultaneously." },
  { q: "How do I manage multiple brands?", a: "Navigate to the Brands page to add and manage multiple brand profiles. Each brand can have its own voice, industry, and connected platforms." },
  { q: "What analytics are available?", a: "The Analytics page shows engagement rates, reach, follower growth, best posting times, and content performance across all connected platforms." },
  { q: "How do I change my subscription plan?", a: "Go to Settings → Billing to view available plans and upgrade or downgrade your subscription at any time." },
  { q: "Is my data secure?", a: "Absolutely. We use enterprise-grade encryption, never store your social media passwords, and comply with GDPR and SOC 2 standards." },
  { q: "How do I cancel my account?", a: "You can cancel anytime from Settings → Account → Cancel Subscription. Your data will be retained for 30 days in case you change your mind." },
];

interface Guide {
  title: string;
  desc: string;
  icon: React.ElementType;
  tag: string;
  fullContent: string;
}

const guides: Guide[] = [
  {
    title: "Getting Started with Flowo",
    desc: "Learn the basics of setting up your account and creating your first post.",
    icon: Zap,
    tag: "Beginner",
    fullContent: "Welcome to Flowo! Getting started is easy. First, head to the Brands page and create your first brand profile — enter your brand name, industry, and describe your brand's personality. Next, go to Settings and connect your social media accounts (Instagram, LinkedIn, Twitter, etc.) by following the OAuth authorization flow. Once connected, navigate to Create Post, enter a topic or idea, select your target platforms, and click Generate. Flowo's AI will craft platform-optimized content using your brand voice. Review the generated posts, make any edits, and publish instantly or schedule for later using the Content Calendar. Start with one post to get comfortable, then explore Campaign Generator on the Trends page to create a full week of content at once.",
  },
  {
    title: "Mastering AI Content Generation",
    desc: "Deep dive into using AI to create engaging, on-brand content at scale.",
    icon: Sparkles,
    tag: "Intermediate",
    fullContent: "Flowo's AI content generation is powered by your Brand Voice Profile — a custom AI model trained on your brand's tone, style, and messaging. To get the best results, visit your Brand settings and provide 2-3 sample posts that represent your ideal voice. The AI analyzes these samples to understand your writing patterns, vocabulary preferences, and emotional tone. When generating content, choose the right Content Type (Educational, Promotional, Engagement, etc.) to guide the AI's approach. Use 'Brand Default' tone to let your trained voice shine, or override with specific tones like 'Witty' or 'Bold' for variety. Pro tip: the more specific your topic prompt, the better the output. Instead of 'skincare tips,' try 'morning skincare routine for sensitive skin in winter.' You can regenerate individual posts, add AI-generated hashtags, and edit inline before publishing.",
  },
  {
    title: "Analytics & Performance Tracking",
    desc: "Understand your metrics and optimize your content strategy.",
    icon: Users,
    tag: "Intermediate",
    fullContent: "Flowo's Analytics dashboard gives you a clear picture of your content performance across all connected platforms. Key metrics include: Reach (how many unique users saw your content), Engagements (total likes, comments, and shares), and Engagement Rate (the percentage of people who interacted with your post relative to reach). Use the time range selector to view data for the last 7, 30, or 90 days. The Platform Breakdown table shows which platforms perform best for your brand. Check the Top Performing Posts section to identify content patterns that resonate with your audience. Every week, Flowo's AI analyzes your data and surfaces personalized insights in the AI Analytics Insight card — actionable recommendations like optimal posting times, content types that drive the most engagement, and platform-specific strategies. Use the Compare Brands toggle to see all your brands side by side and identify which ones need more attention.",
  },
  {
    title: "Brand Voice & Tone Configuration",
    desc: "Set up consistent brand voices across all your content.",
    icon: Shield,
    tag: "Advanced",
    fullContent: "Managing multiple brands in Flowo means each brand gets its own AI voice profile, connected platforms, and content library. To set up a new brand, go to Brands → Add New Brand and complete the 3-step wizard: define your brand identity (name, industry, color), configure your tone preferences (Professional, Casual, Witty, etc.), and optionally paste sample posts to train the AI voice. Each brand's voice profile is independently trained, so content generated for Brand A will never sound like Brand B. You can switch between brands instantly using the Brand Switcher in the sidebar — all pages automatically filter to show only that brand's data. For agencies managing client brands, upgrade to the Agency plan for unlimited brand slots. Use the Brand Comparison view in Analytics to benchmark performance across all your brands and allocate resources to underperforming ones.",
  },
];

const HelpPage = () => {
  const isLoading = useLoadingSkeleton(600);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [activeGuide, setActiveGuide] = useState<Guide | null>(null);

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmitContact = () => {
    if (!contactMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }
    toast.success("Message sent! We'll get back to you within 24 hours.");
    setContactMessage("");
  };

  const closeGuideModal = useCallback(() => setActiveGuide(null), []);

  // Close on Escape key
  useEffect(() => {
    if (!activeGuide) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeGuideModal();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeGuide, closeGuideModal]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="h-6 w-32 rounded bg-muted animate-pulse" />
        <SkeletonList count={4} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="text-center">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="font-heading text-2xl font-bold text-foreground">Help & Support</h2>
          <p className="mt-1 text-sm text-muted-foreground">Find answers, guides, and get in touch with our team</p>
        </motion.div>
      </div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="relative mx-auto max-w-xl">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs and guides..."
            className="w-full rounded-xl border border-border bg-card py-3 pl-11 pr-4 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </motion.div>

      {/* Quick Links */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Book, label: "Documentation", desc: "Browse full docs", color: "text-primary" },
          { icon: Video, label: "Video Tutorials", desc: "Watch & learn", color: "text-secondary" },
          { icon: MessageSquare, label: "Live Chat", desc: "Chat with us", color: "text-success" },
        ].map((item, i) => (
          <button
            key={i}
            onClick={() => toast.info(`${item.label} coming soon!`)}
            className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="font-heading text-sm font-bold text-foreground">{item.label}</p>
              <p className="text-[11px] text-muted-foreground">{item.desc}</p>
            </div>
            <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* FAQs */}
        <div className="lg:col-span-3 space-y-3">
          <h3 className="flex items-center gap-2 font-heading text-base font-bold text-foreground">
            <HelpCircle className="h-4 w-4 text-primary" /> Frequently Asked Questions
          </h3>
          <div className="space-y-2">
            {filteredFaqs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">No results found for "{searchQuery}"</p>
              </div>
            ) : (
              filteredFaqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between gap-3 p-4 text-left"
                  >
                    <span className="font-heading text-sm font-semibold text-foreground">{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border bg-muted/30 px-4 py-3"
                    >
                      <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                    </motion.div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Guides */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 font-heading text-base font-bold text-foreground">
              <Book className="h-4 w-4 text-primary" /> Guides
            </h3>
            <div className="space-y-2">
              {guides.map((guide, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 + 0.15 }}
                  onClick={() => setActiveGuide(guide)}
                  className="group flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm text-left cursor-pointer transition-all duration-150 hover:bg-lavender hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <guide.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-xs font-bold text-foreground">{guide.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{guide.desc}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
                    {guide.tag}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div id="contact-support" className="space-y-3">
            <h3 className="flex items-center gap-2 font-heading text-base font-bold text-foreground">
              <Mail className="h-4 w-4 text-primary" /> Contact Support
            </h3>
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Describe your issue or question..."
                rows={4}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
              <button
                onClick={handleSubmitContact}
                className="w-full rounded-lg gradient-bg py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.01]"
              >
                Send Message
              </button>
              <p className="text-center text-[10px] text-muted-foreground">
                We typically respond within 24 hours
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Modal */}
      <AnimatePresence>
        {activeGuide && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeGuideModal}
              className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 m-auto h-fit w-full max-w-[560px] rounded-[20px] border border-border bg-card p-6 shadow-2xl mx-4 sm:mx-auto overflow-y-auto"
              style={{ maxHeight: "85vh" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <activeGuide.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold text-muted-foreground mb-1">
                      {activeGuide.tag}
                    </span>
                    <h3 className="font-heading text-lg font-bold text-foreground leading-tight">
                      {activeGuide.title}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={closeGuideModal}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {activeGuide.fullContent}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={closeGuideModal}
                  className="flex-1 rounded-lg gradient-bg py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.01]"
                >
                  Got it
                </button>
                <button
                  onClick={() => {
                    closeGuideModal();
                    setTimeout(() => {
                      document.getElementById("contact-support")?.scrollIntoView({ behavior: "smooth" });
                    }, 200);
                  }}
                  className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact Support
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HelpPage;
