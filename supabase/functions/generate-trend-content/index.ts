import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory rate limit store (resets on cold start, good enough for edge)
const rateLimits = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMITS_PER_PLAN: Record<string, number> = {
  starter: 10,
  pro: 30,
  agency: 60,
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

    if (authHeader?.startsWith("Bearer ")) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
          const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
          userPlan = profile?.plan || "starter";
        }
      } catch { /* continue with defaults */ }
    }

    // Rate limit check
    const { allowed, remaining } = checkRateLimit(userId, userPlan);
    if (!allowed) {
      return new Response(JSON.stringify({ 
        error: "Rate limit exceeded. Please wait a moment before generating more content.",
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

    const body = await req.json();
    const { trendTopic, requirements, platform, tone, topic, brandVoice } = body;
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY is not configured. Add it as a Supabase Edge Function secret." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const effectiveTopic = trendTopic || topic || "social media content";
    const effectivePlatform = platform || "instagram";
    const effectiveTone = tone || "engaging";

    let systemPrompt: string;
    let userPrompt: string;

    if (effectivePlatform === "brand_voice") {
      systemPrompt = "You are an expert brand strategist. Create a brand voice profile description based on the information provided. Be specific about tone, vocabulary, sentence structure, and personality traits.";
      userPrompt = `Create a brand voice profile for: ${effectiveTopic}\nTone preferences: ${effectiveTone}`;
    } else if (effectivePlatform === "insight") {
      systemPrompt = "You are an expert social media analyst. Provide a specific, actionable insight in 2-3 sentences based on the data context provided.";
      userPrompt = `Analyze and provide insight for: ${effectiveTopic}`;
    } else if (effectivePlatform === "reply") {
      systemPrompt = "You are a friendly social media community manager. Write a helpful, engaging reply to the comment. Keep it concise and authentic.";
      userPrompt = `Write a reply to this comment: ${effectiveTopic}`;
    } else if (effectiveTone === "hashtags") {
      systemPrompt = "You are a social media hashtag expert. Return ONLY a JSON array of 5-10 relevant hashtags (with # prefix) for the given content and platform.";
      userPrompt = `Generate hashtags for this ${effectivePlatform} content: ${effectiveTopic}`;
    } else if (effectivePlatform === "trends") {
      systemPrompt = "You are a social media trend analyst. Provide analysis of current trends.";
      userPrompt = `${effectiveTopic}\n${requirements || ""}`;
    } else {
      systemPrompt = `You are an expert social media content creator. Generate an engaging, platform-ready ${effectivePlatform} post.${brandVoice ? `\n\nBrand voice: ${brandVoice}` : ""}\n\nReturn ONLY a JSON object with these fields:\n- "content": the post text ready to copy\n- "hashtags": array of relevant hashtags\n- "tips": array of 2-3 engagement tips`;
      userPrompt = `Topic: "${effectiveTopic}"\nPlatform: ${effectivePlatform}\nTone: ${effectiveTone}\n${requirements ? `Requirements: ${requirements}` : ""}`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401) {
        return new Response(JSON.stringify({ error: "Invalid OpenAI API key." }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("OpenAI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim() || "";

    try {
      const parsed = JSON.parse(rawContent);
      return new Response(JSON.stringify({
        content: parsed.content || rawContent,
        hashtags: parsed.hashtags || [],
        tips: parsed.tips || [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-RateLimit-Remaining": String(remaining) },
      });
    } catch {
      const hashtagMatches = rawContent.match(/#\w+/g) || [];
      return new Response(JSON.stringify({
        content: rawContent,
        hashtags: hashtagMatches,
        tips: [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-RateLimit-Remaining": String(remaining) },
      });
    }
  } catch (e) {
    console.error("generate-trend-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
