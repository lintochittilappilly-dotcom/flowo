import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImageIcon, Sparkles, Loader2, Download, Copy, Check, Wand2,
  LayoutTemplate, Send, Instagram, Linkedin, Twitter, Facebook, Music, Pin,
  Trash2, Clock, Grid3X3, X, Rocket, Tag, PartyPopper, MessageSquareQuote, Briefcase, Gift,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { publishPost } from "@/services/publish.service";
import { useUsageCheck } from "@/hooks/use-plan-gate";
import { UsageBanner, UsageChip } from "@/components/plan-gate/usage-gate";

// ── Tab 1: Free Image Gen ──
const examplePrompts = [
  "A minimalist flat illustration of a coffee cup with steam, pastel colors",
  "An abstract gradient background in purple and blue tones for a social media post",
  "A professional product photo of headphones on a clean white background",
  "A cozy autumn scene with falling leaves and warm lighting, illustration style",
  "A modern tech startup workspace with people collaborating, flat design",
  "A vibrant food photography style image of a healthy smoothie bowl",
];

// ── Tab 2: Banner / Poster ──
const bannerPlatforms = [
  { name: "Instagram Post", icon: Instagram, size: "1080×1080", ratio: "1:1" },
  { name: "Instagram Story", icon: Instagram, size: "1080×1920", ratio: "9:16" },
  { name: "Facebook Cover", icon: Facebook, size: "1200×628", ratio: "1.91:1" },
  { name: "LinkedIn Banner", icon: Linkedin, size: "1584×396", ratio: "4:1" },
  { name: "Twitter Header", icon: Twitter, size: "1500×500", ratio: "3:1" },
  { name: "YouTube Thumbnail", icon: Music, size: "1280×720", ratio: "16:9" },
  { name: "Pinterest Pin", icon: Pin, size: "1000×1500", ratio: "2:3" },
];

const bannerStyles = [
  "Modern & Clean", "Bold & Vibrant", "Elegant & Minimal", "Playful & Fun",
  "Dark & Moody", "Corporate & Professional",
];

// ── Interactive Templates ──
interface TemplateField {
  key: string;
  label: string;
  placeholder: string;
  defaultValue: string;
}

interface BannerTemplate {
  name: string;
  icon: LucideIcon;
  description: string;
  fields: TemplateField[];
  buildPrompt: (values: Record<string, string>) => string;
}

