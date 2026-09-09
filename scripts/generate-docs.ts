#!/usr/bin/env ts-node
import fs from 'fs';
import path from 'path';

// Read actual project data
const readProjectData = () => {
  // Read plan features
  const planFeaturesPath = path.join(process.cwd(), 'src/lib/plan-features.ts');
  const planFeatures = fs.readFileSync(planFeaturesPath, 'utf8');
  
  // Read OAuth config
  const oauthConfigPath = path.join(process.cwd(), 'src/lib/oauth-config.ts');
  const oauthConfig = fs.readFileSync(oauthConfigPath, 'utf8');
  
  // Read .env.example
  const envExamplePath = path.join(process.cwd(), '.env.example');
  const envExample = fs.readFileSync(envExamplePath, 'utf8');
  
  // Read Supabase types for table names
  const typesPath = path.join(process.cwd(), 'src/integrations/supabase/types.ts');
  const types = fs.readFileSync(typesPath, 'utf8');
  
  // Read Edge Functions directory
  const functionsDir = path.join(process.cwd(), 'supabase/functions');
  const edgeFunctions = fs.readdirSync(functionsDir).filter(item => 
    fs.statSync(path.join(functionsDir, item)).isDirectory()
  );
  
  // Read package.json for version
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  return {
    planFeatures,
    oauthConfig,
    envExample,
    types,
    edgeFunctions,
    version: packageJson.version || '1.0.0'
  };
};

// Extract plan data from plan-features.ts
const extractPlanData = (planFeaturesContent: string) => {
  const plans = [
    {
      name: 'Starter',
      monthly: 49,
      annual: 39,
      features: [
        '1 brand profile',
        '3 social accounts per brand',
        '100 AI posts/month',
        '50 AI images/month',
        '1 team member',
        'Basic analytics',
        'Content calendar',
        'Comments manager',
        'Brand voice training'
      ]
    },
    {
      name: 'Pro',
      monthly: 99,
      annual: 79,
      popular: true,
      features: [
        '3 brand profiles',
        '10 social accounts per brand',
        '500 AI posts/month',
        '200 AI images/month',
        '5 team members',
        'Advanced analytics',
        'Bulk scheduling',
        'Custom posting times',
        'Export analytics',
        'Campaign generator',
        'All platforms: Instagram, LinkedIn, Twitter, Facebook, TikTok, Pinterest'
      ]
    },
    {
      name: 'Agency',
      monthly: 199,
      annual: 159,
      features: [
        'Unlimited brand profiles',
        'Unlimited social accounts',
        'Unlimited AI posts',
        'Unlimited AI images',
        'Unlimited team members',
        'White-label reports',
        'API access',
        'Priority support',
        'Team collaboration',
        'All Pro features'
      ]
    }
  ];
  return plans;
};

// Generate README.md
const generateREADME = (data: any) => {
  const plans = extractPlanData(data.planFeatures);
  
  return `# ✦ Flowo — AI Social Media Manager

> Your AI Social Media Team. Generate, schedule, and publish content across all platforms automatically.

![Version](https://img.shields.io/badge/version-${data.version}-violet)
![React](https://img.shields.io/badge/React-18-blue)
![Supabase](https://img.shields.io/badge/Supabase-green)
![TypeScript](https://img.shields.io/badge/TypeScript-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## What is Flowo?

Flowo is an AI-powered social media management platform that automates content creation, scheduling, and analytics across all major social platforms. Generate high-quality posts with AI, schedule them weeks in advance, track performance with detailed analytics, and manage multiple brands from one unified dashboard.

## ✨ Features

### 🤖 AI Content Generation
- **Smart Content Creation**: Generate platform-optimized posts with GPT-4o
- **AI Image Generation**: Create stunning visuals with DALL-E 3
- **Brand Voice Training**: Maintain consistent tone across all content
- **Trend-Based Content**: Generate posts based on trending topics
- **Campaign Generator**: Create multi-post campaigns automatically

### 📅 Advanced Scheduling
- **Content Calendar**: Visual calendar with drag-drop scheduling
- **Bulk Upload**: Schedule hundreds of posts at once
- **Optimal Timing**: AI suggests best posting times
- **Queue Management**: Auto-fill your posting queue
- **Cross-Platform Publishing**: Post to all platforms simultaneously

### 📊 Analytics & Insights
- **Real-Time Analytics**: Track engagement, reach, and growth
- **Performance Insights**: Detailed post-level analytics
- **Weekly AI Reports**: Automated performance summaries
- **Competitor Analysis**: Monitor competitor performance
- **ROI Tracking**: Measure campaign effectiveness

### 🏢 Team Collaboration
- **Multi-Brand Management**: Manage unlimited brands (Agency plan)
- **Team Permissions**: Granular access control
- **Approval Workflows**: Review posts before publishing
- **Activity Tracking**: Monitor team actions
- **White-Label Reports**: Client-ready analytics

### 💬 Comments Management
- **Unified Inbox**: Manage all platform comments in one place
- **AI Reply Suggestions**: Smart response recommendations
- **Sentiment Analysis**: Track comment sentiment
- **Auto-Moderation**: Flag inappropriate comments
- **Quick Responses**: Save and reuse common replies

### 🔗 Platform Integrations
- **Instagram**: Posts, Stories, Reels, and analytics
- **LinkedIn**: Company pages and personal profiles
- **Twitter/X**: Tweets, threads, and engagement tracking
- **Facebook**: Pages, groups, and detailed insights
- **TikTok**: Video posts and trending hashtags
- **Pinterest**: Pins, boards, and seasonal trends

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Tailwind CSS |
| **Backend** | Supabase Edge Functions, PostgreSQL |
| **Authentication** | Supabase Auth with OAuth |
| **Database** | PostgreSQL with Row Level Security |
| **AI Services** | OpenAI GPT-4o, DALL-E 3 |
| **Payments** | Stripe Subscriptions |
| **Email** | Resend for transactional emails |
| **State Management** | Zustand |
| **Charts** | Recharts |
| **UI Components** | shadcn/ui, Radix UI |
| **Icons** | Lucide React |
| **Styling** | Tailwind CSS |
| **Build Tool** | Vite |

## 📁 Project Structure

\`\`\`
flowo/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   ├── dashboard/      # Dashboard layout components
│   │   ├── landing/        # Landing page sections
│   │   ├── settings/       # Settings page tabs
│   │   └── ui/            # Base UI components (shadcn/ui)
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # Third-party integrations
│   │   └── supabase/      # Supabase client and types
│   ├── lib/               # Utility functions and configs
│   ├── pages/             # Application pages/routes
│   ├── services/          # Business logic and API calls
│   └── store/             # Zustand state management
├── supabase/
│   ├── functions/         # Edge Functions
│   │   ├── api-keys/      # API key management
│   │   ├── api-v1/        # Public API endpoints
│   │   ├── generate-image/# AI image generation
│   │   ├── generate-trend-content/ # AI content generation
│   │   ├── generate-weekly-insights/ # Weekly reports
│   │   ├── process-scheduled-posts/ # Post publishing
│   │   ├── social-oauth/  # Social platform OAuth
│   │   ├── stripe-billing/# Stripe integration
│   │   └── sync-post-analytics/ # Analytics sync
│   └── config.toml       # Supabase configuration
├── scripts/              # Utility scripts
└── public/               # Static assets
\`\`\`

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Git

### Installation

\`\`\`bash
git clone https://github.com/yourusername/flowo.git
cd flowo
npm install
cp .env.example .env
\`\`\`

### Environment Setup

Fill in your \`.env\` file with these required variables:

\`\`\`bash
# Supabase Configuration (auto-populated for Lovable projects)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id

# App Configuration
VITE_APP_URL=http://localhost:8080

# Feature Flags (set to "true" to enable)
VITE_AI_ENABLED=false
VITE_STRIPE_ENABLED=false
VITE_TRENDS_ENABLED=false

# Stripe (publishable key only - private keys go in Supabase secrets)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key

# Platform Enable Flags (set individual platforms to "true")
VITE_INSTAGRAM_ENABLED=false
VITE_LINKEDIN_ENABLED=false
VITE_TWITTER_ENABLED=false
VITE_FACEBOOK_ENABLED=false
VITE_TIKTOK_ENABLED=false
VITE_PINTEREST_ENABLED=false
\`\`\`

### Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open http://localhost:8080 in your browser.

### Database Setup

Complete database setup is required. See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions.

## 💰 Plans and Pricing

${plans.map(plan => 
  `### ${plan.name} ${plan.popular ? '⭐ Most Popular' : ''}
**$${plan.monthly}/month** • **$${plan.annual}/month** *(billed annually)*

${plan.features.map(feature => `- ${feature}`).join('\n')}
`).join('\n')}

## 🚀 Deployment

### Deploy to Vercel

\`\`\`bash
npm install -g vercel
vercel
\`\`\`

Add all environment variables in your Vercel dashboard under Settings → Environment Variables.

### Deploy Supabase Edge Functions

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for complete Edge Function deployment instructions.

## 📚 Documentation

| File | Contents |
|------|---------|
| [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) | Complete database, auth, storage, and Edge Functions setup |
| [STRIPE_SETUP.md](./STRIPE_SETUP.md) | Stripe billing integration and webhook configuration |
| [API_CONNECT.md](./API_CONNECT.md) | Social platform OAuth app setup for all 6 platforms |

## 🔧 Admin Tools

Visit \`/admin/health\` (requires admin privileges) to monitor:
- Database connectivity and table status
- Edge Function health
- External API connections
- Stripe integration status
- Real-time system metrics

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@flowo.com
- 💬 Discord: [Join our community](https://discord.gg/flowo)
- 📖 Documentation: [docs.flowo.com](https://docs.flowo.com)
- 🐛 Bug Reports: [GitHub Issues](https://github.com/yourusername/flowo/issues)

---

**Built with ❤️ by the Flowo team**
`;
};

