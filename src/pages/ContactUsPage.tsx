import { useState } from "react";
import { Mail, MessageSquare, MapPin, Clock, Send } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import InfoPageLayout from "@/components/info/InfoPageLayout";
import SEOHead from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const contactMethods = [
  { icon: <Mail className="h-5 w-5" />, title: "Email Us", value: "support@publioxa.com", desc: "For general inquiries and support" },
  { icon: <MessageSquare className="h-5 w-5" />, title: "Live Chat", value: "Available in-app", desc: "Mon–Fri, 9am–6pm EST" },
  { icon: <MapPin className="h-5 w-5" />, title: "Office", value: "San Francisco, CA", desc: "548 Market St, Suite 35100" },
  { icon: <Clock className="h-5 w-5" />, title: "Response Time", value: "Under 4 hours", desc: "During business hours" },
];

const ContactUsPage = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success("Message sent! We'll get back to you within 4 hours.");
      setForm({ name: "", email: "", subject: "", message: "" });
    }, 1500);
  };

  return (
    <>
      <SEOHead title="Contact Us — Publioxa" description="Get in touch with the Publioxa team. We respond within 4 hours during business hours." path="/contact" />
      <InfoPageLayout badge="Contact" badgeIcon={<Mail className="h-4 w-4" />} title="Contact Us" description="Have a question, feedback, or partnership idea? We'd love to hear from you.">
      {/* Contact Methods */}
      <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {contactMethods.map((m, i) => (
          <motion.div key={m.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="rounded-xl border bg-card p-5 text-center shadow-sm">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-lavender text-primary">{m.icon}</span>
            <h3 className="font-heading text-sm font-bold text-foreground">{m.title}</h3>
            <p className="mt-1 font-heading text-sm font-semibold text-primary">{m.value}</p>
            <p className="mt-0.5 font-body text-xs text-muted-foreground">{m.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Form */}
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-6 border-l-4 border-primary pl-4 font-heading text-2xl font-bold text-foreground">Send Us a Message</h2>
        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border bg-card p-8 shadow-card">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-body text-sm font-medium text-foreground">Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
            </div>
            <div>
              <label className="mb-1.5 block font-body text-sm font-medium text-foreground">Email *</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block font-body text-sm font-medium text-foreground">Subject</label>
            <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="What's this about?" />
          </div>
          <div>
            <label className="mb-1.5 block font-body text-sm font-medium text-foreground">Message *</label>
            <Textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us what's on your mind..." />
          </div>
          <Button type="submit" disabled={sending} className="gradient-bg w-full gap-2 rounded-pill font-heading text-primary-foreground">
            <Send className="h-4 w-4" /> {sending ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </div>
    </InfoPageLayout>
    </>
  );
};

export default ContactUsPage;
