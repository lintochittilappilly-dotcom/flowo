import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Instagram, Linkedin, Twitter, Facebook, Music, Pin,
  Check, Loader2, X, Shield, ExternalLink, AlertTriangle, RefreshCw, Lock, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { OAUTH_PLATFORMS, PLATFORM_KEYS } from "@/lib/oauth-config";
import { usePlanGate } from "@/hooks/use-plan-gate";
import { getPlanPlatforms } from "@/lib/plan-features";
import { UpgradeModal } from "@/components/plan-gate/upgrade-modal";

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  tiktok: Music,
  pinterest: Pin,
};

interface ConnectedAccount {
  id: string;
  platform: string;
  username: string;
  profilePicture: string | null;
  followersCount: number;
  connected: boolean;
  needsReconnect: boolean;
  errorMessage: string | null;
  connectedAt: string | null;
}

interface Props {
  brandId: string | null;
}

const ConnectedAccountsTab = ({ brandId }: Props) => {
  const { user } = useAuth();
  const { plan } = usePlanGate();
  const allowedPlatforms = getPlanPlatforms(plan);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [disconnectingPlatform, setDisconnectingPlatform] = useState<string | null>(null);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [platformStatuses, setPlatformStatuses] = useState<Record<string, boolean>>({});
  const [showUpgrade, setShowUpgrade] = useState(false);

  const loadAccounts = async () => {
    if (!user) return;
    try {
      const { data: sa } = await supabase
        .from("social_accounts")
        .select("*")
        .eq("user_id", user.id);

      const mapped: ConnectedAccount[] = PLATFORM_KEYS.map((key) => {
        const found = (sa ?? []).find(
          (a: any) => a.platform?.toLowerCase() === key && a.is_active
        );
        return {
          id: found?.id || "",
          platform: key,
          username: found?.platform_username || found?.account_name || "",
          profilePicture: found?.platform_profile_picture || null,
          followersCount: found?.platform_followers_count || 0,
          connected: !!found,
          needsReconnect: found?.needs_reconnect || false,
          errorMessage: found?.error_message || null,
          connectedAt: found?.connected_at || null,
        };
      });
      setAccounts(mapped);

      try {
        const { data } = await supabase.functions.invoke("social-oauth", {
          body: { action: "check_platforms" },
        });
        if (data?.platforms) {
          setPlatformStatuses(data.platforms);
        }
      } catch {
        // Edge function might not be deployed yet
      }
    } catch (e) {
      console.error("Failed to load social accounts:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadAccounts();
  }, [user]);

  // Handle URL params for OAuth callback results
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");
    const platform = params.get("platform");

    if (success === "connected" && platform) {
      toast.success(`${OAUTH_PLATFORMS[platform]?.label || platform} connected successfully!`);
      window.history.replaceState({}, "", window.location.pathname);
      loadAccounts();
    }

    if (error && platform) {
      const ERROR_MESSAGES: Record<string, string> = {
        access_denied: "You declined the permission request.",
        token_exchange_failed: "Connection failed. Please try again.",
        platform_not_configured: "This platform is not yet available.",
        invalid_state: "Security check failed. Please try again.",
        save_failed: "Connected but failed to save. Please try again.",
        callback_failed: "Something went wrong. Please try again.",
      };
      toast.error(ERROR_MESSAGES[error] || "Connection failed. Please try again.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleConnect = async (platform: string) => {
    if (!brandId) {
      toast.error("Please create a brand first");
      return;
    }

    // Check plan restriction
    if (!allowedPlatforms.includes(platform)) {
      setShowUpgrade(true);
      return;
    }

    setConnectingPlatform(platform);
    try {
      const { data, error } = await supabase.functions.invoke("social-oauth", {
        body: { action: "connect", platform, brand_id: brandId },
      });

      if (error) throw error;

      // Simulated connection (dev mode) — instant success
      if (data?.simulated && data?.success) {
        toast.success(`${OAUTH_PLATFORMS[platform]?.label || platform} connected (dev mode)!`);
        await loadAccounts();
        return;
      }

      // Real OAuth — redirect to auth URL
      if (data?.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to start connection");
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectingPlatform || !brandId) return;

    setDisconnectLoading(true);
    try {
      const { error } = await supabase.functions.invoke("social-oauth", {
        body: { action: "disconnect", platform: disconnectingPlatform, brand_id: brandId },
      });

      if (error) throw error;

      setAccounts((prev) =>
        prev.map((a) =>
          a.platform === disconnectingPlatform
            ? { ...a, connected: false, username: "", profilePicture: null, followersCount: 0, needsReconnect: false, errorMessage: null, connectedAt: null }
            : a
        )
      );
      toast.success(`${OAUTH_PLATFORMS[disconnectingPlatform]?.label || disconnectingPlatform} disconnected`);
    } catch (e: any) {
      toast.error(e.message || "Failed to disconnect");
    } finally {
      setDisconnectLoading(false);
      setDisconnectingPlatform(null);
    }
  };

  const connectedCount = accounts.filter((a) => a.connected).length;
  const hasSimulatedPlatforms = Object.keys(platformStatuses).length > 0 &&
    Object.values(platformStatuses).some((v) => !v);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 rounded bg-muted animate-pulse" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-base font-bold text-foreground">Connected Accounts</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {connectedCount} of {accounts.length} platforms connected
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
          <Shield className="h-3 w-3 text-success" />
          <span className="text-[10px] font-semibold text-muted-foreground">OAuth 2.0 Secured</span>
        </div>
      </div>

      {/* Dev mode notice */}
      {hasSimulatedPlatforms && (
        <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
          <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">Dev Mode:</span> Platforms without API keys use simulated OAuth.
            Add real credentials to Supabase secrets to enable production OAuth.
          </p>
        </div>
      )}

      {/* Platform Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {accounts.map((account, i) => {
          const config = OAUTH_PLATFORMS[account.platform];
          const Icon = PLATFORM_ICONS[account.platform] || ExternalLink;
          const isConfigured = platformStatuses[account.platform];
          const isConnecting = connectingPlatform === account.platform;
          const isPlanLocked = !allowedPlatforms.includes(account.platform) && !account.connected;
          const isDevMode = !isConfigured && !account.connected;

          return (
            <motion.div
              key={account.platform}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-xl border p-4 transition-all ${
                isPlanLocked
                  ? "border-border bg-muted/30 opacity-70"
                  : account.connected
                  ? account.needsReconnect
                    ? "border-amber-300/50 bg-amber-50/30 dark:bg-amber-950/20"
                    : "border-success/30 bg-success/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${config?.gradientClass || "from-gray-500 to-gray-600"} text-white shadow-sm`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-sm font-bold text-foreground">
                    {config?.label || account.platform}
                  </p>
                  {account.connected ? (
                    <p className="text-[11px] text-muted-foreground truncate">
                      @{account.username}
                      {account.followersCount > 0 && (
                        <span className="ml-1 text-muted-foreground/60">
                          · {account.followersCount.toLocaleString()} followers
                        </span>
                      )}
                    </p>
                  ) : isPlanLocked ? (
                    <p className="text-[11px] text-muted-foreground">Pro feature</p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">Not connected</p>
                  )}
                </div>

                {/* Status badges */}
                {isPlanLocked && (
                  <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                    <Lock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-bold text-muted-foreground">Pro</span>
                  </span>
                )}
                {account.connected && !account.needsReconnect && !isPlanLocked && (
                  <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5">
                    <Check className="h-3 w-3 text-success" />
                    <span className="text-[10px] font-bold text-success">Live</span>
                  </span>
                )}
                {account.needsReconnect && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5">
                    <AlertTriangle className="h-3 w-3 text-amber-600" />
                    <span className="text-[10px] font-bold text-amber-600">Reconnect</span>
                  </span>
                )}
                {!account.connected && !isPlanLocked && isDevMode && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    Dev
                  </span>
                )}
              </div>

              {/* Reconnect warning */}
              {account.needsReconnect && (
                <div className="mt-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30 px-3 py-2">
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    This connection expired. Click Reconnect to restore access.
                  </p>
                </div>
              )}

              {/* Action buttons */}
              {isPlanLocked ? (
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Lock className="h-3.5 w-3.5" /> Upgrade to Connect
                </button>
              ) : account.connected ? (
                <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
                  {account.needsReconnect ? (
                    <button
                      onClick={() => handleConnect(account.platform)}
                      disabled={isConnecting}
                      className="flex items-center gap-1.5 rounded-md gradient-bg px-3 py-1.5 text-[11px] font-bold text-primary-foreground"
                    >
                      {isConnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      Reconnect
                    </button>
                  ) : (
                    <div className="text-[10px] text-muted-foreground/50">
                      {account.connectedAt && `Connected ${new Date(account.connectedAt).toLocaleDateString()}`}
                    </div>
                  )}
                  <button
                    onClick={() => setDisconnectingPlatform(account.platform)}
                    className="rounded-md border border-destructive/30 px-3 py-1.5 text-[11px] font-semibold text-destructive hover:bg-destructive/5"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleConnect(account.platform)}
                  disabled={isConnecting}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg gradient-bg py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
                >
                  {isConnecting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ExternalLink className="h-3.5 w-3.5" />
                  )}
                  Connect {config?.label}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Disconnect Confirmation Modal */}
      <AnimatePresence>
        {disconnectingPlatform && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setDisconnectingPlatform(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl text-center space-y-4"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <X className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-foreground">
                  Disconnect {OAUTH_PLATFORMS[disconnectingPlatform]?.label || disconnectingPlatform}?
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  You won't be able to publish until you reconnect.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDisconnectingPlatform(null)}
                  className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnectLoading}
                  className="flex-1 rounded-lg bg-destructive py-2 text-sm font-bold text-destructive-foreground disabled:opacity-60"
                >
                  {disconnectLoading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Disconnect"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        currentPlan={plan}
      />
    </div>
  );
};

export default ConnectedAccountsTab;
