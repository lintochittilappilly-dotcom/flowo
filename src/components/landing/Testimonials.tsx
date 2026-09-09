import { motion } from "framer-motion";
import { Star } from "lucide-react";
import SectionBadge from "./SectionBadge";

const testimonials = [
  { name: "Sarah Mitchell", title: "Owner, Bloom Skincare Co", initials: "SM", quote: "I used to spend every Sunday night dreading writing posts for the week ahead. Now I open Flowo on Monday morning, click generate, and my entire week is done in 8 minutes. My engagement has tripled and I haven't missed a single day of posting in four months. This tool is genuinely life-changing for a small business owner." },
  { name: "Marcus Johnson", title: "Founder, Elevate Fitness Studios", initials: "MJ", quote: "I was paying a social media agency $3,200/month and getting maybe 10 posts per month with mediocre results. I switched to Flowo six months ago and now I get 30+ posts per month that actually sound like me. My Instagram following went from 2,100 to 11,400. The ROI is absolutely insane." },
  { name: "Jennifer Park", title: "Marketing Director, Nexus Real Estate", initials: "JP", quote: "Managing social media for 14 agents was a nightmare. Flowo lets me run 14 separate brand profiles from one dashboard. What used to take my team 40 hours a month now takes 3 hours. We use the savings to run ads instead and our lead generation has doubled." },
  { name: "David Okonkwo", title: "CEO, TechBridge Consulting", initials: "DO", quote: "I was skeptical that AI could capture my professional voice on LinkedIn. I was completely wrong. The posts Flowo generates sound exactly like how I write — maybe even better. Three clients found me through LinkedIn last quarter specifically mentioning my content. That's direct revenue from a $49 tool." },
  { name: "Lisa Chen", title: "Founder, Wildflower Bakery", initials: "LC", quote: "I'm a baker, not a marketer. Writing captions made me want to cry. Now I tell Flowo what I baked this week and it writes beautiful, mouth-watering posts that make people show up to my store. My Saturday morning queue is longer than it's ever been." },
  { name: "Ryan Torres", title: "Owner, Torres Digital Agency", initials: "RT", quote: "I run a 12-person digital agency and Flowo is now part of every single client package we offer. It's added $6,000/month to our revenue with almost zero extra effort. Best investment we've ever made." },
];

const Testimonials = () => (
  <section id="testimonials" className="bg-lavender py-20 sm:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <SectionBadge text="Real Customers. Real Results." />
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-4 font-heading text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl"
        >
          Business Owners Who Stopped Struggling With Social Media
        </motion.h2>
      </div>

      {/* Mobile horizontal scroll */}
      <div className="mt-14 flex gap-5 overflow-x-auto pb-4 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="min-w-[300px] flex-shrink-0 rounded-[16px] bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover lg:min-w-0"
          >
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, si) => (
                <Star key={si} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="mt-4 font-body text-sm italic leading-relaxed text-foreground/70">
              "{t.quote}"
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-bg font-heading text-sm font-bold text-primary-foreground">
                {t.initials}
              </div>
              <div>
                <p className="font-heading text-sm font-bold text-foreground">{t.name}</p>
                <p className="font-body text-xs text-muted-foreground">{t.title}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
