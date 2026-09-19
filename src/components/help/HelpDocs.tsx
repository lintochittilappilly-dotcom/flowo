import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Rocket, Building2, Plug, PenSquare, Calendar, Flame, ImageIcon,
  BarChart3, MessageSquare, Users, CreditCard, Code2, Search,
  ChevronDown, ArrowRight, HelpCircle,
} from "lucide-react";

interface DocAction {
  label: string;
  to: string;
}
interface DocSection {
  id: string;
  icon: React.ElementType;
  tag: string;
  title: string;
  desc: string;
  steps: string[];
  actions: DocAction[];
}

const DOCS: DocSection[] = [
  {
    id: "getting-started",
    icon: Rocket,
    tag: "Beginner",
    title: "Getting Started",
    desc: "Set up your account and publish your first AI-generated post in minutes.",
    steps: [
      "Complete onboarding: enter your business name, role, industry and size.",
      "Pick your brand tone (Professional, Casual, Witty, Bold, etc.).",
      "Connect your first social account so Publioxa can publish for you.",
      "Open Create Post, type a topic, generate content, and publish or schedule it.",
    ],
    actions: [
      { label: "Start onboarding", to: "/onboarding" },
      { label: "Create your brand", to: "/brands" },
    ],
  },
  {
    id: "brands",
    icon: Building2,
    tag: "Core",
    title: "Brands & Brand Voice",
    desc: "Manage one or many brands, each with its own AI voice and connected platforms.",
    steps: [
      "Go to Brands and click Add New Brand.",
      "Enter the brand name, industry and a short description of its personality.",
      "Tune the voice sliders and optionally paste 2–3 sample posts to train the AI.",
      "Switch the active brand any time using the Brand Switcher in the sidebar.",
    ],
    actions: [
      { label: "Manage brands", to: "/brands" },
      { label: "Brand voice settings", to: "/settings" },
    ],
  },
  {
    id: "connect-accounts",
    icon: Plug,
    tag: "Setup",
    title: "Connect Social Accounts",
    desc: "Link Instagram, LinkedIn, X, Facebook, TikTok and more via secure OAuth.",
    steps: [
      "Open Settings → Connected Accounts.",
      "Click Connect next to the platform you want to link.",
      "Authorize Publioxa in the platform's pop-up (we never store your password).",
      "Confirm the account now shows a green Connected status.",
    ],
    actions: [
      { label: "Connect accounts", to: "/settings?tab=connected-accounts" },
    ],
  },
  {
    id: "create-post",
    icon: PenSquare,
    tag: "Core",
    title: "Create a Post",
    desc: "Generate platform-optimized content with your brand voice, then publish or schedule.",
    steps: [
      "Open Create Post and enter a specific topic or idea.",
      "Choose the target platforms and a content type/tone.",
      "Click Generate — review the AI drafts and edit inline as needed.",
      "Add AI hashtags/images, then Publish now or Schedule for later.",
    ],
    actions: [
      { label: "Create post", to: "/create" },
      { label: "Generate an image", to: "/image-gen" },
    ],
  },
  {
    id: "calendar",
    icon: Calendar,
    tag: "Core",
    title: "Content Calendar & Scheduling",
    desc: "Plan and queue posts across every platform from one calendar.",
    steps: [
      "Open the Content Calendar to see everything scheduled.",
      "Pick a date and time slot, or send a draft here from Create Post.",
      "Review queued posts per platform; reschedule by editing the time.",
      "Confirm — Publioxa auto-publishes at the scheduled time.",
    ],
    actions: [
      { label: "Open calendar", to: "/calendar" },
    ],
  },
  {
    id: "trends",
    icon: Flame,
    tag: "Intermediate",
    title: "Trends & Campaigns",
    desc: "Discover trending topics and spin up a whole week of content at once.",
    steps: [
      "Open Trends to browse trending topics for your industry.",
      "Click Generate Post on any trend to draft on-brand content instantly.",
      "Use the campaign generator to create a multi-day content plan.",
      "Send the generated posts straight to your Content Calendar.",
    ],
    actions: [
      { label: "Explore trends", to: "/trends" },
    ],
  },
  {
    id: "image-gen",
    icon: ImageIcon,
    tag: "AI",
    title: "AI Image Generation",
    desc: "Create on-brand visuals from a text prompt and attach them to posts.",
    steps: [
      "Open Image Gen and describe the image you want.",
      "Click Generate and wait for the AI to render it.",
      "Regenerate or refine the prompt until you're happy.",
      "Attach the image to a post in Create Post.",
    ],
    actions: [
      { label: "Generate images", to: "/image-gen" },
    ],
  },
  {
    id: "analytics",
    icon: BarChart3,
    tag: "Intermediate",
    title: "Analytics & Insights",
    desc: "Track reach, engagement and growth, plus weekly AI recommendations.",
    steps: [
      "Open Analytics and choose a time range (7, 30 or 90 days).",
      "Review Reach, Engagements and Engagement Rate across platforms.",
      "Check Top Performing Posts to spot what resonates.",
      "Read the weekly AI Insight and compare brands side by side.",
    ],
    actions: [
      { label: "View analytics", to: "/analytics" },
    ],
  },
  {
    id: "comments",
    icon: MessageSquare,
    tag: "Core",
    title: "Comments & Engagement",
    desc: "Reply to comments from all platforms in one unified inbox.",
    steps: [
      "Open Comments to see your unified engagement inbox.",
      "Filter by unread to focus on what needs a reply.",
      "Reply directly, or use an AI-assisted response.",
      "Mark items done to keep your inbox at zero.",
    ],
    actions: [
      { label: "Manage comments", to: "/comments" },
    ],
  },
  {
    id: "team",
    icon: Users,
    tag: "Collaboration",
    title: "Team Members",
    desc: "Invite teammates and control what each person can access.",
    steps: [
      "Open Settings → Team Members.",
      "Invite a teammate by email and assign a role.",
      "They accept the invite from the email link.",
      "Adjust or revoke permissions any time.",
    ],
    actions: [
      { label: "Invite team", to: "/settings?tab=team" },
    ],
  },
  {
    id: "billing",
    icon: CreditCard,
    tag: "Account",
    title: "Billing & Plans",
    desc: "View your plan and usage, upgrade or downgrade, and get invoices.",
    steps: [
      "Open Settings → Billing.",
      "Review your current plan and usage this month.",
      "Upgrade or downgrade — changes apply immediately.",
      "Download invoices for your records.",
    ],
    actions: [
      { label: "Billing & plans", to: "/settings?tab=billing" },
    ],
  },
  {
    id: "api",
    icon: Code2,
    tag: "Developers",
    title: "API Access",
    desc: "Generate API keys and call Publioxa programmatically.",
    steps: [
      "Open Settings → API Access.",
      "Generate a new API key and copy it (store it securely).",
      "Copy your API base URL.",
      "Read the API reference and start making requests.",
    ],
    actions: [
      { label: "API keys", to: "/settings?tab=api-access" },
      { label: "API reference", to: "/api-docs" },
    ],
  },
];

