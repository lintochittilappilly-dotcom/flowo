import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, Instagram, Linkedin, Twitter, Facebook, Music, Pin, RefreshCw, Copy, Calendar, Send, Loader2, Check, Hash, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { generatePost, generateHashtags } from "@/services/openai.service";
import { publishPost, schedulePost } from "@/services/publish.service";
import { useBrandStore } from "@/store/brand-store";
import BrandIndicator from "@/components/brand-indicator";
import NoBrandsState from "@/components/no-brands-state";
import { usePlanGate, useUsageCheck } from "@/hooks/use-plan-gate";
import { UsageBanner, UsageChip } from "@/components/plan-gate/usage-gate";
import { PlanGate } from "@/components/plan-gate/plan-gate";

const platforms = [
  { name: "Instagram", icon: Instagram, maxChars: 2200 },
  { name: "LinkedIn", icon: Linkedin, maxChars: 3000 },
  { name: "Twitter", icon: Twitter, maxChars: 280 },
  { name: "Facebook", icon: Facebook, maxChars: 5000 },
  { name: "TikTok", icon: Music, maxChars: 2200 },
  { name: "Pinterest", icon: Pin, maxChars: 500 },
];

const tones = ["Brand Default", "Professional", "Casual", "Witty", "Inspirational", "Bold"];
const contentTypes = ["Educational", "Promotional", "Engagement", "Behind the Scenes", "Trending", "Announcement"];

interface GeneratedPost {
  platform: string;
  icon: React.ElementType;
  content: string;
  maxChars: number;
}

