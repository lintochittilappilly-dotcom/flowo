import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, Shield, Info, Mail, ArrowRight, ChevronDown } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface LegalSection {
  id: string;
  number: string;
  title: string;
  content: React.ReactNode;
}

export interface LegalPageData {
  badge: string;
  badgeIcon: React.ReactNode;
  title: string;
  description: string;
  lastUpdated: string;
  readTime: string;
  sections: LegalSection[];
}

interface RelatedPage {
  path: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const allPages: RelatedPage[] = [
  { path: "/privacy", title: "Privacy Policy", description: "How we collect and protect your data", icon: <Shield className="h-5 w-5" /> },
  { path: "/terms", title: "Terms of Service", description: "Rules governing your use of Flowo", icon: <Info className="h-5 w-5" /> },
  { path: "/cookies", title: "Cookie Policy", description: "What cookies we use and why", icon: <Info className="h-5 w-5" /> },
  { path: "/gdpr", title: "GDPR Compliance", description: "Your data rights under GDPR", icon: <Shield className="h-5 w-5" /> },
  { path: "/security", title: "Security", description: "How we keep your data safe", icon: <Shield className="h-5 w-5" /> },
  { path: "/refund", title: "Refund Policy", description: "Our fair approach to refunds", icon: <Info className="h-5 w-5" /> },
];

const Callout = ({ children }: { children: React.ReactNode }) => (
  <div className="my-6 flex gap-3 rounded-md border-l-4 border-primary bg-lavender p-4">
    <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
    <div className="font-body text-sm leading-relaxed text-foreground">{children}</div>
  </div>
);

const LegalPageLayout = ({ data, currentPath }: { data: LegalPageData; currentPath: string }) => {
  const [activeId, setActiveId] = useState(data.sections[0]?.id || "");
  const [tocOpen, setTocOpen] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const relatedPages = useMemo(
    () => allPages.filter((p) => p.path !== currentPath),
    [currentPath]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    data.sections.forEach((s) => {
      const el = sectionRefs.current[s.id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [data.sections]);

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTocOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-lavender to-background py-16 sm:py-20">
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-[0.07]">
          <div className="absolute right-[-10%] top-[10%] h-72 w-72 rounded-full bg-primary blur-3xl" />
          <div className="absolute right-[15%] top-[40%] h-48 w-48 rounded-full bg-secondary blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-start gap-4"
          >
            <span className="inline-flex items-center gap-2 rounded-pill bg-primary/10 px-4 py-1.5 font-heading text-sm font-semibold text-primary">
              {data.badgeIcon}
              {data.badge}
            </span>
            <h1 className="font-heading text-4xl font-bold text-foreground sm:text-5xl">
              {data.title}
            </h1>
            <p className="max-w-xl font-body text-lg text-muted-foreground">
              {data.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-card px-3 py-1.5 font-body text-xs text-muted-foreground shadow-sm">
                <Calendar className="h-3.5 w-3.5" /> Last updated: {data.lastUpdated}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-card px-3 py-1.5 font-body text-xs text-muted-foreground shadow-sm">
                <Clock className="h-3.5 w-3.5" /> {data.readTime}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-card px-3 py-1.5 font-body text-xs text-muted-foreground shadow-sm">
                <Shield className="h-3.5 w-3.5" /> Flowo Inc.
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-[1100px] px-4 py-12 sm:px-6 lg:px-8">
        {/* Mobile TOC */}
        <div className="mb-8 lg:hidden">
          <Collapsible open={tocOpen} onOpenChange={setTocOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card p-4 font-heading text-sm font-semibold text-foreground">
              Table of Contents
              <ChevronDown className={cn("h-4 w-4 transition-transform", tocOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 rounded-lg border bg-card p-4">
              <nav className="flex flex-col gap-1">
                {data.sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className={cn(
                      "rounded-md px-3 py-2 text-left font-body text-sm transition-colors",
                      activeId === s.id
                        ? "bg-lavender font-medium text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {s.number}. {s.title}
                  </button>
                ))}
              </nav>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="flex gap-12">
          {/* Desktop Sticky TOC */}
          <aside className="hidden w-[220px] shrink-0 lg:block">
            <nav className="sticky top-24 flex flex-col gap-0.5">
              <p className="mb-3 font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Contents
              </p>
              {data.sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={cn(
                    "border-l-2 px-3 py-1.5 text-left font-body text-[13px] transition-all",
                    activeId === s.id
                      ? "border-primary font-medium text-primary"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  {s.number}. {s.title}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="min-w-0 flex-1">
            <div className="space-y-10">
              {data.sections.map((s) => (
                <section
                  key={s.id}
                  id={s.id}
                  ref={(el) => { sectionRefs.current[s.id] = el; }}
                  className="scroll-mt-24"
                >
                  <h2 className="mb-4 flex items-center gap-3 border-l-4 border-primary pl-4 font-heading text-xl font-semibold text-foreground">
                    <span className="text-primary">{s.number}.</span> {s.title}
                  </h2>
                  <div className="legal-content font-body text-[15px] leading-relaxed text-foreground/80">
                    {s.content}
                  </div>
                </section>
              ))}
            </div>

            {/* Contact Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-16 overflow-hidden rounded-2xl bg-card shadow-card"
            >
              <div className="h-1 w-full gradient-bg" />
              <div className="p-8 text-center">
                <h3 className="font-heading text-xl font-bold text-foreground">
                  Questions about this policy?
                </h3>
                <p className="mx-auto mt-2 max-w-md font-body text-sm text-muted-foreground">
                  We're happy to clarify anything. Our legal and support teams are here to help.
                </p>
                <a
                  href="mailto:legal@flowo.com"
                  className="mt-3 inline-flex items-center gap-2 font-body text-sm font-semibold text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" /> legal@flowo.com
                </a>
                <div className="mt-4">
                  <Link
                    to="/help"
                    className="inline-flex items-center gap-2 rounded-pill border border-primary/20 bg-lavender px-6 py-2.5 font-heading text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Related Pages */}
            <div className="mt-16">
              <h3 className="mb-6 font-heading text-lg font-bold text-foreground">
                Related Pages
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPages.map((page) => (
                  <Link
                    key={page.path}
                    to={page.path}
                    className="group flex items-start gap-3 rounded-xl border bg-card p-4 transition-all hover:shadow-card"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lavender text-primary">
                      {page.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="font-heading text-sm font-semibold text-foreground group-hover:text-primary">
                        {page.title}
                      </p>
                      <p className="mt-0.5 font-body text-xs text-muted-foreground">
                        {page.description}
                      </p>
                    </div>
                    <ArrowRight className="ml-auto mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </Link>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>

      <Footer />
      <BackToTop />
    </div>
  );
};

export { Callout };
export default LegalPageLayout;
