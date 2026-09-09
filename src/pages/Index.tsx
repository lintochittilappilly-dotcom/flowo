import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import ProblemSection from "@/components/landing/ProblemSection";
import HowItWorks from "@/components/landing/HowItWorks";
import FeaturesSection from "@/components/landing/FeaturesSection";
import SocialProof from "@/components/landing/SocialProof";
import Testimonials from "@/components/landing/Testimonials";
import ComparisonSection from "@/components/landing/ComparisonSection";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import FinalCTA from "@/components/landing/FinalCTA";
import AboutSection from "@/components/landing/AboutSection";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import SEOHead from "@/components/seo-head";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Flowo — Your AI Social Media Team"
        description="Flowo generates, schedules, and publishes your entire social media strategy using AI. Save 15+ hours/week. Start your free 14-day trial today."
        path="/"
      />
      <Navbar />
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <FeaturesSection />
      <SocialProof />
      <Testimonials />
      <ComparisonSection />
      <PricingSection />
      <FAQSection />
      <FinalCTA />
      <AboutSection />
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Index;
