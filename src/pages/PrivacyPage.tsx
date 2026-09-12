import { Shield } from "lucide-react";
import LegalPageLayout, { Callout, type LegalPageData } from "@/components/legal/LegalPageLayout";
import SEOHead from "@/components/seo-head";

const data: LegalPageData = {
  badge: "Privacy",
  badgeIcon: <Shield className="h-4 w-4" />,
  title: "Privacy Policy",
  description: "How Publioxa collects, uses, and protects your personal information.",
  lastUpdated: "February 15, 2026",
  readTime: "8 min read",
  sections: [
    {
      id: "introduction",
      number: "01",
      title: "Introduction",
      content: (
        <>
          <p>Welcome to Publioxa. Your privacy matters to us — it's not just a legal obligation, it's core to how we build our product. This Privacy Policy explains what information we collect, how we use it, and the choices you have.</p>
          <p className="mt-3">Publioxa ("we," "us," or "our") operates the Publioxa platform at <strong>publioxa.com</strong>, including our web application, APIs, and related services. This policy applies to all users of our services.</p>
          <Callout>By using Publioxa, you agree to the collection and use of information as described in this policy. If you don't agree, please discontinue use of our services.</Callout>
        </>
      ),
    },
    {
      id: "data-collected",
      number: "02",
      title: "Information We Collect",
      content: (
        <>
          <p className="mb-3"><strong>Account Information:</strong> When you sign up, we collect your name, email address, and password. If you sign up via Google or social login, we receive your basic profile info from that provider.</p>
          <p className="mb-3"><strong>Social Media Data:</strong> When you connect platforms like Instagram, LinkedIn, or Twitter (X), we access your public profile information, post content, engagement metrics, and scheduling permissions through OAuth. <strong>We never store your social media passwords.</strong></p>
          <p className="mb-3"><strong>Content & Usage Data:</strong> We store the content you create, schedule, or publish through Publioxa, including captions, images, hashtags, and scheduling preferences. We also collect usage data such as features used, pages visited, and interactions within the app.</p>
          <p className="mb-3"><strong>Payment Information:</strong> Payments are processed by <strong>Stripe</strong>. We do not store your full credit card number. Stripe provides us with a token, your card's last four digits, and billing address for record-keeping.</p>
          <p><strong>Device & Technical Data:</strong> We automatically collect your IP address, browser type, operating system, device identifiers, and referring URLs through standard web technologies.</p>
        </>
      ),
    },
    {
      id: "how-used",
      number: "03",
      title: "How We Use Your Information",
      content: (
        <ul className="list-none space-y-2">
          {[
            "Provide, maintain, and improve the Publioxa platform",
            "Generate AI-powered content suggestions using OpenAI (your prompts and brand context are sent to OpenAI's API but are not used to train their models)",
            "Schedule and publish your social media posts across connected platforms",
            "Process payments and manage your subscription",
            "Send transactional emails (confirmations, receipts, security alerts)",
            "Send product updates and tips (you can unsubscribe anytime)",
            "Analyze usage patterns to improve features and user experience",
            "Detect, prevent, and address security issues and fraud",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "data-storage",
      number: "04",
      title: "Data Storage & Security",
      content: (
        <>
          <p>Your data is stored on secure servers provided by <strong>Supabase</strong> (hosted on AWS infrastructure) with data centers in the United States. All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.</p>
          <p className="mt-3">We implement industry-standard security measures including regular security audits, access controls, monitoring, and incident response procedures. For more details, visit our <a href="/security" className="font-medium text-primary underline">Security page</a>.</p>
          <Callout>While we take every reasonable precaution to protect your data, no method of transmission or storage is 100% secure. We cannot guarantee absolute security but we are committed to protecting your information to the best of our ability.</Callout>
        </>
      ),
    },
    {
      id: "third-parties",
      number: "05",
      title: "Third-Party Sharing",
      content: (
        <>
          <p className="mb-3">We do <strong>not</strong> sell your personal data. We share information only with trusted service providers who help us operate Publioxa:</p>
          <ul className="list-none space-y-2">
            {[
              { name: "Stripe", purpose: "Payment processing" },
              { name: "OpenAI", purpose: "AI content generation (prompts only, not personal data)" },
              { name: "Supabase", purpose: "Database hosting and authentication" },
              { name: "Google Analytics", purpose: "Usage analytics (anonymized)" },
              { name: "Social media platforms", purpose: "Publishing and analytics via OAuth" },
            ].map((p) => (
              <li key={p.name} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span><strong>{p.name}</strong> — {p.purpose}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3">We may also disclose information if required by law, court order, or to protect the safety and rights of Publioxa or its users.</p>
        </>
      ),
    },
    {
      id: "cookies",
      number: "06",
      title: "Cookies & Tracking",
      content: (
        <p>We use cookies and similar technologies to maintain your session, remember preferences, and analyze usage. For full details on which cookies we use and how to manage them, please see our <a href="/cookies" className="font-medium text-primary underline">Cookie Policy</a>.</p>
      ),
    },
    {
      id: "your-rights",
      number: "07",
      title: "Your Rights",
      content: (
        <>
          <p className="mb-3">Depending on your location, you may have the following rights regarding your personal data:</p>
          <ul className="list-none space-y-2">
            {[
              "Access — Request a copy of the personal data we hold about you",
              "Correction — Request that we update inaccurate or incomplete data",
              "Deletion — Request that we delete your personal data",
              "Portability — Request your data in a machine-readable format",
              "Restriction — Request that we limit how we process your data",
              "Objection — Object to our processing of your data for certain purposes",
            ].map((r) => (
              <li key={r} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3">To exercise any of these rights, email us at <a href="mailto:privacy@publioxa.com" className="font-medium text-primary underline">privacy@publioxa.com</a>. We respond within 30 days.</p>
        </>
      ),
    },
    {
      id: "data-retention",
      number: "08",
      title: "Data Retention",
      content: (
        <>
          <p>We retain your personal data for as long as your account is active or as needed to provide our services. When you delete your account, we remove your personal data within <strong>30 days</strong>, except where retention is required by law (e.g., billing records for tax purposes, retained for up to 7 years).</p>
          <p className="mt-3">Anonymized, aggregated data that cannot identify you may be retained indefinitely for analytics and product improvement.</p>
        </>
      ),
    },
    {
      id: "children",
      number: "09",
      title: "Children's Privacy",
      content: (
        <p>Publioxa is not intended for users under the age of 16. We do not knowingly collect personal data from children. If we learn that we have collected data from a child under 16, we will delete it promptly. If you believe a child has provided us with personal information, please contact us at <a href="mailto:privacy@publioxa.com" className="font-medium text-primary underline">privacy@publioxa.com</a>.</p>
      ),
    },
    {
      id: "changes",
      number: "10",
      title: "Changes to This Policy",
      content: (
        <p>We may update this Privacy Policy from time to time. When we make significant changes, we will notify you via email or a prominent notice within the app at least <strong>14 days</strong> before the changes take effect. Your continued use of Publioxa after changes are posted constitutes acceptance of the updated policy.</p>
      ),
    },
    {
      id: "contact",
      number: "11",
      title: "Contact Us",
      content: (
        <>
          <p>If you have questions, concerns, or requests regarding this Privacy Policy, contact us at:</p>
          <div className="mt-3 rounded-lg border bg-lavender/50 p-4 font-body text-sm">
            <p><strong>Publioxa Inc.</strong></p>
            <p>Attn: Privacy Team</p>
            <p>Email: <a href="mailto:privacy@publioxa.com" className="font-medium text-primary underline">privacy@publioxa.com</a></p>
          </div>
        </>
      ),
    },
  ],
};

const PrivacyPage = () => <><SEOHead title="Privacy Policy — Publioxa" description="How Publioxa collects, uses, and protects your personal information. GDPR and CCPA compliant." path="/privacy" /><LegalPageLayout data={data} currentPath="/privacy" /></>;
export default PrivacyPage;
