import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateApiKey(): { fullKey: string; keyPrefix: string } {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const keyBody = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  const fullKey = `flw_live_${keyBody}`;
  const keyPrefix = `flw_live_${keyBody.substring(0, 8)}...`;
  return { fullKey, keyPrefix };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth via Supabase session
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceClient = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify user session
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(
    authHeader.replace("Bearer ", "")
  );
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }
  const userId = claimsData.claims.sub as string;

  // Check Agency plan
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  if (profile?.plan !== "agency") {
    return new Response(
      JSON.stringify({ error: "API access requires Agency plan" }),
      { status: 403, headers: corsHeaders }
    );
  }

  const url = new URL(req.url);
  const pathSegments = url.pathname
    .replace(/^\/api-keys\/?/, "")
    .split("/")
    .filter(Boolean);

  // GET / — list keys
  if (req.method === "GET" && pathSegments.length === 0) {
    const { data } = await serviceClient
      .from("api_keys")
      .select("id, name, key_prefix, permissions, last_used_at, expires_at, is_active, total_requests, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return new Response(JSON.stringify({ data: data ?? [] }), {
      headers: corsHeaders,
    });
  }

  // GET /:id/logs — get request logs for a key
  if (req.method === "GET" && pathSegments.length === 2 && pathSegments[1] === "logs") {
    const keyId = pathSegments[0];
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100"), 500);

    const { data } = await serviceClient
      .from("api_request_logs")
      .select("id, method, endpoint, status_code, response_time_ms, created_at, ip_address")
      .eq("api_key_id", keyId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return new Response(JSON.stringify({ data: data ?? [] }), {
      headers: corsHeaders,
    });
  }

  // POST / — create key
  if (req.method === "POST" && pathSegments.length === 0) {
    const body = await req.json().catch(() => null);
    if (!body?.name?.trim()) {
      return new Response(
        JSON.stringify({ error: "Key name is required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Max 10 active keys
    const { count } = await serviceClient
      .from("api_keys")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_active", true);

    if ((count ?? 0) >= 10) {
      return new Response(
        JSON.stringify({ error: "Maximum 10 active API keys. Revoke one first." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { fullKey, keyPrefix } = generateApiKey();
    const keyHash = await sha256(fullKey);

    const expiresAt = !body.expires_at || body.expires_at === "never"
      ? null
      : typeof body.expires_at === "number"
        ? new Date(Date.now() + body.expires_at * 86400000).toISOString()
        : body.expires_at;

    const { data: newKey, error } = await serviceClient
      .from("api_keys")
      .insert({
        user_id: userId,
        name: body.name.trim(),
        key_hash: keyHash,
        key_prefix: keyPrefix,
        permissions: body.permissions ?? {
          brands: { read: true, write: false },
          posts: { read: true, write: true, publish: false },
          analytics: { read: true },
          comments: { read: true, write: false },
        },
        expires_at: expiresAt,
      })
      .select("id, name, key_prefix, permissions, expires_at, created_at")
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: "Failed to create key" }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        ...newKey,
        key: fullKey, // ONE TIME ONLY
        show_once: true,
      }),
      { status: 201, headers: corsHeaders }
    );
  }

  // PATCH /:id — update key
  if (req.method === "PATCH" && pathSegments.length === 1) {
    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const updates: Record<string, unknown> = {};
    if (body.name) updates.name = body.name;
    if (body.permissions) updates.permissions = body.permissions;

    const { data, error } = await serviceClient
      .from("api_keys")
      .update(updates)
      .eq("id", pathSegments[0])
      .eq("user_id", userId)
      .select("id, name, key_prefix, permissions, last_used_at, expires_at, is_active, created_at")
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Key not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ data }), { headers: corsHeaders });
  }

  // DELETE /:id — revoke key
  if (req.method === "DELETE" && pathSegments.length === 1) {
    await serviceClient
      .from("api_keys")
      .update({ is_active: false })
      .eq("id", pathSegments[0])
      .eq("user_id", userId);

    return new Response(JSON.stringify({ revoked: true }), {
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: corsHeaders,
  });
});
