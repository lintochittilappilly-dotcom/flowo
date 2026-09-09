import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  full_name: string | null;
  plan: string;
  completed_onboarding: boolean;
  shown_welcome_modal: boolean;
  business_name: string | null;
  industry: string | null;
  role: string | null;
  business_size: string | null;
  brand_tones: string[] | null;
  brand_description: string | null;
  sample_posts: string | null;
  connected_platforms: string[] | null;
  dismissed_setup_checklist?: boolean;
  email?: string | null;
  // Trial fields
  trial_ends_at: string | null;
  trial_expired: boolean | null;
}

// Helper to check if user has active access (trial or paid plan)
export function hasActiveAccess(profile: Profile | null): boolean {
  if (!profile) return false;
  const plan = profile.plan ?? "none";
  
  // Paid plans always have access
  if (["starter", "pro", "agency"].includes(plan)) return true;
  
  // Active trial
  if (plan === "trial") {
    if (profile.trial_expired) return false;
    if (!profile.trial_ends_at) return false;
    return new Date(profile.trial_ends_at) > new Date();
  }
  
  return false;
}

// Calculate days left in trial
export function getTrialDaysLeft(profile: Profile | null): number {
  if (!profile?.trial_ends_at) return 0;
  const msLeft = new Date(profile.trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data as Profile | null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
