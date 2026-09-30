import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Small helper so every response is consistent
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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
    if (!res.ok) {
      console.error(`profile fetch failed for ${platform}:`, res.status, await res.text());
      return defaultProfile;
    }
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
  } catch (e) {
    console.error(`profile fetch threw for ${platform}:`, e);
    return defaultProfile;
  }
}

const FB_GRAPH = "https://graph.facebook.com/v18.0";

async function exchangeFacebookLongLivedToken(
  shortToken: string,
  config: typeof OAUTH_CONFIGS[string]
): Promise<string> {
  try {
    const url = `${FB_GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${config.clientId}&client_secret=${config.clientSecret}&fb_exchange_token=${shortToken}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error("FB long-lived exchange failed:", res.status, await res.text());
      return shortToken;
    }
    const data = await res.json();
    return data.access_token || shortToken;
  } catch (e) {
    console.error("FB long-lived exchange threw:", e);
    return shortToken;
  }
}

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  followers: number;
  picture: string | null;
}

// CHANGED: throws on a real Graph error instead of silently returning []
async function fetchFacebookPages(userToken: string): Promise<FacebookPage[]> {
  const url = `${FB_GRAPH}/me/accounts?fields=id,name,access_token,fan_count,followers_count,picture{url}&limit=100&access_token=${userToken}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errText = await res.text();
    console.error("FB /me/accounts failed:", res.status, errText);
    throw new Error(`fb_pages_fetch_failed: ${res.status} ${errText}`);
  }
  const data = await res.json();
  return (data.data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    access_token: p.access_token,
    followers: p.followers_count ?? p.fan_count ?? 0,
    picture: p.picture?.data?.url ?? null,
  }));
}

