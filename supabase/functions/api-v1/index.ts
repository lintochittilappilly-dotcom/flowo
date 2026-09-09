import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const RATE_LIMIT = 1000;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// ── Helpers ──────────────────────────────────────────────────────────

function ok<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  return new Response(
    JSON.stringify({ success: true, data, ...(meta ? { meta } : {}) }),
    { status, headers: corsHeaders }
  );
}

function created<T>(data: T) {
  return ok(data, undefined, 201);
}

function err(message: string, code: string, status: number, details?: unknown) {
  return new Response(
    JSON.stringify({
      success: false,
      error: { message, code, ...(details ? { details } : {}) },
    }),
    { status, headers: corsHeaders }
  );
}

// ── SHA-256 hash in Deno ─────────────────────────────────────────────

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Auth middleware ──────────────────────────────────────────────────

interface AuthResult {
  userId: string;
  keyId: string;
  keyHash: string;
  permissions: any;
}

async function authenticate(
  req: Request,
  supabase: any
): Promise<AuthResult | Response> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer flw_live_")) {
    return err(
      'Missing or invalid Authorization header. Use: Authorization: Bearer flw_live_...',
      "missing_auth",
      401
    );
  }

  const key = auth.replace("Bearer ", "").trim();
  const keyHash = await sha256(key);

  const { data: keyRecord, error: keyErr } = await supabase
    .from("api_keys")
    .select("id, user_id, key_hash, permissions, expires_at, is_active")
    .eq("key_hash", keyHash)
    .eq("is_active", true)
    .single();

  if (keyErr || !keyRecord) {
    return err("Invalid API key.", "invalid_key", 401);
  }

  if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
    return err("API key has expired.", "key_expired", 401);
  }

  // Check plan
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", keyRecord.user_id)
    .single();

  if (profile?.plan !== "agency") {
    return err("API access requires the Agency plan.", "plan_required", 403);
  }

  // Rate limiting
  const windowStart = new Date(
    Math.floor(Date.now() / RATE_WINDOW_MS) * RATE_WINDOW_MS
  ).toISOString();

  const { data: rateRow } = await supabase
    .from("api_rate_limits")
    .select("request_count")
    .eq("key_hash", keyHash)
    .eq("window_start", windowStart)
    .maybeSingle();

  const currentCount = rateRow?.request_count ?? 0;

  if (currentCount >= RATE_LIMIT) {
    return err(
      `Rate limit exceeded. Maximum ${RATE_LIMIT} requests per hour.`,
      "rate_limit_exceeded",
      429
    );
  }

  // Upsert rate count
  if (rateRow) {
    await supabase
      .from("api_rate_limits")
      .update({ request_count: currentCount + 1 })
      .eq("key_hash", keyHash)
      .eq("window_start", windowStart);
  } else {
    await supabase
      .from("api_rate_limits")
      .insert({ key_hash: keyHash, window_start: windowStart, request_count: 1 });
  }

  // Increment total requests
  await supabase.rpc("increment_api_key_requests", { p_key_hash: keyHash });

  // Increment usage tracking
  await supabase.rpc("increment_usage", {
    p_user_id: keyRecord.user_id,
    p_field: "api_calls_made",
    p_amount: 1,
  });

  return {
    userId: keyRecord.user_id,
    keyId: keyRecord.id,
    keyHash,
    permissions: keyRecord.permissions ?? { read: true, write: true, publish: false },
  };
}

// ── Route handlers ───────────────────────────────────────────────────

