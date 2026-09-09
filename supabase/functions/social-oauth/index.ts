import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// OAuth configs — all secrets from edge function env
const OAUTH_CONFIGS: Record<string, {
  authUrl: string;
  tokenUrl: string;
  profileUrl: string;
  longLivedTokenUrl?: string;
  scopes: string[];
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  usePKCE: boolean;
  label: string;
}> = {
  instagram: {
    authUrl: "https://api.instagram.com/oauth/authorize",
    tokenUrl: "https://api.instagram.com/oauth/access_token",
    longLivedTokenUrl: "https://graph.instagram.com/access_token",
    profileUrl: "https://graph.instagram.com/me",
    scopes: ["user_profile", "user_media"],
    clientId: Deno.env.get("INSTAGRAM_APP_ID") || "",
    clientSecret: Deno.env.get("INSTAGRAM_APP_SECRET") || "",
    redirectUri: Deno.env.get("INSTAGRAM_REDIRECT_URI") || "",
    usePKCE: false,
    label: "Instagram",
  },
  facebook: {
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    profileUrl: "https://graph.facebook.com/me",
    scopes: ["pages_show_list", "pages_read_engagement", "pages_manage_posts"],
    clientId: Deno.env.get("FACEBOOK_APP_ID") || "",
    clientSecret: Deno.env.get("FACEBOOK_APP_SECRET") || "",
    redirectUri: Deno.env.get("FACEBOOK_REDIRECT_URI") || "",
    usePKCE: false,
    label: "Facebook",
  },
  linkedin: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    profileUrl: "https://api.linkedin.com/v2/userinfo",
    scopes: ["openid", "profile", "email", "w_member_social"],
    clientId: Deno.env.get("LINKEDIN_CLIENT_ID") || "",
    clientSecret: Deno.env.get("LINKEDIN_CLIENT_SECRET") || "",
    redirectUri: Deno.env.get("LINKEDIN_REDIRECT_URI") || "",
    usePKCE: false,
    label: "LinkedIn",
  },
  twitter: {
    authUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    profileUrl: "https://api.twitter.com/2/users/me",
    scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    clientId: Deno.env.get("TWITTER_CLIENT_ID") || "",
    clientSecret: Deno.env.get("TWITTER_CLIENT_SECRET") || "",
    redirectUri: Deno.env.get("TWITTER_REDIRECT_URI") || "",
    usePKCE: true,
    label: "Twitter / X",
  },
  tiktok: {
    authUrl: "https://www.tiktok.com/v2/auth/authorize",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    profileUrl: "https://open.tiktokapis.com/v2/user/info/",
    scopes: ["user.info.basic", "video.publish", "video.upload"],
    clientId: Deno.env.get("TIKTOK_CLIENT_KEY") || "",
    clientSecret: Deno.env.get("TIKTOK_CLIENT_SECRET") || "",
    redirectUri: Deno.env.get("TIKTOK_REDIRECT_URI") || "",
    usePKCE: true,
    label: "TikTok",
  },
  pinterest: {
    authUrl: "https://www.pinterest.com/oauth/",
    tokenUrl: "https://api.pinterest.com/v5/oauth/token",
    profileUrl: "https://api.pinterest.com/v5/user_account",
    scopes: ["boards:read", "pins:read", "pins:write"],
    clientId: Deno.env.get("PINTEREST_APP_ID") || "",
    clientSecret: Deno.env.get("PINTEREST_APP_SECRET") || "",
    redirectUri: Deno.env.get("PINTEREST_REDIRECT_URI") || "",
    usePKCE: false,
    label: "Pinterest",
  },
};

function isPlatformConfigured(platform: string): boolean {
  const config = OAUTH_CONFIGS[platform];
  return !!(config?.clientId && config?.clientSecret);
}

function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Simple XOR-based token obfuscation for storage (real encryption needs a proper key)
const ENCRYPTION_KEY = Deno.env.get("TOKEN_ENCRYPTION_KEY") || "";