// Generate SUPABASE_SETUP.md
const generateSupabaseSetup = (data: any) => {
  const edgeFunctions = data.edgeFunctions;
  
  return `# Supabase Setup Guide — Flowo

Complete step-by-step guide to set up the Flowo database, authentication, storage, Edge Functions, and cron jobs.

---

## 📋 Overview

Flowo uses Supabase as its complete backend infrastructure:
- **PostgreSQL Database**: 25+ tables with Row Level Security
- **Authentication**: Email/password + OAuth providers
- **Storage**: File uploads for images and brand assets  
- **Edge Functions**: 8 serverless functions for AI, billing, and automation
- **Real-time**: Live updates for team collaboration

## Step 1 — Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Choose your organization
4. Enter project name: \`flowo-production\`
5. Set a **strong database password** — save it securely
6. Choose region closest to your users
7. Click **"Create new project"** — wait 2-3 minutes for provisioning

## Step 2 — Get Your API Keys

1. Go to **Settings → API**
2. Copy these three values to your \`.env\` file:

\`\`\`bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=your-project-id

# ⚠️ Service role key - keep secret, never expose client-side
# Add this to Supabase Edge Function secrets, not .env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

## Step 3 — Generate Token Encryption Key

This key encrypts social platform OAuth tokens stored in the database.

\`\`\`bash
# Run this command to generate a secure encryption key
openssl rand -base64 32

# Copy the output - you'll need it for both .env and Supabase secrets
\`\`\`

## Step 4 — Database Setup

### 4.1 — Enable Required Extensions

Go to **Database → Extensions** and enable:

| Extension | Purpose |
|-----------|---------|
| **pg_cron** | Scheduled jobs for auto-publishing posts |
| **pg_net** | HTTP requests from database to Edge Functions |
| **uuid-ossp** | UUID generation for primary keys |

Click the toggle to enable each extension.

### 4.2 — Create Core Tables

Go to **SQL Editor → New Query**. Run this SQL to create all tables:

\`\`\`sql
-- Enable RLS by default on new tables
CREATE EVENT TRIGGER rls_auto_enable
ON ddl_command_end
WHEN TAG IN ('CREATE TABLE')
EXECUTE FUNCTION rls_auto_enable();

-- User profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  full_name VARCHAR,
  email VARCHAR,
  plan VARCHAR DEFAULT 'starter',
  business_name VARCHAR,
  industry VARCHAR,
  role VARCHAR,
  business_size VARCHAR,
  brand_description TEXT,
  brand_tones VARCHAR[],
  sample_posts TEXT,
  connected_platforms VARCHAR[],
  active_brand_id UUID,
  completed_onboarding BOOLEAN DEFAULT false,
  shown_welcome_modal BOOLEAN DEFAULT false,
  dismissed_setup_checklist BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Brands table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR NOT NULL,
  brand_description TEXT,
  industry VARCHAR,
  business_size VARCHAR,
  role VARCHAR,
  tone VARCHAR[],
  sample_posts TEXT,
  color VARCHAR DEFAULT '#6D28D9',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Social accounts table (encrypted tokens)
CREATE TABLE public.social_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  platform VARCHAR NOT NULL,
  account_id VARCHAR,
  account_name VARCHAR,
  platform_user_id VARCHAR,
  platform_username VARCHAR,
  platform_profile_picture VARCHAR,
  platform_followers_count INTEGER DEFAULT 0,
  access_token TEXT, -- AES-256 encrypted
  refresh_token TEXT, -- AES-256 encrypted
  token_expires_at TIMESTAMPTZ,
  scopes VARCHAR[],
  is_active BOOLEAN DEFAULT true,
  needs_reconnect BOOLEAN DEFAULT false,
  error_message TEXT,
  connected_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  social_account_id UUID,
  platform VARCHAR NOT NULL,
  content TEXT NOT NULL,
  image_url VARCHAR,
  status VARCHAR DEFAULT 'draft', -- draft, scheduled, published, failed
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  platform_post_id VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Post analytics table
CREATE TABLE public.post_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  platform VARCHAR NOT NULL,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement_rate DECIMAL DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Comments cache table
CREATE TABLE public.comments_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  platform VARCHAR NOT NULL,
  platform_comment_id VARCHAR NOT NULL,
  comment_text TEXT NOT NULL,
  commenter_username VARCHAR,
  commenter_display_name VARCHAR,
  platform_created_at TIMESTAMPTZ,
  sentiment VARCHAR,
  is_replied BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  reply_text TEXT,
  ai_suggested_reply TEXT,
  replied_at TIMESTAMPTZ,
  reply_saved_locally BOOLEAN DEFAULT false,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Content drafts table (temporary AI generations)
CREATE TABLE public.content_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  platform VARCHAR NOT NULL,
  content TEXT NOT NULL,
  topic VARCHAR,
  tone VARCHAR,
  content_type VARCHAR,
  image_url VARCHAR,
  hashtags VARCHAR[],
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Brand voice profiles table
CREATE TABLE public.brand_voice_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  voice_profile TEXT NOT NULL,
  tone VARCHAR[],
  keywords VARCHAR[],
  forbidden_words VARCHAR[],
  sample_posts TEXT,
  last_trained_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Team members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  member_user_id UUID,
  invited_email VARCHAR NOT NULL,
  full_name VARCHAR,
  role VARCHAR DEFAULT 'editor',
  permissions JSONB DEFAULT '{"dashboard": true, "create_post": true, "publish_posts": false, "delete_posts": false, "calendar": true, "comments": true, "analytics": false, "trends": true, "brands": false, "settings": false, "manage_team": false}',
  status VARCHAR DEFAULT 'pending', -- pending, accepted, expired
  invite_token VARCHAR,
  invite_expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ
);

-- Team activity log table
CREATE TABLE public.team_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  actor_user_id UUID,
  actor_name VARCHAR,
  action_type VARCHAR NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scheduled jobs table
CREATE TABLE public.scheduled_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status VARCHAR DEFAULT 'pending', -- pending, processing, completed, failed
  attempts INTEGER DEFAULT 0,
  last_attempted_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- OAuth state management table
CREATE TABLE public.oauth_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  platform VARCHAR NOT NULL,
  state_token VARCHAR NOT NULL,
  code_verifier VARCHAR, -- PKCE for platforms that support it
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '10 minutes'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  related_post_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trend topics table (global, read-only for users)
CREATE TABLE public.trend_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic VARCHAR NOT NULL,
  industry VARCHAR NOT NULL,
  trend_score INTEGER DEFAULT 0,
  growth_percent INTEGER DEFAULT 0,
  trend_type VARCHAR DEFAULT 'hot_today',
  source VARCHAR,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours')
);

-- Saved trends table (user's saved trends)
CREATE TABLE public.saved_trends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic VARCHAR NOT NULL,
  industry VARCHAR,
  trend_score INTEGER DEFAULT 0,
  notes TEXT,
  is_posted BOOLEAN DEFAULT false,
  saved_at TIMESTAMPTZ DEFAULT now()
);

-- Usage tracking table
CREATE TABLE public.usage_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month_year VARCHAR NOT NULL, -- "2024-03"
  posts_generated INTEGER DEFAULT 0,
  ai_images_generated INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- Billing history table
CREATE TABLE public.billing_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL, -- cents
  currency VARCHAR DEFAULT 'usd',
  plan VARCHAR,
  status VARCHAR,
  stripe_invoice_id VARCHAR,
  invoice_url VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI insights table (weekly summaries)
CREATE TABLE public.ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  insight_type VARCHAR DEFAULT 'weekly_summary',
  insight_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- API keys table (for public API)
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR NOT NULL,
  key_prefix VARCHAR NOT NULL,
  key_hash VARCHAR NOT NULL,
  permissions JSONB DEFAULT '{"read": true, "write": true, "publish": false}',
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  total_requests INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- API rate limits table
CREATE TABLE public.api_rate_limits (
  key_hash VARCHAR NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER DEFAULT 1,
  PRIMARY KEY (key_hash, window_start)
);

-- API request logs table
CREATE TABLE public.api_request_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  api_key_id UUID,
  method VARCHAR NOT NULL,
  endpoint VARCHAR NOT NULL,
  request_body JSONB,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  error_message TEXT,
  ip_address VARCHAR,
  user_agent VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Generated images table
CREATE TABLE public.generated_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  image_type TEXT DEFAULT 'freeform',
  platform TEXT,
  style TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Brand activity table
CREATE TABLE public.brand_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  activity_type VARCHAR NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
\`\`\`

### 4.3 — Row Level Security Policies

Run this SQL to enable RLS and create security policies:

\`\`\`sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_activity ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Brands policies
CREATE POLICY "Users can manage own brands" ON public.brands FOR ALL USING (auth.uid() = user_id);

-- Social accounts policies
CREATE POLICY "Users can manage own social accounts" ON public.social_accounts FOR ALL USING (auth.uid() = user_id);

-- Posts policies
CREATE POLICY "Users can manage own posts" ON public.posts FOR ALL USING (auth.uid() = user_id);

-- Post analytics policies
CREATE POLICY "Users can manage own post analytics" ON public.post_analytics FOR ALL USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Users can manage own comments" ON public.comments_cache FOR ALL USING (auth.uid() = user_id);

-- Content drafts policies
CREATE POLICY "Users can manage own drafts" ON public.content_drafts FOR ALL USING (auth.uid() = user_id);

-- Brand voice profiles policies
CREATE POLICY "Users can manage own voice profiles" ON public.brand_voice_profiles FOR ALL USING (auth.uid() = user_id);

-- Team members policies
CREATE POLICY "Owners can manage their team" ON public.team_members FOR ALL USING (auth.uid() = owner_user_id);
CREATE POLICY "Members view own record" ON public.team_members FOR SELECT USING (auth.uid() = member_user_id);

-- Team activity policies
CREATE POLICY "Owners view team activity" ON public.team_activity FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "Owners insert team activity" ON public.team_activity FOR INSERT WITH CHECK (auth.uid() = owner_user_id);

-- Scheduled jobs policies
CREATE POLICY "Users can manage own jobs" ON public.scheduled_jobs FOR ALL USING (auth.uid() = user_id);

-- OAuth states policies
CREATE POLICY "Users can manage own oauth states" ON public.oauth_states FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Trend topics policies (read-only for all users)
CREATE POLICY "Anyone can read trends" ON public.trend_topics FOR SELECT USING (true);

-- Saved trends policies
CREATE POLICY "Users can manage own saved trends" ON public.saved_trends FOR ALL USING (auth.uid() = user_id);

-- Usage tracking policies
CREATE POLICY "Users can view own usage" ON public.usage_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own usage" ON public.usage_tracking FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON public.usage_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Billing history policies
CREATE POLICY "Users can view own billing" ON public.billing_history FOR SELECT USING (auth.uid() = user_id);

-- AI insights policies
CREATE POLICY "Users can manage own insights" ON public.ai_insights FOR ALL USING (auth.uid() = user_id);

-- API keys policies
CREATE POLICY "Users can manage own API keys" ON public.api_keys FOR ALL USING (auth.uid() = user_id);

-- API rate limits policies (service role only)
CREATE POLICY "Service role manages rate limits" ON public.api_rate_limits FOR ALL USING (true);

-- API request logs policies
CREATE POLICY "Users view own API logs" ON public.api_request_logs FOR SELECT USING (auth.uid() = user_id);

-- Generated images policies
CREATE POLICY "Users can manage own generated images" ON public.generated_images FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Brand activity policies
CREATE POLICY "Users can manage own brand activity" ON public.brand_activity FOR ALL USING (auth.uid() = user_id);
\`\`\`

### 4.4 — Database Functions

Create helper functions for the application:

\`\`\`sql
-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get dashboard statistics
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  current_week_reach BIGINT;
  previous_week_reach BIGINT;
  current_week_engagements BIGINT;
  previous_week_engagements BIGINT;
  reach_change NUMERIC;
  engagement_change NUMERIC;
BEGIN
  -- Current week stats
  SELECT 
    COALESCE(SUM(pa.reach), 0),
    COALESCE(SUM(pa.likes + pa.comments + pa.shares), 0)
  INTO current_week_reach, current_week_engagements
  FROM posts p
  LEFT JOIN post_analytics pa ON pa.post_id = p.id
  WHERE p.user_id = p_user_id
    AND p.status = 'published'
    AND p.published_at >= date_trunc('week', now());

  -- Previous week stats
  SELECT 
    COALESCE(SUM(pa.reach), 0),
    COALESCE(SUM(pa.likes + pa.comments + pa.shares), 0)
  INTO previous_week_reach, previous_week_engagements
  FROM posts p
  LEFT JOIN post_analytics pa ON pa.post_id = p.id
  WHERE p.user_id = p_user_id
    AND p.status = 'published'
    AND p.published_at >= date_trunc('week', now()) - INTERVAL '7 days'
    AND p.published_at < date_trunc('week', now());

  -- Calculate percentage changes
  IF previous_week_reach > 0 THEN
    reach_change := ROUND(((current_week_reach - previous_week_reach)::NUMERIC / previous_week_reach) * 100, 1);
  ELSE
    reach_change := 0;
  END IF;

  IF previous_week_engagements > 0 THEN
    engagement_change := ROUND(((current_week_engagements - previous_week_engagements)::NUMERIC / previous_week_engagements) * 100, 1);
  ELSE
    engagement_change := 0;
  END IF;

  SELECT json_build_object(
    'total_reach_this_week', current_week_reach,
    'total_engagements_this_week', current_week_engagements,
    'posts_published_this_week', (
      SELECT COUNT(*) FROM posts 
      WHERE user_id = p_user_id AND status = 'published' 
      AND published_at >= date_trunc('week', now())
    ),
    'posts_scheduled_upcoming', (
      SELECT COUNT(*) FROM posts 
      WHERE user_id = p_user_id AND status = 'scheduled' 
      AND scheduled_at > now()
    ),
    'reach_change_percent', reach_change,
    'engagement_change_percent', engagement_change
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get current usage for plan limits
CREATE OR REPLACE FUNCTION public.get_current_usage(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_month VARCHAR(7);
  v_usage JSONB;
BEGIN
  v_month := to_char(now(), 'YYYY-MM');
  
  SELECT jsonb_build_object(
    'posts_generated', COALESCE(posts_generated, 0),
    'ai_images_generated', COALESCE(ai_images_generated, 0),
    'api_calls_made', COALESCE(api_calls_made, 0),
    'month_year', v_month
  )
  INTO v_usage
  FROM public.usage_tracking
  WHERE user_id = p_user_id AND month_year = v_month;
  
  RETURN COALESCE(v_usage, jsonb_build_object(
    'posts_generated', 0,
    'ai_images_generated', 0,
    'api_calls_made', 0,
    'month_year', v_month
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Increment usage tracking
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id UUID,
  p_field VARCHAR,
  p_amount INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.usage_tracking (user_id, month_year, posts_generated, ai_images_generated, api_calls_made)
  VALUES (
    p_user_id,
    to_char(now(), 'YYYY-MM'),
    CASE WHEN p_field = 'posts_generated' THEN p_amount ELSE 0 END,
    CASE WHEN p_field = 'ai_images_generated' THEN p_amount ELSE 0 END,
    CASE WHEN p_field = 'api_calls_made' THEN p_amount ELSE 0 END
  )
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET
    posts_generated = public.usage_tracking.posts_generated + 
      CASE WHEN p_field = 'posts_generated' THEN p_amount ELSE 0 END,
    ai_images_generated = public.usage_tracking.ai_images_generated + 
      CASE WHEN p_field = 'ai_images_generated' THEN p_amount ELSE 0 END,
    api_calls_made = public.usage_tracking.api_calls_made + 
      CASE WHEN p_field = 'api_calls_made' THEN p_amount ELSE 0 END,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Increment API key usage
CREATE OR REPLACE FUNCTION public.increment_api_key_requests(p_key_hash VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE public.api_keys
  SET total_requests = COALESCE(total_requests, 0) + 1, last_used_at = now()
  WHERE key_hash = p_key_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Cleanup expired OAuth states
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.oauth_states WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
\`\`\`

### 4.5 — Database Triggers

Create triggers for automatic functionality:

\`\`\`sql
-- Auto-create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_brands
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_posts
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
\`\`\`

### 4.6 — Indexes for Performance

Create indexes for frequently queried columns:

\`\`\`sql
-- Indexes for better query performance
CREATE INDEX idx_brands_user_id ON public.brands (user_id);
CREATE INDEX idx_posts_user_id ON public.posts (user_id);
CREATE INDEX idx_posts_status ON public.posts (status);
CREATE INDEX idx_posts_scheduled_at ON public.posts (scheduled_at);
CREATE INDEX idx_social_accounts_user_id ON public.social_accounts (user_id);
CREATE INDEX idx_social_accounts_brand_id ON public.social_accounts (brand_id);
CREATE INDEX idx_post_analytics_post_id ON public.post_analytics (post_id);
CREATE INDEX idx_comments_cache_post_id ON public.comments_cache (post_id);
CREATE INDEX idx_team_members_owner_user_id ON public.team_members (owner_user_id);
CREATE INDEX idx_usage_tracking_user_month ON public.usage_tracking (user_id, month_year);
CREATE INDEX idx_oauth_states_expires_at ON public.oauth_states (expires_at);
\`\`\`

## Step 5 — Configure Authentication

### 5.1 — Enable Email Authentication
1. Go to **Authentication → Providers**
2. Enable **Email** provider
3. Enable **Confirm email** for security

### 5.2 — Enable Google OAuth
1. In **Authentication → Providers**, enable **Google**
2. Go to [Google Cloud Console](https://console.cloud.google.com)
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI: \`https://your-project.supabase.co/auth/v1/callback\`
5. Copy Client ID and Secret to Supabase

### 5.3 — Configure Redirect URLs
In **Authentication → URL Configuration**, add these to Redirect URLs:
\`\`\`
http://localhost:8080/auth/callback
https://yourdomain.com/auth/callback
https://yourdomain.com/invite/accept
\`\`\`

### 5.4 — Customize Email Templates
In **Authentication → Email Templates**, update:
- **Confirm signup** template with Flowo branding
- **Invite user** template
- **Reset password** template

## Step 6 — Set Up Storage

### 6.1 — Create Storage Buckets

Go to **Storage** and create these buckets:

| Bucket Name | Public | Max File Size | Allowed Types |
|-------------|--------|---------------|---------------|
| \`generated-images\` | ✅ Yes | 10MB | image/jpeg, image/png, image/webp |
| \`post-images\` | ✅ Yes | 10MB | image/jpeg, image/png, image/webp, image/gif |
| \`brand-assets\` | ✅ Yes | 5MB | image/jpeg, image/png, image/svg+xml |

### 6.2 — Set Storage Policies

Run this SQL to set up storage security:

\`\`\`sql
-- Users can upload to their own folder (folder name = user ID)
CREATE POLICY "Users upload own files" ON storage.objects 
  FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own files
CREATE POLICY "Users update own files" ON storage.objects 
  FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own files
CREATE POLICY "Users delete own files" ON storage.objects 
  FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Public read access for all buckets
CREATE POLICY "Public read access" ON storage.objects 
  FOR SELECT USING (bucket_id IN ('generated-images', 'post-images', 'brand-assets'));
\`\`\`

## Step 7 — Deploy Edge Functions

### 7.1 — Install Supabase CLI

\`\`\`bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
\`\`\`

Find your project ref in **Settings → General → Reference ID**.

### 7.2 — Set Edge Function Secrets

\`\`\`bash
# Core secrets
supabase secrets set SUPABASE_URL="https://your-project.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
supabase secrets set TOKEN_ENCRYPTION_KEY="your-32-byte-base64-key"

# AI Services
supabase secrets set OPENAI_API_KEY="sk-your-openai-key"

# Stripe (optional)
supabase secrets set STRIPE_SECRET_KEY="sk_test_your-stripe-key"
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

# Platform-specific OAuth (add as needed)
supabase secrets set INSTAGRAM_APP_ID=""
supabase secrets set INSTAGRAM_APP_SECRET=""
supabase secrets set LINKEDIN_CLIENT_ID=""
supabase secrets set LINKEDIN_CLIENT_SECRET=""
supabase secrets set TWITTER_CLIENT_ID=""
supabase secrets set TWITTER_CLIENT_SECRET=""
supabase secrets set FACEBOOK_APP_ID=""
supabase secrets set FACEBOOK_APP_SECRET=""
supabase secrets set TIKTOK_CLIENT_KEY=""
supabase secrets set TIKTOK_CLIENT_SECRET=""
supabase secrets set PINTEREST_APP_ID=""
supabase secrets set PINTEREST_APP_SECRET=""

# Email service (optional)
supabase secrets set RESEND_API_KEY="re_your-resend-key"
\`\`\`

### 7.3 — Deploy All Edge Functions

The project includes ${edgeFunctions.length} Edge Functions:

${edgeFunctions.map(func => `- **${func}**: ${getFunctionDescription(func)}`).join('\n')}

Deploy all functions:

\`\`\`bash
${edgeFunctions.map(func => `supabase functions deploy ${func}`).join('\n')}
\`\`\`

Verify deployment in **Supabase Dashboard → Edge Functions**.

### 7.4 — Set Up Cron Jobs with pg_cron

Run this SQL to enable automated background tasks:

\`\`\`sql
-- Set app settings for cron jobs
SELECT pg_catalog.set_config('app.supabase_url', 'https://your-project.supabase.co', false);
SELECT pg_catalog.set_config('app.service_role_key', 'your-service-role-key', false);

-- Auto-publish scheduled posts every minute
SELECT cron.schedule(
  'process-scheduled-posts',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/process-scheduled-posts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Sync post analytics every 6 hours
SELECT cron.schedule(
  'sync-post-analytics',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/sync-post-analytics',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Generate weekly insights every Monday at 9 AM UTC
SELECT cron.schedule(
  'generate-weekly-insights',
  '0 9 * * 1',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/generate-weekly-insights',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Cleanup expired OAuth states daily at midnight
SELECT cron.schedule(
  'cleanup-oauth-states',
  '0 0 * * *',
  $$
  SELECT public.cleanup_expired_oauth_states();
  $$
);
\`\`\`

Verify cron jobs are registered:
\`\`\`sql
SELECT * FROM cron.job;
\`\`\`

## Step 8 — Verify Setup

1. **Test Database Connection**: Visit your app and try to sign up
2. **Check Tables**: Go to **Supabase → Database → Tables** — all 25 tables should be visible
3. **Test Auth**: Create a test account and verify the profile is auto-created
4. **Test Storage**: Try uploading an image in the app
5. **Check Edge Functions**: Go to **Edge Functions** tab and verify all are deployed
6. **Test Cron Jobs**: Check **Edge Functions → Logs** for cron execution

## 🔧 Troubleshooting

### Common Issues

**"relation does not exist" error**
- Re-run the table creation SQL
- Check that RLS policies were created after tables

**Edge Function deployment fails**
- Verify you're linked to the correct project: \`supabase projects list\`
- Check your CLI is logged in: \`supabase auth\`

**Cron jobs not running**
- Verify pg_cron extension is enabled
- Check app settings are configured with correct URLs and keys
- Look at Edge Function logs for cron execution errors

**Authentication not working**
- Check redirect URLs match exactly (including http vs https)
- Verify the handle_new_user trigger exists
- Test with email confirmation disabled first

**Storage uploads failing**
- Verify bucket policies are created correctly
- Check file size and type restrictions
- Ensure bucket is marked as public

### Getting Help

- 📖 [Supabase Documentation](https://supabase.com/docs)
- 💬 [Supabase Discord](https://discord.supabase.com)
- 🐛 Check Edge Function logs in the Supabase dashboard
- 🔍 Use the Supabase SQL editor to query tables directly

---

**Your Supabase backend is now fully configured! 🎉**

Next steps: Configure [Stripe billing](./STRIPE_SETUP.md) and [social platform connections](./API_CONNECT.md).
`;
};