async function handleBrands(
  req: Request,
  path: string[],
  auth: AuthResult,
  supabase: any
): Promise<Response> {
  // GET /v1/brands
  if (req.method === "GET" && path.length === 0) {
    if (!auth.permissions?.brands?.read && !auth.permissions?.read) {
      return err("No brands:read permission", "forbidden", 403);
    }
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const perPage = Math.min(parseInt(url.searchParams.get("per_page") ?? "20"), 100);
    const offset = (page - 1) * perPage;

    const { data, error, count } = await supabase
      .from("brands")
      .select(
        "id, name, industry, tone, brand_description, is_default, color, created_at, social_accounts(platform, platform_username, is_active)",
        { count: "exact" }
      )
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + perPage - 1);

    if (error) return err("Failed to fetch brands", "database_error", 500);
    return ok(data, { total: count ?? 0, page, per_page: perPage, total_pages: Math.ceil((count ?? 0) / perPage) });
  }

  // GET /v1/brands/:id
  if (req.method === "GET" && path.length === 1) {
    if (!auth.permissions?.brands?.read && !auth.permissions?.read) {
      return err("No brands:read permission", "forbidden", 403);
    }
    const { data, error } = await supabase
      .from("brands")
      .select("*, social_accounts(platform, platform_username, is_active)")
      .eq("id", path[0])
      .eq("user_id", auth.userId)
      .single();

    if (error || !data) return err("Brand not found", "not_found", 404);
    return ok(data);
  }

  // PATCH /v1/brands/:id
  if (req.method === "PATCH" && path.length === 1) {
    if (!auth.permissions?.brands?.write && !auth.permissions?.write) {
      return err("No brands:write permission", "forbidden", 403);
    }
    const body = await req.json().catch(() => null);
    if (!body) return err("Invalid JSON body", "invalid_body", 400);

    const allowed = ["name", "industry", "tone", "brand_description", "color"];
    const updates: Record<string, unknown> = {};
    for (const k of allowed) {
      if (body[k] !== undefined) updates[k] = body[k];
    }
    if (Object.keys(updates).length === 0) return err("No valid fields to update", "validation_error", 400);

    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from("brands")
      .update(updates)
      .eq("id", path[0])
      .eq("user_id", auth.userId)
      .select()
      .single();

    if (error || !data) return err("Brand not found", "not_found", 404);
    return ok(data);
  }

  return err("Not found", "not_found", 404);
}

