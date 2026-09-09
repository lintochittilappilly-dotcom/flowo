# Stripe Setup Guide — Flowo

Complete step-by-step guide to enable real subscription billing in Flowo.

---

## 📋 Overview

Flowo uses Stripe for subscription billing with three automated plans:
- **Starter**: $49/month or $39/month annual
- **Pro**: $99/month or $79/month annual  
- **Agency**: $199/month or $159/month annual

Without Stripe, the billing page shows upgrade prompts that redirect to professional contact forms. With Stripe connected, users get real checkout flows and automated subscription management.

## Step 1 — Create Stripe Account

1. Go to [https://stripe.com](https://stripe.com) and create an account
2. Complete business verification process
3. **Important**: Start with **Test Mode** (toggle in top right) to test everything first
4. Only switch to **Live Mode** when ready for real payments

## Step 2 — Get API Keys

1. Go to **Developers → API Keys**
2. Copy your keys to `.env`:

```bash
# Test keys for development
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
# Add secret key to Supabase secrets (never in .env file)
# STRIPE_SECRET_KEY=sk_test_xxxxx

# Live keys for production (after testing)
# VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
# STRIPE_SECRET_KEY=sk_live_xxxxx
```

⚠️ **Never put `STRIPE_SECRET_KEY` in your `.env` file** — add it to Supabase Edge Function secrets only.

## Step 3 — Create Products and Price IDs

### 3.1 — Starter Plan Product

1. Go to **Products → Add Product**
2. **Name**: `Starter`
3. **Description**: `Perfect for individual creators and small businesses`
4. Click **Create Product**

After creating, add two prices:

**Monthly Price:**
- Price: `$49.00`
- Billing period: `Monthly`
- Currency: `USD`
- Click **Save** → Copy the Price ID (starts with `price_`)

**Annual Price:**
- Price: `$39.00`
- Billing period: `Yearly`
- Currency: `USD`  
- Click **Save** → Copy the Price ID

### 3.2 — Pro Plan Product

1. **Name**: `Pro`
2. **Description**: `For growing businesses and marketing teams`
3. **Monthly Price**: `$99.00` per month
4. **Annual Price**: `$79.00` per month (billed yearly)

### 3.3 — Agency Plan Product  

1. **Name**: `Agency`
2. **Description**: `For agencies managing multiple brands`
3. **Monthly Price**: `$199.00` per month
4. **Annual Price**: `$159.00` per month (billed yearly)

### 3.4 — Add Price IDs to Supabase Secrets

```bash
supabase secrets set STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxxxx
supabase secrets set STRIPE_STARTER_ANNUAL_PRICE_ID=price_xxxxx
supabase secrets set STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxx
supabase secrets set STRIPE_PRO_ANNUAL_PRICE_ID=price_xxxxx
supabase secrets set STRIPE_AGENCY_MONTHLY_PRICE_ID=price_xxxxx
supabase secrets set STRIPE_AGENCY_ANNUAL_PRICE_ID=price_xxxxx
```

## Step 4 — Configure Customer Portal

1. Go to **Settings → Billing → Customer Portal**
2. **Enable** the customer portal
3. Configure these settings:
   - ✅ **Allow customers to update payment method**
   - ✅ **Allow customers to cancel subscription**  
   - ✅ **Allow customers to switch plans**
   - **Cancellation behavior**: `Cancel at end of billing period`
4. **Save Configuration**

## Step 5 — Set Up Webhook Endpoint

### 5.1 — Create Webhook

1. Go to **Developers → Webhooks**
2. Click **Add Endpoint**
3. **Endpoint URL**: `https://yourdomain.com/functions/v1/stripe-webhook`
4. **Listen to**: `Events on your account`

### 5.2 — Select Events to Listen For

Add these specific events (required for subscription management):

```
✅ checkout.session.completed
✅ invoice.payment_succeeded  
✅ invoice.payment_failed
✅ customer.subscription.created
✅ customer.subscription.updated
✅ customer.subscription.deleted
✅ customer.subscription.trial_will_end
```

### 5.3 — Get Webhook Secret

1. Click **Add Endpoint** to save
2. Click on your new webhook endpoint  
3. Copy the **Signing Secret** (starts with `whsec_`)
4. Add to Supabase secrets:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 5.4 — Test Webhook Locally (Development)

For local development, use Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local dev server
stripe listen --forward-to localhost:8080/functions/v1/stripe-webhook
```

This gives you a temporary webhook secret for local testing.

## Step 6 — Enable Stripe in Your App

Update your `.env` file:

```bash
VITE_STRIPE_ENABLED=true
```

Restart your development server:

```bash
npm run dev
```

## Step 7 — Test the Complete Billing Flow

### 7.1 — Test Subscription Creation

1. Go to `/settings` → **Billing** tab
2. Click **"Upgrade to Pro"** or any plan button
3. You should be redirected to Stripe Checkout
4. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any billing address
5. Complete the payment
6. You should be redirected back to Flowo with a success message

### 7.2 — Verify Database Updates

Check that the subscription was recorded:

1. Go to **Supabase → SQL Editor**
2. Run: `SELECT id, plan, created_at FROM profiles WHERE plan != 'starter';`
3. Your user should show the upgraded plan

### 7.3 — Test Customer Portal

1. Go back to `/settings` → **Billing**
2. Click **"Manage Subscription"**
3. You should be redirected to Stripe Customer Portal
4. Test updating payment method, canceling subscription, etc.

### 7.4 — Test Webhook Events

1. Go to **Stripe Dashboard → Events**
2. You should see events like `checkout.session.completed`
3. Click on an event to see the details
4. Check **Supabase → Edge Functions → stripe-webhook → Logs** for processing logs

## Step 8 — Go Live with Real Payments

### 8.1 — Complete Stripe Account Verification

1. Go to **Settings → Account Details**
2. Complete all required business information
3. Verify your bank account for payouts
4. Wait for Stripe approval (usually 1-2 business days)

### 8.2 — Switch to Live Mode

1. Toggle from **Test Mode** to **Live Mode** in Stripe dashboard
2. Create new live webhook endpoint pointing to your production URL
3. Update all secrets with live keys:

```bash
# Update to live keys
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_live_xxxxx

# Update price IDs to live versions
supabase secrets set STRIPE_STARTER_MONTHLY_PRICE_ID=price_live_xxxxx
supabase secrets set STRIPE_STARTER_ANNUAL_PRICE_ID=price_live_xxxxx
# ... repeat for all price IDs
```

3. Update your production `.env`:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

### 8.3 — Test with Real Card

1. Use a real credit card with a small amount
2. Verify the charge appears in your Stripe dashboard
3. Cancel the subscription immediately if it's just a test
4. Check that the cancellation webhook updates your database correctly

## Step 9 — Monitor and Manage

### 9.1 — Set Up Notifications

1. **Stripe Dashboard → Settings → Notifications**
2. Enable email notifications for:
   - Failed payments
   - Successful payments  
   - Subscription cancellations
   - Disputed charges

### 9.2 — Review Analytics

Regular monitoring dashboards:
- **Stripe Dashboard → Analytics** — Revenue, growth, churn
- **Supabase → Database → billing_history** — All transactions
- **Your App → Admin Panel** — User plan distribution

## 🔧 Troubleshooting

### Payment Issues

**Checkout session creation fails**
- ✅ Verify all `STRIPE_*_PRICE_ID` secrets are set correctly
- ✅ Check that `STRIPE_SECRET_KEY` is the right environment (test vs live)
- ✅ Look at Stripe logs in **Developers → Logs** for detailed error messages

**User plan not updating after payment**
- ✅ Check webhook endpoint is receiving events: **Stripe → Events**
- ✅ Verify `STRIPE_WEBHOOK_SECRET` matches your endpoint
- ✅ Look at Edge Function logs: **Supabase → Functions → stripe-webhook → Logs**
- ✅ Ensure your webhook endpoint URL is publicly accessible

### Webhook Issues

**Webhook signature verification fails**
- ✅ Make sure `STRIPE_WEBHOOK_SECRET` exactly matches (no extra spaces)
- ✅ Verify the endpoint URL in Stripe matches your deployed function
- ✅ Check that the webhook is sending to the correct environment (test/live)

**Subscription not found in database**
- ✅ Verify the `handle_stripe_webhook` function is working
- ✅ Check that customer metadata includes `supabase_user_id`
- ✅ Look for errors in the Edge Function logs

### Going Live Issues

**Live webhook not working**
- ✅ Create a separate webhook endpoint for live mode
- ✅ Update `STRIPE_WEBHOOK_SECRET` to the live webhook's secret
- ✅ Test with Stripe CLI: `stripe trigger checkout.session.completed`

**Price ID mismatch**
- ✅ Ensure all live price IDs are updated in Supabase secrets
- ✅ Live price IDs are different from test price IDs
- ✅ Check **Products** page shows `Live` mode when getting price IDs

## Step 10 — Trial System & Expiry Automation

Flowo includes a 14-day free trial with Pro-level access. After 14 days, the dashboard locks until the user purchases a plan.

### 10.1 — Trial Activation

Trials are activated automatically when a user completes onboarding. The `profiles` table is updated with:
- `plan = 'trial'`
- `trial_ends_at = now() + 14 days`
- `trial_expired = false`

### 10.2 — Trial Expiry Cron Job

Run this SQL in **Supabase SQL Editor** to enable automatic trial expiration (requires `pg_cron` extension):

```sql
SELECT cron.schedule(
  'expire-trials-daily',
  '0 0 * * *',
  $$
  UPDATE profiles
  SET plan = 'expired', trial_expired = true
  WHERE plan = 'trial'
    AND trial_ends_at < now()
    AND trial_expired = false;
  $$
);
```

This runs daily at midnight UTC and marks expired trials so the middleware redirects users to the billing page.

### 10.3 — After Payment

When a user purchases a plan via Stripe, the webhook sets `plan` to the purchased plan and clears `trial_expired`. The dashboard unlocks immediately.

---

## 📞 Support

- 📖 [Stripe Documentation](https://stripe.com/docs)
- 💬 [Stripe Support](https://support.stripe.com)  
- 🔍 Use Stripe Dashboard → **Logs** for debugging API calls
- 📊 Monitor webhook delivery in **Developers → Webhooks → [Your endpoint]**

---

**Your Stripe billing is now fully configured! 💳**

Users can now subscribe to paid plans and get automatically charged monthly or annually. Next: Set up [social platform connections](./API_CONNECT.md).
