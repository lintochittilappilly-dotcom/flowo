# Social Platform API Connection Guide — Flowo

Complete step-by-step guide to create developer apps and connect all 6 social media platforms to Flowo.

---

## 📋 Overview

Flowo supports 6 major social media platforms. Each platform requires creating a developer app, getting OAuth credentials, and configuring redirect URLs. **You can connect any combination** — each platform is independent.

| Platform | Publishing | Analytics | Approval Time | Cost |
|----------|------------|-----------|---------------|------|
| **Instagram** | ✅ Images & Videos | ✅ Full metrics | 1-3 days review | Free |
| **Facebook** | ✅ Posts & Images | ✅ Page insights | 1-3 days review | Free |
| **LinkedIn** | ✅ Posts & Articles | ✅ Engagement stats | 24 hours review | Free |
| **Twitter/X** | ✅ Tweets & Threads | ✅ Tweet analytics | Instant (with paid plan) | $100/month Basic |
| **TikTok** | ✅ Videos | ✅ Video metrics | 1-2 weeks review | Free |
| **Pinterest** | ✅ Pins & Boards | ✅ Pin analytics | 1-2 days review | Free |

---

## 🔧 Before You Start

### Required Information

For each platform you'll need:
- **App Name**: `Flowo` (or your branded name)
- **App Description**: `AI-powered social media management platform for automated content creation and scheduling`
- **Website URL**: Your production domain (e.g., `https://yourdomain.com`)
- **Privacy Policy URL**: `https://yourdomain.com/privacy`
- **Terms of Service URL**: `https://yourdomain.com/terms`

### OAuth Redirect URLs

Each platform needs these exact redirect URLs:
```
https://yourdomain.com/api/auth/callback/[platform]
http://localhost:8080/api/auth/callback/[platform]  # for development
```

Replace `[platform]` with: `instagram`, `facebook`, `linkedin`, `twitter`, `tiktok`, or `pinterest`.

---

## 📸 Instagram Setup

### Step 1 — Create Meta Developer Account

