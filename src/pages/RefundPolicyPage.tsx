import { Info, ShieldCheck } from "lucide-react";
import LegalPageLayout, { Callout, type LegalPageData } from "@/components/legal/LegalPageLayout";

const GuaranteeBanner = () => (
  <div className="mb-8 flex items-center gap-4 rounded-xl border-2 border-primary/20 bg-lavender p-6">
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
      <ShieldCheck className="h-8 w-8 text-primary" />
    </span>
    <div>
      <p className="font-heading text-lg font-bold text-primary">30-Day Money Back Guarantee</p>
      <p className="mt-0.5 font-body text-sm text-foreground/70">No questions asked. If Flowo isn't the right fit, we'll refund you in full.</p>
    </div>
  </div>
);

const data: LegalPageData = {
  badge: "Billing",
  badgeIcon: <Info className="h-4 w-4" />,
  title: "Refund Policy",
  description: "Our fair and transparent approach to refunds and cancellations.",
  lastUpdated: "February 15, 2026",
  readTime: "4 min read",
  sections: [
    {
      id: "guarantee",
      number: "01",
      title: "Our Guarantee",
      content: (
        <>
          <GuaranteeBanner />
          <p>We believe in Flowo, and we want you to feel confident when you subscribe. That's why every paid plan comes with a <strong>30-day money back guarantee</strong>. If you're not satisfied with Flowo for any reason within the first 30 days of your subscription, we'll issue a full refund — no questions asked, no hoops to jump through.</p>
        </>
      ),
    },
    {
      id: "how-to-request",
      number: "02",
      title: "How to Request a Refund",
      content: (
        <>
          <p className="mb-3">Requesting a refund is simple:</p>
          <ul className="list-none space-y-2 mb-3">
            {[
              "Email us at billing@flowo.com with the subject line \"Refund Request\"",
              "Include your account email and the reason for your refund (optional but helpful)",
              "Our team will process your request within 1-2 business days",
              "Refunds are issued to your original payment method via Stripe",
              "Funds typically appear in your account within 5-10 business days, depending on your bank",
            ].map((i) => (
              <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{i}</span></li>
            ))}
          </ul>
          <Callout>You can also request a refund directly from your Settings page under Billing. Click "Request Refund" and our team will be notified automatically.</Callout>
        </>
      ),
    },
    {
      id: "monthly-plans",
      number: "03",
      title: "Monthly Plan Refunds",
      content: (
        <>
          <p className="mb-3">For monthly subscriptions:</p>
          <ul className="list-none space-y-2">
            {[
              "Within 30 days of your first payment — full refund, no questions asked",
              "After 30 days — no refund for the current billing period, but you can cancel anytime to prevent future charges",
              "Cancellation takes effect at the end of your current billing cycle — you retain access until then",
            ].map((i) => (
              <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{i}</span></li>
            ))}
          </ul>
        </>
      ),
    },
    {
      id: "annual-plans",
      number: "04",
      title: "Annual Plan Refunds",
      content: (
        <>
          <p className="mb-3">For annual subscriptions:</p>
          <ul className="list-none space-y-2">
            {[
              "Within 30 days of payment — full refund, no questions asked",
              "Between 30 and 90 days — prorated refund for the remaining unused months",
              "After 90 days — no refund, but you can cancel and retain access until your annual period ends",
            ].map((i) => (
              <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{i}</span></li>
            ))}
          </ul>
          <Callout>Annual plans offer significant savings over monthly billing. The prorated refund window (30-90 days) ensures fairness while reflecting the discounted rate you received.</Callout>
        </>
      ),
    },
    {
      id: "not-eligible",
      number: "05",
      title: "What's Not Eligible for Refund",
      content: (
        <ul className="list-none space-y-2">
          {[
            "AI credit add-ons that have already been consumed or used",
            "One-time setup fees or professional onboarding services",
            "Accounts terminated for violation of our Terms of Service",
            "Chargebacks filed through your bank without first contacting us (we may dispute these)",
          ].map((i) => (
            <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{i}</span></li>
          ))}
        </ul>
      ),
    },
    {
      id: "cancellation",
      number: "06",
      title: "How to Cancel Your Subscription",
      content: (
        <>
          <p className="mb-3">You can cancel your Flowo subscription at any time:</p>
          <ul className="list-none space-y-2 mb-3">
            {[
              "Go to Settings → Billing → Cancel Subscription",
              "Confirm your cancellation (we may ask for optional feedback)",
              "Your account remains active until the end of your current billing period",
              "After your billing period ends, your account reverts to the Free plan",
            ].map((i) => (
              <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{i}</span></li>
            ))}
          </ul>
          <p>You can reactivate your subscription at any time from your Settings page. Your data and content will be preserved.</p>
        </>
      ),
    },
    {
      id: "after-refund",
      number: "07",
      title: "What Happens After a Refund",
      content: (
        <>
          <p className="mb-3">After a refund is processed:</p>
          <ul className="list-none space-y-2">
            {[
              "Your account immediately reverts to the Free plan with limited features",
              "Scheduled posts that haven't been published yet will be paused — they won't be deleted",
              "Your content, analytics history, and connected accounts are preserved for 30 days",
              "After 30 days on the Free plan without resubscribing, content beyond Free plan limits may be archived",
              "You can re-subscribe at any time to regain full access",
            ].map((i) => (
              <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{i}</span></li>
            ))}
          </ul>
        </>
      ),
    },
    {
      id: "scheduled-posts",
      number: "08",
      title: "Scheduled Posts After Cancellation",
      content: (
        <>
          <p className="mb-3">When your subscription ends (whether by cancellation or refund):</p>
          <ul className="list-none space-y-2">
            {[
              "Posts scheduled within your remaining billing period will still be published as planned",
              "Posts scheduled after your billing period ends will be paused and moved to drafts",
              "You'll receive an email notification listing all affected scheduled posts",
              "Published posts remain on your social media accounts — Flowo doesn't remove them",
            ].map((i) => (
              <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{i}</span></li>
            ))}
          </ul>
          <Callout>We strongly recommend reviewing your scheduled posts before canceling to avoid any surprises with your social media calendar.</Callout>
        </>
      ),
    },
    {
      id: "contact",
      number: "09",
      title: "Billing Questions",
      content: (
        <>
          <p>For any billing or refund questions, reach out to our billing team:</p>
          <div className="mt-3 rounded-lg border bg-lavender/50 p-4 font-body text-sm">
            <p><strong>Flowo Billing Team</strong></p>
            <p>Email: <a href="mailto:billing@flowo.com" className="font-medium text-primary underline">billing@flowo.com</a></p>
            <p>Response time: Within 1 business day</p>
          </div>
        </>
      ),
    },
  ],
};

const RefundPolicyPage = () => <LegalPageLayout data={data} currentPath="/refund" />;
export default RefundPolicyPage;
