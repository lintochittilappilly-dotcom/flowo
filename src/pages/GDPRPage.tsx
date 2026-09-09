import { Shield } from "lucide-react";
import LegalPageLayout, { Callout, type LegalPageData } from "@/components/legal/LegalPageLayout";

const data: LegalPageData = {
  badge: "GDPR",
  badgeIcon: <Shield className="h-4 w-4" />,
  title: "GDPR Compliance",
  description: "How Flowo complies with the General Data Protection Regulation.",
  lastUpdated: "February 15, 2026",
  readTime: "7 min read",
  sections: [
    {
      id: "commitment",
      number: "01",
      title: "Our Commitment to GDPR",
      content: (
        <>
          <p>Flowo is committed to full compliance with the General Data Protection Regulation (GDPR) and the UK GDPR. We believe that strong data protection practices aren't just a legal requirement — they're fundamental to building trust with our users across the European Union, the United Kingdom, and worldwide.</p>
          <Callout>Whether you're based in the EU or not, we apply GDPR-level data protection standards to all Flowo users globally.</Callout>
        </>
      ),
    },
    {
      id: "role",
      number: "02",
      title: "Flowo as Data Controller",
      content: (
        <>
          <p className="mb-3">Under the GDPR, Flowo Inc. acts as the <strong>data controller</strong> for the personal data of our users. This means we determine the purposes and means of processing your personal data.</p>
          <p>When you connect third-party social media platforms (Instagram, LinkedIn, Twitter/X), we process that data under your explicit authorization via OAuth consent. We act as a data processor for the content you create and schedule through our platform.</p>
        </>
      ),
    },
    {
      id: "lawful-bases",
      number: "03",
      title: "Lawful Bases for Processing",
      content: (
        <>
          <p className="mb-3">We process your personal data under the following lawful bases:</p>
          <ul className="list-none space-y-3">
            {[
              { basis: "Contract Performance", desc: "Processing necessary to provide the Flowo service you signed up for, including account management, content scheduling, and social media publishing." },
              { basis: "Legitimate Interest", desc: "Processing for analytics, product improvement, fraud prevention, and security — where our interests don't override your rights." },
              { basis: "Consent", desc: "Processing for marketing emails, optional analytics cookies, and AI content generation. You can withdraw consent at any time." },
              { basis: "Legal Obligation", desc: "Processing required to comply with tax, accounting, and regulatory requirements." },
            ].map((i) => (
              <li key={i.basis} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span><strong>{i.basis}:</strong> {i.desc}</span></li>
            ))}
          </ul>
        </>
      ),
    },
    {
      id: "your-rights",
      number: "04",
      title: "Your Data Rights",
      content: (
        <>
          <p className="mb-3">As an EU/UK data subject, you have the following rights under GDPR:</p>
          <ul className="list-none space-y-2 mb-3">
            {[
              "Right of Access — Request a complete copy of all personal data we hold about you",
              "Right to Rectification — Request correction of inaccurate or incomplete data",
              "Right to Erasure (Right to be Forgotten) — Request deletion of your personal data",
              "Right to Data Portability — Receive your data in a structured, machine-readable format (JSON or CSV)",
              "Right to Restriction — Request that we temporarily stop processing your data",
              "Right to Object — Object to processing based on legitimate interests or for direct marketing",
              "Right to Withdraw Consent — Withdraw previously given consent at any time",
              "Rights related to Automated Decision-Making — You have the right not to be subject to purely automated decisions with legal or significant effects",
            ].map((r) => (
              <li key={r} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{r}</span></li>
            ))}
          </ul>
          <Callout>To exercise any of these rights, email <a href="mailto:privacy@flowo.com" className="font-medium text-primary underline">privacy@flowo.com</a> with the subject line "GDPR Request." We will respond within <strong>30 days</strong> as required by law. We may ask for identity verification before processing your request.</Callout>
        </>
      ),
    },
    {
      id: "data-transfers",
      number: "05",
      title: "International Data Transfers",
      content: (
        <>
          <p className="mb-3">Flowo's primary infrastructure is hosted in the United States via Supabase (AWS). When transferring data outside the EU/EEA, we rely on the following safeguards:</p>
          <ul className="list-none space-y-2">
            {[
              "EU-U.S. Data Privacy Framework (DPF) for applicable service providers",
              "Standard Contractual Clauses (SCCs) approved by the European Commission",
              "Adequacy decisions where applicable",
              "Supplementary technical measures including encryption in transit and at rest",
            ].map((i) => (
              <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{i}</span></li>
            ))}
          </ul>
        </>
      ),
    },
    {
      id: "data-breach",
      number: "06",
      title: "Data Breach Notification",
      content: (
        <>
          <p>In the event of a personal data breach that poses a risk to your rights and freedoms, we will:</p>
          <ul className="mt-3 list-none space-y-2">
            {[
              "Notify the relevant supervisory authority within 72 hours of becoming aware of the breach",
              "Notify affected users without undue delay if the breach is likely to result in a high risk to their rights",
              "Document the breach, its effects, and the remedial actions taken in our internal breach register",
              "Take immediate steps to contain and mitigate the breach",
            ].map((i) => (
              <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{i}</span></li>
            ))}
          </ul>
        </>
      ),
    },
    {
      id: "retention",
      number: "07",
      title: "Data Retention",
      content: (
        <>
          <p className="mb-3">We retain personal data only for as long as necessary for the purposes outlined in our Privacy Policy:</p>
          <ul className="list-none space-y-2">
            {[
              "Account data — retained while your account is active, deleted within 30 days of account closure",
              "Social media content — deleted within 30 days of disconnecting a platform or closing your account",
              "Billing records — retained for 7 years as required by tax regulations",
              "Server logs — retained for 90 days for security and debugging purposes",
              "Marketing consent records — retained for 3 years after last interaction",
            ].map((i) => (
              <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{i}</span></li>
            ))}
          </ul>
        </>
      ),
    },
    {
      id: "dpo",
      number: "08",
      title: "Data Protection Officer",
      content: (
        <>
          <p>You can reach our Data Protection Officer for any GDPR-related inquiries:</p>
          <div className="mt-3 rounded-lg border bg-lavender/50 p-4 font-body text-sm">
            <p><strong>Data Protection Officer</strong></p>
            <p>Flowo Inc.</p>
            <p>Email: <a href="mailto:dpo@flowo.com" className="font-medium text-primary underline">dpo@flowo.com</a></p>
          </div>
          <p className="mt-3">If you are not satisfied with our response, you have the right to lodge a complaint with your local data protection supervisory authority.</p>
        </>
      ),
    },
  ],
};

const GDPRPage = () => <LegalPageLayout data={data} currentPath="/gdpr" />;
export default GDPRPage;
