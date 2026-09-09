import { Users, MessageSquare, Award, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import InfoPageLayout from "@/components/info/InfoPageLayout";

const channels = [
  { icon: <MessageSquare className="h-6 w-6" />, title: "Discussion Forum", desc: "Ask questions, share strategies, and get advice from fellow Flowo users and our team.", members: "8,400+", link: "#" },
  { icon: <Users className="h-6 w-6" />, title: "Discord Community", desc: "Real-time chat with other creators. Get instant feedback, share wins, and connect with your peers.", members: "5,200+", link: "#" },
  { icon: <Award className="h-6 w-6" />, title: "Creator Spotlight", desc: "Each month we highlight outstanding community members and their social media success stories.", members: "Featured monthly", link: "#" },
];

const topics = [
  { title: "Content Strategy", threads: 342, desc: "Share and discuss content strategies that drive engagement" },
  { title: "Instagram Growth", threads: 287, desc: "Tips, tricks, and case studies for growing on Instagram" },
  { title: "AI Content Tips", threads: 198, desc: "Get the most out of Flowo's AI content generation" },
  { title: "LinkedIn for Business", threads: 156, desc: "B2B social strategies and LinkedIn best practices" },
  { title: "Analytics Deep Dives", threads: 134, desc: "Understanding your data and making it actionable" },
  { title: "Feature Requests", threads: 412, desc: "Suggest and vote on new Flowo features" },
];

const CommunityForumPage = () => (
  <InfoPageLayout badge="Community" badgeIcon={<Users className="h-4 w-4" />} title="Community Forum" description="Connect with 13,000+ creators, marketers, and small business owners who use Flowo.">
    {/* Channels */}
    <div className="mb-12 grid gap-6 sm:grid-cols-3">
      {channels.map((c, i) => (
        <motion.a key={c.title} href={c.link} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-card">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-lavender text-primary">{c.icon}</span>
          <h3 className="font-heading text-base font-bold text-foreground group-hover:text-primary">{c.title}</h3>
          <p className="mt-1 font-body text-sm text-muted-foreground">{c.desc}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="font-body text-xs font-medium text-primary">{c.members} members</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
          </div>
        </motion.a>
      ))}
    </div>

    {/* Topics */}
    <section>
      <h2 className="mb-6 border-l-4 border-primary pl-4 font-heading text-2xl font-bold text-foreground">Popular Topics</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {topics.map((t) => (
          <a key={t.title} href="#" className="group flex items-center justify-between rounded-xl border bg-card px-6 py-5 shadow-sm transition-all hover:border-primary/30">
            <div>
              <h3 className="font-heading text-sm font-bold text-foreground group-hover:text-primary">{t.title}</h3>
              <p className="mt-0.5 font-body text-xs text-muted-foreground">{t.desc}</p>
            </div>
            <span className="shrink-0 rounded-pill bg-lavender px-3 py-1 font-heading text-xs font-semibold text-primary">{t.threads} threads</span>
          </a>
        ))}
      </div>
    </section>
  </InfoPageLayout>
);

export default CommunityForumPage;
