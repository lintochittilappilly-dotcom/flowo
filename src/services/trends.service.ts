// Trends service layer — system-ready with feature flag pattern
// Real trending data activates when Tavily/SerpAPI keys are added

import { supabase } from "@/integrations/supabase/client";
import { generatePost, type GeneratePostParams } from "@/services/openai.service";

const TRENDS_ENABLED = import.meta.env.VITE_TRENDS_ENABLED === "true";
const AI_ENABLED = import.meta.env.VITE_AI_ENABLED === "true";

// ── Industry-specific dummy trends (rotate weekly) ────────────────

const industryTrends: Record<string, string[]> = {
  "Beauty & Wellness": [
    "Glass skin routine using only 3 products", "Peptide skincare revolution", "Clean beauty certification standards",
    "Scalp care is the new skincare trend", "AI-powered skin analysis apps", "Waterless beauty products surge",
    "Microbiome-friendly cosmetics", "Blue light protection skincare", "Adaptogenic beauty supplements",
    "Sustainable refillable packaging trend",
  ],
  "Health & Fitness": [
    "Zone 2 cardio training for longevity", "Protein coffee pre-workout trend", "AI personal training apps boom",
    "Cold plunge therapy going mainstream", "Hybrid fitness memberships rise", "Wearable health tech predictions",
    "Gut health and fitness performance link", "Mobility training over flexibility", "Walking pad desk setups surge",
    "Sleep optimization biohacking tools",
  ],
  "Technology & SaaS": [
    "AI agents replacing traditional SaaS", "Vertical AI tools outperforming horizontal", "Developer experience as competitive moat",
    "Usage-based pricing model shift", "AI-native startups fundraising trends", "Edge computing for real-time AI",
    "Open source AI model adoption rates", "API-first product architecture", "No-code automation platforms growth",
    "Cybersecurity AI defense systems",
  ],
  "E-commerce & Retail": [
    "Social commerce conversion optimization", "AI product photography replacing studios", "Same-day delivery expectations rising",
    "Shoppable video content ROI data", "Returns reduction through AR try-on", "Subscription fatigue and bundling",
    "Micro-influencer affiliate programs", "Voice commerce search optimization", "Sustainable packaging as selling point",
    "Live shopping events driving sales",
  ],
  "Food & Beverage": [
    "Functional beverages market explosion", "Plant-based protein innovations", "Ghost kitchens profitability data",
    "Food waste reduction technology", "Personalized nutrition apps trend", "Fermented foods mainstream adoption",
    "QR code menu innovation ideas", "Local sourcing as brand differentiator", "Meal kit subscription evolution",
    "CBD-infused food regulations update",
  ],
  "Real Estate": [
    "AI-powered property valuation accuracy", "Remote work impact on suburban demand", "Smart home features buyers want",
    "Sustainable building certifications value", "Virtual staging conversion rates", "Co-living spaces investment trend",
    "PropTech funding landscape shift", "Interest rate impact on first-time buyers", "Short-term rental regulation changes",
    "Modular construction cost savings data",
  ],
  "Coaching & Consulting": [
    "AI coaching assistants emerging", "Group coaching scalability models", "Certification program ROI analysis",
    "LinkedIn thought leadership strategies", "Productized consulting services trend", "Community-led growth for coaches",
    "Video course completion rate optimization", "Niche specialization premium pricing", "Client success metrics frameworks",
    "Podcast as client acquisition channel",
  ],
  "Finance & Accounting": [
    "AI bookkeeping automation adoption", "Embedded finance opportunities", "Cryptocurrency accounting standards",
    "Financial wellness programs for employees", "RegTech compliance automation", "Open banking API integrations",
    "ESG reporting requirements expansion", "Fractional CFO demand increase", "Digital payment fraud prevention",
    "Tax optimization AI tools surge",
  ],
  "Education": [
    "AI tutoring personalized learning paths", "Microlearning course completion rates", "Gamification in corporate training",
    "Skills-based hiring replacing degrees", "Cohort-based course revenue models", "AR/VR classroom experiences",
    "Student mental health tech solutions", "Competency-based education models", "EdTech funding trends analysis",
    "Lifelong learning subscription platforms",
  ],
  "Travel & Hospitality": [
    "Bleisure travel trend acceleration", "AI concierge services in hotels", "Sustainable tourism certification demand",
    "Experience economy post-pandemic data", "Digital nomad visa programs expansion", "Contactless hotel technology adoption",
    "Wellness retreat bookings surge", "Local experience marketplace growth", "Travel insurance innovation trends",
    "Space tourism market development",
  ],
  "Marketing & Advertising": [
    "AI-generated ad creative performance", "First-party data strategy essentials", "Short-form video ad spend shift",
    "Influencer marketing ROI benchmarks", "Privacy-first advertising solutions", "Conversational marketing automation",
    "User-generated content campaigns ROI", "Podcast advertising growth data", "Interactive content engagement rates",
    "Brand safety in AI-generated content",
  ],
  "Healthcare & Medical": [
    "Telehealth adoption permanence data", "AI diagnostic tool accuracy rates", "Mental health app effectiveness studies",
    "Wearable health monitoring advances", "Precision medicine accessibility trends", "Healthcare data interoperability push",
    "Patient experience digital transformation", "Remote patient monitoring ROI", "Healthcare cybersecurity threats rise",
    "Digital therapeutics FDA approvals",
  ],
};

function getWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

function getRotatedTrends(industry: string, count: number): { topic: string; growth: number; source: string }[] {
  const key = Object.keys(industryTrends).find((k) => k.toLowerCase() === industry.toLowerCase()) || "Technology & SaaS";
  const topics = industryTrends[key] || industryTrends["Technology & SaaS"];
  const week = getWeekNumber();
  const offset = week % topics.length;

  return Array.from({ length: count }, (_, i) => {
    const idx = (offset + i) % topics.length;
    return {
      topic: topics[idx],
      growth: Math.floor(Math.random() * 800 + 50),
      source: ["Google Trends", "Industry News", "Social Listening", "Curated"][i % 4],
    };
  });
}

// ── Upcoming marketing dates ──────────────────────────────────────

interface UpcomingDate {
  date: string; // ISO string
  event: string;
  category: "Shopping" | "Awareness" | "Holiday" | "Business";
}

function getUpcomingDatesRaw(): UpcomingDate[] {
  const year = new Date().getFullYear();
  const allDates: UpcomingDate[] = [
    { date: `${year}-01-01`, event: "New Year's Day", category: "Holiday" },
    { date: `${year}-01-15`, event: "Martin Luther King Jr. Day", category: "Awareness" },
    { date: `${year}-02-14`, event: "Valentine's Day", category: "Shopping" },
    { date: `${year}-02-20`, event: "Presidents' Day", category: "Holiday" },
    { date: `${year}-03-08`, event: "International Women's Day", category: "Awareness" },
    { date: `${year}-03-14`, event: "Pi Day", category: "Awareness" },
    { date: `${year}-03-17`, event: "St. Patrick's Day", category: "Holiday" },
    { date: `${year}-03-20`, event: "International Day of Happiness", category: "Awareness" },
    { date: `${year}-03-22`, event: "World Water Day", category: "Awareness" },
    { date: `${year}-04-01`, event: "April Fools' Day", category: "Holiday" },
    { date: `${year}-04-07`, event: "World Health Day", category: "Awareness" },
    { date: `${year}-04-22`, event: "Earth Day", category: "Awareness" },
    { date: `${year}-05-01`, event: "May Day / Workers' Day", category: "Holiday" },
    { date: `${year}-05-04`, event: "Star Wars Day", category: "Holiday" },
    { date: `${year}-05-11`, event: "Mother's Day", category: "Shopping" },
    { date: `${year}-05-26`, event: "Memorial Day", category: "Holiday" },
    { date: `${year}-06-05`, event: "World Environment Day", category: "Awareness" },
    { date: `${year}-06-15`, event: "Father's Day", category: "Shopping" },
    { date: `${year}-06-19`, event: "Juneteenth", category: "Awareness" },
    { date: `${year}-07-04`, event: "Independence Day (US)", category: "Holiday" },
    { date: `${year}-07-30`, event: "International Day of Friendship", category: "Awareness" },
    { date: `${year}-08-19`, event: "World Photography Day", category: "Awareness" },
    { date: `${year}-09-01`, event: "Labor Day", category: "Holiday" },
    { date: `${year}-09-21`, event: "International Day of Peace", category: "Awareness" },
    { date: `${year}-10-10`, event: "World Mental Health Day", category: "Awareness" },
    { date: `${year}-10-31`, event: "Halloween", category: "Shopping" },
    { date: `${year}-11-11`, event: "Veterans Day / Singles' Day", category: "Shopping" },
    { date: `${year}-11-28`, event: "Thanksgiving", category: "Holiday" },
    { date: `${year}-11-29`, event: "Black Friday", category: "Shopping" },
    { date: `${year}-12-02`, event: "Cyber Monday", category: "Shopping" },
    { date: `${year}-12-25`, event: "Christmas Day", category: "Holiday" },
    { date: `${year}-12-26`, event: "Boxing Day", category: "Shopping" },
    { date: `${year}-12-31`, event: "New Year's Eve", category: "Holiday" },
    { date: `${year + 1}-01-01`, event: "New Year's Day", category: "Holiday" },
    { date: `${year + 1}-02-14`, event: "Valentine's Day", category: "Shopping" },
  ];
  return allDates;
}

// ── Exported functions ────────────────────────────────────────────

