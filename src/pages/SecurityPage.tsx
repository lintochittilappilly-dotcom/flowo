import { Shield, Lock, Server, Key, Eye, Bug, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import LegalPageLayout, { Callout, type LegalPageData } from "@/components/legal/LegalPageLayout";

const highlights = [
  { icon: <Lock className="h-7 w-7" />, title: "256-bit Encryption", desc: "AES-256 at rest, TLS 1.3 in transit" },
  { icon: <Server className="h-7 w-7" />, title: "SOC 2 Infrastructure", desc: "Hosted on Supabase & AWS" },
  { icon: <Key className="h-7 w-7" />, title: "OAuth-Only Connections", desc: "We never store your social passwords" },
  { icon: <Eye className="h-7 w-7" />, title: "Zero Password Storage", desc: "Social tokens encrypted & scoped" },
  { icon: <ShieldCheck className="h-7 w-7" />, title: "Regular Audits", desc: "Continuous security monitoring" },
];

const SecurityHighlights = () => (
  <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
    {highlights.map((h, i) => (
      <motion.div
        key={h.title}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.05 }}
        className="flex flex-col items-center rounded-xl border bg-card p-5 text-center shadow-sm"
      >
        <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-lavender text-primary">{h.icon}</span>
        <p className="font-heading text-sm font-bold text-foreground">{h.title}</p>
        <p className="mt-1 font-body text-xs text-muted-foreground">{h.desc}</p>
      </motion.div>
    ))}
  </div>
);

