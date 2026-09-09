# ✦ Flowo — AI Social Media Manager

> Your AI Social Media Team. Generate, schedule, and publish content across all platforms automatically.

![Version](https://img.shields.io/badge/version-1.0.0-violet)
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

```
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
│   │   ├── stripe-webhook/# Stripe webhook processing
│   │   └── sync-post-analytics/ # Analytics sync
│   └── config.toml       # Supabase configuration
├── scripts/              # Utility scripts
└── public/               # Static assets
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Git

### Installation

```bash
git clone https://github.com/yourusername/flowo.git
cd flowo
npm install
cp .env.example .env
```

### Environment Setup

Fill in your `.env` file with these required variables:

```bash
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
```

### Run Development Server

```bash
npm run dev
```

Open http://localhost:8080 in your browser.

### Database Setup

Complete database setup is required. See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions.

## 💰 Plans and Pricing

### Starter
**$49/month** • **$39/month** *(billed annually)*

- 1 brand profile
- 3 social accounts per brand
- 100 AI posts/month
- 50 AI images/month
- 1 team member
- Basic analytics
- Content calendar
- Comments manager
- Brand voice training

### Pro ⭐ Most Popular
**$99/month** • **$79/month** *(billed annually)*

- 3 brand profiles
- 10 social accounts per brand
- 500 AI posts/month
- 200 AI images/month
- 5 team members
- Advanced analytics
- Bulk scheduling
- Custom posting times
- Export analytics
- Campaign generator
- All platforms: Instagram, LinkedIn, Twitter, Facebook, TikTok, Pinterest

### Agency
**$199/month** • **$159/month** *(billed annually)*

- Unlimited brand profiles
- Unlimited social accounts
- Unlimited AI posts
- Unlimited AI images
- Unlimited team members
- White-label reports
- API access
- Priority support
- Team collaboration
- All Pro features

## 🚀 Deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

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

Visit `/admin/health` (requires admin privileges) to monitor:
- Database connectivity and table status
- Edge Function health
- External API connections
- Stripe integration status
- Real-time system metrics

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
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
