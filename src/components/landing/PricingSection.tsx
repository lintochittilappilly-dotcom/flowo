import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, Shield, CreditCard, RefreshCw, Star } from "lucide-react";
import SectionBadge from "./SectionBadge";

const plans = [
  {
    name: "Starter",
    monthly: 49,
    annual: 39,
    tagline: "Everything you need to get started",
    featured: false,
    features: [
      "1 brand profile",
      "3 social accounts",
      "30 AI-generated posts/month",
      "Content calendar",
      "Basic analytics",
      "Auto-scheduling",
      "Email support",
    ],
  },
  {
    name: "Pro",
    monthly: 99,
    annual: 79,
    tagline: "The complete social media system",
    featured: true,
    features: [
      "3 brand profiles",
      "10 social accounts",
      "Unlimited AI-generated posts",
      "30-day content calendar",
      "Advanced analytics & reports",
      "Trend detection alerts",
      "Brand voice training",
      "AI comment manager",
      "AI image generator",
      "Priority support",
    ],
  },
  {
    name: "Agency",
    monthly: 199,
    annual: 159,
    tagline: "Manage all your clients from one dashboard",
    featured: false,
    features: [
      "Unlimited brand profiles",
      "Unlimited social accounts",
      "Unlimited AI-generated posts",
      "30-day content calendar",
      "Trend detection alerts",
      "Brand voice training",
      "AI comment & DM manager",
      "AI image generator",
      "Dedicated account manager",
      "API access",
    ],
  },
];

const trustItems = [
  { icon: Lock, label: "SSL Secured" },
  { icon: Shield, label: "30-Day Money Back" },
  { icon: CreditCard, label: "No Credit Card Needed" },
  { icon: RefreshCw, label: "Cancel Anytime" },
  { icon: Star, label: "4.9/5 Rated" },
];

const PricingSection = () => {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="bg-lavender/50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <SectionBadge text="Simple Pricing" />
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-4 font-heading text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl"
          >
            One Price. No Surprises. Cancel Anytime.
          </motion.h2>
        </div>

        {/* Toggle */}
        <div className="mt-10 flex items-center justify-center">
          <div className="relative inline-grid grid-cols-2 rounded-pill bg-card p-1 shadow-card">
            {/* Sliding pill */}
            <div
              className={`absolute inset-y-1 w-[calc(50%-4px)] rounded-pill gradient-bg shadow-md transition-all duration-300 ease-out ${
                annual ? "left-[calc(50%+2px)]" : "left-1"
              }`}
            />
            <button
              onClick={() => setAnnual(false)}
              className={`relative z-10 rounded-pill px-6 py-2.5 font-heading text-sm font-semibold transition-colors duration-300 ${
                !annual ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`relative z-10 flex items-center justify-center gap-2 rounded-pill px-6 py-2.5 font-heading text-sm font-semibold transition-colors duration-300 ${
                annual ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual
              <span className={`rounded-pill px-2 py-0.5 text-[10px] font-bold transition-colors duration-300 ${
                annual ? "bg-success text-success-foreground" : "bg-success/15 text-success"
              }`}>
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="mt-12 grid items-center gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-lg p-8 transition-all duration-300 ${
                plan.featured
                  ? "gradient-bg relative scale-105 text-primary-foreground shadow-2xl shadow-primary/30 lg:py-12"
                  : "bg-card text-foreground shadow-card hover:shadow-card-hover"
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-pill bg-secondary px-4 py-1 text-xs font-bold text-secondary-foreground">
                  Most Popular
                </span>
              )}
              <h3 className="font-heading text-lg font-bold">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-heading text-5xl font-extrabold">
                  ${annual ? plan.annual : plan.monthly}
                </span>
                <span className={`text-sm ${plan.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>/month</span>
              </div>
              {annual && (
                <p className={`mt-1 text-xs ${plan.featured ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  Billed annually (${(annual ? plan.annual : plan.monthly) * 12}/year)
                </p>
              )}
              <p className={`mt-3 font-body text-sm ${plan.featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {plan.tagline}
              </p>
              <div className={`my-6 h-px ${plan.featured ? "bg-primary-foreground/20" : "bg-border"}`} />
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`h-4 w-4 mt-0.5 shrink-0 ${plan.featured ? "text-success-foreground" : "text-success"}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to={`/signup?plan=${plan.name.toLowerCase()}`}
                className={`mt-8 block w-full rounded-pill py-3 text-center font-heading text-sm font-bold transition-all duration-300 hover:scale-105 ${
                  plan.featured
                    ? "bg-card text-primary shadow-lg"
                    : "border-2 border-primary text-primary hover:bg-primary/5"
                }`}
              >
                Start Free 14-Day Trial
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Trust row */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {trustItems.map((t) => (
            <div key={t.label} className="flex items-center gap-2 text-muted-foreground">
              <t.icon className="h-4 w-4" />
              <span className="font-body text-xs font-medium">{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
