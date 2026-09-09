import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Price IDs — read from env, fallback to placeholders
const PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  starter: {
    monthly: Deno.env.get("STRIPE_STARTER_MONTHLY_PRICE_ID") || "",
    annual: Deno.env.get("STRIPE_STARTER_ANNUAL_PRICE_ID") || "",
  },
  pro: {
    monthly: Deno.env.get("STRIPE_PRO_MONTHLY_PRICE_ID") || "",
    annual: Deno.env.get("STRIPE_PRO_ANNUAL_PRICE_ID") || "",
  },
  agency: {
    monthly: Deno.env.get("STRIPE_AGENCY_MONTHLY_PRICE_ID") || "",
    annual: Deno.env.get("STRIPE_AGENCY_ANNUAL_PRICE_ID") || "",
  },
};

async function stripeRequest(endpoint: string, body: Record<string, string>, stripeKey: string) {
  const res = await fetch(`https://api.stripe.com/v1${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });
  return res.json();
}

async function stripeGet(endpoint: string, stripeKey: string) {
  const res = await fetch(`https://api.stripe.com/v1${endpoint}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "Stripe not configured", configured: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth
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

    const userId = user.id;
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, plan")
      .eq("id", userId)
      .single();

    const { action, plan, interval, return_url } = await req.json();

    // ---- GET OR CREATE STRIPE CUSTOMER ----
    const getOrCreateCustomer = async (email: string) => {
      const searchRes = await fetch(
        `https://api.stripe.com/v1/customers/search?query=email:'${email}'`,
        { headers: { Authorization: `Bearer ${stripeKey}` } }
      );
      const searchData = await searchRes.json();
      if (searchData.data?.length > 0) return searchData.data[0].id;

      const customer = await stripeRequest("/customers", {
        email,
        "metadata[supabase_user_id]": userId,
      }, stripeKey);
      return customer.id;
    };

    // ---- ACTION: CREATE CHECKOUT SESSION ----
    if (action === "create_checkout") {
      const priceId = PRICE_IDS[plan]?.[interval as "monthly" | "annual"];
      if (!priceId) {
        return new Response(JSON.stringify({ error: "Price ID not configured for this plan. Add STRIPE_*_PRICE_ID secrets.", configured: false }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const customerId = await getOrCreateCustomer(profile?.email || user.email || "");

      const session = await stripeRequest("/checkout/sessions", {
        customer: customerId,
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        mode: "subscription",
        success_url: `${return_url}?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${return_url}?canceled=true`,
        "metadata[supabase_user_id]": userId,
        "metadata[plan]": plan,
        "subscription_data[metadata][supabase_user_id]": userId,
        "subscription_data[metadata][plan]": plan,
      }, stripeKey);

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- ACTION: CUSTOMER PORTAL ----
    if (action === "customer_portal") {
      const customerId = await getOrCreateCustomer(profile?.email || user.email || "");

      const portalSession = await stripeRequest("/billing_portal/sessions", {
        customer: customerId,
        return_url: return_url || "",
      }, stripeKey);

      return new Response(JSON.stringify({ url: portalSession.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- ACTION: GET SUBSCRIPTION STATUS ----
    if (action === "get_subscription") {
      const customerId = await getOrCreateCustomer(profile?.email || user.email || "");
      const subs = await stripeGet(`/subscriptions?customer=${customerId}&status=active&limit=1`, stripeKey);

      if (subs.data?.length > 0) {
        const sub = subs.data[0];
        return new Response(JSON.stringify({
          subscription_id: sub.id,
          status: sub.status,
          plan: sub.metadata?.plan || profile?.plan || "starter",
          current_period_end: sub.current_period_end,
          cancel_at_period_end: sub.cancel_at_period_end,
          interval: sub.items?.data?.[0]?.price?.recurring?.interval || "month",
          configured: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        subscription_id: null,
        status: "none",
        plan: profile?.plan || "starter",
        configured: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- ACTION: CANCEL SUBSCRIPTION ----
    if (action === "cancel_subscription") {
      const customerId = await getOrCreateCustomer(profile?.email || user.email || "");
      const subs = await stripeGet(`/subscriptions?customer=${customerId}&status=active&limit=1`, stripeKey);

      if (!subs.data?.length) {
        return new Response(JSON.stringify({ error: "No active subscription found" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const subId = subs.data[0].id;
      // Cancel at end of billing period so user keeps access until then
      const canceled = await stripeRequest(`/subscriptions/${subId}`, {
        cancel_at_period_end: "true",
      }, stripeKey);

      // Update profile plan to starter when period ends (webhook handles this too)
      return new Response(JSON.stringify({
        success: true,
        cancel_at_period_end: canceled.cancel_at_period_end,
        current_period_end: canceled.current_period_end,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- ACTION: DELETE ACCOUNT ----
    if (action === "delete_account") {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      // Cancel any active Stripe subscription first
      try {
        const customerId = await getOrCreateCustomer(profile?.email || user.email || "");
        const subs = await stripeGet(`/subscriptions?customer=${customerId}&status=active&limit=1`, stripeKey);
        if (subs.data?.length) {
          await stripeRequest(`/subscriptions/${subs.data[0].id}`, { cancel_at_period_end: "false" }, stripeKey);
          // Immediately cancel
          await fetch(`https://api.stripe.com/v1/subscriptions/${subs.data[0].id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${stripeKey}` },
          });
        }
      } catch (e) {
        console.error("Failed to cancel Stripe subscription during account deletion:", e);
      }

      // Delete user data in order (respecting FK constraints)
      const tables = [
        "comments_cache", "post_analytics", "scheduled_jobs", "posts",
        "content_drafts", "brand_voice_profiles", "brand_activity", "social_accounts",
        "brands", "saved_trends", "notifications", "ai_insights",
        "generated_images", "billing_history", "team_activity", "team_members",
        "api_request_logs", "api_keys", "usage_tracking", "oauth_states",
      ];

      for (const table of tables) {
        const { error: delErr } = await supabaseAdmin.from(table).delete().eq("user_id", userId);
        if (delErr) console.error(`Failed to delete from ${table}:`, delErr.message);
      }

      // Delete team_members where user is owner
      await supabaseAdmin.from("team_members").delete().eq("owner_user_id", userId);
      // Delete team_activity where user is owner
      await supabaseAdmin.from("team_activity").delete().eq("owner_user_id", userId);

      // Delete profile
      await supabaseAdmin.from("profiles").delete().eq("id", userId);

      // Delete auth user
      const { error: authDeleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authDeleteErr) {
        console.error("Failed to delete auth user:", authDeleteErr.message);
        return new Response(JSON.stringify({ error: "Failed to delete auth account" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