const bannerTemplates: BannerTemplate[] = [
  {
    name: "Product Launch",
    icon: Rocket,
    description: "Announce a new product or feature",
    fields: [
      { key: "product", label: "Product Name", placeholder: "e.g. Smart Watch Pro", defaultValue: "Your Product" },
      { key: "tagline", label: "Tagline", placeholder: "e.g. The future on your wrist", defaultValue: "Innovation Meets Design" },
      { key: "date", label: "Launch Date", placeholder: "e.g. March 15, 2026", defaultValue: "Coming Soon" },
      { key: "colors", label: "Brand Colors", placeholder: "e.g. blue and gold", defaultValue: "modern gradient" },
    ],
    buildPrompt: (v) => `Product launch announcement banner for "${v.product}". Tagline: "${v.tagline}". Launch date: ${v.date}. Use ${v.colors} colors. Professional, exciting, premium feel with the product as hero element.`,
  },
  {
    name: "Sale / Discount",
    icon: Tag,
    description: "Promote a sale or special offer",
    fields: [
      { key: "discount", label: "Discount", placeholder: "e.g. 50% OFF", defaultValue: "50% OFF" },
      { key: "event", label: "Sale Name", placeholder: "e.g. Summer Sale", defaultValue: "Big Sale" },
      { key: "duration", label: "Duration", placeholder: "e.g. This weekend only", defaultValue: "Limited Time" },
      { key: "items", label: "What's on sale?", placeholder: "e.g. All clothing", defaultValue: "Everything" },
    ],
    buildPrompt: (v) => `Eye-catching sale banner: ${v.discount} on ${v.items}. Event: "${v.event}". Duration: ${v.duration}. Bold, attention-grabbing design with large discount text, urgency elements, and vibrant colors.`,
  },
  {
    name: "Event Invitation",
    icon: PartyPopper,
    description: "Invite people to your event or webinar",
    fields: [
      { key: "event", label: "Event Name", placeholder: "e.g. AI Workshop 2026", defaultValue: "Your Event" },
      { key: "date", label: "Date & Time", placeholder: "e.g. March 20, 2pm EST", defaultValue: "Date TBA" },
      { key: "speaker", label: "Speaker / Host", placeholder: "e.g. John Smith, CEO", defaultValue: "" },
      { key: "topic", label: "Topic", placeholder: "e.g. Future of AI in Marketing", defaultValue: "Don't Miss Out" },
    ],
    buildPrompt: (v) => `Event invitation banner for "${v.event}". Date: ${v.date}. ${v.speaker ? `Speaker: ${v.speaker}.` : ""} Topic: ${v.topic}. Professional, inviting design with clear event details hierarchy and a modern aesthetic.`,
  },
  {
    name: "Quote / Motivation",
    icon: MessageSquareQuote,
    description: "Share an inspirational or brand quote",
    fields: [
      { key: "quote", label: "Quote Text", placeholder: 'e.g. "Success is not final..."', defaultValue: '"Your quote here"' },
      { key: "author", label: "Author", placeholder: "e.g. Winston Churchill", defaultValue: "" },
      { key: "mood", label: "Mood", placeholder: "e.g. calm, powerful, warm", defaultValue: "inspirational" },
    ],
    buildPrompt: (v) => `Motivational quote poster: ${v.quote}${v.author ? ` — ${v.author}` : ""}. Mood: ${v.mood}. Beautiful typography-focused design with elegant background, perfect for social media sharing.`,
  },
  {
    name: "Hiring / Job Post",
    icon: Briefcase,
    description: "Announce an open position",
    fields: [
      { key: "position", label: "Job Title", placeholder: "e.g. Senior Developer", defaultValue: "We're Hiring!" },
      { key: "company", label: "Company Name", placeholder: "e.g. TechCorp", defaultValue: "Our Team" },
      { key: "perks", label: "Key Perks", placeholder: "e.g. Remote, Great pay", defaultValue: "Great benefits" },
      { key: "cta", label: "Call to Action", placeholder: "e.g. Apply Now", defaultValue: "Join Us" },
    ],
    buildPrompt: (v) => `Job posting banner: "${v.position}" at ${v.company}. Perks: ${v.perks}. CTA: "${v.cta}". Modern, professional recruitment design that feels welcoming and exciting.`,
  },
  {
    name: "Holiday Greeting",
    icon: Gift,
    description: "Seasonal or holiday themed post",
    fields: [
      { key: "occasion", label: "Occasion", placeholder: "e.g. Christmas, Eid, Diwali", defaultValue: "Happy Holidays" },
      { key: "from", label: "From (Brand)", placeholder: "e.g. From the Flowo team", defaultValue: "From our team" },
      { key: "message", label: "Short Message", placeholder: "e.g. Wishing you joy!", defaultValue: "Warmest wishes" },
    ],
    buildPrompt: (v) => `Holiday greeting banner for "${v.occasion}". Message: "${v.message}". From: ${v.from}. Festive, warm design with holiday-appropriate decorations and elegant typography.`,
  },
];

// ── Gallery image type ──
interface GalleryImage {
  id: string;
  prompt: string;
  image_url: string;
  storage_path: string | null;
  image_type: string;
  platform: string | null;
  style: string | null;
  created_at: string;
}

/** Enhance prompt with platform context */
function buildBannerPrompt(
  description: string,
  platform: typeof bannerPlatforms[number],
  style: string
): string {
  return `Create a professional social media ${platform.name.toLowerCase()} banner/poster image.
Size: ${platform.size} pixels (${platform.ratio} aspect ratio).
Style: ${style}.
Content/Theme: ${description}.
Requirements:
- Clean, high-quality design suitable for ${platform.name}
- Eye-catching composition with proper visual hierarchy
- Modern typography-style layout if text elements are implied
- Professional color palette matching the "${style}" aesthetic
- Optimized for the ${platform.ratio} aspect ratio
- Ready to use as a social media graphic`;
}

const ImageGenerationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { images: imagesUsage, incrementImages } = useUsageCheck();
  const [activeTab, setActiveTab] = useState<"generate" | "banner" | "gallery">("generate");

  // ── Shared ──
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiText, setAiText] = useState("");

  // ── Tab 1 state ──
  const [prompt, setPrompt] = useState("");

  // ── Tab 2 state ──
  const [bannerDesc, setBannerDesc] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState(bannerPlatforms[0]);
  const [bannerStyle, setBannerStyle] = useState(bannerStyles[0]);
  const [publishing, setPublishing] = useState(false);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<BannerTemplate | null>(null);
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});

  // ── Gallery state ──
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("brands").select("id").eq("user_id", user.id).limit(1).then(({ data }) => {
      if (data?.[0]) setBrandId(data[0].id);
    });
  }, [user]);

  const fetchGallery = useCallback(async () => {
    if (!user) return;
    setGalleryLoading(true);
    const { data } = await supabase
      .from("generated_images")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setGallery((data as GalleryImage[]) || []);
    setGalleryLoading(false);
  }, [user]);

  useEffect(() => {
    if (activeTab === "gallery") fetchGallery();
  }, [activeTab, fetchGallery]);

  const switchTab = (tab: "generate" | "banner" | "gallery") => {
    setActiveTab(tab);
    if (tab !== "gallery") {
      setImageUrl(null);
      setAiText("");
    }
  };

  // ── Save to gallery ──
  const saveToGallery = async (promptText: string, url: string, type: string) => {
    if (!user) return;
    setSaving(true);
    try {
      // Download image and upload to storage
      const response = await fetch(url);
      const blob = await response.blob();
      const ext = "png";
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("generated-images")
        .upload(filePath, blob, { contentType: "image/png" });

      if (uploadErr) throw uploadErr;

      const { data: publicUrl } = supabase.storage
        .from("generated-images")
        .getPublicUrl(filePath);

      await supabase.from("generated_images").insert({
        user_id: user.id,
        prompt: promptText,
        image_url: publicUrl.publicUrl,
        storage_path: filePath,
        image_type: type,
        platform: activeTab === "banner" ? selectedPlatform.name : null,
        style: activeTab === "banner" ? bannerStyle : null,
      });

      toast.success("Saved to gallery!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const deleteFromGallery = async (img: GalleryImage) => {
    if (!user) return;
    try {
      if (img.storage_path) {
        await supabase.storage.from("generated-images").remove([img.storage_path]);
      }
      await supabase.from("generated_images").delete().eq("id", img.id);
      setGallery(prev => prev.filter(g => g.id !== img.id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  // ── Template handling ──
  const selectTemplate = (tpl: BannerTemplate) => {
    setActiveTemplate(tpl);
    const defaults: Record<string, string> = {};
    tpl.fields.forEach(f => { defaults[f.key] = f.defaultValue; });
    setTemplateValues(defaults);
  };

  const applyTemplate = () => {
    if (!activeTemplate) return;
    const builtPrompt = activeTemplate.buildPrompt(templateValues);
    setBannerDesc(builtPrompt);
    setActiveTemplate(null);
  };

  // ── Generate (Tab 1) ──
  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Please enter a prompt"); return; }
    if (imagesUsage.isAtLimit) { toast.error("Monthly image limit reached. Upgrade your plan."); return; }
    setLoading(true);
    setImageUrl(null);
    setAiText("");
    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: prompt.trim() },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      if (data?.imageUrl) {
        setImageUrl(data.imageUrl);
        setAiText(data.text || "");
        await incrementImages();
        toast.success("Image generated!");
      } else toast.error("No image was returned");
    } catch (e: any) {
      toast.error(e.message || "Image generation failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Generate Banner (Tab 2) ──
  const handleGenerateBanner = async () => {
    if (!bannerDesc.trim()) { toast.error("Describe your banner first"); return; }
    if (imagesUsage.isAtLimit) { toast.error("Monthly image limit reached. Upgrade your plan."); return; }
    setLoading(true);
    setImageUrl(null);
    setAiText("");
    const enhancedPrompt = buildBannerPrompt(bannerDesc, selectedPlatform, bannerStyle);
    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: enhancedPrompt },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      if (data?.imageUrl) {
        setImageUrl(data.imageUrl);
        setAiText(data.text || "");
        await incrementImages();
        toast.success("Banner created!");
      } else toast.error("No image was returned");
    } catch (e: any) {
      toast.error(e.message || "Banner generation failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Publish Banner ──
  const handlePublishBanner = async () => {
    if (!user || !brandId) { toast.error("No brand found. Complete onboarding first."); return; }
    if (!imageUrl) { toast.error("Generate a banner first"); return; }
    setPublishing(true);
    try {
      const platformName = selectedPlatform.name.split(" ")[0];
      const { data: newPost, error } = await supabase.from("posts").insert({
        user_id: user.id,
        brand_id: brandId,
        platform: platformName,
        content: bannerDesc || "Banner post",
        image_url: imageUrl,
        status: "draft",
      }).select("id").single();
      if (error) throw error;
      const result = await publishPost(newPost.id, user.id);
      if (result.success) {
        toast.success(`Published to ${platformName}${result.simulated ? " (simulated)" : ""}!`);
      } else {
        toast.error(result.error || "Publish failed");
      }
    } catch (e: any) {
      toast.error(e.message || "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `flowo-${activeTab}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloaded!");
  };

  const handleCopyUrl = () => {
    if (!imageUrl) return;
    navigator.clipboard.writeText(imageUrl);
    setCopied(true);
    toast.success("URL copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const currentPromptText = activeTab === "generate" ? prompt : bannerDesc;
  const currentType = activeTab === "generate" ? "freeform" : "banner";

  // ── Preview Panel ──
  const PreviewPanel = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-muted animate-pulse" />
              <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary animate-spin" />
            </div>
            <p className="mt-4 font-heading text-sm font-semibold text-foreground">
              {activeTab === "banner" ? "Creating your banner..." : "Creating your image..."}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">This may take a few seconds</p>
          </div>
        ) : imageUrl ? (
          <div>
            <img src={imageUrl} alt="Generated" className="w-full object-contain max-h-[500px]" />
            <div className="p-4 space-y-3">
              {aiText && <p className="text-xs text-muted-foreground font-body">{aiText}</p>}
              {activeTab === "banner" && (
                <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
                  <selectedPlatform.icon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">{selectedPlatform.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{selectedPlatform.size}</span>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors">
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
                <button onClick={handleCopyUrl} className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors">
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied!" : "Copy URL"}
                </button>
              </div>
              {/* Save to gallery */}
              <button
                onClick={() => saveToGallery(currentPromptText, imageUrl, currentType)}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-primary py-2 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Grid3X3 className="h-3.5 w-3.5" />}
                {saving ? "Saving..." : "Save to Gallery"}
              </button>
              {activeTab === "banner" && (
                <button
                  onClick={handlePublishBanner}
                  disabled={publishing}
                  className="w-full flex items-center justify-center gap-2 rounded-lg gradient-bg py-2.5 text-xs font-bold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
                >
                  {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  {publishing ? "Publishing..." : `Publish to ${selectedPlatform.name.split(" ")[0]}`}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="rounded-2xl bg-muted/30 p-5">
              {activeTab === "banner" ? <LayoutTemplate className="h-12 w-12 text-muted-foreground/30" /> : <ImageIcon className="h-12 w-12 text-muted-foreground/30" />}
            </div>
            <p className="mt-4 font-heading text-sm font-semibold text-muted-foreground">
              {activeTab === "banner" ? "Your banner/poster will appear here" : "Your generated image will appear here"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeTab === "banner" ? "Pick a template or describe what you need" : "Describe what you want and click Generate"}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Usage banner */}
      <UsageBanner used={imagesUsage.used} limit={imagesUsage.limit} resourceName="AI images" isUnlimited={imagesUsage.isUnlimited} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">AI Image Studio</h1>
          <p className="mt-1 font-body text-sm text-muted-foreground">Generate images, banners, and posters for your social media</p>
        </div>
        <UsageChip used={imagesUsage.used} limit={imagesUsage.limit} isUnlimited={imagesUsage.isUnlimited} />
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 rounded-xl bg-card border border-border p-1 w-fit">
        {([
          { key: "generate" as const, label: "Image Generation", icon: Wand2 },
          { key: "banner" as const, label: "Banner & Poster", icon: LayoutTemplate },
          { key: "gallery" as const, label: "Gallery", icon: Grid3X3 },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => switchTab(tab.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 font-heading text-xs font-semibold transition-all ${
              activeTab === tab.key ? "gradient-bg text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── TAB 1: Image Generation ── */}
        {activeTab === "generate" && (
          <motion.div key="generate" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Wand2 className="h-4 w-4 text-primary" />
                  <span className="font-heading text-sm font-bold text-foreground">Describe Your Image</span>
                </div>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the image you want to generate... Be specific about style, colors, composition, and mood." className="w-full rounded-lg border border-border bg-background p-4 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[140px] resize-none" />
                <button onClick={handleGenerate} disabled={loading || !prompt.trim() || imagesUsage.isAtLimit} className="w-full flex items-center justify-center gap-2 rounded-lg gradient-bg py-3 font-heading text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loading ? "Generating..." : imagesUsage.isAtLimit ? "Image limit reached" : "Generate Image"}
                </button>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <p className="mb-3 font-heading text-xs font-semibold text-muted-foreground uppercase tracking-wider">Try these prompts</p>
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.map((ep, i) => (
                    <button key={i} onClick={() => setPrompt(ep)} className="rounded-lg bg-muted/50 px-3 py-2 text-left text-xs font-body text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                      {ep.length > 60 ? ep.slice(0, 60) + "..." : ep}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
            <PreviewPanel />
          </motion.div>
        )}

        {/* ── TAB 2: Banner & Poster ── */}
        {activeTab === "banner" && (
          <motion.div key="banner" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-5">
                {/* Platform select */}
                <div>
                  <p className="mb-2.5 font-heading text-xs font-semibold text-foreground">Platform & Format</p>
                  <div className="grid grid-cols-2 gap-2">
                    {bannerPlatforms.map((p) => (
                      <button key={p.name} onClick={() => setSelectedPlatform(p)} className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-all ${selectedPlatform.name === p.name ? "bg-primary text-primary-foreground shadow-sm" : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"}`}>
                        <p.icon className="h-3.5 w-3.5 shrink-0" />
                        <div>
                          <span className="text-xs font-semibold block leading-tight">{p.name}</span>
                          <span className={`text-[10px] ${selectedPlatform.name === p.name ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{p.size}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style */}
                <div>
                  <p className="mb-2.5 font-heading text-xs font-semibold text-foreground">Style</p>
                  <div className="flex flex-wrap gap-2">
                    {bannerStyles.map((s) => (
                      <button key={s} onClick={() => setBannerStyle(s)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${bannerStyle === s ? "gradient-bg text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <p className="font-heading text-xs font-semibold text-foreground">What's your banner about?</p>
                  </div>
                  <p className="mb-2 text-[11px] text-muted-foreground">
                    Describe in simple words or use a template below — AI handles the design
                  </p>
                  <textarea value={bannerDesc} onChange={(e) => setBannerDesc(e.target.value)} placeholder='e.g. "Summer sale 50% off" or "New product launch"' className="w-full rounded-lg border border-border bg-background p-4 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[100px] resize-none" />
                </div>

                <button onClick={handleGenerateBanner} disabled={loading || !bannerDesc.trim() || imagesUsage.isAtLimit} className="w-full flex items-center justify-center gap-2 rounded-lg gradient-bg py-3 font-heading text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LayoutTemplate className="h-4 w-4" />}
                  {loading ? "Creating Banner..." : imagesUsage.isAtLimit ? "Image limit reached" : `Create ${selectedPlatform.name}`}
                </button>
              </div>

              {/* Interactive Templates */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <p className="mb-3 font-heading text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Quick Templates — click to customize
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {bannerTemplates.map((tpl) => (
                    <button
                      key={tpl.name}
                      onClick={() => selectTemplate(tpl)}
                      className="flex items-start gap-2.5 rounded-lg border border-border p-3 text-left hover:border-primary/40 hover:bg-primary/5 transition-all group"
                    >
                      <tpl.icon className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors block">{tpl.name}</span>
                        <span className="text-[10px] text-muted-foreground leading-tight">{tpl.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            <PreviewPanel />

            {/* Template Modal */}
            <AnimatePresence>
              {activeTemplate && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
                  onClick={(e) => { if (e.target === e.currentTarget) setActiveTemplate(null); }}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl space-y-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <activeTemplate.icon className="h-6 w-6 text-primary" />
                        <div>
                          <h3 className="font-heading text-base font-bold text-foreground">{activeTemplate.name}</h3>
                          <p className="text-xs text-muted-foreground">{activeTemplate.description}</p>
                        </div>
                      </div>
                      <button onClick={() => setActiveTemplate(null)} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {activeTemplate.fields.map((field) => (
                        <div key={field.key}>
                          <label className="block mb-1 font-heading text-xs font-semibold text-foreground">{field.label}</label>
                          <input
                            type="text"
                            value={templateValues[field.key] || ""}
                            onChange={(e) => setTemplateValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Live preview of the prompt */}
                    <div className="rounded-lg bg-muted/30 border border-border p-3">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Preview</p>
                      <p className="text-xs text-foreground leading-relaxed">{activeTemplate.buildPrompt(templateValues)}</p>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => setActiveTemplate(null)} className="flex-1 rounded-lg border border-border py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                        Cancel
                      </button>
                      <button onClick={applyTemplate} className="flex-1 rounded-lg gradient-bg py-2.5 text-xs font-bold text-primary-foreground transition-transform hover:scale-[1.02]">
                        Use This Template
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── TAB 3: Gallery ── */}
        {activeTab === "gallery" && (
          <motion.div key="gallery" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {galleryLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : gallery.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-16 text-center">
                <Grid3X3 className="h-12 w-12 text-muted-foreground/30" />
                <p className="mt-4 font-heading text-sm font-semibold text-muted-foreground">No saved images yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Generate an image and click "Save to Gallery" to see it here</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {gallery.map((img) => (
                  <motion.div
                    key={img.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group relative rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <img src={img.image_url} alt={img.prompt} className="w-full aspect-square object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                      <p className="text-[11px] text-foreground font-semibold line-clamp-2 mb-1">{img.prompt.slice(0, 80)}</p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
                        <Clock className="h-3 w-3" />
                        {new Date(img.created_at).toLocaleDateString()}
                        {img.platform && (
                          <span className="ml-1 rounded bg-primary/10 px-1.5 py-0.5 text-primary font-semibold">{img.platform}</span>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        <a
                          href={img.image_url}
                          download
                          className="flex-1 flex items-center justify-center gap-1 rounded-md bg-card/80 backdrop-blur-sm border border-border py-1.5 text-[10px] font-semibold text-foreground hover:bg-muted transition-colors"
                        >
                          <Download className="h-3 w-3" /> Save
                        </a>
                        <button
                          onClick={() => navigate(`/create?image_url=${encodeURIComponent(img.image_url)}`)}
                          className="flex-1 flex items-center justify-center gap-1 rounded-md bg-primary/80 backdrop-blur-sm border border-primary/30 py-1.5 text-[10px] font-semibold text-primary-foreground hover:bg-primary transition-colors"
                        >
                          <Send className="h-3 w-3" /> Use in Post
                        </button>
                        <button
                          onClick={() => deleteFromGallery(img)}
                          className="flex items-center justify-center rounded-md bg-card/80 backdrop-blur-sm border border-destructive/30 px-2 py-1.5 text-[10px] font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    {/* Type badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold backdrop-blur-sm ${img.image_type === "banner" ? "bg-accent/80 text-accent-foreground" : "bg-primary/80 text-primary-foreground"}`}>
                        {img.image_type === "banner" ? "Banner" : "Image"}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageGenerationPage;
