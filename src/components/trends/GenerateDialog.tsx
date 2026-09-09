import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, Copy, Check, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface GenerateDialogProps {
  open: boolean;
  onClose: () => void;
  trendTopic: string;
}

const platforms = ["Instagram", "Twitter/X", "LinkedIn", "Facebook", "TikTok"];
const tones = ["Professional", "Casual", "Humorous", "Inspirational", "Educational"];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-trend-content`;

const GenerateDialog = ({ open, onClose, trendTopic }: GenerateDialogProps) => {
  const [requirements, setRequirements] = useState("");
  const [platform, setPlatform] = useState("");
  const [tone, setTone] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setRequirements("");
      setPlatform("");
      setTone("");
      setGeneratedContent("");
      setIsGenerating(false);
    }
  }, [open]);

  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.scrollTop = resultRef.current.scrollHeight;
    }
  }, [generatedContent]);

  const handleGenerate = async () => {
    if (!requirements.trim()) {
      toast.error("Please describe what you want");
      return;
    }
    setIsGenerating(true);
    setGeneratedContent("");

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ trendTopic, requirements, platform, tone }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Generation failed" }));
        toast.error(err.error || "Generation failed");
        setIsGenerating(false);
        return;
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let content = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              content += delta;
              setGeneratedContent(content);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    toast.success("Content copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-border bg-gradient-to-r from-primary/5 to-transparent p-5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-5 w-5 text-primary shrink-0" />
                <h3 className="font-heading text-base font-bold text-foreground truncate">
                  Generate Content
                </h3>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Trend: <span className="font-semibold text-foreground">{trendTopic}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Platform & Tone chips */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Platform</label>
                <div className="flex flex-wrap gap-1.5">
                  {platforms.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlatform(platform === p ? "" : p)}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                        platform === p
                          ? "gradient-bg text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Tone</label>
                <div className="flex flex-wrap gap-1.5">
                  {tones.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(tone === t ? "" : t)}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                        tone === t
                          ? "gradient-bg text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Requirements input */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                Your Requirements
              </label>
              <div className="relative">
                <textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Describe what kind of content you want... e.g., 'Create an engaging carousel post highlighting top 5 tips with emojis'"
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
                  }}
                />
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !requirements.trim()}
                  className="absolute right-2 bottom-2 rounded-lg gradient-bg p-2 text-primary-foreground transition-transform hover:scale-105 disabled:opacity-40"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Press Ctrl+Enter to generate
              </p>
            </div>

            {/* Generated content */}
            {(generatedContent || isGenerating) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-border bg-muted/30 overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Generated Content
                    {isGenerating && (
                      <Loader2 className="h-3 w-3 animate-spin text-primary ml-1" />
                    )}
                  </span>
                  {generatedContent && !isGenerating && (
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                    >
                      {copied ? (
                        <><Check className="h-3 w-3" /> Copied</>
                      ) : (
                        <><Copy className="h-3 w-3" /> Copy</>
                      )}
                    </button>
                  )}
                </div>
                <div
                  ref={resultRef}
                  className="p-4 max-h-64 overflow-y-auto prose prose-sm dark:prose-invert max-w-none text-sm text-foreground"
                >
                  {generatedContent ? (
                    <ReactMarkdown>{generatedContent}</ReactMarkdown>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs">Generating content...</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GenerateDialog;
