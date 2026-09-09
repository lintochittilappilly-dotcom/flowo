import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AuthRedirect from "@/components/auth/AuthRedirect";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import ContentCalendar from "./pages/ContentCalendar";
import CreatePost from "./pages/CreatePost";
import AnalyticsPage from "./pages/AnalyticsPage";
import CommentsPage from "./pages/CommentsPage";
import TrendsPage from "./pages/TrendsPage";
import ImageGenerationPage from "./pages/ImageGenerationPage";
import BrandsPage from "./pages/BrandsPage";
import SettingsPage from "./pages/SettingsPage";
import HelpPage from "./pages/HelpPage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import OnboardingPage from "./pages/OnboardingPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import CookiePolicyPage from "./pages/CookiePolicyPage";
import GDPRPage from "./pages/GDPRPage";
import SecurityPage from "./pages/SecurityPage";
import RefundPolicyPage from "./pages/RefundPolicyPage";
import AboutUsPage from "./pages/AboutUsPage";
import ContactUsPage from "./pages/ContactUsPage";
import HelpCenterPage from "./pages/HelpCenterPage";
import GettingStartedPage from "./pages/GettingStartedPage";
import SystemStatusPage from "./pages/SystemStatusPage";
import CommunityForumPage from "./pages/CommunityForumPage";
import PartnershipsPage from "./pages/PartnershipsPage";
import RoadmapPage from "./pages/RoadmapPage";
import APIDocumentationPage from "./pages/APIDocumentationPage";
import ChangelogPage from "./pages/ChangelogPage";
import InviteAcceptPage from "./pages/InviteAcceptPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />

            {/* Legal pages */}
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/cookies" element={<CookiePolicyPage />} />
            <Route path="/gdpr" element={<GDPRPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/refund" element={<RefundPolicyPage />} />

            {/* Info pages */}
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/contact" element={<ContactUsPage />} />
            <Route path="/help-center" element={<HelpCenterPage />} />
            <Route path="/getting-started" element={<GettingStartedPage />} />
            <Route path="/status" element={<SystemStatusPage />} />
            <Route path="/community" element={<CommunityForumPage />} />
            <Route path="/partnerships" element={<PartnershipsPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/api-docs" element={<APIDocumentationPage />} />
            <Route path="/changelog" element={<ChangelogPage />} />

            {/* Auth routes */}
            <Route path="/signup" element={<AuthRedirect><SignupPage /></AuthRedirect>} />
            <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/auth/callback/:platform" element={<OAuthCallbackPage />} />
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
            <Route path="/invite/accept" element={<InviteAcceptPage />} />

            {/* Dashboard routes */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/calendar" element={<ContentCalendar />} />
              <Route path="/create" element={<CreatePost />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/comments" element={<CommentsPage />} />
              <Route path="/trends" element={<TrendsPage />} />
              <Route path="/image-gen" element={<ImageGenerationPage />} />
              <Route path="/brands" element={<BrandsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/help" element={<HelpPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