const CreatePost = () => {
  const { user } = useAuth();
  const { activeBrand, isLoading: brandLoading } = useBrandStore();
  const { posts: postsUsage, images: imagesUsage, incrementPosts, incrementImages } = useUsageCheck();
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Instagram", "LinkedIn"]);
  const [topic, setTopic] = useState("");
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState("Brand Default");
  const [contentType, setContentType] = useState("Educational");
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [schedulingPlatform, setSchedulingPlatform] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("10:00");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const [showImageGen, setShowImageGen] = useState(false);
  const [manualContent, setManualContent] = useState("");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();

  const brandId = activeBrand?.id || null;

  // Auto-save drafts
  const autoSaveDraft = useCallback((platform: string, content: string) => {
    if (!user || !brandId || !content.trim()) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      await supabase.from("content_drafts").upsert({
        user_id: user.id,
        brand_id: brandId,
        platform,
        content,
        topic,
        tone,
        content_type: contentType,
      }, { onConflict: "id" });
    }, 30000);
  }, [user, brandId, topic, tone, contentType]);

  // Show no brands state if no active brand (after all hooks)
  if (!brandLoading && !activeBrand) {
    return <NoBrandsState />;
  }

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) { toast.error("Enter an image prompt"); return; }
    if (imagesUsage.isAtLimit) { toast.error("Monthly image limit reached. Upgrade your plan."); return; }
    setGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: imagePrompt.trim() },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      if (data?.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        await incrementImages();
        toast.success("Image generated!");
      } else {
        toast.error("No image was returned");
      }
    } catch (e: any) {
      toast.error(e.message || "Image generation failed");
    } finally {
      setGeneratingImage(false);
    }
  };

  const togglePlatform = (name: string) => {
    setSelectedPlatforms(prev => prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) { toast.error("Enter a topic first"); return; }
    if (postsUsage.isAtLimit) { toast.error("Monthly post limit reached. Upgrade your plan."); return; }
    setLoading(true);
    try {
      let brandVoice = "";
      if (brandId) {
        const { data: bv } = await supabase.from("brand_voice_profiles").select("voice_profile").eq("brand_id", brandId).limit(1).maybeSingle();
        brandVoice = bv?.voice_profile || "";
      }

      const results: GeneratedPost[] = [];
      for (const pName of selectedPlatforms) {
        const pInfo = platforms.find(p => p.name === pName)!;
        const result = await generatePost({ brandVoice, platform: pName, topic, tone, contentType });
        results.push({ platform: pName, icon: pInfo.icon, content: result.content, maxChars: pInfo.maxChars });
      }
      setGeneratedPosts(results);
      setGenerated(true);
      toast.success("Content generated!");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    }
    setLoading(false);
  };

  const handleRegenerate = async (index: number) => {
    const post = generatedPosts[index];
    try {
      const result = await generatePost({ brandVoice: "", platform: post.platform, topic, tone, contentType });
      setGeneratedPosts(prev => prev.map((p, i) => i === index ? { ...p, content: result.content } : p));
      toast.success("Regenerated!");
    } catch { toast.error("Failed to regenerate"); }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard!");
  };

  const handleAddHashtags = async (index: number) => {
    const post = generatedPosts[index];
    try {
      const tags = await generateHashtags(post.content, post.platform);
      const newContent = post.content + "\n\n" + tags.join(" ");
      setGeneratedPosts(prev => prev.map((p, i) => i === index ? { ...p, content: newContent } : p));
      toast.success("Hashtags added!");
    } catch { toast.error("Failed to generate hashtags"); }
  };

  const handlePostNow = async (post: GeneratedPost) => {
    if (!user || !brandId) { toast.error("No brand found"); return; }
    if (postsUsage.isAtLimit) { toast.error("Monthly post limit reached."); return; }
    setPublishingId(post.platform);
    try {
      const { data: newPost, error } = await supabase.from("posts").insert({
        user_id: user.id,
        brand_id: brandId,
        platform: post.platform,
        content: post.content,
        image_url: generatedImageUrl || null,
        status: "draft",
      }).select("id").single();
      if (error) throw error;

      const result = await publishPost(newPost.id, user.id);
      if (result.success) {
        await incrementPosts();
        toast.success(`${post.platform} post published${result.simulated ? " (simulated)" : ""}!`);
      } else {
        toast.error(result.error || "Publish failed");
      }
    } catch (e: any) {
      toast.error(e.message);
    }
    setPublishingId(null);
  };

  const handleSchedule = async (post: GeneratedPost) => {
    if (!user || !brandId || !scheduleDate) { toast.error("Select a date"); return; }
    if (postsUsage.isAtLimit) { toast.error("Monthly post limit reached."); return; }
    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      const { data: newPost, error } = await supabase.from("posts").insert({
        user_id: user.id,
        brand_id: brandId,
        platform: post.platform,
        content: post.content,
        image_url: generatedImageUrl || null,
        status: "draft",
      }).select("id").single();
      if (error) throw error;

      await schedulePost(newPost.id, user.id, scheduledAt);
      await incrementPosts();
      toast.success(`Scheduled for ${new Date(scheduledAt).toLocaleString()}`);
      setSchedulingPlatform(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleManualPostNow = async () => {
    if (!user || !brandId || !manualContent.trim()) return;
    if (postsUsage.isAtLimit) { toast.error("Monthly post limit reached."); return; }
    for (const pName of selectedPlatforms) {
      try {
        const { data: newPost, error } = await supabase.from("posts").insert({
          user_id: user.id, brand_id: brandId, platform: pName, content: manualContent, image_url: generatedImageUrl || null, status: "draft",
        }).select("id").single();
        if (error) throw error;
        await publishPost(newPost.id, user.id);
      } catch (e: any) { toast.error(e.message); }
    }
    await incrementPosts();
    toast.success("Posts published!");
    setManualContent("");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Usage banners */}
      <UsageBanner used={postsUsage.used} limit={postsUsage.limit} resourceName="posts" isUnlimited={postsUsage.isUnlimited} />
      <UsageBanner used={imagesUsage.used} limit={imagesUsage.limit} resourceName="AI images" isUnlimited={imagesUsage.isUnlimited} />

      {/* Mode toggle + usage chip */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-pill bg-card border border-border p-1 w-fit">
          {(["ai", "manual"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-pill px-4 py-2 font-heading text-xs font-semibold transition-all ${mode === m ? "gradient-bg text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {m === "ai" ? "AI Generate" : "Manual Write"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Posts</span>
          <UsageChip used={postsUsage.used} limit={postsUsage.limit} isUnlimited={postsUsage.isUnlimited} />
        </div>
      </div>

      {mode === "ai" ? (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <div className="rounded-md border border-border bg-card p-5 shadow-sm space-y-4">
              <textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder="What do you want to post about? Give a topic, promotion, or idea and let AI do the rest..." className="w-full rounded-md border border-border bg-background p-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[100px] resize-none" />
              <div>
                <p className="mb-2 font-heading text-xs font-semibold text-foreground">Platforms</p>
                <div className="flex flex-wrap gap-2">
                  {platforms.map(p => (
                    <button key={p.name} onClick={() => togglePlatform(p.name)} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${selectedPlatforms.includes(p.name) ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}>
                      <p.icon className="h-3.5 w-3.5" /> {p.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 font-heading text-xs font-semibold text-foreground">Content Type</p>
                <select value={contentType} onChange={e => setContentType(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {contentTypes.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <p className="mb-2 font-heading text-xs font-semibold text-foreground">Tone</p>
                <div className="flex flex-wrap gap-2">
                  {tones.map(t => (
                    <button key={t} onClick={() => setTone(t)} className={`rounded-pill px-3 py-1 text-xs font-semibold transition-all ${tone === t ? "gradient-bg text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}>{t}</button>
                  ))}
                </div>
              </div>
              {/* Image Generation - gated */}
              <PlanGate feature="ai_image_generation">
                <div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setShowImageGen(!showImageGen)}
                      className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      {showImageGen ? "Hide Image Generator" : "Generate Image with AI"}
                    </button>
                    <UsageChip used={imagesUsage.used} limit={imagesUsage.limit} isUnlimited={imagesUsage.isUnlimited} />
                  </div>
                  {showImageGen && (
                    <div className="mt-3 space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                      <input
                        type="text"
                        value={imagePrompt}
                        onChange={e => setImagePrompt(e.target.value)}
                        placeholder="Describe the image you want..."
                        className="w-full rounded-md border border-border bg-background px-3 py-2 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <button
                        onClick={handleGenerateImage}
                        disabled={generatingImage || !imagePrompt.trim() || imagesUsage.isAtLimit}
                        className="w-full flex items-center justify-center gap-2 rounded-md border-2 border-primary py-2 font-heading text-xs font-bold text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                      >
                        {generatingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                        {generatingImage ? "Generating..." : imagesUsage.isAtLimit ? "Image limit reached" : "Generate Image"}
                      </button>
                      {generatedImageUrl && (
                        <div className="rounded-lg overflow-hidden border border-border">
                          <img src={generatedImageUrl} alt="Generated" className="w-full max-h-[200px] object-contain bg-muted/20" />
                          <div className="flex gap-2 p-2">
                            <a href={generatedImageUrl} download className="flex-1 text-center rounded-md bg-primary/10 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors">
                              Download
                            </a>
                            <button
                              onClick={() => { setGeneratedImageUrl(null); setImagePrompt(""); }}
                              className="flex-1 text-center rounded-md bg-muted py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </PlanGate>
              <button onClick={handleGenerate} disabled={loading || postsUsage.isAtLimit} className="w-full flex items-center justify-center gap-2 rounded-md gradient-bg py-3 font-heading text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Generating..." : postsUsage.isAtLimit ? "Post limit reached" : "Generate Posts"}
              </button>
            </div>
          </motion.div>

          {/* Right preview */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <h3 className="font-heading text-base font-bold text-foreground">Your Generated Posts</h3>
            {loading ? (
              <div className="space-y-4">
                {selectedPlatforms.map((_, i) => (
                  <div key={i} className="animate-pulse rounded-md border border-border bg-card p-5">
                    <div className="h-4 w-24 rounded bg-muted mb-3" />
                    <div className="space-y-2"><div className="h-3 w-full rounded bg-muted" /><div className="h-3 w-3/4 rounded bg-muted" /></div>
                  </div>
                ))}
              </div>
            ) : generated ? (
              <>
                {generatedPosts.map((g, i) => (
                  <div key={i} className="rounded-md border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                       <g.icon className="h-4 w-4 text-primary" />
                       <span className="font-heading text-xs font-bold text-foreground">{g.platform}</span>
                     </div>
                     {generatedImageUrl && (
                       <div className="mb-3 rounded-lg overflow-hidden border border-border">
                         <img src={generatedImageUrl} alt="Attached" className="w-full max-h-[150px] object-contain bg-muted/20" />
                         <p className="px-2 py-1 text-[10px] text-muted-foreground flex items-center gap-1"><ImageIcon className="h-3 w-3" /> AI image will be attached to this post</p>
                       </div>
                     )}
                    <textarea value={g.content} onChange={e => {
                      const newContent = e.target.value;
                      setGeneratedPosts(prev => prev.map((p, idx) => idx === i ? { ...p, content: newContent } : p));
                      autoSaveDraft(g.platform, newContent);
                    }} className="w-full rounded-md border border-border bg-background p-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[120px] resize-none" />
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-[10px] ${g.content.length > g.maxChars ? "text-destructive font-bold" : "text-muted-foreground"}`}>{g.content.length}/{g.maxChars}</span>
                      <div className="flex gap-1.5">
                        <button onClick={() => handleRegenerate(i)} className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"><RefreshCw className="h-3 w-3" /> Regen</button>
                        <button onClick={() => handleCopy(g.content)} className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"><Copy className="h-3 w-3" /> Copy</button>
                        <button onClick={() => handleAddHashtags(i)} className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"><Hash className="h-3 w-3" /> Tags</button>
                        <button onClick={() => setSchedulingPlatform(g.platform)} className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/5"><Calendar className="h-3 w-3" /> Schedule</button>
                        <button onClick={() => handlePostNow(g)} disabled={publishingId === g.platform} className="flex items-center gap-1 rounded-md gradient-bg px-2.5 py-1 text-[11px] font-bold text-primary-foreground disabled:opacity-60">
                          {publishingId === g.platform ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Post Now
                        </button>
                      </div>
                    </div>
                    {/* Schedule picker */}
                    {schedulingPlatform === g.platform && (
                      <div className="mt-3 flex items-center gap-2 rounded-md bg-lavender/50 p-3">
                        <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                        <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                        <button onClick={() => handleSchedule(g)} className="rounded-md gradient-bg px-3 py-1 text-xs font-bold text-primary-foreground"><Check className="inline h-3 w-3 mr-1" />Confirm</button>
                        <button onClick={() => setSchedulingPlatform(null)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex flex-wrap gap-2">
                  {["Make it shorter", "Make it punchier", "Add emoji"].map(s => (
                    <button key={s} onClick={async () => {
                      for (let i = 0; i < generatedPosts.length; i++) {
                        const result = await generatePost({ brandVoice: "", platform: generatedPosts[i].platform, topic: `${s}: ${generatedPosts[i].content.slice(0, 100)}`, tone });
                        setGeneratedPosts(prev => prev.map((p, idx) => idx === i ? { ...p, content: result.content } : p));
                      }
                      toast.success(`Applied: ${s}`);
                    }} className="rounded-pill bg-lavender px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10">
                      {s}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-border bg-card p-12 text-center">
                <Sparkles className="h-10 w-10 text-muted-foreground/30" />
                <p className="mt-3 font-heading text-sm font-semibold text-muted-foreground">Your AI-generated posts will appear here</p>
                <p className="mt-1 text-xs text-muted-foreground">Click Generate Posts to get started.</p>
              </div>
            )}
          </motion.div>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl rounded-md border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap gap-2">
            {platforms.map(p => (
              <button key={p.name} onClick={() => togglePlatform(p.name)} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${selectedPlatforms.includes(p.name) ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}>
                <p.icon className="h-3.5 w-3.5" /> {p.name}
              </button>
            ))}
          </div>
          <textarea value={manualContent} onChange={e => setManualContent(e.target.value)} placeholder="Write your post content here..." className="w-full rounded-md border border-border bg-background p-4 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[200px] resize-none" />
          <div className="flex flex-wrap gap-2">
            {["Make it punchier", "Add hashtags", "Fix grammar", "Change tone"].map(a => (
              <button key={a} onClick={async () => {
                if (!manualContent.trim()) return;
                const result = await generatePost({ brandVoice: "", platform: selectedPlatforms[0] || "Instagram", topic: `${a}: ${manualContent.slice(0, 200)}`, tone });
                setManualContent(result.content);
                toast.success(`Applied: ${a}`);
              }} className="flex items-center gap-1 rounded-pill bg-lavender px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10">
                <Sparkles className="h-3 w-3" /> {a}
              </button>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button className="flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted">
              <Calendar className="h-3.5 w-3.5" /> Schedule
            </button>
            <button onClick={handleManualPostNow} disabled={postsUsage.isAtLimit} className="flex items-center gap-1.5 rounded-md gradient-bg px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60">
              <Send className="h-3.5 w-3.5" /> {postsUsage.isAtLimit ? "Limit reached" : "Post Now"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePost;
