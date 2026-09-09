import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Mail, Shield, Eye, Pen, X, Copy, Check,
  MoreHorizontal, RefreshCw, UserMinus, Clock, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanGate } from "@/hooks/use-plan-gate";
import { PlanGate } from "@/components/plan-gate/plan-gate";
import {
  ROLE_PERMISSIONS,
  PERMISSION_LABELS,
  getRoleConfig,
  type Role,
  type Permission,
} from "@/lib/team-permissions";
import { getLimit, isUnlimited } from "@/lib/plan-features";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TeamMember {
  id: string;
  invited_email: string;
  full_name: string | null;
  role: string;
  status: string;
  permissions: Record<string, boolean> | null;
  invite_token: string | null;
  invited_at: string;
  accepted_at: string | null;
  last_active_at: string | null;
}

interface TeamActivity {
  id: string;
  actor_name: string | null;
  action_type: string;
  description: string;
  created_at: string;
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const ROLE_BADGE_STYLES: Record<string, string> = {
  admin: "bg-primary/10 text-primary",
  editor: "bg-secondary/10 text-secondary",
  viewer: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  suspended: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  removed: "bg-muted text-muted-foreground",
};

const TeamMembersTab = () => {
  const { user, profile } = useAuth();
  const { plan } = usePlanGate();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [activity, setActivity] = useState<TeamActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const memberLimit = getLimit(plan, "team_members");
  const isUnlimitedMembers = isUnlimited(plan, "team_members");
  const activeCount = members.filter((m) => ["active", "pending"].includes(m.status)).length;

  const loadMembers = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("team_members")
      .select("id, invited_email, full_name, role, status, permissions, invite_token, invited_at, accepted_at, last_active_at")
      .eq("owner_user_id", user.id)
      .neq("status", "removed")
      .order("invited_at", { ascending: false });
    setMembers((data as TeamMember[]) ?? []);
    setLoading(false);
  }, [user]);

  const loadActivity = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("team_activity")
      .select("id, actor_name, action_type, description, created_at")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setActivity((data as TeamActivity[]) ?? []);
  }, [user]);

  useEffect(() => {
    loadMembers();
    loadActivity();
  }, [loadMembers, loadActivity]);

  const handleRemove = async (memberId: string) => {
    await supabase
      .from("team_members")
      .update({ status: "removed" } as any)
      .eq("id", memberId);
    toast.success("Team member removed");
    loadMembers();

    // Log activity
    if (user) {
      await supabase.from("team_activity").insert({
        owner_user_id: user.id,
        actor_user_id: user.id,
        actor_name: profile?.full_name ?? "Owner",
        action_type: "member_removed",
        description: "Removed a team member",
      } as any);
      loadActivity();
    }
  };

  const handleResendInvite = async (member: TeamMember) => {
    // Generate new token
    const newToken = crypto.randomUUID() + "-" + Date.now();
    await supabase
      .from("team_members")
      .update({
        invite_token: newToken,
        invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      } as any)
      .eq("id", member.id);
    toast.success("Invitation resent! Share the invite link.");
    loadMembers();
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    const rolePerms = ROLE_PERMISSIONS[newRole as Role]?.permissions ?? ROLE_PERMISSIONS.editor.permissions;
    await supabase
      .from("team_members")
      .update({ role: newRole, permissions: rolePerms } as any)
      .eq("id", memberId);
    toast.success(`Role updated to ${newRole}`);
    loadMembers();
  };

  const copyInviteLink = (token: string | null) => {
    if (!token) return;
    const url = `${window.location.origin}/invite/accept?token=${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied!");
  };

  return (
    <PlanGate feature="team_collaboration">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-base font-bold text-foreground">Team Members</h3>
            <p className="text-sm text-muted-foreground">
              {activeCount} {isUnlimitedMembers ? "members" : `of ${memberLimit} members`}
            </p>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            disabled={!isUnlimitedMembers && activeCount >= memberLimit}
            className="flex items-center gap-1.5 rounded-lg gradient-bg px-4 py-2 text-xs font-bold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-3.5 w-3.5" /> Invite Member
          </button>
        </div>

        {/* Members list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-4 text-sm font-semibold text-foreground">Invite your team</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Collaborate with teammates to manage your social media content together.
            </p>
            <button
              onClick={() => setShowInvite(true)}
              className="mt-5 rounded-lg gradient-bg px-6 py-2.5 text-xs font-bold text-primary-foreground"
            >
              Invite First Member
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Member</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Role</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Last Active</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const initials = (m.full_name || m.invited_email)
                    .split(/[@\s]/)
                    .slice(0, 2)
                    .map((s) => s[0]?.toUpperCase())
                    .join("");
                  return (
                    <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-bg text-[10px] font-bold text-primary-foreground">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {m.full_name || m.invited_email}
                            </p>
                            {m.full_name && (
                              <p className="text-[10px] text-muted-foreground truncate">{m.invited_email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${ROLE_BADGE_STYLES[m.role] ?? ROLE_BADGE_STYLES.editor}`}>
                          {getRoleConfig(m.role).label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[m.status] ?? STATUS_STYLES.pending}`}>
                          {m.status === "active" && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                          {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                        {m.status === "active" ? relativeTime(m.last_active_at) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {m.status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => handleResendInvite(m)}>
                                  <RefreshCw className="mr-2 h-3.5 w-3.5" /> Resend Invite
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => copyInviteLink(m.invite_token)}>
                                  <Copy className="mr-2 h-3.5 w-3.5" /> Copy Invite Link
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem onClick={() => handleRoleChange(m.id, "admin")}>
                              <Shield className="mr-2 h-3.5 w-3.5" /> Set as Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(m.id, "editor")}>
                              <Pen className="mr-2 h-3.5 w-3.5" /> Set as Editor
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(m.id, "viewer")}>
                              <Eye className="mr-2 h-3.5 w-3.5" /> Set as Viewer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRemove(m.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <UserMinus className="mr-2 h-3.5 w-3.5" /> Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Team Activity Feed */}
        {activity.length > 0 && (
          <div>
            <h4 className="font-heading text-sm font-bold text-foreground mb-3">Recent Activity</h4>
            <div className="space-y-2">
              {activity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {(a.actor_name || "?")[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-foreground">{a.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {a.actor_name && <span className="font-semibold">{a.actor_name}</span>}
                      {" · "}
                      {relativeTime(a.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invite Modal */}
        <InviteModal
          open={showInvite}
          onClose={() => setShowInvite(false)}
          onSuccess={() => {
            loadMembers();
            loadActivity();
          }}
        />
      </div>
    </PlanGate>
  );
};

/* ─── Invite Modal ─── */

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function InviteModal({ open, onClose, onSuccess }: InviteModalProps) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("editor");
  const [perms, setPerms] = useState<Record<string, boolean>>(
    { ...ROLE_PERMISSIONS.editor.permissions }
  );
  const [sending, setSending] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  const resetAndClose = () => {
    setStep(1);
    setEmail("");
    setRole("editor");
    setPerms({ ...ROLE_PERMISSIONS.editor.permissions });
    setInviteLink("");
    setCopied(false);
    onClose();
  };

  const selectRole = (r: Role) => {
    setRole(r);
    setPerms({ ...ROLE_PERMISSIONS[r].permissions });
  };

  const handleSend = async () => {
    if (!email.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }
    if (!user) return;
    setSending(true);

    // Check if already invited
    const { data: existing } = await supabase
      .from("team_members")
      .select("id, status")
      .eq("owner_user_id", user.id)
      .eq("invited_email", email.toLowerCase())
      .single();

    if (existing?.status === "active") {
      toast.error("This person is already on your team");
      setSending(false);
      return;
    }

    const inviteToken = crypto.randomUUID() + "-" + Date.now();

    const { error } = await supabase
      .from("team_members")
      .upsert(
        {
          owner_user_id: user.id,
          invited_email: email.toLowerCase(),
          role,
          permissions: perms,
          status: "pending",
          invite_token: inviteToken,
          invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        } as any,
        { onConflict: "id" }
      );

    if (error) {
      toast.error("Failed to send invitation");
      setSending(false);
      return;
    }

    // Log activity
    await supabase.from("team_activity").insert({
      owner_user_id: user.id,
      actor_user_id: user.id,
      actor_name: profile?.full_name ?? "Owner",
      action_type: "member_invited",
      description: `Invited ${email} as ${role}`,
      metadata: { email, role },
    } as any);

    const link = `${window.location.origin}/invite/accept?token=${inviteToken}`;
    setInviteLink(link);
    toast.success("Invitation created! Share the link with your teammate.");
    setSending(false);
    onSuccess();
    setStep(3);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Invite link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
          onClick={resetAndClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-[20px] border border-border bg-card shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-heading text-base font-bold text-foreground">
                {step === 1 && "Invite Team Member"}
                {step === 2 && "Select Role"}
                {step === 3 && "Invitation Created"}
              </h3>
              <button onClick={resetAndClose} className="rounded-md p-1 hover:bg-muted">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6">
              {/* Step 1: Email */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground">Email Address</label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="teammate@company.com"
                        className="w-full rounded-lg border border-border bg-background pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        autoFocus
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!email.includes("@")) {
                        toast.error("Enter a valid email");
                        return;
                      }
                      setStep(2);
                    }}
                    className="w-full rounded-lg gradient-bg py-2.5 text-sm font-bold text-primary-foreground"
                  >
                    Continue
                  </button>
                </div>
              )}

              {/* Step 2: Role selection + permissions */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-3">
                    {(Object.keys(ROLE_PERMISSIONS) as Role[]).map((r) => {
                      const rc = ROLE_PERMISSIONS[r];
                      const selected = role === r;
                      return (
                        <button
                          key={r}
                          onClick={() => selectRole(r)}
                          className={`rounded-xl border-2 p-3 text-left transition-all ${
                            selected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground/30"
                          }`}
                        >
                          <p className="text-sm font-bold text-foreground">{rc.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                            {rc.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Permission toggles */}
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">Customize Permissions</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(PERMISSION_LABELS) as Permission[]).map((p) => (
                        <label
                          key={p}
                          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={perms[p] ?? false}
                            onChange={(e) =>
                              setPerms((prev) => ({ ...prev, [p]: e.target.checked }))
                            }
                            className="h-3.5 w-3.5 rounded border-border accent-primary"
                          />
                          <span className="text-[11px] text-foreground">{PERMISSION_LABELS[p].name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={sending}
                      className="flex-1 rounded-lg gradient-bg py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
                    >
                      {sending ? (
                        <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                      ) : (
                        "Send Invitation"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Invite link */}
              {step === 3 && (
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Invitation sent to {email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Share this invite link with your teammate. It expires in 7 days.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                    <code className="flex-1 text-[10px] font-mono text-foreground truncate">
                      {inviteLink}
                    </code>
                    <button
                      onClick={copyLink}
                      className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-[10px] font-bold text-primary-foreground"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <button
                    onClick={resetAndClose}
                    className="w-full rounded-lg border border-border py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default TeamMembersTab;
