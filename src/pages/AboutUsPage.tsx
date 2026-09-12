import { Users, Target, Zap, Heart, Globe, Award } from "lucide-react";
import { motion } from "framer-motion";
import InfoPageLayout from "@/components/info/InfoPageLayout";
import SEOHead from "@/components/seo-head";

const values = [
  { icon: <Target className="h-6 w-6" />, title: "Mission-Driven", desc: "We exist to give small businesses the same social media firepower that big brands take for granted." },
  { icon: <Zap className="h-6 w-6" />, title: "Simplicity First", desc: "Powerful doesn't have to mean complicated. Every feature we ship must be usable in under 60 seconds." },
  { icon: <Heart className="h-6 w-6" />, title: "Customer Obsessed", desc: "Our roadmap is shaped by the businesses who use Publioxa every day, not by trends or VC pressure." },
  { icon: <Globe className="h-6 w-6" />, title: "Globally Inclusive", desc: "We build for creators and businesses everywhere — every language, every niche, every platform." },
];

const team = [
  { name: "Sarah Chen", role: "CEO & Co-Founder", desc: "Former Head of Product at Buffer. 10+ years in social media tech." },
  { name: "Marcus Williams", role: "CTO & Co-Founder", desc: "Ex-Google engineer. Built real-time systems serving 50M+ users." },
  { name: "Priya Sharma", role: "VP of Design", desc: "Led design at Canva. Passionate about tools that feel effortless." },
  { name: "David Park", role: "Head of AI", desc: "PhD in NLP from Stanford. Previously at OpenAI research team." },
];

const milestones = [
  { year: "2022", event: "Publioxa founded in San Francisco by Sarah & Marcus" },
  { year: "2023", event: "Launched public beta — 5,000 users in first month" },
  { year: "2023", event: "Raised $4.2M seed round led by Sequoia Scout" },
  { year: "2024", event: "Hit 50,000 active users across 120 countries" },
  { year: "2024", event: "Launched AI content engine powered by GPT-4" },
  { year: "2025", event: "Series A — $18M led by Andreessen Horowitz" },
  { year: "2026", event: "100,000+ businesses trust Publioxa for their social presence" },
];

const AboutUsPage = () => (
  <>
    <SEOHead title="About Us — Publioxa" description="Learn about the team behind Publioxa, our mission to democratize social media marketing with AI." path="/about" />
    <InfoPageLayout badge="Company" badgeIcon={<Users className="h-4 w-4" />} title="About Publioxa" description="We're building the AI-powered social media team that every small business deserves.">
    {/* Story */}
    <section className="mb-16">
      <h2 className="mb-4 border-l-4 border-primary pl-4 font-heading text-2xl font-bold text-foreground">Our Story</h2>
      <div className="space-y-4 font-body text-[15px] leading-relaxed text-foreground/80">
        <p>Publioxa started with a frustration. Sarah Chen had spent years helping brands crush it on social media at Buffer, but when her sister opened a small bakery and asked for help — Sarah realized the tools that worked for brands with marketing teams were impossible for a one-person shop.</p>
        <p>The content calendars were overwhelming. The analytics dashboards required a data science degree. And the "AI" tools at the time just spit out generic, soulless captions that sounded like everyone else.</p>
        <p>She teamed up with Marcus Williams, a former Google engineer obsessed with making powerful technology feel simple, and together they built <strong>Publioxa</strong> — an AI-powered social media platform that actually understands your brand, creates content that sounds like you, and handles the entire publishing workflow so you can focus on running your business.</p>
        <p>Today, over <strong>100,000 businesses</strong> across 120+ countries use Publioxa to manage their social media presence. From local coffee shops to fast-growing D2C brands, Publioxa gives every business access to the social media superpowers that used to require a full marketing team.</p>
      </div>
    </section>

    {/* Values */}
    <section className="mb-16">
      <h2 className="mb-8 border-l-4 border-primary pl-4 font-heading text-2xl font-bold text-foreground">Our Values</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {values.map((v, i) => (
          <motion.div key={v.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="rounded-xl border bg-card p-6 shadow-sm">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-lavender text-primary">{v.icon}</span>
            <h3 className="font-heading text-lg font-bold text-foreground">{v.title}</h3>
            <p className="mt-2 font-body text-sm text-muted-foreground">{v.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>

    {/* Team */}
    <section className="mb-16">
      <h2 className="mb-8 border-l-4 border-primary pl-4 font-heading text-2xl font-bold text-foreground">Leadership Team</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {team.map((t, i) => (
          <motion.div key={t.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="flex gap-4 rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-lavender font-heading text-lg font-bold text-primary">
              {t.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-foreground">{t.name}</h3>
              <p className="font-body text-sm font-medium text-primary">{t.role}</p>
              <p className="mt-1 font-body text-xs text-muted-foreground">{t.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>

    {/* Timeline */}
    <section className="mb-16">
      <h2 className="mb-8 border-l-4 border-primary pl-4 font-heading text-2xl font-bold text-foreground">Our Journey</h2>
      <div className="relative space-y-6 pl-8 before:absolute before:left-3 before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-primary/20">
        {milestones.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="relative">
            <div className="absolute -left-[22px] top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background" />
            <span className="font-heading text-xs font-bold text-primary">{m.year}</span>
            <p className="font-body text-sm text-foreground/80">{m.event}</p>
          </motion.div>
        ))}
      </div>
    </section>

    {/* Stats */}
    <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
      {[
        { label: "Active Users", value: "100K+" },
        { label: "Countries", value: "120+" },
        { label: "Posts Published", value: "12M+" },
        { label: "Team Members", value: "45" },
      ].map((s) => (
        <div key={s.label} className="rounded-xl border bg-card p-6 text-center shadow-sm">
          <p className="font-heading text-3xl font-bold text-primary">{s.value}</p>
          <p className="mt-1 font-body text-sm text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </section>
  </InfoPageLayout>
  </>
);

export default AboutUsPage;
