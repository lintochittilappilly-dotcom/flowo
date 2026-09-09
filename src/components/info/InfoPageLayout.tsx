import { ReactNode } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";

interface InfoPageLayoutProps {
  badge: string;
  badgeIcon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}

const InfoPageLayout = ({ badge, badgeIcon, title, description, children }: InfoPageLayoutProps) => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="relative overflow-hidden bg-gradient-to-b from-lavender to-background py-16 sm:py-20">
      <div className="absolute right-0 top-0 h-full w-1/2 opacity-[0.07]">
        <div className="absolute right-[-10%] top-[10%] h-72 w-72 rounded-full bg-primary blur-3xl" />
        <div className="absolute right-[15%] top-[40%] h-48 w-48 rounded-full bg-secondary blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-start gap-4">
          <span className="inline-flex items-center gap-2 rounded-pill bg-primary/10 px-4 py-1.5 font-heading text-sm font-semibold text-primary">
            {badgeIcon}{badge}
          </span>
          <h1 className="font-heading text-4xl font-bold text-foreground sm:text-5xl">{title}</h1>
          <p className="max-w-xl font-body text-lg text-muted-foreground">{description}</p>
        </motion.div>
      </div>
    </section>
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {children}
    </div>
    <Footer />
    <BackToTop />
  </div>
);

export default InfoPageLayout;