1. Go to [https://developers.facebook.com](https://developers.facebook.com)
2. Log in with your Facebook account (create one if needed)
3. Click **"Get Started"** and complete developer registration
4. Accept Meta developer terms and conditions

### Step 2 — Create App

1. Go to **My Apps → Create App**
2. **Use case**: Select **"Other"**
3. **App type**: Select **"Business"**
4. **App details**:
   - **App name**: `Flowo`
   - **App contact email**: Your business email
5. Click **"Create App"**

### Step 3 — Add Instagram Basic Display

1. In your app dashboard, scroll to **"Add a product"**
2. Find **"Instagram Basic Display"** → Click **"Set Up"**
3. Click **"Create New App"** in the Instagram Basic Display section
4. This creates a linked Instagram app

### Step 4 — Configure OAuth Settings

1. Go to **Instagram Basic Display → Basic Display**
2. In **Instagram App Secret** section, click **"Show"** and copy the secret
3. Scroll to **OAuth Redirect URIs** and add:
   ```
   https://yourdomain.com/api/auth/callback/instagram
   http://localhost:8080/api/auth/callback/instagram
   ```
4. Add **Deauthorize Callback URL**: `https://yourdomain.com/api/auth/deauthorize`
5. Add **Data Deletion Request URL**: `https://yourdomain.com/api/auth/deletion`
6. Click **"Save Changes"**

### Step 5 — Get App Credentials

1. Go to **Settings → Basic**
2. Copy **App ID** and **App Secret**

### Step 6 — Add to Your Environment

```bash
# Add to Supabase Edge Function secrets
supabase secrets set INSTAGRAM_APP_ID="your_app_id"
supabase secrets set INSTAGRAM_APP_SECRET="your_app_secret"
supabase secrets set INSTAGRAM_REDIRECT_URI="https://yourdomain.com/api/auth/callback/instagram"

# Enable in your .env file
VITE_INSTAGRAM_ENABLED=true
```

### Step 7 — App Review (Production)

For production, you need Instagram App Review:

1. **Development**: Use **Instagram Testers** (add in app dashboard) — no review needed
2. **Production**: Submit for review with:
   - **instagram_basic** — View basic profile info
   - **instagram_content_publish** — Publish posts
3. **Review time**: 1-3 business days
4. **Requirements**: Screen recording showing your app's Instagram integration

---

## 👤 Facebook Setup

### Step 1 — Use Same Meta App

Facebook shares the same Meta Developer app created for Instagram above.

### Step 2 — Add Facebook Login Product

1. In your Meta app dashboard, **"Add a product"**
2. Find **"Facebook Login"** → Click **"Set Up"**
3. Go to **Facebook Login → Settings**
4. Add **Valid OAuth Redirect URIs**:
   ```
   https://yourdomain.com/api/auth/callback/facebook
   http://localhost:8080/api/auth/callback/facebook
   ```

### Step 3 — Add Pages Product

1. Add **"Facebook Pages"** product to your app
2. This allows publishing to Facebook Pages

### Step 4 — Configure Permissions

Request these permissions for your app:
- **pages_show_list** — View user's pages
- **pages_read_engagement** — Read page insights
- **pages_manage_posts** — Publish posts to pages
- **pages_manage_engagement** — Reply to comments

### Step 5 — Add to Environment

```bash
# Facebook uses same app credentials as Instagram
supabase secrets set FACEBOOK_APP_ID="same_as_instagram_app_id"
supabase secrets set FACEBOOK_APP_SECRET="same_as_instagram_app_secret"  
supabase secrets set FACEBOOK_REDIRECT_URI="https://yourdomain.com/api/auth/callback/facebook"

# Enable in .env
VITE_FACEBOOK_ENABLED=true
```

### Step 6 — App Review

Submit for review requesting the permissions above. Provide screen recordings showing:
- How users connect their Facebook Pages
- How your app publishes posts to their pages
- How your app shows page analytics

---

## 💼 LinkedIn Setup

### Step 1 — Create LinkedIn Developer App

1. Go to [https://linkedin.com/developers](https://linkedin.com/developers)
2. Click **"Create App"**
3. **App name**: `Flowo`
4. **LinkedIn Page**: Select your company LinkedIn page (required)
5. **App logo**: Upload your logo (400x400px PNG)
6. **Legal agreement**: Check and accept
7. Click **"Create App"**

### Step 2 — Configure Authentication

1. Go to your app → **Auth** tab
2. Under **Authorized Redirect URLs** add:
   ```
   https://yourdomain.com/api/auth/callback/linkedin
   http://localhost:8080/api/auth/callback/linkedin
   ```
3. Click **"Update"**

### Step 3 — Request Access to Products

1. Go to **Products** tab
2. **Request access** to:
   - **"Sign In with LinkedIn using OpenID Connect"** — For authentication
   - **"Share on LinkedIn"** — For posting content
   - **"Marketing Developer Platform"** — For analytics (optional)
3. Most requests are **auto-approved within 24 hours**

### Step 4 — Get Credentials

1. Go to **Auth** tab
2. Copy **Client ID** and **Client Secret**

### Step 5 — Add to Environment

```bash
supabase secrets set LINKEDIN_CLIENT_ID="your_client_id"
supabase secrets set LINKEDIN_CLIENT_SECRET="your_client_secret"
supabase secrets set LINKEDIN_REDIRECT_URI="https://yourdomain.com/api/auth/callback/linkedin"

VITE_LINKEDIN_ENABLED=true
```

---

## 🐦 Twitter / X Setup

### Step 1 — Apply for Developer Account

1. Go to [https://developer.twitter.com](https://developer.twitter.com)
2. **Apply for a developer account**
3. **Describe your use case**: 
   > "Building Flowo, an AI-powered social media management platform that helps businesses create and schedule Twitter content. Our app will post tweets on behalf of users and provide analytics on tweet performance."
4. **Wait for approval** (usually same day, sometimes up to 3 days)

### Step 2 — Create Project and App

1. Go to **Developer Portal → Projects & Apps**
2. **Create Project**:
   - **Name**: `Flowo`
   - **Use case**: `Making a bot` or `Building tools for Twitter users`
3. **Create App** inside the project:
   - **App name**: `Flowo`
   - **Environment**: `Development` (change to Production later)

### Step 3 — Configure App Settings

1. Go to your app → **Settings**
2. Click **"Set up"** under **User authentication settings**
3. **App permissions**: `Read and Write`
4. **Type of App**: `Web App`
5. **App info**:
   - **Callback URL**: `https://yourdomain.com/api/auth/callback/twitter`
   - **Website URL**: `https://yourdomain.com`
   - **Terms of Service**: `https://yourdomain.com/terms`
   - **Privacy Policy**: `https://yourdomain.com/privacy`
6. Click **"Save"**

### Step 4 — Get Credentials

1. Go to **Keys and Tokens** tab
2. Under **OAuth 2.0 Client ID and Client Secret**, copy both values

### Step 5 — Add to Environment

```bash
supabase secrets set TWITTER_CLIENT_ID="your_oauth2_client_id"
supabase secrets set TWITTER_CLIENT_SECRET="your_oauth2_client_secret"
supabase secrets set TWITTER_REDIRECT_URI="https://yourdomain.com/api/auth/callback/twitter"

VITE_TWITTER_ENABLED=true
```

### ⚠️ Important: Twitter API Pricing

**Twitter requires a paid plan for write access (posting tweets):**

- **Free tier**: Read-only access (can't post tweets)
- **Basic tier**: $100/month — required for posting tweets and managing posts
- **Pro tier**: $5,000/month — for enterprise features

**For Flowo to publish tweets, you need at least the Basic tier subscription.**

### Step 6 — Upgrade to Basic Tier

1. In Twitter Developer Portal, go to **Billing**
2. **Subscribe to Basic** ($100/month)
3. This enables write permissions for your app
4. Update your app environment from **Development** to **Production**

---

## 🎵 TikTok Setup

### Step 1 — Create TikTok Developer Account

1. Go to [https://developers.tiktok.com](https://developers.tiktok.com)
2. Click **"Get Started"**
3. Sign in with your TikTok account (create one if needed)
4. Accept TikTok for Developers terms

### Step 2 — Create App

1. Go to **"Manage Apps"** → **"Create an App"**
2. **App details**:
   - **App Name**: `Flowo`
   - **Category**: `Tools and Utilities`
   - **Platform**: `Web`
   - **App description**: `AI social media management platform`
3. Click **"Submit"**

### Step 3 — Add Login Kit

1. In your app dashboard, **"Products"** → **"Add Products"**
2. Select **"Login Kit"** → **"Apply"**
3. Once approved, go to **Login Kit → Settings**
4. Add **Redirect URI**:
   ```
   https://yourdomain.com/api/auth/callback/tiktok
   http://localhost:8080/api/auth/callback/tiktok
   ```

### Step 4 — Add Content Posting API

1. **"Add Products"** → **"Content Posting API"**
2. This allows your app to post videos to TikTok
3. **Requires app review** for production use

### Step 5 — Get Credentials

1. Go to **Keys and Credentials**
2. Copy **Client Key** and **Client Secret**

### Step 6 — Add to Environment

```bash
supabase secrets set TIKTOK_CLIENT_KEY="your_client_key"
supabase secrets set TIKTOK_CLIENT_SECRET="your_client_secret"
supabase secrets set TIKTOK_REDIRECT_URI="https://yourdomain.com/api/auth/callback/tiktok"

VITE_TIKTOK_ENABLED=true
```

### Step 7 — App Review for Production

Submit app review for **Content Posting API**:
- **Review time**: 1-2 weeks
- **Requirements**: Demo video showing how your app posts to TikTok
- **Permissions needed**: `video.publish`, `user.info.basic`

---

## 📌 Pinterest Setup

### Step 1 — Create Pinterest Business Account

1. Go to [https://business.pinterest.com](https://business.pinterest.com)
2. **Create a business account** or **convert your personal account**
3. Complete business profile setup

### Step 2 — Create Pinterest Developer App

1. Go to [https://developers.pinterest.com](https://developers.pinterest.com)
2. **Get started** → **Connect app**
3. Log in with your Pinterest business account
4. Click **"Connect app"**

### Step 3 — Create App

1. **App name**: `Flowo`
2. **Description**: `AI-powered social media management tool for automated Pinterest pin creation and scheduling`
3. **App website**: `https://yourdomain.com`
4. **Privacy Policy URL**: `https://yourdomain.com/privacy`
5. **Terms of Service URL**: `https://yourdomain.com/terms`
6. Click **"Create"**

### Step 4 — Configure OAuth

1. Go to your app settings
2. **Add Redirect URIs**:
   ```
   https://yourdomain.com/api/auth/callback/pinterest
   http://localhost:8080/api/auth/callback/pinterest
   ```
3. **Save changes**

### Step 5 — Request Scopes

In your app settings, request these scopes:
- **boards:read** — View user's boards
- **pins:read** — View pins
- **pins:write** — Create new pins

### Step 6 — Get Credentials

1. Go to app **Settings** → **API Keys**
2. Copy **App ID** and **App Secret**

### Step 7 — Add to Environment

```bash
supabase secrets set PINTEREST_APP_ID="your_app_id"
supabase secrets set PINTEREST_APP_SECRET="your_app_secret"
supabase secrets set PINTEREST_REDIRECT_URI="https://yourdomain.com/api/auth/callback/pinterest"

VITE_PINTEREST_ENABLED=true
```

### Step 8 — App Review

Submit for production review:
- **Review time**: 1-2 business days
- **Requirements**: Screenshots/video of Pinterest integration in your app
- Most apps with clear business use cases are approved quickly

---

## ✅ Final Setup and Testing

### Step 1 — Update Environment Variables

Restart your development server after adding platform credentials:

```bash
npm run dev
```

### Step 2 — Test OAuth Connections

1. Go to **Settings → Connected Accounts** in your app
2. Click **"Connect"** for each enabled platform
3. Complete the OAuth flow for each platform
4. Verify the account appears as connected

### Step 3 — Test Publishing

1. Go to **Create Post** or **Content Calendar**
2. Create a test post for each connected platform
3. **Publish immediately** or **schedule for near future**
4. Verify posts appear on each platform

### Step 4 — Monitor Integration Health

Visit `/admin/health` to check platform integration status:
- ✅ **Green**: Platform is properly connected
- ⚠️ **Yellow**: Platform credentials configured but no accounts connected  
- ❌ **Red**: Missing credentials or configuration error

---

## 🔧 Troubleshooting

### Common OAuth Issues

**"Invalid redirect URI" error**
- ✅ Verify redirect URI in platform developer console **exactly matches** your app
- ✅ Check for trailing slashes, http vs https mismatches
- ✅ Ensure you added both production and localhost URLs

**"Invalid client" error**  
- ✅ Double-check CLIENT_ID and CLIENT_SECRET (copy-paste carefully)
- ✅ Ensure no extra spaces or characters
- ✅ Verify you're using the correct environment (test vs live keys)

**"Scope not authorized" error**
- ✅ Check you requested and received approval for required permissions
- ✅ Some platforms require manual approval for write permissions
- ✅ Verify your app is approved for production use

### Platform-Specific Issues

**Instagram/Facebook**: Meta apps require approved business use cases for publishing permissions

**LinkedIn**: Make sure you have a company LinkedIn page linked to your app

**Twitter**: Publishing requires paid Basic tier ($100/month) — free tier is read-only

**TikTok**: Content posting requires app review approval (1-2 weeks)

**Pinterest**: Must use Pinterest Business account, personal accounts won't work

### Token Issues

**"Token encryption error"**
- ✅ Verify `TOKEN_ENCRYPTION_KEY` is set in Supabase Edge Function secrets
- ✅ Key must be base64-encoded 32-byte value
- ✅ Regenerate with: `openssl rand -base64 32`

**"Access token expired"**
- ✅ Most platforms provide refresh tokens for automatic renewal
- ✅ Check Edge Function logs for refresh token errors
- ✅ User may need to reconnect their account

---

## 📞 Getting Help

### Platform Documentation
- 📖 [Meta Developers (Instagram/Facebook)](https://developers.facebook.com/docs/)
- 📖 [LinkedIn Developers](https://docs.microsoft.com/en-us/linkedin/)
- 📖 [Twitter Developer Docs](https://developer.twitter.com/en/docs)
- 📖 [TikTok for Developers](https://developers.tiktok.com/docs/)
- 📖 [Pinterest Developers](https://developers.pinterest.com/docs/)

### Support Communities
- 💬 Platform-specific developer communities
- 🐛 Check Supabase Edge Function logs: **Functions → social-oauth → Logs**
- 🔍 Test OAuth flows manually using platform's OAuth documentation

---

**All social platforms are now configured! 🎉**

Users can connect their social media accounts and start publishing content across all platforms. Your Flowo setup is complete!