const getFunctionDescription = (functionName: string): string => {
  const descriptions: Record<string, string> = {
    'generate-image': 'AI image generation with OpenAI DALL-E',
    'generate-trend-content': 'AI content generation based on trends',
    'generate-weekly-insights': 'Weekly AI performance reports',
    'process-scheduled-posts': 'Auto-publish scheduled posts to platforms',
    'social-oauth': 'Social platform OAuth and token management',
    'stripe-billing': 'Stripe checkout and subscription management',
    'stripe-webhook': 'Stripe webhook event processing',
    'sync-post-analytics': 'Fetch analytics from social platforms',
    'api-keys': 'Public API key management and rate limiting',
    'api-v1': 'Public API endpoints for third-party integrations'
  };
  return descriptions[functionName] || 'Custom business logic';
};

// Generate STRIPE_SETUP.md
const generateStripeSetup = () => {
  return `# Stripe Setup Guide — Flowo

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
2. Copy your keys to \`.env\`:

\`\`\`bash
# Test keys for development
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
# Add secret key to Supabase secrets (never in .env file)
# STRIPE_SECRET_KEY=sk_test_xxxxx

# Live keys for production (after testing)
# VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
# STRIPE_SECRET_KEY=sk_live_xxxxx
\`\`\`

⚠️ **Never put \`STRIPE_SECRET_KEY\` in your \`.env\` file** — add it to Supabase Edge Function secrets only.

## Step 3 — Create Products and Price IDs

### 3.1 — Starter Plan Product

1. Go to **Products → Add Product**
2. **Name**: \`Starter\`
3. **Description**: \`Perfect for individual creators and small businesses\`
4. Click **Create Product**

After creating, add two prices:

**Monthly Price:**
- Price: \`$49.00\`
- Billing period: \`Monthly\`
- Currency: \`USD\`
- Click **Save** → Copy the Price ID (starts with \`price_\`)

**Annual Price:**
- Price: \`$39.00\`
- Billing period: \`Yearly\`
- Currency: \`USD\`  
- Click **Save** → Copy the Price ID

### 3.2 — Pro Plan Product

1. **Name**: \`Pro\`
2. **Description**: \`For growing businesses and marketing teams\`
3. **Monthly Price**: \`$99.00\` per month
4. **Annual Price**: \`$79.00\` per month (billed yearly)

### 3.3 — Agency Plan Product  

1. **Name**: \`Agency\`
2. **Description**: \`For agencies managing multiple brands\`
3. **Monthly Price**: \`$199.00\` per month
4. **Annual Price**: \`$159.00\` per month (billed yearly)

### 3.4 — Add Price IDs to Supabase Secrets

\`\`\`bash
supabase secrets set STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxxxx
supabase secrets set STRIPE_STARTER_ANNUAL_PRICE_ID=price_xxxxx
supabase secrets set STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxx
supabase secrets set STRIPE_PRO_ANNUAL_PRICE_ID=price_xxxxx
supabase secrets set STRIPE_AGENCY_MONTHLY_PRICE_ID=price_xxxxx
supabase secrets set STRIPE_AGENCY_ANNUAL_PRICE_ID=price_xxxxx
\`\`\`

## Step 4 — Configure Customer Portal

1. Go to **Settings → Billing → Customer Portal**
2. **Enable** the customer portal
3. Configure these settings:
   - ✅ **Allow customers to update payment method**
   - ✅ **Allow customers to cancel subscription**  
   - ✅ **Allow customers to switch plans**
   - **Cancellation behavior**: \`Cancel at end of billing period\`
4. **Save Configuration**

## Step 5 — Set Up Webhook Endpoint

### 5.1 — Create Webhook

1. Go to **Developers → Webhooks**
2. Click **Add Endpoint**
3. **Endpoint URL**: \`https://yourdomain.com/functions/v1/stripe-webhook\`
4. **Listen to**: \`Events on your account\`

### 5.2 — Select Events to Listen For

Add these specific events (required for subscription management):

\`\`\`
✅ checkout.session.completed
✅ invoice.payment_succeeded  
✅ invoice.payment_failed
✅ customer.subscription.created
✅ customer.subscription.updated
✅ customer.subscription.deleted
✅ customer.subscription.trial_will_end
\`\`\`

### 5.3 — Get Webhook Secret

1. Click **Add Endpoint** to save
2. Click on your new webhook endpoint  
3. Copy the **Signing Secret** (starts with \`whsec_\`)
4. Add to Supabase secrets:

\`\`\`bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
\`\`\`

### 5.4 — Test Webhook Locally (Development)

For local development, use Stripe CLI:

\`\`\`bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local dev server
stripe listen --forward-to localhost:8080/functions/v1/stripe-webhook
\`\`\`

This gives you a temporary webhook secret for local testing.

## Step 6 — Enable Stripe in Your App

Update your \`.env\` file:

\`\`\`bash
VITE_STRIPE_ENABLED=true
\`\`\`

Restart your development server:

\`\`\`bash
npm run dev
\`\`\`

## Step 7 — Test the Complete Billing Flow

### 7.1 — Test Subscription Creation

1. Go to \`/settings\` → **Billing** tab
2. Click **"Upgrade to Pro"** or any plan button
3. You should be redirected to Stripe Checkout
4. Use Stripe test card: \`4242 4242 4242 4242\`
   - Any future expiry date
   - Any 3-digit CVC
   - Any billing address
5. Complete the payment
6. You should be redirected back to Flowo with a success message

### 7.2 — Verify Database Updates

Check that the subscription was recorded:

1. Go to **Supabase → SQL Editor**
2. Run: \`SELECT id, plan, created_at FROM profiles WHERE plan != 'starter';\`
3. Your user should show the upgraded plan

### 7.3 — Test Customer Portal

1. Go back to \`/settings\` → **Billing**
2. Click **"Manage Subscription"**
3. You should be redirected to Stripe Customer Portal
4. Test updating payment method, canceling subscription, etc.

### 7.4 — Test Webhook Events

1. Go to **Stripe Dashboard → Events**
2. You should see events like \`checkout.session.completed\`
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

\`\`\`bash
# Update to live keys
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_live_xxxxx

# Update price IDs to live versions
supabase secrets set STRIPE_STARTER_MONTHLY_PRICE_ID=price_live_xxxxx
supabase secrets set STRIPE_STARTER_ANNUAL_PRICE_ID=price_live_xxxxx
# ... repeat for all price IDs
\`\`\`

3. Update your production \`.env\`:

\`\`\`bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
\`\`\`

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
- ✅ Verify all \`STRIPE_*_PRICE_ID\` secrets are set correctly
- ✅ Check that \`STRIPE_SECRET_KEY\` is the right environment (test vs live)
- ✅ Look at Stripe logs in **Developers → Logs** for detailed error messages

**User plan not updating after payment**
- ✅ Check webhook endpoint is receiving events: **Stripe → Events**
- ✅ Verify \`STRIPE_WEBHOOK_SECRET\` matches your endpoint
- ✅ Look at Edge Function logs: **Supabase → Functions → stripe-webhook → Logs**
- ✅ Ensure your webhook endpoint URL is publicly accessible

### Webhook Issues

**Webhook signature verification fails**
- ✅ Make sure \`STRIPE_WEBHOOK_SECRET\` exactly matches (no extra spaces)
- ✅ Verify the endpoint URL in Stripe matches your deployed function
- ✅ Check that the webhook is sending to the correct environment (test/live)

**Subscription not found in database**
- ✅ Verify the \`handle_stripe_webhook\` function is working
- ✅ Check that customer metadata includes \`supabase_user_id\`
- ✅ Look for errors in the Edge Function logs

### Going Live Issues

**Live webhook not working**
- ✅ Create a separate webhook endpoint for live mode
- ✅ Update \`STRIPE_WEBHOOK_SECRET\` to the live webhook's secret
- ✅ Test with Stripe CLI: \`stripe trigger checkout.session.completed\`

**Price ID mismatch**
- ✅ Ensure all live price IDs are updated in Supabase secrets
- ✅ Live price IDs are different from test price IDs
- ✅ Check **Products** page shows \`Live\` mode when getting price IDs

## 📞 Support

- 📖 [Stripe Documentation](https://stripe.com/docs)
- 💬 [Stripe Support](https://support.stripe.com)  
- 🔍 Use Stripe Dashboard → **Logs** for debugging API calls
- 📊 Monitor webhook delivery in **Developers → Webhooks → [Your endpoint]**

---

**Your Stripe billing is now fully configured! 💳**

Users can now subscribe to paid plans and get automatically charged monthly or annually. Next: Set up [social platform connections](./API_CONNECT.md).
`;
};

