import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle, Facebook } from "lucide-react";
import { OAUTH_PLATFORMS } from "@/lib/oauth-config";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "You declined the permission request.",
  token_exchange_failed: "Connection failed. Please try again.",
  platform_not_configured: "This platform is not yet available.",
  invalid_state: "Security check failed. Please try again.",
  save_failed: "Connected but failed to save. Please try again.",
  callback_failed: "Something went wrong. Please try again.",
  invalid_callback: "Invalid callback parameters.",
  no_session: "You need to be logged in. Redirecting…",
  no_pages: "No Facebook Page found on your account. You need a Facebook Page (not just a personal profile) to connect.",
  fb_pages_fetch_failed: "Couldn't fetch your Facebook Pages. Reconnect and make sure you grant the Pages permissions when prompted.",
  token_exchange_failed: "Facebook rejected the login. Please try connecting again.",
  invalid_state: "Your session expired during login. Please try connecting again.",
  selection_expired: "Selection timed out. Please connect again.",
  page_not_found: "That Page could not be found. Please try again.",
};

interface PageOption {
  id: string;
  name: string;
  followers: number;
  picture: string | null;
}

const OAuthCallbackPage = () => {
  const { platform } = useParams<{ platform: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "select">("loading");
  const [message, setMessage] = useState("Connecting your account…");
  const [pages, setPages] = useState<PageOption[]>([]);
  const [selectionToken, setSelectionToken] = useState("");
  const [selecting, setSelecting] = useState<string | null>(null);

  const platformLabel = (platform ? OAUTH_PLATFORMS[platform]?.label : "") || platform || "Platform";

  const goToSettings = (query: string) =>
    setTimeout(() => navigate(`/settings?tab=connected-accounts&${query}`, { replace: true }), 1500);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      if (error) {
        setStatus("error"); setMessage(ERROR_MESSAGES.access_denied);
        goToSettings(`error=access_denied&platform=${platform}`); return;
      }
      if (!code || !state || !platform) {
        setStatus("error"); setMessage(ERROR_MESSAGES.invalid_callback);
        goToSettings("error=invalid_callback"); return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus("error"); setMessage(ERROR_MESSAGES.no_session);
        setTimeout(() => navigate("/login", { replace: true }), 2000); return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke("social-oauth", {
          body: { action: "callback", platform, code, state },
        });

        if (fnError || data?.error) {
          const errorCode = data?.error || "callback_failed";
          setStatus("error"); setMessage(ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.callback_failed);
          goToSettings(`error=${errorCode}&platform=${platform}`); return;
        }

        if (data?.needs_page_selection) {
          setPages(data.pages || []);
          setSelectionToken(data.selection_token);
          setStatus("select");
          setMessage(`Select a ${platformLabel} Page to connect`);
          return;
        }

        setStatus("success"); setMessage(`${platformLabel} connected successfully!`);
        goToSettings(`success=connected&platform=${platform}`);
      } catch {
        setStatus("error"); setMessage(ERROR_MESSAGES.callback_failed);
        goToSettings(`error=callback_failed&platform=${platform}`);
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]);

  const handleSelectPage = async (pageId: string) => {
    setSelecting(pageId);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("social-oauth", {
        body: { action: "select_page", platform, selection_token: selectionToken, page_id: pageId },
      });
      if (fnError || data?.error) {
        const errorCode = data?.error || "callback_failed";
        setStatus("error"); setMessage(ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.callback_failed);
        goToSettings(`error=${errorCode}&platform=${platform}`); return;
      }
      setStatus("success"); setMessage(`${platformLabel} Page connected successfully!`);
      goToSettings(`success=connected&platform=${platform}`);
    } catch {
      setStatus("error"); setMessage(ERROR_MESSAGES.callback_failed);
      goToSettings(`error=callback_failed&platform=${platform}`);
    } finally {
      setSelecting(null);
    }
  };

  if (status === "select") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl" data-testid="page-picker">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white">
              <Facebook className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-foreground">Choose a Page</h2>
              <p className="text-xs text-muted-foreground">Select which {platformLabel} Page to publish to.</p>
            </div>
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {pages.map((p) => (
              <button
                key={p.id}
                data-testid={`select-page-${p.id}`}
                disabled={!!selecting}
                onClick={() => handleSelectPage(p.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-3 text-left transition-all hover:border-primary/50 hover:bg-primary/5 disabled:opacity-60"
              >
                {p.picture ? (
                  <img src={p.picture} alt={p.name} className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    <Facebook className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading text-sm font-semibold text-foreground">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">{p.followers.toLocaleString()} followers</p>
                </div>
                {selecting === p.id
                  ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  : <CheckCircle2 className="h-4 w-4 text-muted-foreground/30" />}
              </button>
            ))}
          </div>

          <button
            data-testid="cancel-page-selection"
            onClick={() => navigate("/settings?tab=connected-accounts", { replace: true })}
            className="mt-5 w-full rounded-lg border border-border py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center px-6">
        {status === "loading" && <Loader2 className="h-10 w-10 animate-spin text-primary" />}
        {status === "success" && <CheckCircle2 className="h-10 w-10 text-green-500" />}
        {status === "error" && <XCircle className="h-10 w-10 text-destructive" />}
        <p className="text-lg font-heading font-semibold text-foreground">{message}</p>
        <p className="text-sm text-muted-foreground">
          {status === "loading" ? "Please wait while we finish setting things up…" : "Redirecting you back to settings…"}
        </p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
