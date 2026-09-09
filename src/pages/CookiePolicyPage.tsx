import { Info } from "lucide-react";
import LegalPageLayout, { Callout, type LegalPageData } from "@/components/legal/LegalPageLayout";

const CookieTable = () => (
  <div className="my-4 overflow-x-auto rounded-lg border">
    <table className="w-full text-left font-body text-sm">
      <thead className="bg-lavender">
        <tr>
          <th className="px-4 py-3 font-heading text-xs font-semibold text-foreground">Cookie Name</th>
          <th className="px-4 py-3 font-heading text-xs font-semibold text-foreground">Purpose</th>
          <th className="px-4 py-3 font-heading text-xs font-semibold text-foreground">Duration</th>
          <th className="px-4 py-3 font-heading text-xs font-semibold text-foreground">Type</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {[
          ["sb-access-token", "Supabase authentication session", "1 hour", "Essential"],
          ["sb-refresh-token", "Supabase session refresh", "7 days", "Essential"],
          ["flowo_session", "Application session management", "Session", "Essential"],
          ["flowo_preferences", "User UI preferences (theme, sidebar)", "1 year", "Preference"],
          ["_ga", "Google Analytics — unique visitor tracking", "2 years", "Analytics"],
          ["_ga_*", "Google Analytics — session tracking", "1 year", "Analytics"],
          ["__stripe_mid", "Stripe fraud prevention", "1 year", "Essential"],
          ["__stripe_sid", "Stripe checkout session", "30 min", "Essential"],
          ["flowo_consent", "Cookie consent preferences", "1 year", "Essential"],
          ["_fbp", "Facebook Pixel (if ads enabled)", "90 days", "Marketing"],
        ].map(([name, purpose, duration, type]) => (
          <tr key={name} className="hover:bg-lavender/30">
            <td className="px-4 py-2.5 font-mono text-xs text-primary">{name}</td>
            <td className="px-4 py-2.5 text-foreground/80">{purpose}</td>
            <td className="px-4 py-2.5 text-muted-foreground">{duration}</td>
            <td className="px-4 py-2.5">
              <span className={`rounded-pill px-2 py-0.5 text-xs font-medium ${
                type === "Essential" ? "bg-primary/10 text-primary" :
                type === "Analytics" ? "bg-secondary/10 text-secondary" :
                type === "Preference" ? "bg-success/10 text-success" :
                "bg-muted text-muted-foreground"
              }`}>{type}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const data: LegalPageData = {
  badge: "Cookies",
  badgeIcon: <Info className="h-4 w-4" />,
  title: "Cookie Policy",
  description: "What cookies Flowo uses and how to control them.",
  lastUpdated: "February 15, 2026",
  readTime: "5 min read",
  sections: [
    {
      id: "what-are-cookies",
      number: "01",
      title: "What Are Cookies?",
      content: (
        <p>Cookies are small text files placed on your device when you visit a website. They help websites remember your preferences, keep you signed in, and understand how you use the site. Cookies can be "first-party" (set by Flowo) or "third-party" (set by services we use like Google Analytics or Stripe).</p>
      ),
    },
    {
      id: "types",
      number: "02",
      title: "Types of Cookies We Use",
      content: (
        <>
          <p className="mb-3"><strong>Essential Cookies:</strong> Required for Flowo to function properly. These handle authentication, security, and basic session management. You cannot opt out of these cookies — without them, the app won't work.</p>
          <p className="mb-3"><strong>Analytics Cookies:</strong> Help us understand how users interact with Flowo so we can improve the experience. We use Google Analytics with IP anonymization enabled. These cookies track page views, feature usage, and session duration.</p>
          <p className="mb-3"><strong>Preference Cookies:</strong> Remember your settings and UI preferences, like sidebar state, theme preference, and language. These make your experience more personalized.</p>
          <p><strong>Marketing Cookies:</strong> Used only if we run advertising campaigns. These cookies help us measure the effectiveness of our ads and avoid showing you irrelevant ones. We currently use these minimally.</p>
        </>
      ),
    },
    {
      id: "cookie-table",
      number: "03",
      title: "Cookie Reference Table",
      content: (
        <>
          <p className="mb-2">Below is a detailed list of cookies used by Flowo and our third-party partners:</p>
          <CookieTable />
        </>
      ),
    },
    {
      id: "third-party",
      number: "04",
      title: "Third-Party Cookies",
      content: (
        <>
          <p className="mb-3">Some cookies are placed by services we integrate with:</p>
          <ul className="list-none space-y-2">
            {[
              { name: "Google Analytics", purpose: "Anonymized usage analytics to improve Flowo" },
              { name: "Stripe", purpose: "Payment processing and fraud prevention" },
              { name: "Supabase", purpose: "Authentication session management" },
            ].map((p) => (
              <li key={p.name} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span><strong>{p.name}</strong> — {p.purpose}</span></li>
            ))}
          </ul>
          <p className="mt-3">These third parties have their own privacy policies governing their use of cookies. We encourage you to review them.</p>
        </>
      ),
    },
    {
      id: "consent",
      number: "05",
      title: "Cookie Consent",
      content: (
        <>
          <p>When you first visit Flowo, a cookie consent banner appears allowing you to accept or customize your cookie preferences. Essential cookies are always active. You can change your preferences at any time from your account Settings page.</p>
          <Callout>Your cookie consent choice is stored in the <strong>flowo_consent</strong> cookie so we can remember your preferences across visits.</Callout>
        </>
      ),
    },
    {
      id: "manage",
      number: "06",
      title: "Managing & Deleting Cookies",
      content: (
        <>
          <p className="mb-3">You can control cookies through your browser settings. Here's how to manage cookies in popular browsers:</p>
          <ul className="list-none space-y-2 mb-3">
            {[
              "Chrome: Settings → Privacy and Security → Cookies and other site data",
              "Firefox: Settings → Privacy & Security → Cookies and Site Data",
              "Safari: Preferences → Privacy → Manage Website Data",
              "Edge: Settings → Privacy, search, and services → Cookies",
            ].map((i) => (
              <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{i}</span></li>
            ))}
          </ul>
          <Callout>Blocking essential cookies may prevent Flowo from functioning correctly. We recommend keeping essential cookies enabled for the best experience.</Callout>
        </>
      ),
    },
    {
      id: "changes",
      number: "07",
      title: "Changes to This Policy",
      content: (
        <p>We may update this Cookie Policy as we add new features or integrate new services. When we make changes, we'll update the "Last updated" date at the top of this page. Significant changes may trigger a new cookie consent prompt.</p>
      ),
    },
  ],
};

const CookiePolicyPage = () => <LegalPageLayout data={data} currentPath="/cookies" />;
export default CookiePolicyPage;
