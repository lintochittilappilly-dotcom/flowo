import { BookOpen, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import InfoPageLayout from "@/components/info/InfoPageLayout";

const steps = [
  {
    number: "01",
    title: "Create Your Account",
    desc: "Sign up for a free Flowo account in under 30 seconds. You can use your email or sign in with Google — no credit card required.",
    tips: ["Choose a strong password with at least 8 characters", "Use a business email for team features later", "Check your inbox for the verification email"],
  },
  {
    number: "02",
    title: "Complete Onboarding",
    desc: "Tell us about your business so Flowo's AI can learn your brand voice. Share your industry, tone preferences, and a brief description of what you do.",
    tips: ["Be specific about your brand tone (casual, professional, witty)", "Add sample posts if you have them — it helps AI learn faster", "You can update these settings anytime in Brand Settings"],
  },
  {
    number: "03",
    title: "Connect Your Social Accounts",
    desc: "Link your Instagram, LinkedIn, Twitter/X, Facebook, or TikTok accounts. Flowo uses secure OAuth — we never see or store your passwords.",
    tips: ["Make sure you have admin access to business pages", "Instagram requires a Business or Creator account", "You can connect up to 5 platforms on the Pro plan"],
  },
  {
    number: "04",
    title: "Generate Your First Content",
    desc: "Head to the Create Post page and let Flowo's AI generate on-brand content for you. Enter a topic or idea, and watch the magic happen.",
    tips: ["Start with a simple topic like a product highlight or tip", "Edit AI suggestions to add your personal touch", "Use the platform preview to see how posts will look"],
  },
  {
    number: "05",
    title: "Schedule & Publish",
    desc: "Use the Content Calendar to schedule posts at optimal times. Flowo analyzes your audience to suggest the best posting windows for maximum engagement.",
    tips: ["Schedule at least a week of content to stay consistent", "Use the bulk scheduling feature for efficiency", "Review scheduled posts before they go live"],
  },
  {
    number: "06",
    title: "Track Your Results",
    desc: "Visit Analytics to monitor engagement, follower growth, and content performance across all platforms in one unified dashboard.",
    tips: ["Check analytics weekly to spot trends", "Use insights to refine your content strategy", "Export reports to share with your team or clients"],
  },
];

const GettingStartedPage = () => (
  <InfoPageLayout badge="Guide" badgeIcon={<BookOpen className="h-4 w-4" />} title="Getting Started with Flowo" description="Go from zero to publishing in under 10 minutes. Here's everything you need to know.">
    <div className="space-y-10">
      {steps.map((step, i) => (
        <motion.section key={step.number} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="rounded-2xl border bg-card p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary font-heading text-sm font-bold text-primary-foreground">{step.number}</span>
            <div className="flex-1">
              <h2 className="font-heading text-xl font-bold text-foreground">{step.title}</h2>
              <p className="mt-2 font-body text-[15px] leading-relaxed text-foreground/80">{step.desc}</p>
              <ul className="mt-4 space-y-2">
                {step.tips.map((tip) => (
                  <li key={tip} className="flex items-start gap-2 font-body text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.section>
      ))}
    </div>

    <div className="mt-12 text-center">
      <p className="mb-4 font-body text-muted-foreground">Ready to get started?</p>
      <Link to="/signup" className="inline-flex items-center gap-2 gradient-bg rounded-pill px-8 py-3 font-heading font-semibold text-primary-foreground shadow-md transition-all hover:shadow-lg hover:scale-105">
        Create Your Free Account <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  </InfoPageLayout>
);

export default GettingStartedPage;
