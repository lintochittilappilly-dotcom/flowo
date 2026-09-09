import { motion } from "framer-motion";
import { Bot, Brain, Calendar, Flame, Clock, BarChart3, MessageSquare, Palette } from "lucide-react";
import SectionBadge from "./SectionBadge";

const features = [
  { icon: Bot, heading: "AI Content Generation Engine", desc: "Describe what you want to post and Flowo instantly generates platform-native content for every connected account. Instagram captions, LinkedIn articles, Twitter threads, TikTok scripts — each one perfectly written for that platform." },
  { icon: Brain, heading: "Brand Voice Training", desc: "Flowo learns exactly how your brand speaks. Paste in a few of your best posts and the AI memorizes your tone, vocabulary, and style forever. Every post sounds like you wrote it on your best day." },
  { icon: Calendar, heading: "30-Day Content Calendar Builder", desc: "Stop planning one post at a time. Click one button and Flowo builds an entire month of balanced, strategic content automatically spread across your best posting times." },
  { icon: Flame, heading: "Real-Time Trend Detection", desc: "Flowo monitors trending topics in your industry every single day. When something relevant blows up, you get an instant alert with a one-click option to generate a post before your competitors do." },
  { icon: Clock, heading: "Smart Auto-Scheduling & Publishing", desc: "Set your preferred posting times once and forget it. Flowo automatically publishes your content at the exact moment your audience is most active on each platform." },
  { icon: BarChart3, heading: "Unified Analytics Dashboard", desc: "See exactly what's working across every platform in one clean dashboard. Every week the AI sends you a plain-English performance summary with specific recommendations to improve." },
  { icon: MessageSquare, heading: "AI Comment & DM Manager", desc: "Never miss an engagement opportunity again. Flowo monitors all your comments and DMs, categorizes them by intent, and suggests perfectly crafted replies that match your brand voice." },
  { icon: Palette, heading: "AI Image & Visual Generator", desc: "Every post comes with a matching AI-generated image or curated stock photo suggestion. Beautiful on-brand visuals generated automatically alongside your caption." },
];

const FeaturesSection = () => (
  <section id="features" className="bg-midnight py-20 sm:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <SectionBadge text="Everything You Need" />
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-4 font-heading text-3xl font-bold text-primary-foreground sm:text-4xl lg:text-5xl"
        >
          One Dashboard That Replaces Your Entire Social Media Operation
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-4 max-w-2xl font-body text-base text-primary-foreground/60 sm:text-lg"
        >
          Every feature you need to dominate social media — without the agency price tag.
        </motion.p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="group rounded-[16px] border border-primary/10 bg-primary-foreground/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/20">
              <f.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="mt-4 font-heading text-base font-bold text-primary-foreground">{f.heading}</h3>
            <p className="mt-2 font-body text-sm leading-relaxed text-primary-foreground/50">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
