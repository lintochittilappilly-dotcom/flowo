import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
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
};

const OAuthCallbackPage = () => {
  const { platform } = useParams<{ platform: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Connecting your account…");

  const platformConfig = platform ? OAUTH_PLATFORMS[platform] : null;
  const platformLabel = platformConfig?.label || platform || "Platform";

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      // Platform denied access
      if (error) {
        setStatus("error");
        setMessage(ERROR_MESSAGES.access_denied);
        setTimeout(() => navigate("/settings?tab=connected-accounts&error=access_denied&platform=" + platform, { replace: true }), 2000);
        return;
      }

      if (!code || !state || !platform) {
        setStatus("error");
        setMessage(ERROR_MESSAGES.invalid_callback);
        setTimeout(() => navigate("/settings?tab=connected-accounts&error=invalid_callback", { replace: true }), 2000);
        return;
      }

      // Check session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus("error");
        setMessage(ERROR_MESSAGES.no_session);
        setTimeout(() => navigate("/login", { replace: true }), 2000);
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke("social-oauth", {
          body: {
            action: "callback",
            platform,
            code,
            state,
          },
        });

        if (fnError || data?.error) {
          const errorCode = data?.error || "callback_failed";
          setStatus("error");
          setMessage(ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.callback_failed);
          setTimeout(() => navigate(`/settings?tab=connected-accounts&error=${errorCode}&platform=${platform}`, { replace: true }), 2500);
          return;
        }

        setStatus("success");
        setMessage(`${platformLabel} connected successfully!`);
        setTimeout(() => navigate(`/settings?tab=connected-accounts&success=connected&platform=${platform}`, { replace: true }), 1500);
      } catch {
        setStatus("error");
        setMessage(ERROR_MESSAGES.callback_failed);
        setTimeout(() => navigate("/settings?tab=connected-accounts&error=callback_failed&platform=" + platform, { replace: true }), 2500);
      }
    };

    handleCallback();
  }, [platform, searchParams, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center px-6">
        {status === "loading" && (
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        )}
        {status === "success" && (
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        )}
        {status === "error" && (
          <XCircle className="h-10 w-10 text-destructive" />
        )}
        <p className="text-lg font-heading font-semibold text-foreground">{message}</p>
        <p className="text-sm text-muted-foreground">
          {status === "loading" ? "Please wait while we finish setting things up…" : "Redirecting you back to settings…"}
        </p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
