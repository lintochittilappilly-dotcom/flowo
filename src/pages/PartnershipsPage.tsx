import { Handshake, CheckCircle2, ArrowRight, Building2, Megaphone, Code2, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import InfoPageLayout from "@/components/info/InfoPageLayout";

const programs = [
  { icon: <Megaphone className="h-6 w-6" />, title: "Agency Partners", desc: "Manage multiple client accounts with white-label features, bulk pricing, and dedicated support. Perfect for social media agencies of all sizes.", benefits: ["White-label dashboard", "Bulk client pricing", "Priority support", "Co-marketing opportunities"] },
  { icon: <Code2 className="h-6 w-6" />, title: "Integration Partners", desc: "Build on top of Flowo's API to create powerful integrations. Access our developer tools, sandbox environment, and technical documentation.", benefits: ["Full API access", "Sandbox environment", "Technical support", "Featured in marketplace"] },
  { icon: <GraduationCap className="h-6 w-6" />, title: "Education Partners", desc: "Special pricing and features for universities, bootcamps, and educational programs teaching social media marketing.", benefits: ["80% educational discount", "Classroom licenses", "Custom curricula", "Student portfolios"] },
  { icon: <Building2 className="h-6 w-6" />, title: "Technology Partners", desc: "Strategic partnerships with complementary SaaS platforms. Integrate Flowo into your product ecosystem for mutual value.", benefits: ["Joint product development", "Shared customer success", "Co-branded campaigns", "Revenue sharing"] },
];

const PartnershipsPage = () => (
  <InfoPageLayout badge="Partners" badgeIcon={<Handshake className="h-4 w-4" />} title="Partnerships" description="Grow your business alongside Flowo. Explore partnership programs built for mutual success.">
    <div className="space-y-8">
      {programs.map((p, i) => (
        <motion.div key={p.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="rounded-2xl border bg-card p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-lavender text-primary">{p.icon}</span>
            <div className="flex-1">
              <h2 className="font-heading text-xl font-bold text-foreground">{p.title}</h2>
              <p className="mt-2 font-body text-[15px] leading-relaxed text-foreground/80">{p.desc}</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {p.benefits.map((b) => (
                  <li key={b} className="flex items-center gap-2 font-body text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      ))}
    </div>

    <div className="mt-12 rounded-2xl bg-gradient-to-r from-lavender to-background p-8 text-center">
      <h2 className="font-heading text-2xl font-bold text-foreground">Ready to Partner with Flowo?</h2>
      <p className="mx-auto mt-2 max-w-lg font-body text-muted-foreground">Whether you're an agency, developer, educator, or technology company, we'd love to explore how we can grow together.</p>
      <Link to="/contact" className="mt-6 inline-flex items-center gap-2 gradient-bg rounded-pill px-8 py-3 font-heading font-semibold text-primary-foreground shadow-md transition-all hover:shadow-lg hover:scale-105">
        Apply to Partner <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  </InfoPageLayout>
);

export default PartnershipsPage;