async function handlePosts(
  req: Request,
  path: string[],
  auth: AuthResult,
  supabase: any
): Promise<Response> {
  // GET /v1/posts
  if (req.method === "GET" && path.length === 0) {
    if (!auth.permissions?.posts?.read && !auth.permissions?.read) {
      return err("No posts:read permission", "forbidden", 403);
    }
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const perPage = Math.min(parseInt(url.searchParams.get("per_page") ?? "20"), 100);
    const offset = (page - 1) * perPage;

    let query = supabase
      .from("posts")
      .select("*, post_analytics(*)", { count: "exact" })
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + perPage - 1);

    const brandId = url.searchParams.get("brand_id");
    const platform = url.searchParams.get("platform");
    const status = url.searchParams.get("status");
    const fromDate = url.searchParams.get("from_date");
    const toDate = url.searchParams.get("to_date");

    if (brandId) query = query.eq("brand_id", brandId);
    if (platform) query = query.eq("platform", platform);
    if (status) query = query.eq("status", status);
    if (fromDate) query = query.gte("created_at", fromDate);
    if (toDate) query = query.lte("created_at", toDate);

    const { data, error, count } = await query;
    if (error) return err("Failed to fetch posts", "database_error", 500);
    return ok(data, { total: count ?? 0, page, per_page: perPage, total_pages: Math.ceil((count ?? 0) / perPage) });
  }

  // POST /v1/posts
  if (req.method === "POST" && path.length === 0) {
    if (!auth.permissions?.posts?.write && !auth.permissions?.write) {
      return err("No posts:write permission", "forbidden", 403);
    }
    const body = await req.json().catch(() => null);
    if (!body) return err("Invalid JSON body", "invalid_body", 400);

    const errors: Record<string, string> = {};
    if (!body.brand_id) errors.brand_id = "brand_id is required";
    if (!body.platform) errors.platform = "platform is required";
    if (!body.content) errors.content = "content is required";

    const validPlatforms = ["instagram", "linkedin", "twitter", "facebook", "tiktok", "pinterest"];
    if (body.platform && !validPlatforms.includes(body.platform)) {
      errors.platform = `platform must be one of: ${validPlatforms.join(", ")}`;
    }

    if (Object.keys(errors).length > 0) {
      return err("Validation failed", "validation_error", 400, errors);
    }

    // Verify brand ownership
    const { data: brand } = await supabase
      .from("brands")
      .select("id")
      .eq("id", body.brand_id)
      .eq("user_id", auth.userId)
      .single();

    if (!brand) return err("Brand not found or does not belong to you", "not_found", 404);

    const { data: socialAccount } = await supabase
      .from("social_accounts")
      .select("id")
      .eq("brand_id", body.brand_id)
      .eq("platform", body.platform)
      .eq("is_active", true)
      .maybeSingle();

    const { data: post, error: postErr } = await supabase
      .from("posts")
      .insert({
        user_id: auth.userId,
        brand_id: body.brand_id,
        social_account_id: socialAccount?.id ?? null,
        platform: body.platform,
        content: body.content,
        image_url: body.image_url ?? null,
        status: body.scheduled_at ? "scheduled" : "draft",
        scheduled_at: body.scheduled_at ?? null,
      })
      .select()
      .single();

    if (postErr) return err("Failed to create post", "database_error", 500);

    if (body.scheduled_at && post) {
      await supabase.from("scheduled_jobs").insert({
        post_id: post.id,
        user_id: auth.userId,
        scheduled_at: body.scheduled_at,
        status: "pending",
      });
    }

    await supabase.rpc("increment_usage", {
      p_user_id: auth.userId,
      p_field: "posts_generated",
      p_amount: 1,
    });

    return created(post);
  }

  // GET /v1/posts/:id
  if (req.method === "GET" && path.length === 1) {
    if (!auth.permissions?.posts?.read && !auth.permissions?.read) {
      return err("No posts:read permission", "forbidden", 403);
    }
    const { data, error } = await supabase
      .from("posts")
      .select("*, post_analytics(*)")
      .eq("id", path[0])
      .eq("user_id", auth.userId)
      .single();

    if (error || !data) return err("Post not found", "not_found", 404);
    return ok(data);
  }

  // PATCH /v1/posts/:id
  if (req.method === "PATCH" && path.length === 1) {
    if (!auth.permissions?.posts?.write && !auth.permissions?.write) {
      return err("No posts:write permission", "forbidden", 403);
    }
    const body = await req.json().catch(() => null);
    if (!body) return err("Invalid JSON body", "invalid_body", 400);

    const allowed = ["content", "image_url", "scheduled_at", "status"];
    const updates: Record<string, unknown> = {};
    for (const k of allowed) {
      if (body[k] !== undefined) updates[k] = body[k];
    }
    if (Object.keys(updates).length === 0) return err("No valid fields", "validation_error", 400);

    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from("posts")
      .update(updates)
      .eq("id", path[0])
      .eq("user_id", auth.userId)
      .select()
      .single();

    if (error || !data) return err("Post not found", "not_found", 404);
    return ok(data);
  }

  // DELETE /v1/posts/:id
  if (req.method === "DELETE" && path.length === 1) {
    if (!auth.permissions?.posts?.write && !auth.permissions?.write) {
      return err("No posts:write permission", "forbidden", 403);
    }
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", path[0])
      .eq("user_id", auth.userId);

    if (error) return err("Failed to delete post", "database_error", 500);
    return ok({ deleted: true });
  }

  // POST /v1/posts/:id/schedule
  if (req.method === "POST" && path.length === 2 && path[1] === "schedule") {
    if (!auth.permissions?.posts?.write && !auth.permissions?.write) {
      return err("No posts:write permission", "forbidden", 403);
    }
    const body = await req.json().catch(() => null);
    if (!body?.scheduled_at) return err("scheduled_at is required (ISO 8601)", "validation_error", 400);

    if (new Date(body.scheduled_at) <= new Date()) {
      return err("scheduled_at must be in the future", "validation_error", 400);
    }

    const { data: post } = await supabase
      .from("posts")
      .select("id")
      .eq("id", path[0])
      .eq("user_id", auth.userId)
      .single();

    if (!post) return err("Post not found", "not_found", 404);

    await supabase
      .from("posts")
      .update({ status: "scheduled", scheduled_at: body.scheduled_at, updated_at: new Date().toISOString() })
      .eq("id", path[0]);

    await supabase.from("scheduled_jobs").insert({
      post_id: path[0],
      user_id: auth.userId,
      scheduled_at: body.scheduled_at,
      status: "pending",
    });

    return ok({ post_id: path[0], scheduled_at: body.scheduled_at, status: "scheduled" });
  }

  // POST /v1/posts/:id/publish
  if (req.method === "POST" && path.length === 2 && path[1] === "publish") {
    if (!auth.permissions?.posts?.publish && !auth.permissions?.publish) {
      return err("No posts:publish permission. Regenerate your key with publish permission.", "forbidden", 403);
    }

    const { data: post } = await supabase
      .from("posts")
      .select("*, social_accounts(*)")
      .eq("id", path[0])
      .eq("user_id", auth.userId)
      .single();

    if (!post) return err("Post not found", "not_found", 404);
    if (post.status === "published") return err("Post already published", "already_published", 400);

    if (!post.social_account_id) {
      return err("No social account connected for this platform", "platform_not_connected", 400);
    }

    // Mark as published (actual platform publishing would go through publish service)
    await supabase
      .from("posts")
      .update({ status: "published", published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", path[0]);

    return ok({ post_id: path[0], published: true, published_at: new Date().toISOString() });
  }

  return err("Not found", "not_found", 404);
}

async function handleAnalytics(
  req: Request,
  auth: AuthResult,
  supabase: any
): Promise<Response> {
  if (req.method !== "GET") return err("Method not allowed", "not_found", 404);
  if (!auth.permissions?.analytics?.read && !auth.permissions?.read) {
    return err("No analytics:read permission", "forbidden", 403);
  }

  const url = new URL(req.url);
  const brandId = url.searchParams.get("brand_id");
  const platform = url.searchParams.get("platform");
  const fromDate = url.searchParams.get("from_date") ?? new Date(Date.now() - 30 * 86400000).toISOString();
  const toDate = url.searchParams.get("to_date") ?? new Date().toISOString();

  let query = supabase
    .from("post_analytics")
    .select("*, posts!inner(brand_id, platform, user_id)")
    .eq("posts.user_id", auth.userId)
    .gte("created_at", fromDate)
    .lte("created_at", toDate);

  if (brandId) query = query.eq("posts.brand_id", brandId);
  if (platform) query = query.eq("platform", platform);

  const { data, error } = await query;
  if (error) return err("Failed to fetch analytics", "database_error", 500);

  const totals = (data ?? []).reduce(
    (acc: any, row: any) => ({
      reach: acc.reach + (row.reach ?? 0),
      impressions: acc.impressions + (row.impressions ?? 0),
      likes: acc.likes + (row.likes ?? 0),
      comments: acc.comments + (row.comments ?? 0),
      shares: acc.shares + (row.shares ?? 0),
      clicks: acc.clicks + (row.clicks ?? 0),
    }),
    { reach: 0, impressions: 0, likes: 0, comments: 0, shares: 0, clicks: 0 }
  );

  return ok({ totals, records: data?.length ?? 0, from_date: fromDate, to_date: toDate });
}

async function handleComments(
  req: Request,
  path: string[],
  auth: AuthResult,
  supabase: any
): Promise<Response> {
  // GET /v1/comments
  if (req.method === "GET" && path.length === 0) {
    if (!auth.permissions?.comments?.read && !auth.permissions?.read) {
      return err("No comments:read permission", "forbidden", 403);
    }
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const perPage = Math.min(parseInt(url.searchParams.get("per_page") ?? "20"), 100);
    const offset = (page - 1) * perPage;

    let query = supabase
      .from("comments_cache")
      .select("*", { count: "exact" })
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + perPage - 1);

    const platform = url.searchParams.get("platform");
    const isReplied = url.searchParams.get("is_replied");
    const isFlagged = url.searchParams.get("is_flagged");

    if (platform) query = query.eq("platform", platform);
    if (isReplied !== null && isReplied !== undefined) query = query.eq("is_replied", isReplied === "true");
    if (isFlagged !== null && isFlagged !== undefined) query = query.eq("is_flagged", isFlagged === "true");

    const { data, error, count } = await query;
    if (error) return err("Failed to fetch comments", "database_error", 500);
    return ok(data, { total: count ?? 0, page, per_page: perPage });
  }

  // POST /v1/comments/:id/reply
  if (req.method === "POST" && path.length === 2 && path[1] === "reply") {
    if (!auth.permissions?.comments?.write && !auth.permissions?.write) {
      return err("No comments:write permission", "forbidden", 403);
    }
    const body = await req.json().catch(() => null);
    if (!body?.reply_text) return err("reply_text is required", "validation_error", 400);

    const { data, error } = await supabase
      .from("comments_cache")
      .update({
        reply_text: body.reply_text,
        is_replied: true,
        replied_at: new Date().toISOString(),
        reply_saved_locally: true,
      })
      .eq("id", path[0])
      .eq("user_id", auth.userId)
      .select()
      .single();

    if (error || !data) return err("Comment not found", "not_found", 404);
    return ok(data);
  }

  return err("Not found", "not_found", 404);
}

