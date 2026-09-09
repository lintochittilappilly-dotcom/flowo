// OpenAI service layer — always tries edge function first, falls back to dummy data
// No client-side feature flag needed — the edge function checks for OPENAI_API_KEY

export interface GeneratePostParams {
  brandVoice: string;
  platform: string;
  topic: string;
  tone: string;
  contentType?: string;
}

export interface GeneratePostResult {
  content: string;
  hashtags: string[];
  characterCount: number;
}

const dummyPosts: Record<string, string> = {
  Instagram: "✨ Transform your routine this season with our latest collection. Your journey to better starts here — naturally sourced, expertly crafted, and loved by thousands.\n\n💫 Link in bio!\n\n#trending #lifestyle #growth",
  LinkedIn: "After years of building in this space, here's what I've learned about customer trust:\n\n1. Transparency wins every time\n2. Reviews are your best marketing\n3. Quality compounds over time\n\nWhat's the #1 thing that builds trust in your industry?",
  Twitter: "Hot take: The best marketing strategy isn't about going viral — it's about being consistently valuable.\n\nHere's what most people get wrong 🧵",
  Facebook: "We're excited to announce something special! 🎉\n\nAfter months of hard work, we're launching something that will change how you think about your daily routine.\n\nStay tuned for the big reveal this week!",
  TikTok: "POV: When you finally find a product that actually works 😍\n\n#fyp #viral #musthave #trending",
  Pinterest: "The ultimate guide to elevating your space this season ✨\n\nSave this pin for later!",
};

export async function generatePost(params: GeneratePostParams): Promise<GeneratePostResult> {
  // Always try AI first via edge function — it will return error if OPENAI_API_KEY not set
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.functions.invoke("generate-trend-content", {
      body: { topic: params.topic, platform: params.platform, tone: params.tone, brandVoice: params.brandVoice },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    if (data?.content) {
      return { content: data.content, hashtags: data.hashtags || [], characterCount: data.content.length };
    }
  } catch (e) {
    console.warn("AI generation unavailable, using fallback:", e);
  }

  // Dummy fallback — works without any API keys
  await new Promise((r) => setTimeout(r, 1200));
  const base = dummyPosts[params.platform] || dummyPosts.Instagram;
  const content = params.topic ? base.replace(/your routine|your space|this space/gi, params.topic) : base;
  return { content, hashtags: ["#trending", "#growth", "#content"], characterCount: content.length };
}

export async function generateBrandVoice(businessName: string, industry: string, samplePosts: string, tonePrefs: string[]): Promise<string> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.functions.invoke("generate-trend-content", {
      body: { topic: `Brand voice for ${businessName}`, platform: "brand_voice", tone: tonePrefs.join(", ") },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    if (data?.content) return data.content;
  } catch (e) {
    console.warn("Brand voice generation unavailable, using fallback:", e);
  }
  await new Promise((r) => setTimeout(r, 1500));
  return `${businessName} speaks with a ${tonePrefs.join(", ")} voice. In the ${industry} space, we communicate as a trusted expert who makes complex topics accessible. We avoid jargon and focus on empowerment. Our content balances education with personality, using storytelling to connect with our audience.`;
}

export async function generateInsight(analyticsData: Record<string, number>): Promise<string> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.functions.invoke("generate-trend-content", {
      body: { topic: "Weekly analytics insight", platform: "insight", tone: "analytical" },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    if (data?.content) return data.content;
  } catch (e) {
    console.warn("Insight generation unavailable, using fallback:", e);
  }
  await new Promise((r) => setTimeout(r, 800));
  return "Your educational content is outperforming promotional posts by 2.8× in engagement. Tuesday and Thursday posts between 10am–2pm see the highest reach. Consider increasing LinkedIn posting frequency — your engagement rate there is 80% above industry average.";
}

export async function generateHashtags(content: string, platform: string): Promise<string[]> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.functions.invoke("generate-trend-content", {
      body: { topic: content, platform, tone: "hashtags" },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    if (data?.hashtags) return data.hashtags;
  } catch (e) {
    console.warn("Hashtag generation unavailable, using fallback:", e);
  }
  await new Promise((r) => setTimeout(r, 600));
  return ["#trending", "#socialmedia", "#marketing", "#contentcreator", "#growth"];
}

export async function generateSuggestedReply(commentText: string, postContext: string): Promise<string> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.functions.invoke("generate-trend-content", {
      body: { topic: `Reply to: ${commentText}`, platform: "reply", tone: "friendly" },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    if (data?.content) return data.content;
  } catch (e) {
    console.warn("Reply generation unavailable, using fallback:", e);
  }
  await new Promise((r) => setTimeout(r, 700));
  return `Thank you for your comment! We really appreciate your engagement. ${commentText.includes("?") ? "Great question — we'd love to help. Let us DM you with more details!" : "We're so glad you enjoyed this! Stay tuned for more content like this. 💜"}`;
}
