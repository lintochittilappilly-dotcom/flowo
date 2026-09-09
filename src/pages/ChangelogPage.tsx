import { FileText, Sparkles, Bug, Zap, ArrowUp } from "lucide-react";
import { motion } from "framer-motion";
import InfoPageLayout from "@/components/info/InfoPageLayout";

const releases = [
  {
    version: "3.4.0",
    date: "March 5, 2026",
    tag: "Latest",
    changes: [
      { type: "feature", text: "TikTok auto-publishing is now live for all Pro and Business users" },
      { type: "feature", text: "New AI brand voice tuning — upload sample posts for better tone matching" },
      { type: "improvement", text: "Content calendar now supports drag-and-drop rescheduling" },
      { type: "improvement", text: "Analytics dashboard loads 40% faster with optimized data fetching" },
      { type: "fix", text: "Fixed issue where Instagram carousel posts occasionally failed to publish" },
      { type: "fix", text: "Resolved timezone offset in scheduled post display" },
    ],
  },
  {
    version: "3.3.0",
    date: "February 18, 2026",
    changes: [
      { type: "feature", text: "Bulk content generation — create up to 30 posts from a single prompt" },
      { type: "feature", text: "Advanced hashtag analytics with trend tracking" },
      { type: "improvement", text: "Improved AI content quality for LinkedIn professional posts" },
      { type: "improvement", text: "Redesigned settings page with cleaner navigation" },
      { type: "fix", text: "Fixed password reset email delivery delays" },
    ],
  },
  {
    version: "3.2.0",
    date: "January 28, 2026",
    changes: [
      { type: "feature", text: "Content performance predictions — AI estimates engagement before publishing" },
      { type: "feature", text: "CSV export for all analytics reports" },
      { type: "improvement", text: "Onboarding flow redesigned for faster setup" },
      { type: "fix", text: "Fixed intermittent logout issues on Safari" },
      { type: "fix", text: "Corrected follower count sync delay for Twitter/X" },
    ],
  },
  {
    version: "3.1.0",
    date: "January 8, 2026",
    changes: [
      { type: "feature", text: "Multi-image carousel support for Instagram and LinkedIn" },
      { type: "improvement", text: "Dark mode refinements across the dashboard" },
      { type: "improvement", text: "Reduced AI generation latency by 35%" },
      { type: "fix", text: "Fixed duplicate notification emails for scheduled posts" },
    ],
  },
  {
    version: "3.0.0",
    date: "December 12, 2025",
    tag: "Major Release",
    changes: [
      { type: "feature", text: "Complete UI redesign with new dashboard layout" },
      { type: "feature", text: "AI Content Engine 2.0 — powered by GPT-4 with brand context" },
      { type: "feature", text: "Real-time collaboration (beta) — invite team members" },
      { type: "feature", text: "Unified inbox for comments and messages" },
      { type: "improvement", text: "New pricing plans with more value at every tier" },
    ],
  },
];

const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  feature: { icon: <Sparkles className="h-3.5 w-3.5" />, label: "New", color: "bg-primary/10 text-primary" },
  improvement: { icon: <ArrowUp className="h-3.5 w-3.5" />, label: "Improved", color: "bg-success/10 text-success" },
  fix: { icon: <Bug className="h-3.5 w-3.5" />, label: "Fixed", color: "bg-secondary/10 text-secondary" },
};

const ChangelogPage = () => (
  <InfoPageLayout badge="Product" badgeIcon={<FileText className="h-4 w-4" />} title="Changelog" description="Everything new, improved, and fixed in Flowo — updated with every release.">
    <div className="relative space-y-10 pl-8 before:absolute before:left-3 before:top-4 before:h-[calc(100%-32px)] before:w-0.5 before:bg-primary/15">
      {releases.map((r, ri) => (
        <motion.div key={r.version} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: ri * 0.05 }} className="relative">
          <div className="absolute -left-[22px] top-2 h-3 w-3 rounded-full border-2 border-primary bg-background" />
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className="font-heading text-xl font-bold text-foreground">v{r.version}</h2>
              {r.tag && <span className="rounded-pill bg-primary/10 px-3 py-0.5 font-heading text-xs font-semibold text-primary">{r.tag}</span>}
              <span className="font-body text-sm text-muted-foreground">{r.date}</span>
            </div>
            <ul className="space-y-2.5">
              {r.changes.map((c, i) => {
                const cfg = typeConfig[c.type];
                return (
                  <li key={i} className="flex items-start gap-3">
                    <span className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 font-body text-xs font-medium ${cfg.color}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                    <span className="font-body text-sm text-foreground/80">{c.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </motion.div>
      ))}
    </div>
  </InfoPageLayout>
);

export default ChangelogPage;