function obfuscateToken(token: string): string {
  if (!ENCRYPTION_KEY || !token) return token;
  try {
    const keyBytes = new TextEncoder().encode(ENCRYPTION_KEY);
    const tokenBytes = new TextEncoder().encode(token);
    const result = new Uint8Array(tokenBytes.length);
    for (let i = 0; i < tokenBytes.length; i++) {
      result[i] = tokenBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    return btoa(String.fromCharCode(...result));
  } catch {
    return token;
  }
}

async function fetchUserProfile(
  platform: string,
  accessToken: string,
  config: typeof OAUTH_CONFIGS[string]
) {
  const defaultProfile = { id: "", username: "", profilePicture: null as string | null, followersCount: 0 };

  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${accessToken}` };
    let url = config.profileUrl;

    if (platform === "instagram") url += "?fields=id,username";
    else if (platform === "twitter") url += "?user.fields=profile_image_url,public_metrics";
    else if (platform === "tiktok") url += "?fields=open_id,display_name,avatar_url,follower_count";

    const res = await fetch(url, { headers });
    if (!res.ok) return defaultProfile;

    const data = await res.json();

    switch (platform) {
      case "instagram":
        return { id: data.id || "", username: data.username || "", profilePicture: null, followersCount: 0 };
      case "linkedin":
        return { id: data.sub || "", username: data.name || data.email || "", profilePicture: data.picture || null, followersCount: 0 };
      case "twitter":
        return { id: data.data?.id || "", username: data.data?.username || "", profilePicture: data.data?.profile_image_url || null, followersCount: data.data?.public_metrics?.followers_count || 0 };
      case "facebook":
        return { id: data.id || "", username: data.name || "", profilePicture: null, followersCount: 0 };
      case "tiktok": {
        const u = data.data?.user;
        return { id: u?.open_id || "", username: u?.display_name || "", profilePicture: u?.avatar_url || null, followersCount: u?.follower_count || 0 };
      }
      case "pinterest":
        return { id: data.username || "", username: data.username || "", profilePicture: null, followersCount: data.follower_count || 0 };
      default:
        return defaultProfile;
    }
  } catch {
    return defaultProfile;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, platform, brand_id, account_id, return_url } = body;

    // ─── CHECK PLATFORM STATUS ───
    if (action === "check_platforms") {
      const statuses: Record<string, boolean> = {};
      for (const key of Object.keys(OAUTH_CONFIGS)) {
        statuses[key] = isPlatformConfigured(key);
      }
      return new Response(JSON.stringify({ platforms: statuses }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── START CONNECT (generate auth URL or simulate) ───
    if (action === "connect") {
      if (!platform || !brand_id) {
        return new Response(JSON.stringify({ error: "Missing platform or brand_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const config = OAUTH_CONFIGS[platform];

      // If platform not configured with real keys, simulate connection (dev mode)
      if (!config || !isPlatformConfigured(platform)) {
        const simUsername = `demo_${platform}_user`;
        const simFollowers = Math.floor(Math.random() * 5000) + 500;

        // Check for existing account to update
        const { data: existing } = await supabase
          .from("social_accounts")
          .select("id")
          .eq("user_id", user.id)
          .eq("brand_id", brand_id)
          .eq("platform", platform)
          .maybeSingle();

        const accountData = {
          user_id: user.id,
          brand_id,
          platform,
          platform_user_id: `sim_${platform}_${user.id.slice(0, 8)}`,
          platform_username: simUsername,
          account_name: simUsername,
          platform_profile_picture: null,
          platform_followers_count: simFollowers,
          access_token: `simulated_token_${platform}_${Date.now()}`,
          refresh_token: null,
          token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          scopes: config?.scopes ?? [],
          is_active: true,
          needs_reconnect: false,
          error_message: null,
          connected_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        };

        if (existing) {
          await supabase.from("social_accounts").update(accountData).eq("id", existing.id);
        } else {
          await supabase.from("social_accounts").insert(accountData);
        }

        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "platform_connected",
          title: `${config?.label ?? platform} connected`,
          message: `${config?.label ?? platform} account @${simUsername} connected in dev mode.`,
        });

        return new Response(JSON.stringify({
          success: true,
          simulated: true,
          platform,
          username: simUsername,
          followers_count: simFollowers,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate state token
      const stateToken = generateRandomString(32);
      let codeVerifier: string | null = null;
      let codeChallenge: string | null = null;

      if (config.usePKCE) {
        codeVerifier = generateRandomString(32);
        codeChallenge = await generateCodeChallenge(codeVerifier);
      }

      // Clean up expired states first
      await supabase.rpc("cleanup_expired_oauth_states").catch(() => {});

      // Save state
      await supabase.from("oauth_states").insert({
        user_id: user.id,
        brand_id,
        platform,
        state_token: stateToken,
        code_verifier: codeVerifier,
      });

      // Build auth URL
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope: config.scopes.join(platform === "twitter" ? " " : ","),
        response_type: "code",
        state: stateToken,
      });

      if (codeChallenge) {
        params.set("code_challenge", codeChallenge);
        params.set("code_challenge_method", "S256");
      }

      const authUrl = `${config.authUrl}?${params.toString()}`;

      return new Response(JSON.stringify({ auth_url: authUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── CALLBACK (exchange code for tokens) ───
    if (action === "callback") {
      const { code, state } = body;

      if (!code || !state || !platform) {
        return new Response(JSON.stringify({ error: "invalid_callback" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify state — CSRF protection
      const { data: oauthState, error: stateError } = await supabase
        .from("oauth_states")
        .select("*")
        .eq("state_token", state)
        .eq("user_id", user.id)
        .eq("platform", platform)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (stateError || !oauthState) {
        return new Response(JSON.stringify({ error: "invalid_state" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete used state
      await supabase.from("oauth_states").delete().eq("id", oauthState.id);

      const config = OAUTH_CONFIGS[platform];

      // Exchange code for tokens
      const tokenParams: Record<string, string> = {
        grant_type: "authorization_code",
        code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      };

      if (oauthState.code_verifier) {
        tokenParams.code_verifier = oauthState.code_verifier;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/x-www-form-urlencoded",
      };

      if (platform === "twitter") {
        const credentials = btoa(`${config.clientId}:${config.clientSecret}`);
        headers["Authorization"] = `Basic ${credentials}`;
      }

      const tokenRes = await fetch(config.tokenUrl, {
        method: "POST",
        headers,
        body: new URLSearchParams(tokenParams),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error(`Token exchange failed for ${platform}:`, errText);
        return new Response(JSON.stringify({ error: "token_exchange_failed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokenData = await tokenRes.json();
      let accessToken = tokenData.access_token;
      let refreshToken = tokenData.refresh_token ?? null;
      let expiresIn = tokenData.expires_in ?? null;

      // Instagram: exchange for long-lived token
      if (platform === "instagram" && accessToken && config.longLivedTokenUrl) {
        try {
          const llRes = await fetch(
            `${config.longLivedTokenUrl}?grant_type=ig_exchange_token&client_secret=${config.clientSecret}&access_token=${accessToken}`
          );
          if (llRes.ok) {
            const llData = await llRes.json();
            accessToken = llData.access_token;
            expiresIn = llData.expires_in;
          }
        } catch {}
      }

      // Fetch profile
      const profile = await fetchUserProfile(platform, accessToken, config);

      const tokenExpiresAt = expiresIn
        ? new Date(Date.now() + expiresIn * 1000).toISOString()
        : null;

      // Obfuscate tokens
      const encAccessToken = obfuscateToken(accessToken);
      const encRefreshToken = refreshToken ? obfuscateToken(refreshToken) : null;

      // Check for existing account to update
      const { data: existing } = await supabase
        .from("social_accounts")
        .select("id")
        .eq("user_id", user.id)
        .eq("brand_id", oauthState.brand_id)
        .eq("platform", platform)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("social_accounts")
          .update({
            platform_user_id: profile.id,
            platform_username: profile.username,
            account_name: profile.username,
            platform_profile_picture: profile.profilePicture,
            platform_followers_count: profile.followersCount,
            access_token: encAccessToken,
            refresh_token: encRefreshToken,
            token_expires_at: tokenExpiresAt,
            scopes: config.scopes,
            is_active: true,
            needs_reconnect: false,
            error_message: null,
            connected_at: new Date().toISOString(),
            last_used_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("social_accounts").insert({
          user_id: user.id,
          brand_id: oauthState.brand_id,
          platform,
          platform_user_id: profile.id,
          platform_username: profile.username,
          account_name: profile.username,
          platform_profile_picture: profile.profilePicture,
          platform_followers_count: profile.followersCount,
          access_token: encAccessToken,
          refresh_token: encRefreshToken,
          token_expires_at: tokenExpiresAt,
          scopes: config.scopes,
          is_active: true,
          needs_reconnect: false,
          error_message: null,
          connected_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        });
      }

      // Create notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "platform_connected",
        title: `${config.label} connected`,
        message: `Your ${config.label} account @${profile.username} has been connected successfully.`,
      });

      return new Response(JSON.stringify({
        success: true,
        platform,
        username: profile.username,
        profile_picture: profile.profilePicture,
        followers_count: profile.followersCount,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── DISCONNECT ───
    if (action === "disconnect") {
      if (!platform || !brand_id) {
        return new Response(JSON.stringify({ error: "Missing params" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase
        .from("social_accounts")
        .update({
          is_active: false,
          access_token: null,
          refresh_token: null,
          token_expires_at: null,
          needs_reconnect: false,
          error_message: null,
        })
        .eq("user_id", user.id)
        .eq("brand_id", brand_id)
        .eq("platform", platform);

      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "platform_disconnected",
        title: `${platform} disconnected`,
        message: `Your ${platform} account has been disconnected.`,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── REFRESH TOKEN ───
    if (action === "refresh_token") {
      if (!account_id) {
        return new Response(JSON.stringify({ error: "Missing account_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: account } = await supabase
        .from("social_accounts")
        .select("*")
        .eq("id", account_id)
        .eq("user_id", user.id)
        .single();

      if (!account?.refresh_token) {
        await supabase
          .from("social_accounts")
          .update({ needs_reconnect: true, error_message: "Token expired. Please reconnect." })
          .eq("id", account_id);
        return new Response(JSON.stringify({ error: "needs_reconnect" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const config = OAUTH_CONFIGS[account.platform];
      if (!config) {
        return new Response(JSON.stringify({ error: "Unknown platform" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokenRes = await fetch(config.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: account.refresh_token,
          client_id: config.clientId,
          client_secret: config.clientSecret,
        }),
      }).catch(() => null);

      if (!tokenRes?.ok) {
        await supabase
          .from("social_accounts")
          .update({ needs_reconnect: true, error_message: "Token refresh failed." })
          .eq("id", account_id);
        return new Response(JSON.stringify({ error: "refresh_failed" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newTokens = await tokenRes.json();

      await supabase
        .from("social_accounts")
        .update({
          access_token: obfuscateToken(newTokens.access_token),
          refresh_token: newTokens.refresh_token
            ? obfuscateToken(newTokens.refresh_token)
            : account.refresh_token,
          token_expires_at: newTokens.expires_in
            ? new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
            : null,
          needs_reconnect: false,
          error_message: null,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", account_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("social-oauth error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
