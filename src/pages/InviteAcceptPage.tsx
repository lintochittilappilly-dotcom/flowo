import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Check, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleConfig } from "@/lib/team-permissions";

type InviteState = "loading" | "valid" | "expired" | "accepted" | "error";

interface InviteData {
  id: string;
  invited_email: string;
  role: string;
  status: string;
  invite_expires_at: string | null;
  owner_user_id: string;
  ownerName?: string;
}

const InviteAcceptPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = searchParams.get("token");

  const [state, setState] = useState<InviteState>("loading");
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("error");
      return;
    }
    checkInvite();
  }, [token]);

  const checkInvite = async () => {
    const { data, error } = await supabase
      .from("team_members")
      .select("id, invited_email, role, status, invite_expires_at, owner_user_id")
      .eq("invite_token", token)
      .single();

    if (error || !data) {
      setState("error");
      return;
    }

    // Fetch owner name
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", data.owner_user_id)
      .single();

    const inviteData: InviteData = {
      ...data,
      ownerName: ownerProfile?.full_name ?? "A workspace owner",
    };
    setInvite(inviteData);

    if (data.status === "active") {
      setState("accepted");
      return;
    }

    if (data.invite_expires_at && new Date(data.invite_expires_at) < new Date()) {
      setState("expired");
      return;
    }

    setState("valid");
  };

  const handleAccept = async () => {
    if (!user || !invite) {
      // Not logged in — save token and redirect to signup
      localStorage.setItem("flowo_invite_token", token ?? "");
      navigate("/signup");
      return;
    }

    setAccepting(true);

    const { error } = await supabase
      .from("team_members")
      .update({
        member_user_id: user.id,
        status: "active",
        accepted_at: new Date().toISOString(),
        full_name: (await supabase.from("profiles").select("full_name").eq("id", user.id).single()).data?.full_name,
      } as any)
      .eq("id", invite.id);

    if (error) {
      setAccepting(false);
      setState("error");
      return;
    }

    // Log activity
    await supabase.from("team_activity").insert({
      owner_user_id: invite.owner_user_id,
      actor_user_id: user.id,
      actor_name: user.email,
      action_type: "member_joined",
      description: `${user.email} joined the workspace as ${invite.role}`,
    } as any);

    navigate("/dashboard");
  };

  const roleConfig = invite ? getRoleConfig(invite.role) : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-[24px] border border-border bg-card p-8 shadow-2xl text-center"
      >
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-2 font-heading text-xl font-bold text-foreground mb-6">
          <Sparkles className="h-5 w-5 text-primary" />
          Flowo
        </Link>

        {state === "loading" && (
          <div className="py-8">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Checking invitation...</p>
          </div>
        )}

        {state === "valid" && invite && (
          <div className="space-y-5">
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground">
                You've been invited!
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                <span className="font-semibold text-foreground">{invite.ownerName}</span> has invited you
                to join their Flowo workspace.
              </p>
            </div>

            {roleConfig && (
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground">Your Role</p>
                <p className="font-heading text-sm font-bold text-foreground mt-1">{roleConfig.label}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{roleConfig.description}</p>
              </div>
            )}

            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full rounded-lg gradient-bg py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {accepting ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : user ? (
                "Accept Invitation"
              ) : (
                "Sign Up to Accept"
              )}
            </button>

            {!user && (
              <p className="text-[11px] text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Log in
                </Link>
              </p>
            )}
          </div>
        )}

        {state === "expired" && (
          <div className="space-y-4 py-4">
            <Clock className="mx-auto h-10 w-10 text-amber-500" />
            <h2 className="font-heading text-lg font-bold text-foreground">Invitation Expired</h2>
            <p className="text-sm text-muted-foreground">
              This invitation has expired. Please ask the workspace owner to send a new invitation.
            </p>
          </div>
        )}

        {state === "accepted" && (
          <div className="space-y-4 py-4">
            <Check className="mx-auto h-10 w-10 text-primary" />
            <h2 className="font-heading text-lg font-bold text-foreground">Already a Member</h2>
            <p className="text-sm text-muted-foreground">
              You are already a member of this workspace.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-lg gradient-bg px-6 py-2.5 text-sm font-bold text-primary-foreground"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {state === "error" && (
          <div className="space-y-4 py-4">
            <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
            <h2 className="font-heading text-lg font-bold text-foreground">Invalid Invitation</h2>
            <p className="text-sm text-muted-foreground">
              This invitation link is invalid or has been revoked.
            </p>
            <Link
              to="/"
              className="inline-block rounded-lg border border-border px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Go Home
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default InviteAcceptPage;