// CHANGED: now throws on any write error so the caller returns a real failure
async function persistAccount(
  supabase: any,
  p: {
    userId: string; brandId: string; platform: string;
    platformUserId: string; username: string; profilePicture: string | null;
    followersCount: number; accessToken: string; refreshToken: string | null;
    tokenExpiresAt: string | null; scopes: string[];
  }
) {
  const { data: existing, error: selErr } = await supabase
    .from("social_accounts")
    .select("id")
    .eq("user_id", p.userId)
    .eq("brand_id", p.brandId)
    .eq("platform", p.platform)
    .maybeSingle();

  if (selErr) throw new Error(`social_accounts lookup failed: ${selErr.message}`);

  const row = {
    platform_user_id: p.platformUserId,
    platform_username: p.username,
    account_name: p.username,
    platform_profile_picture: p.profilePicture,
    platform_followers_count: p.followersCount,
    access_token: p.accessToken,
    refresh_token: p.refreshToken,
    token_expires_at: p.tokenExpiresAt,
    scopes: p.scopes,
    is_active: true,
    needs_reconnect: false,
    error_message: null,
    connected_at: new Date().toISOString(),
    last_used_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase.from("social_accounts").update(row).eq("id", existing.id);
    if (error) throw new Error(`social_accounts update failed: ${error.message}`);
  } else {
    const { error } = await supabase.from("social_accounts").insert({
      user_id: p.userId, brand_id: p.brandId, platform: p.platform, ...row,
    });
    if (error) throw new Error(`social_accounts insert failed: ${error.message}`);
  }

  const label = OAUTH_CONFIGS[p.platform]?.label ?? p.platform;
  // Notification is non-fatal: log but don't fail the connection
  const { error: notifErr } = await supabase.from("notifications").insert({
    user_id: p.userId,
    type: "platform_connected",
    title: `${label} connected`,
    message: `Your ${label} account "${p.username}" has been connected successfully.`,
  });
  if (notifErr) console.error("notification insert failed (non-fatal):", notifErr.message);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const { action, platform, brand_id, account_id } = body;

    // ─── CHECK PLATFORM STATUS ───
    if (action === "check_platforms") {
      const statuses: Record<string, boolean> = {};
      for (const key of Object.keys(OAUTH_CONFIGS)) {
        statuses[key] = isPlatformConfigured(key);
      }
      return json({ platforms: statuses });
    }

    // ─── START CONNECT ───
    if (action === "connect") {
      if (!platform || !brand_id) {
        return json({ error: "Missing platform or brand_id" }, 400);
      }

      const config = OAUTH_CONFIGS[platform];

      // Dev/simulation mode
      if (!config || !isPlatformConfigured(platform)) {
        const simUsername = `demo_${platform}_user`;
        const simFollowers = Math.floor(Math.random() * 5000) + 500;

        const { data: existing, error: selErr } = await supabase
          .from("social_accounts")
          .select("id")
          .eq("user_id", user.id)
          .eq("brand_id", brand_id)
          .eq("platform", platform)
          .maybeSingle();
        if (selErr) return json({ error: `lookup_failed: ${selErr.message}` }, 500);

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
          const { error } = await supabase.from("social_accounts").update(accountData).eq("id", existing.id);
          if (error) return json({ error: `update_failed: ${error.message}` }, 500);
        } else {
          const { error } = await supabase.from("social_accounts").insert(accountData);
          if (error) return json({ error: `insert_failed: ${error.message}` }, 500);
        }

        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "platform_connected",
          title: `${config?.label ?? platform} connected`,
          message: `${config?.label ?? platform} account @${simUsername} connected in dev mode.`,
        });

        return json({
          success: true, simulated: true, platform,
          username: simUsername, followers_count: simFollowers,
        });
      }

      const stateToken = generateRandomString(32);
      let codeVerifier: string | null = null;
      let codeChallenge: string | null = null;

      if (config.usePKCE) {
        codeVerifier = generateRandomString(32);
        codeChallenge = await generateCodeChallenge(codeVerifier);
      }

      try { await supabase.rpc("cleanup_expired_oauth_states"); } catch (_) { /* ignore */ }

      const { error: stateInsertErr } = await supabase.from("oauth_states").insert({
        user_id: user.id,
        brand_id,
        platform,
        state_token: stateToken,
        code_verifier: codeVerifier,
      });
      if (stateInsertErr) return json({ error: `state_insert_failed: ${stateInsertErr.message}` }, 500);

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

      return json({ auth_url: `${config.authUrl}?${params.toString()}` });
    }

    // ─── CALLBACK ───
    if (action === "callback") {
      const { code, state } = body;
      if (!code || !state || !platform) {
        return json({ error: "invalid_callback" }, 400);
      }

      const { data: oauthState, error: stateError } = await supabase
        .from("oauth_states")
        .select("*")
        .eq("state_token", state)
        .eq("user_id", user.id)
        .eq("platform", platform)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (stateError || !oauthState) {
        return json({ error: "invalid_state" }, 400);
      }

      await supabase.from("oauth_states").delete().eq("id", oauthState.id);

      const config = OAUTH_CONFIGS[platform];

      const tokenParams: Record<string, string> = {
        grant_type: "authorization_code",
        code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      };
      if (oauthState.code_verifier) tokenParams.code_verifier = oauthState.code_verifier;

      const headers: Record<string, string> = {
        "Content-Type": "application/x-www-form-urlencoded",
      };
      if (platform === "twitter") {
        headers["Authorization"] = `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`;
      }

      const tokenRes = await fetch(config.tokenUrl, {
        method: "POST", headers, body: new URLSearchParams(tokenParams),
      });

      if (!tokenRes.ok) {
        console.error(`Token exchange failed for ${platform}:`, await tokenRes.text());
        return json({ error: "token_exchange_failed" }, 400);
      }

      const tokenData = await tokenRes.json();
      let accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token ?? null;
      let expiresIn = tokenData.expires_in ?? null;

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
        } catch (e) { console.error("IG long-lived exchange threw:", e); }
      }

      // ── Facebook: fetch Pages ──
      if (platform === "facebook") {
        let pages: FacebookPage[];
        try {
          const longLived = await exchangeFacebookLongLivedToken(accessToken, config);
          pages = await fetchFacebookPages(longLived);
        } catch (e) {
          // real Graph error is now surfaced instead of masquerading as "no_pages"
          return json({ error: "fb_pages_fetch_failed", detail: (e as Error).message }, 400);
        }

        if (pages.length === 0) {
          return json({ error: "no_pages" }, 400);
        }

        if (pages.length === 1) {
          const page = pages[0];
          await persistAccount(supabase, {
            userId: user.id, brandId: oauthState.brand_id, platform: "facebook",
            platformUserId: page.id, username: page.name, profilePicture: page.picture,
            followersCount: page.followers, accessToken: obfuscateToken(page.access_token),
            refreshToken: null, tokenExpiresAt: null, scopes: config.scopes,
          });
          return json({
            success: true, platform, username: page.name,
            profile_picture: page.picture, followers_count: page.followers,
          });
        }

        const selectionToken = generateRandomString(24);
        const { error: pendErr } = await supabase.from("oauth_pending_selections").insert({
          user_id: user.id,
          brand_id: oauthState.brand_id,
          platform: "facebook",
          selection_token: selectionToken,
          pages: pages.map((p) => ({
            id: p.id, name: p.name,
            access_token: obfuscateToken(p.access_token),
            followers: p.followers, picture: p.picture,
          })),
        });
        if (pendErr) return json({ error: `pending_insert_failed: ${pendErr.message}` }, 500);

        return json({
          needs_page_selection: true,
          platform,
          selection_token: selectionToken,
          pages: pages.map((p) => ({ id: p.id, name: p.name, followers: p.followers, picture: p.picture })),
        });
      }

      // ── All other platforms ──
      const profile = await fetchUserProfile(platform, accessToken, config);
      const tokenExpiresAt = expiresIn
        ? new Date(Date.now() + expiresIn * 1000).toISOString()
        : null;

      await persistAccount(supabase, {
        userId: user.id, brandId: oauthState.brand_id, platform,
        platformUserId: profile.id, username: profile.username,
        profilePicture: profile.profilePicture, followersCount: profile.followersCount,
        accessToken: obfuscateToken(accessToken),
        refreshToken: refreshToken ? obfuscateToken(refreshToken) : null,
        tokenExpiresAt, scopes: config.scopes,
      });

      return json({
        success: true, platform, username: profile.username,
        profile_picture: profile.profilePicture, followers_count: profile.followersCount,
      });
    }

    // ─── DISCONNECT ───
    if (action === "disconnect") {
      if (!platform || !brand_id) return json({ error: "Missing params" }, 400);

      const { error } = await supabase
        .from("social_accounts")
        .update({
          is_active: false, access_token: null, refresh_token: null,
          token_expires_at: null, needs_reconnect: false, error_message: null,
        })
        .eq("user_id", user.id)
        .eq("brand_id", brand_id)
        .eq("platform", platform);
      if (error) return json({ error: `disconnect_failed: ${error.message}` }, 500);

      await supabase.from("notifications").insert({
        user_id: user.id, type: "platform_disconnected",
        title: `${platform} disconnected`,
        message: `Your ${platform} account has been disconnected.`,
      });

      return json({ success: true });
    }

    // ─── REFRESH TOKEN ───
    if (action === "refresh_token") {
      if (!account_id) return json({ error: "Missing account_id" }, 400);

      const { data: account } = await supabase
        .from("social_accounts").select("*")
        .eq("id", account_id).eq("user_id", user.id).single();

      if (!account?.refresh_token) {
        await supabase.from("social_accounts")
          .update({ needs_reconnect: true, error_message: "Token expired. Please reconnect." })
          .eq("id", account_id);
        return json({ error: "needs_reconnect" }, 401);
      }

      const config = OAUTH_CONFIGS[account.platform];
      if (!config) return json({ error: "Unknown platform" }, 400);

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
        await supabase.from("social_accounts")
          .update({ needs_reconnect: true, error_message: "Token refresh failed." })
          .eq("id", account_id);
        return json({ error: "refresh_failed" }, 401);
      }

      const newTokens = await tokenRes.json();
      const { error } = await supabase.from("social_accounts")
        .update({
          access_token: obfuscateToken(newTokens.access_token),
          refresh_token: newTokens.refresh_token
            ? obfuscateToken(newTokens.refresh_token)
            : account.refresh_token,
          token_expires_at: newTokens.expires_in
            ? new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
            : null,
          needs_reconnect: false, error_message: null,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", account_id);
      if (error) return json({ error: `refresh_persist_failed: ${error.message}` }, 500);

      return json({ success: true });
    }

    // ─── SELECT PAGE ───
    if (action === "select_page") {
      const { selection_token, page_id } = body;
      if (!selection_token || !page_id) return json({ error: "invalid_selection" }, 400);

      const { data: pending, error: pErr } = await supabase
        .from("oauth_pending_selections").select("*")
        .eq("selection_token", selection_token)
        .eq("user_id", user.id)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (pErr || !pending) return json({ error: "selection_expired" }, 400);

      const page = (pending.pages as any[]).find((p) => p.id === page_id);
      if (!page) return json({ error: "page_not_found" }, 400);

      await persistAccount(supabase, {
        userId: user.id, brandId: pending.brand_id, platform: pending.platform,
        platformUserId: page.id, username: page.name,
        profilePicture: page.picture ?? null, followersCount: page.followers ?? 0,
        accessToken: page.access_token, // already obfuscated when stored
        refreshToken: null, tokenExpiresAt: null,
        scopes: OAUTH_CONFIGS[pending.platform]?.scopes ?? [],
      });

      await supabase.from("oauth_pending_selections").delete().eq("id", pending.id);

      return json({
        success: true, platform: pending.platform,
        username: page.name, followers_count: page.followers ?? 0,
      });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("social-oauth error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
