import { Map, CheckCircle2, Clock, Lightbulb, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import InfoPageLayout from "@/components/info/InfoPageLayout";

const quarters = [
  {
    label: "Q1 2026 — Completed",
    status: "done",
    items: [
      { title: "TikTok Auto-Publishing", desc: "Publish directly to TikTok from Flowo", done: true },
      { title: "AI Brand Voice 2.0", desc: "Improved brand tone matching with few-shot learning", done: true },
      { title: "Bulk Content Import", desc: "Import content libraries from CSV and other tools", done: true },
      { title: "Advanced Hashtag Analytics", desc: "Track hashtag performance and discover trending tags", done: true },
    ],
  },
  {
    label: "Q2 2026 — In Progress",
    status: "current",
    items: [
      { title: "Multi-Language Content Generation", desc: "AI content in 20+ languages with native-quality output", done: false },
      { title: "Team Collaboration & Approvals", desc: "Invite team members, assign roles, and set up approval workflows", done: false },
      { title: "Instagram Reels Scheduling", desc: "Schedule and auto-publish Instagram Reels", done: false },
      { title: "Content Performance Predictions", desc: "AI-powered predictions for post engagement before publishing", done: false },
    ],
  },
  {
    label: "Q3 2026 — Planned",
    status: "planned",
    items: [
      { title: "White-Label Agency Dashboard", desc: "Fully branded client dashboards for agencies", done: false },
      { title: "AI Image Generation", desc: "Generate on-brand social media visuals with AI", done: false },
      { title: "Pinterest Integration", desc: "Full Pinterest scheduling and analytics support", done: false },
      { title: "Custom Reporting Builder", desc: "Build and export custom analytics reports", done: false },
    ],
  },
  {
    label: "Q4 2026 — Exploring",
    status: "exploring",
    items: [
      { title: "Mobile App (iOS & Android)", desc: "Full-featured mobile app for on-the-go management", done: false },
      { title: "AI Video Captioning", desc: "Automatic captions and subtitles for video content", done: false },
      { title: "Competitor Analysis", desc: "Track and benchmark against competitor social accounts", done: false },
    ],
  },
];

const statusColors: Record<string, string> = {
  done: "bg-success/10 text-success",
  current: "bg-primary/10 text-primary",
  planned: "bg-secondary/10 text-secondary",
  exploring: "bg-muted text-muted-foreground",
};

const statusIcons: Record<string, React.ReactNode> = {
  done: <CheckCircle2 className="h-5 w-5 text-success" />,
  current: <Rocket className="h-5 w-5 text-primary" />,
  planned: <Clock className="h-5 w-5 text-secondary" />,
  exploring: <Lightbulb className="h-5 w-5 text-muted-foreground" />,
};

const RoadmapPage = () => (
  <InfoPageLayout badge="Product" badgeIcon={<Map className="h-4 w-4" />} title="Product Roadmap" description="See what we're building, what's next, and what we're exploring for Flowo's future.">
    <div className="space-y-10">
      {quarters.map((q, qi) => (
        <motion.section key={q.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: qi * 0.05 }}>
          <div className="mb-4 flex items-center gap-3">
            {statusIcons[q.status]}
            <h2 className="font-heading text-xl font-bold text-foreground">{q.label}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {q.items.map((item) => (
              <div key={item.title} className={`rounded-xl border bg-card p-5 shadow-sm ${q.status === "current" ? "border-primary/20" : ""}`}>
                <div className="flex items-start gap-3">
                  {item.done ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" /> : <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-muted-foreground/30" />}
                  <div>
                    <h3 className="font-heading text-sm font-bold text-foreground">{item.title}</h3>
                    <p className="mt-0.5 font-body text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      ))}
    </div>

    <div className="mt-12 rounded-2xl border bg-lavender/50 p-8 text-center">
      <Lightbulb className="mx-auto mb-3 h-8 w-8 text-primary" />
      <h3 className="font-heading text-xl font-bold text-foreground">Have a Feature Idea?</h3>
      <p className="mx-auto mt-2 max-w-md font-body text-sm text-muted-foreground">We build Flowo based on user feedback. Share your ideas in our Community Forum and vote on features that matter to you.</p>
    </div>
  </InfoPageLayout>
);

export default RoadmapPage;
