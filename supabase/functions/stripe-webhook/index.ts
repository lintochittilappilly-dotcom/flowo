import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const body = await req.text();

    // In production, verify the Stripe signature here using webhookSecret
    // For now, we parse the event directly
    const event = JSON.parse(body);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.supabase_user_id;
        const plan = session.metadata?.plan;
        if (userId && plan) {
          // Update plan and clear trial status
          await supabase.from("profiles").update({ 
            plan,
            trial_expired: false,
          }).eq("id", userId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        const userId = sub.metadata?.supabase_user_id;
        const plan = sub.metadata?.plan;
        if (userId) {
          if (sub.status === "active" && plan) {
            await supabase.from("profiles").update({ 
              plan,
              trial_expired: false,
            }).eq("id", userId);
          }
          if (sub.cancel_at_period_end) {
            // Subscription will cancel at end of period - could notify user
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const userId = sub.metadata?.supabase_user_id;
        if (userId) {
          // Subscription ended - set to expired
          await supabase.from("profiles").update({ 
            plan: "expired",
            trial_expired: true,
          }).eq("id", userId);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        // Look up user by customer search
        const custRes = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
          headers: { Authorization: `Bearer ${stripeKey}` },
        });
        const customer = await custRes.json();
        const userId = customer.metadata?.supabase_user_id;

        if (userId) {
          await supabase.from("billing_history").insert({
            user_id: userId,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            plan: invoice.lines?.data?.[0]?.metadata?.plan || null,
            status: "paid",
            stripe_invoice_id: invoice.id,
            invoice_url: invoice.hosted_invoice_url,
          });
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