// Generate API_CONNECT.md
const generateAPIConnect = () => {
  return `# Social Platform API Connection Guide — Flowo

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
- **App Name**: \`Flowo\` (or your branded name)
- **App Description**: \`AI-powered social media management platform for automated content creation and scheduling\`
- **Website URL**: Your production domain (e.g., \`https://yourdomain.com\`)
- **Privacy Policy URL**: \`https://yourdomain.com/privacy\`
- **Terms of Service URL**: \`https://yourdomain.com/terms\`

### OAuth Redirect URLs

Each platform needs these exact redirect URLs:
\`\`\`
https://yourdomain.com/api/auth/callback/[platform]
http://localhost:8080/api/auth/callback/[platform]  # for development
\`\`\`

Replace \`[platform]\` with: \`instagram\`, \`facebook\`, \`linkedin\`, \`twitter\`, \`tiktok\`, or \`pinterest\`.

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
   - **App name**: \`Flowo\`
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
   \`\`\`
   https://yourdomain.com/api/auth/callback/instagram
   http://localhost:8080/api/auth/callback/instagram
   \`\`\`
4. Add **Deauthorize Callback URL**: \`https://yourdomain.com/api/auth/deauthorize\`
5. Add **Data Deletion Request URL**: \`https://yourdomain.com/api/auth/deletion\`
6. Click **"Save Changes"**

### Step 5 — Get App Credentials

1. Go to **Settings → Basic**
2. Copy **App ID** and **App Secret**

### Step 6 — Add to Your Environment

\`\`\`bash
# Add to Supabase Edge Function secrets
supabase secrets set INSTAGRAM_APP_ID="your_app_id"
supabase secrets set INSTAGRAM_APP_SECRET="your_app_secret"
supabase secrets set INSTAGRAM_REDIRECT_URI="https://yourdomain.com/api/auth/callback/instagram"

# Enable in your .env file
VITE_INSTAGRAM_ENABLED=true
\`\`\`

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
   \`\`\`
   https://yourdomain.com/api/auth/callback/facebook
   http://localhost:8080/api/auth/callback/facebook
   \`\`\`

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

\`\`\`bash
# Facebook uses same app credentials as Instagram
supabase secrets set FACEBOOK_APP_ID="same_as_instagram_app_id"
supabase secrets set FACEBOOK_APP_SECRET="same_as_instagram_app_secret"  
supabase secrets set FACEBOOK_REDIRECT_URI="https://yourdomain.com/api/auth/callback/facebook"

# Enable in .env
VITE_FACEBOOK_ENABLED=true
\`\`\`

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
3. **App name**: \`Flowo\`
4. **LinkedIn Page**: Select your company LinkedIn page (required)
5. **App logo**: Upload your logo (400x400px PNG)
6. **Legal agreement**: Check and accept
7. Click **"Create App"**

### Step 2 — Configure Authentication

1. Go to your app → **Auth** tab
2. Under **Authorized Redirect URLs** add:
   \`\`\`
   https://yourdomain.com/api/auth/callback/linkedin
   http://localhost:8080/api/auth/callback/linkedin
   \`\`\`
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

\`\`\`bash
supabase secrets set LINKEDIN_CLIENT_ID="your_client_id"
supabase secrets set LINKEDIN_CLIENT_SECRET="your_client_secret"
supabase secrets set LINKEDIN_REDIRECT_URI="https://yourdomain.com/api/auth/callback/linkedin"

VITE_LINKEDIN_ENABLED=true
\`\`\`

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
   - **Name**: \`Flowo\`
   - **Use case**: \`Making a bot\` or \`Building tools for Twitter users\`
3. **Create App** inside the project:
   - **App name**: \`Flowo\`
   - **Environment**: \`Development\` (change to Production later)

### Step 3 — Configure App Settings

1. Go to your app → **Settings**
2. Click **"Set up"** under **User authentication settings**
3. **App permissions**: \`Read and Write\`
4. **Type of App**: \`Web App\`
5. **App info**:
   - **Callback URL**: \`https://yourdomain.com/api/auth/callback/twitter\`
   - **Website URL**: \`https://yourdomain.com\`
   - **Terms of Service**: \`https://yourdomain.com/terms\`
   - **Privacy Policy**: \`https://yourdomain.com/privacy\`
6. Click **"Save"**

### Step 4 — Get Credentials

1. Go to **Keys and Tokens** tab
2. Under **OAuth 2.0 Client ID and Client Secret**, copy both values

### Step 5 — Add to Environment

\`\`\`bash
supabase secrets set TWITTER_CLIENT_ID="your_oauth2_client_id"
supabase secrets set TWITTER_CLIENT_SECRET="your_oauth2_client_secret"
supabase secrets set TWITTER_REDIRECT_URI="https://yourdomain.com/api/auth/callback/twitter"

VITE_TWITTER_ENABLED=true
\`\`\`

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
   - **App Name**: \`Flowo\`
   - **Category**: \`Tools and Utilities\`
   - **Platform**: \`Web\`
   - **App description**: \`AI social media management platform\`
3. Click **"Submit"**

### Step 3 — Add Login Kit

1. In your app dashboard, **"Products"** → **"Add Products"**
2. Select **"Login Kit"** → **"Apply"**
3. Once approved, go to **Login Kit → Settings**
4. Add **Redirect URI**:
   \`\`\`
   https://yourdomain.com/api/auth/callback/tiktok
   http://localhost:8080/api/auth/callback/tiktok
   \`\`\`

### Step 4 — Add Content Posting API

1. **"Add Products"** → **"Content Posting API"**
2. This allows your app to post videos to TikTok
3. **Requires app review** for production use

### Step 5 — Get Credentials

1. Go to **Keys and Credentials**
2. Copy **Client Key** and **Client Secret**

### Step 6 — Add to Environment

\`\`\`bash
supabase secrets set TIKTOK_CLIENT_KEY="your_client_key"
supabase secrets set TIKTOK_CLIENT_SECRET="your_client_secret"
supabase secrets set TIKTOK_REDIRECT_URI="https://yourdomain.com/api/auth/callback/tiktok"

VITE_TIKTOK_ENABLED=true
\`\`\`

### Step 7 — App Review for Production

Submit app review for **Content Posting API**:
- **Review time**: 1-2 weeks
- **Requirements**: Demo video showing how your app posts to TikTok
- **Permissions needed**: \`video.publish\`, \`user.info.basic\`

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

1. **App name**: \`Flowo\`
2. **Description**: \`AI-powered social media management tool for automated Pinterest pin creation and scheduling\`
3. **App website**: \`https://yourdomain.com\`
4. **Privacy Policy URL**: \`https://yourdomain.com/privacy\`
5. **Terms of Service URL**: \`https://yourdomain.com/terms\`
6. Click **"Create"**

### Step 4 — Configure OAuth

1. Go to your app settings
2. **Add Redirect URIs**:
   \`\`\`
   https://yourdomain.com/api/auth/callback/pinterest
   http://localhost:8080/api/auth/callback/pinterest
   \`\`\`
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

\`\`\`bash
supabase secrets set PINTEREST_APP_ID="your_app_id"
supabase secrets set PINTEREST_APP_SECRET="your_app_secret"
supabase secrets set PINTEREST_REDIRECT_URI="https://yourdomain.com/api/auth/callback/pinterest"

VITE_PINTEREST_ENABLED=true
\`\`\`

### Step 8 — App Review

Submit for production review:
- **Review time**: 1-2 business days
- **Requirements**: Screenshots/video of Pinterest integration in your app
- Most apps with clear business use cases are approved quickly

---

## ✅ Final Setup and Testing

### Step 1 — Update Environment Variables

Restart your development server after adding platform credentials:

\`\`\`bash
npm run dev
\`\`\`

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

Visit \`/admin/health\` to check platform integration status:
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
- ✅ Verify \`TOKEN_ENCRYPTION_KEY\` is set in Supabase Edge Function secrets
- ✅ Key must be base64-encoded 32-byte value
- ✅ Regenerate with: \`openssl rand -base64 32\`

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
`;
};