const data: LegalPageData = {
  badge: "Security",
  badgeIcon: <Shield className="h-4 w-4" />,
  title: "Security at Flowo",
  description: "How Flowo keeps your account and data safe and secure.",
  lastUpdated: "February 15, 2026",
  readTime: "6 min read",
  sections: [
    {
      id: "overview",
      number: "01",
      title: "Our Security Philosophy",
      content: (
        <>
          <p>Security isn't an afterthought at Flowo — it's woven into every layer of our platform. We handle sensitive data like social media credentials, business content, and payment information, and we take that responsibility seriously.</p>
          <SecurityHighlights />
        </>
      ),
    },
    {
      id: "encryption",
      number: "02",
      title: "Encryption",
      content: (
        <>
          <p className="mb-3">All data transmitted between your browser and Flowo is encrypted using <strong>TLS 1.3</strong>, the latest and most secure transport protocol available. We enforce HTTPS on all endpoints with HSTS headers.</p>
          <p>Data stored in our databases is encrypted at rest using <strong>AES-256 encryption</strong>, the same standard used by banks and government agencies. Database backups are also encrypted.</p>
          <Callout>Sensitive data such as OAuth tokens are additionally encrypted at the application level with unique encryption keys before being stored in the database.</Callout>
        </>
      ),
    },
    {
      id: "oauth",
      number: "03",
      title: "OAuth Token Security",
      content: (
        <>
          <p className="mb-3">When you connect a social media platform like Instagram, LinkedIn, or Twitter/X, we use <strong>OAuth 2.0</strong> — the industry standard for secure third-party authorization. Here's what that means:</p>
          <ul className="list-none space-y-2">
            {[
              "We never see, store, or have access to your social media passwords",
              "You grant Flowo specific, limited permissions (scopes) through the platform's own authorization screen",
              "OAuth tokens are encrypted at rest and stored with minimal required scopes",
              "You can revoke Flowo's access from your social media platform at any time",
              "Tokens are automatically refreshed and expired tokens are securely deleted",
            ].map((i) => (
              <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{i}</span></li>
            ))}
          </ul>
        </>
      ),
    },
    {
      id: "infrastructure",
      number: "04",
      title: "Infrastructure Security",
      content: (
        <>
          <p className="mb-3">Flowo's infrastructure is built on top of trusted, enterprise-grade platforms:</p>
          <ul className="list-none space-y-2">
            {[
              "Supabase (built on AWS) — SOC 2 Type II certified database and authentication",
              "Vercel — Edge-deployed application with automatic DDoS protection",
              "Cloudflare — Additional CDN, WAF, and bot protection layer",
              "Stripe — PCI DSS Level 1 certified payment processing",
            ].map((i) => (
              <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{i}</span></li>
            ))}
          </ul>
          <p className="mt-3">Our production databases are backed up continuously with point-in-time recovery capabilities. Backups are encrypted and stored in geographically separate locations.</p>
        </>
      ),
    },
    {
      id: "access-control",
      number: "05",
      title: "Access Controls",
      content: (
        <>
          <p className="mb-3">We enforce strict access controls internally:</p>
          <ul className="list-none space-y-2">
            {[
              "Principle of least privilege — employees only access data required for their role",
              "Multi-factor authentication required for all team members accessing production systems",
              "All database access is logged, audited, and reviewed regularly",
              "Production environment access is restricted to senior engineering staff only",
              "Background checks conducted for all employees handling user data",
            ].map((i) => (
              <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{i}</span></li>
            ))}
          </ul>
        </>
      ),
    },
    {
      id: "account-security",
      number: "06",
      title: "Your Account Security",
      content: (
        <>
          <p className="mb-3">We provide multiple features to help you keep your Flowo account secure:</p>
          <ul className="list-none space-y-2">
            {[
              "Two-factor authentication (2FA) — available for all accounts via authenticator apps",
              "Strong password requirements — minimum 8 characters with complexity requirements",
              "Session management — view and revoke active sessions from Settings",
              "Login notifications — email alerts for new device or location sign-ins",
              "Automatic session expiry — sessions expire after extended inactivity",
            ].map((i) => (
              <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{i}</span></li>
            ))}
          </ul>
        </>
      ),
    },
    {
      id: "api-security",
      number: "07",
      title: "API Security",
      content: (
        <>
          <p className="mb-3">Our API endpoints are protected with multiple layers of security:</p>
          <ul className="list-none space-y-2">
            {[
              "JWT-based authentication with short-lived tokens",
              "Rate limiting to prevent abuse — tiered by plan (100-1000 requests/minute)",
              "Input validation and sanitization on all endpoints",
              "CORS policies restricting access to authorized origins",
              "Request logging and anomaly detection for suspicious patterns",
            ].map((i) => (
              <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{i}</span></li>
            ))}
          </ul>
        </>
      ),
    },
    {
      id: "incident-response",
      number: "08",
      title: "Incident Response",
      content: (
        <>
          <p className="mb-3">We maintain a comprehensive incident response plan:</p>
          <ul className="list-none space-y-2">
            {[
              "24/7 monitoring with automated alerts for suspicious activity",
              "Dedicated incident response team with defined escalation procedures",
              "Affected users notified within 72 hours of confirmed data breaches",
              "Post-incident reviews and public transparency reports",
              "Regular incident response drills and tabletop exercises",
            ].map((i) => (
              <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{i}</span></li>
            ))}
          </ul>
        </>
      ),
    },
    {
      id: "bug-bounty",
      number: "09",
      title: "Bug Bounty Program",
      content: (
        <>
          <p className="mb-3">We welcome responsible security researchers to help us identify vulnerabilities. Our bug bounty program rewards valid reports based on severity:</p>
          <ul className="list-none space-y-2 mb-3">
            {[
              "Critical (remote code execution, data breach) — up to $5,000",
              "High (authentication bypass, privilege escalation) — up to $2,500",
              "Medium (XSS, CSRF) — up to $1,000",
              "Low (information disclosure) — up to $250",
            ].map((i) => (
              <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{i}</span></li>
            ))}
          </ul>
          <p>To report a security vulnerability, email <a href="mailto:security@flowo.com" className="font-medium text-primary underline">security@flowo.com</a>. Please include a detailed description of the vulnerability, steps to reproduce, and potential impact. We will acknowledge receipt within 24 hours and aim to resolve confirmed issues within 7 days.</p>
        </>
      ),
    },
  ],
};

const SecurityPage = () => <LegalPageLayout data={data} currentPath="/security" />;
export default SecurityPage;
