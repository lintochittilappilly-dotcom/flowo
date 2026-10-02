import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory rate limit store
const rateLimits = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMITS_PER_PLAN: Record<string, number> = {
  starter: 5,
  pro: 15,
  agency: 30,
};

function checkRateLimit(userId: string, plan: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const maxRequests = RATE_LIMITS_PER_PLAN[plan] || RATE_LIMITS_PER_PLAN.starter;
  const entry = rateLimits.get(userId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimits.set(userId, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check for rate limiting
    const authHeader = req.headers.get("Authorization");
    let userId = "anonymous";
    let userPlan = "starter";
    // Lifted to outer scope so the Storage upload below can use it
    let supabase: ReturnType<typeof createClient> | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      try {
        supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
          const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle();
          userPlan = (profile?.plan as string) || "starter";
        }
      } catch {
        supabase = null; // continue with defaults, no upload target
      }
    }

    // Rate limit check
    const { allowed, remaining } = checkRateLimit(userId, userPlan);
    if (!allowed) {
      return new Response(JSON.stringify({
        error: "Rate limit exceeded. Please wait a moment before generating more images.",
        retry_after_seconds: 60,
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": "0",
          "Retry-After": "60",
        },
      });
    }

    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY is not configured. Add it as a Supabase secret." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: "1024x1024",
        // NOTE: no response_format — gpt-image-1 doesn't support it and returns b64_json
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("OpenAI image error:", response.status, detail);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "OpenAI rate limit / quota exceeded. Check billing or try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401 || response.status === 403) {
        return new Response(JSON.stringify({ error: "OpenAI rejected the API key (invalid or lacks image access).", detail }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Surface the REAL reason instead of a blind 500
      return new Response(JSON.stringify({ error: "Image generation failed", openai_status: response.status, detail }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const d = data.data?.[0];

    // gpt-image-1 → base64 (b64_json); dall-e-3 → url. Support both.
    let imageUrl: string | null = d?.url ?? null;
    if (!imageUrl && d?.b64_json) {
      const bytes = Uint8Array.from(atob(d.b64_json), (c) => c.charCodeAt(0));
      const path = `${userId}/${Date.now()}.png`;

      if (supabase) {
        const { error: upErr } = await supabase.storage
          .from("generated-images")
          .upload(path, bytes, { contentType: "image/png", upsert: false });

        if (upErr) {
          console.error("storage upload failed:", upErr.message);
          imageUrl = `data:image/png;base64,${d.b64_json}`; // fallback so UI still works
        } else {
          imageUrl = supabase.storage.from("generated-images").getPublicUrl(path).data.publicUrl;
        }
      } else {
        // No authenticated client (anonymous) — fall back to data URL
        imageUrl = `data:image/png;base64,${d.b64_json}`;
      }
    }

    const revisedPrompt = d?.revised_prompt || "";

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "No image was generated. Try a different prompt." }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ imageUrl, text: revisedPrompt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-RateLimit-Remaining": String(remaining) },
    });
  } catch (e) {
    console.error("generate-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
