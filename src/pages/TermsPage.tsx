import { Info } from "lucide-react";
import LegalPageLayout, { Callout, type LegalPageData } from "@/components/legal/LegalPageLayout";
import SEOHead from "@/components/seo-head";

const data: LegalPageData = {
  badge: "Legal",
  badgeIcon: <Info className="h-4 w-4" />,
  title: "Terms of Service",
  description: "The rules and agreements that govern your use of Flowo.",
  lastUpdated: "February 15, 2026",
  readTime: "10 min read",
  sections: [
    {
      id: "acceptance",
      number: "01",
      title: "Acceptance of Terms",
      content: (
        <>
          <p>By accessing or using Flowo ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you are using Flowo on behalf of an organization, you represent that you have authority to bind that organization to these Terms.</p>
          <Callout>Please read these Terms carefully before using Flowo. If you do not agree with any part of these Terms, you must not use our Service.</Callout>
        </>
      ),
    },
    {
      id: "eligibility",
      number: "02",
      title: "Account Registration & Eligibility",
      content: (
        <>
          <p className="mb-3">To use Flowo, you must:</p>
          <ul className="list-none space-y-2">
            {["Be at least 16 years of age", "Provide accurate and complete registration information", "Maintain the security of your account credentials", "Notify us immediately of any unauthorized account access"].map((i) => (
              <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{i}</span></li>
            ))}
          </ul>
          <p className="mt-3">You are solely responsible for all activity under your account. Flowo reserves the right to refuse service, terminate accounts, or remove content at our discretion.</p>
        </>
      ),
    },
    {
      id: "acceptable-use",
      number: "03",
      title: "Acceptable Use Policy",
      content: (
        <>
          <p className="mb-3">You agree to use Flowo only for lawful purposes and in accordance with these Terms. You must <strong>not</strong>:</p>
          <ul className="list-none space-y-2">
            {[
              "Use the Service to distribute spam, malware, or harmful content",
              "Violate any applicable laws, regulations, or third-party rights",
              "Attempt to gain unauthorized access to other accounts or our systems",
              "Use automated scripts or bots to access the Service beyond our provided APIs",
              "Post content that is defamatory, obscene, or promotes violence or discrimination",
              "Resell or redistribute the Service without written permission",
              "Circumvent usage limits, rate limits, or feature restrictions",
            ].map((i) => (
              <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{i}</span></li>
            ))}
          </ul>
        </>
      ),
    },
    {
      id: "subscription",
      number: "04",
      title: "Subscription & Billing",
      content: (
        <>
          <p className="mb-3">Flowo offers free and paid subscription plans. By selecting a paid plan:</p>
          <ul className="list-none space-y-2 mb-3">
            {[
              "You authorize us to charge your payment method on a recurring basis (monthly or annual)",
              "Prices are in USD and exclude applicable taxes which will be added at checkout",
              "Plan changes take effect at the start of your next billing cycle",
              "Downgrades may result in loss of access to features available only on higher-tier plans",
            ].map((i) => (
              <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{i}</span></li>
            ))}
          </ul>
          <p>All payments are processed securely by <strong>Stripe</strong>. We do not store your full payment card details. For refund information, please see our <a href="/refund" className="font-medium text-primary underline">Refund Policy</a>.</p>
        </>
      ),
    },
    {
      id: "intellectual-property",
      number: "05",
      title: "Intellectual Property",
      content: (
        <>
          <p className="mb-3"><strong>Our IP:</strong> Flowo, its logo, design, features, and underlying technology are owned by Flowo Inc. and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, or reverse-engineer any part of our Service.</p>
          <p><strong>Your Content:</strong> You retain full ownership of all content you create, upload, or publish through Flowo. By using our Service, you grant us a limited, non-exclusive license to store, process, and display your content solely for the purpose of providing the Service to you.</p>
        </>
      ),
    },
    {
      id: "ai-content",
      number: "06",
      title: "AI-Generated Content",
      content: (
        <>
          <p className="mb-3">Flowo uses artificial intelligence (powered by OpenAI) to generate content suggestions, captions, and ideas. You understand and agree that:</p>
          <ul className="list-none space-y-2">
            {[
              "AI-generated content is provided as suggestions — you are responsible for reviewing and approving all content before publishing",
              "AI outputs may not always be accurate, original, or appropriate for your audience",
              "You are solely responsible for any content you publish, whether AI-generated or manually created",
              "Flowo makes no warranties regarding the quality, accuracy, or legality of AI-generated content",
            ].map((i) => (
              <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{i}</span></li>
            ))}
          </ul>
        </>
      ),
    },
    {
      id: "termination",
      number: "07",
      title: "Termination",
      content: (
        <>
          <p className="mb-3">You may cancel your account at any time from your Settings page. We may suspend or terminate your account if:</p>
          <ul className="list-none space-y-2 mb-3">
            {[
              "You violate these Terms or our Acceptable Use Policy",
              "Your payment fails and is not resolved within 14 days",
              "We reasonably believe your account poses a security risk",
            ].map((i) => (
              <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{i}</span></li>
            ))}
          </ul>
          <p>Upon termination, your right to use the Service ceases immediately. We will retain your data for 30 days after termination, after which it will be permanently deleted.</p>
        </>
      ),
    },
    {
      id: "disclaimers",
      number: "08",
      title: "Disclaimers & Limitation of Liability",
      content: (
        <>
          <p className="mb-3">Flowo is provided <strong>"as is"</strong> and <strong>"as available."</strong> We disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.</p>
          <Callout>To the maximum extent permitted by law, Flowo Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the Service.</Callout>
          <p>Our total liability for any claim related to the Service shall not exceed the amount you paid to Flowo in the 12 months preceding the claim.</p>
        </>
      ),
    },
    {
      id: "indemnification",
      number: "09",
      title: "Indemnification",
      content: (
        <p>You agree to indemnify, defend, and hold harmless Flowo Inc., its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including reasonable attorney's fees) arising from your use of the Service, your content, or your violation of these Terms.</p>
      ),
    },
    {
      id: "governing-law",
      number: "10",
      title: "Governing Law & Disputes",
      content: (
        <>
          <p className="mb-3">These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles.</p>
          <p>Any disputes arising from these Terms or the Service shall first be attempted to be resolved through good-faith negotiation. If negotiation fails, disputes shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, conducted in English in Delaware.</p>
        </>
      ),
    },
    {
      id: "changes",
      number: "11",
      title: "Changes to These Terms",
      content: (
        <p>We reserve the right to modify these Terms at any time. Material changes will be communicated via email or in-app notification at least <strong>30 days</strong> before taking effect. Continued use of Flowo after changes constitutes acceptance. If you disagree with updated Terms, you may cancel your account before the changes take effect.</p>
      ),
    },
  ],
};

const TermsPage = () => <><SEOHead title="Terms of Service — Flowo" description="The rules and agreements that govern your use of the Flowo platform." path="/terms" /><LegalPageLayout data={data} currentPath="/terms" /></>;
export default TermsPage;