async function handleUsage(
  req: Request,
  auth: AuthResult,
  supabase: any
): Promise<Response> {
  if (req.method !== "GET") return err("Method not allowed", "not_found", 404);

  const { data: usage } = await supabase.rpc("get_current_usage", { p_user_id: auth.userId });

  const { data: keyStats } = await supabase
    .from("api_keys")
    .select("total_requests")
    .eq("id", auth.keyId)
    .single();

  return ok({
    plan: "agency",
    month: (usage as any)?.month_year ?? "",
    posts_generated: (usage as any)?.posts_generated ?? 0,
    ai_images_generated: (usage as any)?.ai_images_generated ?? 0,
    api_calls_total: keyStats?.total_requests ?? 0,
    rate_limit: { requests_per_hour: RATE_LIMIT, window: "1 hour" },
  });
}

// ── Main handler ─────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Parse path: /api-v1/v1/brands/123 → ["brands", "123"]
  const url = new URL(req.url);
  const segments = url.pathname
    .replace(/^\/api-v1\/?/, "")
    .replace(/^v1\/?/, "")
    .split("/")
    .filter(Boolean);

  const resource = segments[0] ?? "";
  const subPath = segments.slice(1);

  // Authenticate
  const authResult = await authenticate(req, supabase);
  if (authResult instanceof Response) {
    // Log failed request
    await supabase.from("api_request_logs").insert({
      user_id: "00000000-0000-0000-0000-000000000000",
      method: req.method,
      endpoint: `/${resource}/${subPath.join("/")}`,
      status_code: 401,
      response_time_ms: Date.now() - startTime,
    }).then(() => {});
    return authResult;
  }

  let response: Response;

  try {
    switch (resource) {
      case "brands":
        response = await handleBrands(req, subPath, authResult, supabase);
        break;
      case "posts":
        response = await handlePosts(req, subPath, authResult, supabase);
        break;
      case "analytics":
        response = await handleAnalytics(req, authResult, supabase);
        break;
      case "comments":
        response = await handleComments(req, subPath, authResult, supabase);
        break;
      case "usage":
        response = await handleUsage(req, authResult, supabase);
        break;
      default:
        response = err(
          "Unknown endpoint. Available: /v1/brands, /v1/posts, /v1/analytics, /v1/comments, /v1/usage",
          "not_found",
          404
        );
    }
  } catch (e: any) {
    response = err(e.message ?? "Internal server error", "internal_error", 500);
  }

  // Log successful request
  const statusCode = response.status;
  await supabase.from("api_request_logs").insert({
    user_id: authResult.userId,
    api_key_id: authResult.keyId,
    method: req.method,
    endpoint: `/${resource}/${subPath.join("/")}`.replace(/\/$/, ""),
    status_code: statusCode,
    response_time_ms: Date.now() - startTime,
    ip_address: req.headers.get("x-forwarded-for") ?? "unknown",
    user_agent: req.headers.get("user-agent") ?? "unknown",
  }).then(() => {});

  return response;
});
