import { Link } from "react-router-dom";
import { Instagram, Linkedin, Twitter, Facebook, Youtube, Heart } from "lucide-react";

type FooterLink = { label: string; path?: string; href?: string };

const footerLinks: Record<string, FooterLink[]> = {
  Product: [
    { label: "Features", path: "/#features" },
    { label: "How It Works", path: "/#how-it-works" },
    { label: "Pricing", path: "/#pricing" },
    { label: "Changelog", path: "/changelog" },
    { label: "Roadmap", path: "/roadmap" },
    { label: "API Documentation", path: "/api-docs" },
  ],
  Company: [
    { label: "About Us", path: "/about" },
    { label: "Partnerships", path: "/partnerships" },
    { label: "Contact Us", path: "/contact" },
  ],
  Support: [
    { label: "Help Center", path: "/help-center" },
    { label: "Getting Started Guide", path: "/getting-started" },
    { label: "Community Forum", path: "/community" },
    { label: "System Status", path: "/status" },
  ],
  Legal: [
    { label: "Privacy Policy", path: "/privacy" },
    { label: "Terms of Service", path: "/terms" },
    { label: "Cookie Policy", path: "/cookies" },
    { label: "GDPR Compliance", path: "/gdpr" },
    { label: "Security", path: "/security" },
    { label: "Refund Policy", path: "/refund" },
  ],
};

const socials = [
  { icon: Instagram, label: "Instagram" },
  { icon: Linkedin, label: "LinkedIn" },
  { icon: Twitter, label: "Twitter" },
  { icon: Facebook, label: "Facebook" },
  { icon: Youtube, label: "YouTube" },
];

const Footer = () => (
  <footer className="bg-midnight">
    <div className="h-px w-full bg-primary/30" />
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      {/* Top row */}
      <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
        <div>
          <a href="#" className="font-heading text-2xl font-bold text-primary-foreground">Flowo</a>
          <p className="mt-1 font-body text-sm text-primary-foreground/50">Your AI Social Media Team</p>
        </div>
        <div className="flex gap-3">
          {socials.map((s) => (
            <a
              key={s.label}
              href="#"
              aria-label={s.label}
              className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-foreground/10 text-primary-foreground/60 transition-colors hover:bg-primary-foreground/20 hover:text-primary-foreground"
            >
              <s.icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>

      {/* Links grid */}
      <div className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
        {Object.entries(footerLinks).map(([heading, links]) => (
          <div key={heading}>
            <h4 className="font-heading text-sm font-bold text-primary-foreground">{heading}</h4>
            <ul className="mt-4 space-y-2.5">
              {links.map((link) => (
                <li key={link.label}>
                  {link.path ? (
                    <Link to={link.path} className="font-body text-sm text-primary-foreground/50 transition-colors hover:text-primary-foreground">
                      {link.label}
                    </Link>
                  ) : link.href ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className="font-body text-sm text-primary-foreground/50 transition-colors hover:text-primary-foreground">
                      {link.label}
                    </a>
                  ) : (
                    <a href="#" className="font-body text-sm text-primary-foreground/50 transition-colors hover:text-primary-foreground">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 h-px w-full bg-primary-foreground/10" />

      {/* Bottom */}
      <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="font-body text-xs text-primary-foreground/40">
          © 2024 Flowo Inc. All rights reserved. Made with <Heart className="inline h-3 w-3 fill-current text-secondary" /> for small business owners everywhere.
        </p>
        <div className="flex gap-4 text-xs text-primary-foreground/40">
          <span>SSL Secured</span>
          <span>Stripe Payments</span>
          <span>4.9/5 Rated</span>
          <span>GDPR Compliant</span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
