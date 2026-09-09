import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();

    // Find users with trials expiring in 1 day or 3 days
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Get trial users expiring within 3 days
    const { data: expiringUsers, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, trial_ends_at")
      .eq("plan", "trial")
      .eq("trial_expired", false)
      .gte("trial_ends_at", now.toISOString())
      .lte("trial_ends_at", threeDaysFromNow.toISOString());

    if (error) {
      console.error("Error fetching expiring users:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!expiringUsers || expiringUsers.length === 0) {
      return new Response(
        JSON.stringify({ message: "No expiring trials found", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { userId: string; daysLeft: number; emailSent: boolean; error?: string }[] = [];

    for (const user of expiringUsers) {
      if (!user.trial_ends_at || !user.email) {
        results.push({ userId: user.id, daysLeft: 0, emailSent: false, error: "Missing email or trial_ends_at" });
        continue;
      }

      const msLeft = new Date(user.trial_ends_at).getTime() - now.getTime();
      const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

      // Only send emails at exactly 3 days and 1 day remaining
      if (daysLeft !== 3 && daysLeft !== 1) {
        continue;
      }

      // If no Resend API key, log but don't fail
      if (!resendApiKey) {
        console.log(`[DRY RUN] Would email ${user.email} — ${daysLeft} day(s) left in trial`);
        results.push({ userId: user.id, daysLeft, emailSent: false, error: "RESEND_API_KEY not configured" });
        continue;
      }

      const userName = user.full_name || "there";
      const subject =
        daysLeft === 1
          ? "⚠️ Your Flowo trial expires tomorrow"
          : "⏳ Your Flowo trial ends in 3 days";

      const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:24px;font-weight:700;color:#1a1a2e;margin:0;">Flowo</h1>
    </div>
    
    <div style="background:${daysLeft === 1 ? "#FEF2F2" : "#FFFBEB"};border:1px solid ${daysLeft === 1 ? "#FECACA" : "#FDE68A"};border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <p style="font-size:36px;margin:0 0 8px 0;">${daysLeft === 1 ? "⚠️" : "⏳"}</p>
      <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:0 0 8px 0;">
        ${daysLeft === 1 ? "Your trial expires tomorrow" : "Your trial ends in 3 days"}
      </h2>
      <p style="font-size:14px;color:#6B7280;margin:0;">
        ${daysLeft === 1
          ? "After tomorrow, your dashboard will be locked until you choose a plan."
          : "You have 3 days left to explore all Pro features before your trial ends."
        }
      </p>
    </div>

    <p style="font-size:15px;color:#374151;line-height:1.6;margin-bottom:16px;">
      Hi ${userName},
    </p>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin-bottom:24px;">
      ${daysLeft === 1
        ? "Your 14-day free trial ends <strong>tomorrow</strong>. To keep access to your brands, scheduled posts, and analytics — upgrade to a paid plan now."
        : "Your 14-day free trial ends in <strong>3 days</strong>. Don't lose access to your scheduled posts, brand profiles, and analytics."
      }
    </p>

    <div style="text-align:center;margin:32px 0;">
      <a href="${supabaseUrl.replace('.supabase.co', '')}/settings?tab=billing" 
         style="display:inline-block;background:linear-gradient(135deg,#6D28D9,#7C3AED);color:#ffffff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;">
        Choose a Plan →
      </a>
    </div>

    <p style="font-size:13px;color:#9CA3AF;line-height:1.5;margin-top:32px;">
      All your data is safe. Once you upgrade, everything picks up right where you left off.
    </p>

    <hr style="border:none;border-top:1px solid #E5E7EB;margin:32px 0 16px 0;">
    <p style="font-size:12px;color:#9CA3AF;text-align:center;">
      Flowo — AI-Powered Social Media Management
    </p>
  </div>
</body>
</html>`;

      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Flowo <noreply@flowo.com>",
            to: [user.email],
            subject,
            html: htmlBody,
          }),
        });

        if (!emailRes.ok) {
          const errText = await emailRes.text();
          console.error(`Failed to email ${user.email}:`, errText);
          results.push({ userId: user.id, daysLeft, emailSent: false, error: errText });
        } else {
          console.log(`✅ Trial warning email sent to ${user.email} (${daysLeft} days left)`);
          results.push({ userId: user.id, daysLeft, emailSent: true });
        }
      } catch (emailErr: any) {
        console.error(`Email error for ${user.email}:`, emailErr.message);
        results.push({ userId: user.id, daysLeft, emailSent: false, error: emailErr.message });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Trial expiry check complete",
        total_expiring: expiringUsers.length,
        emails_processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("check-trial-expiry error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
