import { Link } from "react-router-dom";
import { HelpCircle, BookOpen, MessageSquare, FileText, Shield, CreditCard, Search } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import InfoPageLayout from "@/components/info/InfoPageLayout";
import { Input } from "@/components/ui/input";

const categories = [
  { icon: <BookOpen className="h-6 w-6" />, title: "Getting Started", desc: "New to Flowo? Start here with setup guides and basics.", link: "/getting-started", articles: 12 },
  { icon: <MessageSquare className="h-6 w-6" />, title: "Content & Scheduling", desc: "Learn to create, schedule, and publish content like a pro.", link: "#", articles: 18 },
  { icon: <FileText className="h-6 w-6" />, title: "Analytics & Reporting", desc: "Understand your metrics, insights, and growth tracking.", link: "#", articles: 9 },
  { icon: <Shield className="h-6 w-6" />, title: "Account & Security", desc: "Manage your account, password, and connected platforms.", link: "#", articles: 14 },
  { icon: <CreditCard className="h-6 w-6" />, title: "Billing & Plans", desc: "Subscriptions, invoices, refunds, and plan changes.", link: "#", articles: 8 },
  { icon: <HelpCircle className="h-6 w-6" />, title: "Troubleshooting", desc: "Common issues, error fixes, and platform-specific solutions.", link: "#", articles: 22 },
];

const popularArticles = [
  "How to connect your Instagram account",
  "Setting up your first content calendar",
  "Understanding your analytics dashboard",
  "How AI content generation works",
  "Scheduling posts across multiple platforms",
  "How to change your subscription plan",
  "Fixing common publishing errors",
  "Setting up two-factor authentication",
];

const HelpCenterPage = () => {
  const [search, setSearch] = useState("");
  const filtered = categories.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.desc.toLowerCase().includes(search.toLowerCase()));

  return (
    <InfoPageLayout badge="Support" badgeIcon={<HelpCircle className="h-4 w-4" />} title="Help Center" description="Find answers, guides, and resources to get the most out of Flowo.">
      {/* Search */}
      <div className="relative mx-auto mb-12 max-w-xl">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search for help articles..." className="h-12 rounded-pill pl-12 text-base" />
      </div>

      {/* Categories */}
      <div className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c, i) => (
          <motion.div key={c.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
            <Link to={c.link} className="group flex flex-col rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-card">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-lavender text-primary">{c.icon}</span>
              <h3 className="font-heading text-base font-bold text-foreground group-hover:text-primary">{c.title}</h3>
              <p className="mt-1 flex-1 font-body text-sm text-muted-foreground">{c.desc}</p>
              <p className="mt-3 font-body text-xs font-medium text-primary">{c.articles} articles</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Popular */}
      <section>
        <h2 className="mb-6 border-l-4 border-primary pl-4 font-heading text-2xl font-bold text-foreground">Popular Articles</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {popularArticles.map((a) => (
            <a key={a} href="#" className="flex items-center gap-3 rounded-lg border bg-card px-5 py-4 font-body text-sm text-foreground transition-colors hover:border-primary/30 hover:text-primary">
              <FileText className="h-4 w-4 shrink-0 text-primary" /> {a}
            </a>
          ))}
        </div>
      </section>
    </InfoPageLayout>
  );
};

export default HelpCenterPage;