// Generate all documentation files
const generateDocs = () => {
  console.log('🚀 Generating Flowo documentation files...');
  
  const projectData = readProjectData();
  
  const files = [
    { name: 'README.md', content: generateREADME(projectData) },
    { name: 'SUPABASE_SETUP.md', content: generateSupabaseSetup(projectData) },
    { name: 'STRIPE_SETUP.md', content: generateStripeSetup() },
    { name: 'API_CONNECT.md', content: generateAPIConnect() }
  ];
  
  files.forEach(file => {
    fs.writeFileSync(file.name, file.content);
    console.log(`✅ Generated ${file.name} (${Math.round(file.content.length / 1000)}KB)`);
  });
  
  console.log('\\n🎉 All documentation files generated successfully!');
  console.log('\\n📁 Files created:');
  files.forEach(file => {
    console.log(`   • ${file.name}`);
  });
  
  console.log('\\n📖 Next steps:');
  console.log('   1. Review and customize the generated documentation');
  console.log('   2. Follow SUPABASE_SETUP.md to configure your database');
  console.log('   3. Use STRIPE_SETUP.md to enable billing');
  console.log('   4. Use API_CONNECT.md to connect social platforms');
  
  return files;
};

// Run the documentation generation
if (require.main === module) {
  try {
    generateDocs();
  } catch (error) {
    console.error('❌ Error generating documentation:', error.message);
    process.exit(1);
  }
}

export { generateDocs };