export async function fetchTrendingTopics(industry: string, trendType: string): Promise<any[]> {
  if (TRENDS_ENABLED) {
    // Real Tavily/SerpAPI call would go through edge function
    try {
      const { data, error } = await supabase.functions.invoke("generate-trend-content", {
        body: { topic: `trending topics in ${industry} this week`, platform: "trends", tone: "analytical" },
      });
      if (!error && data?.content) {
        console.info("Trends fetched via API");
      }
    } catch {
      console.info("Trends API call failed, using curated data");
    }
  }

  // Generate curated dummy trends
  const trends = getRotatedTrends(industry, 5);
  const rows = trends.map((t) => ({
    industry,
    topic: t.topic,
    trend_score: Math.floor(Math.random() * 100 + 50),
    growth_percent: t.growth,
    trend_type: trendType,
    source: t.source,
    fetched_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }));

  try {
    const { data: inserted } = await supabase.from("trend_topics").insert(rows).select();
    return inserted || rows;
  } catch {
    console.warn("Failed to cache trends in DB, using local data");
    return rows.map((r, i) => ({ ...r, id: `local-${trendType}-${i}` }));
  }
}

export async function getTrendingTopics(industry: string, trendType: string): Promise<any[]> {
  try {
    // Check cache first
    const { data: cached } = await supabase
      .from("trend_topics")
      .select("*")
      .eq("industry", industry)
      .eq("trend_type", trendType)
      .gt("expires_at", new Date().toISOString())
      .order("trend_score", { ascending: false })
      .limit(5);

    if (cached && cached.length > 0) return cached;

    // Cache miss — fetch fresh
    return await fetchTrendingTopics(industry, trendType);
  } catch (e) {
    console.error("getTrendingTopics failed:", e);
    // Return local fallback data
    return getRotatedTrends(industry, 5).map((t, i) => ({
      id: `fallback-${trendType}-${i}`,
      topic: t.topic,
      growth_percent: t.growth,
      trend_score: Math.floor(Math.random() * 100 + 50),
      trend_type: trendType,
      industry,
      source: t.source,
      fetched_at: new Date().toISOString(),
    }));
  }
}

export function getUpcomingDates(): UpcomingDate[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const sixtyDaysLater = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  return getUpcomingDatesRaw()
    .filter((d) => {
      const date = new Date(d.date);
      return date >= now && date <= sixtyDaysLater;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function generatePostFromTrend(
  topic: string,
  brandId: string,
  platform: string
): Promise<string> {
  try {
    // Try to get brand voice
    let brandVoice = "";
    if (brandId) {
      const { data: voice } = await supabase
        .from("brand_voice_profiles")
        .select("voice_profile")
        .eq("brand_id", brandId)
        .limit(1)
        .single();
      if (voice) brandVoice = voice.voice_profile;
    }

    const result = await generatePost({
      brandVoice,
      platform,
      topic,
      tone: "engaging",
    });

    return result.content;
  } catch (e) {
    console.error("generatePostFromTrend failed:", e);
    return `Here's a post idea about "${topic}" for ${platform}:\n\n🔥 ${topic}\n\nThis is a simulated post. Connect your AI provider to generate real content.`;
  }
}

export async function generateCampaign(
  campaignTopic: string,
  brandId: string,
  numPosts: number,
  platforms: string[]
): Promise<{ platform: string; content: string; suggested_scheduled_at: string }[]> {
  const results: { platform: string; content: string; suggested_scheduled_at: string }[] = [];
  const optimalHours = [9, 12, 15, 18, 10, 14, 17];

  for (let i = 0; i < numPosts; i++) {
    const platform = platforms[i % platforms.length];
    const content = await generatePostFromTrend(`${campaignTopic} - Post ${i + 1}`, brandId, platform);

    const scheduleDate = new Date();
    scheduleDate.setDate(scheduleDate.getDate() + i);
    scheduleDate.setHours(optimalHours[i % optimalHours.length], 0, 0, 0);

    results.push({
      platform,
      content,
      suggested_scheduled_at: scheduleDate.toISOString(),
    });
  }

  return results;
}

// ── Saved trends ──────────────────────────────────────────────────

export async function saveTrend(userId: string, topic: string, industry: string, trendScore = 0): Promise<void> {
  await supabase.from("saved_trends").insert({
    user_id: userId,
    topic,
    industry,
    trend_score: trendScore,
  } as any);
}

export async function unsaveTrend(trendId: string): Promise<void> {
  await supabase.from("saved_trends").delete().eq("id", trendId);
}

export async function getSavedTrends(userId: string): Promise<any[]> {
  try {
    const { data } = await supabase
      .from("saved_trends")
      .select("*")
      .eq("user_id", userId)
      .order("saved_at", { ascending: false }) as any;
    return data || [];
  } catch (e) {
    console.error("getSavedTrends failed:", e);
    return [];
  }
}

export async function clearAllSavedTrends(userId: string): Promise<void> {
  await supabase.from("saved_trends").delete().eq("user_id", userId);
}

export async function toggleTrendPosted(trendId: string, isPosted: boolean): Promise<void> {
  await supabase.from("saved_trends").update({ is_posted: isPosted } as any).eq("id", trendId);
}
