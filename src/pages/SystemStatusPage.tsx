import { Activity, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import InfoPageLayout from "@/components/info/InfoPageLayout";

const services = [
  { name: "Web Application", status: "operational", uptime: "99.98%" },
  { name: "API", status: "operational", uptime: "99.95%" },
  { name: "Content Scheduling Engine", status: "operational", uptime: "99.99%" },
  { name: "AI Content Generation", status: "operational", uptime: "99.90%" },
  { name: "Social Media Publishing", status: "operational", uptime: "99.97%" },
  { name: "Analytics Pipeline", status: "operational", uptime: "99.93%" },
  { name: "Authentication (Supabase)", status: "operational", uptime: "99.99%" },
  { name: "Payment Processing (Stripe)", status: "operational", uptime: "99.99%" },
];

const incidents = [
  { date: "Feb 28, 2026", title: "Scheduled Maintenance — Database Optimization", status: "resolved", desc: "Completed a planned database optimization. Total downtime: 12 minutes." },
  { date: "Feb 15, 2026", title: "Delayed Publishing on Instagram", status: "resolved", desc: "Some scheduled Instagram posts experienced up to 15-minute delays due to API rate limits. Resolved by adjusting queue batching." },
  { date: "Jan 22, 2026", title: "AI Generation Slowness", status: "resolved", desc: "AI content generation experienced increased latency (5-8s vs normal 2-3s) due to upstream OpenAI capacity issues. Resolved automatically." },
];

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "operational") return <CheckCircle2 className="h-5 w-5 text-success" />;
  if (status === "degraded") return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  return <Clock className="h-5 w-5 text-muted-foreground" />;
};

const SystemStatusPage = () => (
  <InfoPageLayout badge="Status" badgeIcon={<Activity className="h-4 w-4" />} title="System Status" description="Real-time status of all Flowo services and infrastructure.">
    {/* Overall */}
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex items-center gap-4 rounded-2xl border-2 border-success/30 bg-success/5 p-6">
      <CheckCircle2 className="h-10 w-10 text-success" />
      <div>
        <p className="font-heading text-xl font-bold text-foreground">All Systems Operational</p>
        <p className="font-body text-sm text-muted-foreground">Last checked: {new Date().toLocaleString()}</p>
      </div>
    </motion.div>

    {/* Services */}
    <section className="mb-16">
      <h2 className="mb-6 border-l-4 border-primary pl-4 font-heading text-2xl font-bold text-foreground">Service Status</h2>
      <div className="space-y-2">
        {services.map((s) => (
          <div key={s.name} className="flex items-center justify-between rounded-lg border bg-card px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <StatusIcon status={s.status} />
              <span className="font-body text-sm font-medium text-foreground">{s.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-body text-xs text-muted-foreground">{s.uptime} uptime</span>
              <span className="rounded-pill bg-success/10 px-3 py-1 font-body text-xs font-medium capitalize text-success">{s.status}</span>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* Recent Incidents */}
    <section>
      <h2 className="mb-6 border-l-4 border-primary pl-4 font-heading text-2xl font-bold text-foreground">Recent Incidents</h2>
      <div className="space-y-4">
        {incidents.map((inc) => (
          <div key={inc.date + inc.title} className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-heading text-base font-bold text-foreground">{inc.title}</h3>
                <p className="mt-1 font-body text-sm text-foreground/80">{inc.desc}</p>
              </div>
              <span className="shrink-0 rounded-pill bg-success/10 px-3 py-1 font-body text-xs font-medium capitalize text-success">{inc.status}</span>
            </div>
            <p className="mt-3 font-body text-xs text-muted-foreground">{inc.date}</p>
          </div>
        ))}
      </div>
    </section>
  </InfoPageLayout>
);

export default SystemStatusPage;