const FAQS = [
  { q: "How do I connect my social media accounts?", a: "Go to Settings → Connected Accounts and click Connect next to the platform you want to link, then complete the authorization steps." },
  { q: "How does AI content generation work?", a: "The AI uses your Brand Voice Profile plus your topic prompt to draft platform-optimized posts. The more specific your prompt, the better the result." },
  { q: "Can I schedule posts across multiple platforms?", a: "Yes. Use the Content Calendar to queue posts to all connected platforms, with the same or different times per platform." },
  { q: "How do I manage multiple brands?", a: "Use the Brands page to add brands, each with its own voice and platforms, and switch between them with the sidebar Brand Switcher." },
  { q: "What analytics are available?", a: "Reach, engagements, engagement rate, follower growth, best posting times and top-performing content, plus weekly AI insights." },
  { q: "How do I change my subscription plan?", a: "Open Settings → Billing to upgrade or downgrade at any time; changes take effect immediately." },
  { q: "Is my data secure?", a: "Yes. We use enterprise-grade encryption, never store your social passwords, and follow GDPR and SOC 2 practices." },
  { q: "How do I cancel my account?", a: "You can cancel from Settings → Billing. Your data is retained for 30 days in case you change your mind." },
];

interface HelpDocsProps {
  embedded?: boolean;
}

const HelpDocs = ({ embedded = false }: HelpDocsProps) => {
  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DOCS;
    return DOCS.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.desc.toLowerCase().includes(q) ||
        d.steps.some((s) => s.toLowerCase().includes(q))
    );
  }, [query]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      {!embedded && (
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 rounded-pill bg-primary/10 px-4 py-1.5 font-heading text-sm font-semibold text-primary">
            <HelpCircle className="h-4 w-4" /> Help & Documentation
          </span>
          <h1 className="mt-4 font-heading text-3xl font-bold text-foreground">How can we help?</h1>
          <p className="mt-2 font-body text-muted-foreground">
            Step-by-step guides for every Publioxa feature, with links straight to each action.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-8 max-w-xl">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the docs (e.g. schedule, connect, analytics)..."
          className="h-12 w-full rounded-pill border border-border bg-background pl-12 pr-4 font-body text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Category quick-nav */}
      <div className="mb-10 flex flex-wrap gap-2">
        {DOCS.map((d) => (
          <button
            key={d.id}
            onClick={() => scrollTo(d.id)}
            className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-card px-3 py-1.5 font-body text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <d.icon className="h-3.5 w-3.5" /> {d.title}
          </button>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-5">
        {sections.length === 0 && (
          <p className="rounded-xl border border-border bg-card p-6 font-body text-sm text-muted-foreground">
            No results for “{query}”. Try a different keyword.
          </p>
        )}
        {sections.map((d, i) => (
          <motion.section
            key={d.id}
            id={d.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: Math.min(i * 0.03, 0.2) }}
            className="scroll-mt-24 rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lavender text-primary">
                <d.icon className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading text-xl font-bold text-foreground">{d.title}</h2>
                  <span className="rounded-pill bg-primary/10 px-2.5 py-0.5 font-heading text-[11px] font-semibold text-primary">
                    {d.tag}
                  </span>
                </div>
                <p className="mt-1 font-body text-sm text-muted-foreground">{d.desc}</p>

                {/* Workflow */}
                <p className="mt-5 font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Workflow
                </p>
                <ol className="mt-2 space-y-2">
                  {d.steps.map((s, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-xs font-bold text-primary">
                        {idx + 1}
                      </span>
                      <span className="font-body text-sm text-foreground">{s}</span>
                    </li>
                  ))}
                </ol>

                {/* Actions */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {d.actions.map((a) => (
                    <Link
                      key={a.to}
                      to={a.to}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 font-heading text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      {a.label} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        ))}
      </div>

      {/* FAQ */}
      <section className="mt-14">
        <h2 className="mb-4 border-l-4 border-primary pl-4 font-heading text-2xl font-bold text-foreground">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {FAQS.map((f, idx) => {
            const open = openFaq === idx;
            return (
              <div key={idx} className="overflow-hidden rounded-xl border border-border bg-card">
                <button
                  onClick={() => setOpenFaq(open ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-heading text-sm font-semibold text-foreground">{f.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <div className="px-5 pb-4 font-body text-sm text-muted-foreground">{f.a}</div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default HelpDocs;
