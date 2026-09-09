import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Instagram, Linkedin, Twitter, MessageSquare, Flag, RefreshCw, Loader2,
  Check, CheckCheck, Search, X, EyeOff, MoreVertical, Send, Smile, Frown, Minus,
  AlertTriangle, LinkIcon, ChevronDown, Pencil, Copy, ExternalLink, Info
} from "lucide-react";
import { SkeletonList } from "@/components/ui/loading-skeletons";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  syncAllComments, replyToComment, generateCommentReply, analyzeSentiment,
  bulkAction, type SyncResult
} from "@/services/comments.service";
import { useBrandStore } from "@/store/brand-store";
import BrandIndicator from "@/components/brand-indicator";
import NoBrandsState from "@/components/no-brands-state";

type CommentStatus = "unread" | "replied" | "flagged";
type Sentiment = "positive" | "neutral" | "negative" | "spam" | null;

interface Comment {
  id: string;
  platform: string;
  platformIcon: React.ElementType;
  user: string;
  username: string;
  displayName: string;
  time: string;
  post: string;
  comment: string;
  aiReply: string;
  accent: string;
  status: CommentStatus;
  sentiment: Sentiment;
  dbId?: string;
}

const platformIconMap: Record<string, React.ElementType> = { Instagram, LinkedIn: Linkedin, Twitter };
const statusFilters = ["All", "Unread", "Replied", "Flagged"] as const;
const platformFilters = ["All Platforms", "Instagram", "LinkedIn", "Twitter"] as const;

const INSTAGRAM_ENABLED = import.meta.env.VITE_INSTAGRAM_ENABLED === "true";
const LINKEDIN_ENABLED = import.meta.env.VITE_LINKEDIN_ENABLED === "true";
const TWITTER_ENABLED = import.meta.env.VITE_TWITTER_ENABLED === "true";


function sentimentConfig(s: Sentiment) {
  if (s === "positive") return { icon: Smile, label: "Positive", cls: "bg-success/10 text-success" };
  if (s === "negative") return { icon: Frown, label: "Negative", cls: "bg-destructive/10 text-destructive" };
  if (s === "spam") return { icon: AlertTriangle, label: "Spam", cls: "bg-destructive/10 text-destructive" };
  if (s === "neutral") return { icon: Minus, label: "Neutral", cls: "bg-muted text-muted-foreground" };
  return { icon: Loader2, label: "Analyzing", cls: "bg-muted text-muted-foreground animate-pulse" };
}

function borderForSentiment(s: Sentiment): string {
  if (s === "positive") return "border-l-success";
  if (s === "negative") return "border-l-destructive";
  if (s === "neutral") return "border-l-amber-400";
  return "border-l-border";
}

const PAGE_SIZE = 20;

const CommentsPage = () => {
  const { user } = useAuth();
  const { activeBrand, isLoading: brandLoading } = useBrandStore();
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [activePlatform, setActivePlatform] = useState<string>("All Platforms");
  const [searchQuery, setSearchQuery] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[] | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState(() => localStorage.getItem("flowo_comments_banner_dismissed") === "true");
  const replyRef = useRef<HTMLTextAreaElement>(null);

  const brandId = activeBrand?.id;

  // Check connected platforms status
  const enabledPlatforms = [
    INSTAGRAM_ENABLED && "Instagram",
    LINKEDIN_ENABLED && "LinkedIn",
    TWITTER_ENABLED && "Twitter",
  ].filter(Boolean) as string[];

  const fetchComments = useCallback(async (pageNum = 1) => {
    if (!user || !brandId) return;
    if (pageNum === 1) setLoading(true);

    // Filter comments by posts that belong to the active brand
    const query = supabase
      .from("comments_cache")
      .select("*, posts!inner(content, platform, brand_id)", { count: "exact" })
      .eq("user_id", user.id)
      .eq("posts.brand_id", brandId)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .range((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE - 1);

    const { data, error, count } = await query;

    if (!error && data && data.length > 0) {
      const mapped: Comment[] = data.map((c: any) => ({
        id: c.id,
        dbId: c.id,
        platform: c.platform,
        platformIcon: platformIconMap[c.platform] || MessageSquare,
        user: (c.commenter_display_name || "U").slice(0, 2).toUpperCase(),
        displayName: c.commenter_display_name || "Unknown User",
        username: c.commenter_username || "Unknown",
        time: new Date(c.platform_created_at || c.created_at).toLocaleString(),
        post: c.posts?.content?.slice(0, 60) || "Post",
        comment: c.comment_text,
        aiReply: c.ai_suggested_reply || "",
        accent: borderForSentiment(c.sentiment as Sentiment),
        status: c.is_flagged ? "flagged" : c.is_replied ? "replied" : "unread",
        sentiment: (c.sentiment as Sentiment) || null,
      }));
      if (pageNum === 1) {
        setComments(mapped);
      } else {
        setComments((prev) => [...prev, ...mapped]);
      }
      setTotalCount(count || 0);
    } else if (pageNum === 1) {
      setComments([]);
      setTotalCount(0);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchComments(); }, [fetchComments, brandId]);

  // Auto-analyze sentiment for visible comments without it
  useEffect(() => {
    comments.forEach(async (c) => {
      if (c.sentiment === null && c.dbId) {
        const sentiment = await analyzeSentiment(c.comment);
        setComments((prev) => prev.map((p) => p.id === c.id ? { ...p, sentiment, accent: borderForSentiment(sentiment) } : p));
        await supabase.from("comments_cache").update({ sentiment }).eq("id", c.dbId);
      }
    });
  }, [comments.length]);

  // Generate AI replies for comments that don't have one
  useEffect(() => {
    comments.forEach(async (c) => {
      if (!c.aiReply && c.dbId) {
        const reply = await generateCommentReply(c.comment, c.post);
        setComments((prev) => prev.map((p) => p.id === c.id ? { ...p, aiReply: reply } : p));
        await supabase.from("comments_cache").update({ ai_suggested_reply: reply }).eq("id", c.dbId);
      }
    });
  }, [comments.length]);

  const handleSyncComments = async () => {
    if (!user) return;
    setSyncing(true);
    setSyncResults(null);
    const results = await syncAllComments(user.id);
    setSyncResults(results);
    const total = results.reduce((s, r) => s + r.newComments, 0);
    if (total > 0) {
      toast.success(`${total} new comment${total !== 1 ? "s" : ""} found`);
      fetchComments();
    } else {
      toast.success("Comments synced — no new comments");
    }
    setSyncing(false);
    setTimeout(() => setSyncResults(null), 5000);
  };

  const handleSendReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    const comment = comments.find((c) => c.id === commentId);
    try {
      if (comment?.dbId) {
        const result = await replyToComment(comment.platform, comment.dbId, "", replyText);
        const msg = result.savedLocally
          ? `Reply saved. Will be sent when ${comment.platform} is connected.`
          : `Reply sent to ${comment.platform}`;
        toast.success(msg);
      }
      setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, status: "replied" as CommentStatus, accent: "border-l-success" } : c));
      setActiveReplyId(null);
      setReplyText("");
    } catch (e: any) {
      toast.error(e.message || "Failed to send reply");
    }
    setSendingReply(false);
  };

  const handleUseReply = (id: string, text: string) => {
    setActiveReplyId(id);
    setReplyText(text);
    setTimeout(() => replyRef.current?.focus(), 100);
  };

  const handleToggleFlag = async (id: string) => {
    const comment = comments.find((c) => c.id === id);
    const newFlagged = comment?.status !== "flagged";
    if (comment?.dbId) {
      await supabase.from("comments_cache").update({ is_flagged: newFlagged }).eq("id", comment.dbId);
    }
    setComments((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      const newStatus: CommentStatus = newFlagged ? "flagged" : "unread";
      return { ...c, status: newStatus };
    }));
    toast.success(newFlagged ? "Comment flagged" : "Flag removed");
  };

  const handleHide = async (id: string) => {
    const comment = comments.find((c) => c.id === id);
    if (comment?.dbId) {
      await supabase.from("comments_cache").update({ is_hidden: true }).eq("id", comment.dbId);
    }
    setComments((prev) => prev.filter((c) => c.id !== id));
    toast.success("Comment hidden");
    setOpenMenuId(null);
  };

  const handleBulkAction = async (action: "mark_read" | "flag" | "hide" | "delete") => {
    const ids = Array.from(selectedIds);
    const dbIds = comments.filter((c) => ids.includes(c.id) && c.dbId).map((c) => c.dbId!);
    if (dbIds.length > 0) {
      await bulkAction(dbIds, action);
    }
    if (action === "hide" || action === "delete") {
      setComments((prev) => prev.filter((c) => !ids.includes(c.id)));
    } else if (action === "mark_read") {
      setComments((prev) => prev.map((c) => ids.includes(c.id) ? { ...c, status: "replied" as CommentStatus } : c));
    } else if (action === "flag") {
      setComments((prev) => prev.map((c) => ids.includes(c.id) ? { ...c, status: "flagged" as CommentStatus } : c));
    }
    setSelectedIds(new Set());
    toast.success(`${ids.length} comment${ids.length !== 1 ? "s" : ""} updated`);
  };

  const dismissBanner = () => {
    setBannerDismissed(true);
    localStorage.setItem("flowo_comments_banner_dismissed", "true");
  };

  // Counts
  const unreadCount = comments.filter((c) => c.status === "unread").length;
  const repliedCount = comments.filter((c) => c.status === "replied").length;
  const flaggedCount = comments.filter((c) => c.status === "flagged").length;
  const filterLabels: Record<string, string> = {
    All: `All (${comments.length})`, Unread: `Unread (${unreadCount})`,
    Replied: `Replied (${repliedCount})`, Flagged: `Flagged (${flaggedCount})`
  };

  const filtered = useMemo(() => {
    let result = comments;
    if (activeFilter === "Unread") result = result.filter((c) => c.status === "unread");
    else if (activeFilter === "Replied") result = result.filter((c) => c.status === "replied");
    else if (activeFilter === "Flagged") result = result.filter((c) => c.status === "flagged");
    if (activePlatform !== "All Platforms") result = result.filter((c) => c.platform === activePlatform);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => c.comment.toLowerCase().includes(q) || c.username.toLowerCase().includes(q) || c.displayName.toLowerCase().includes(q));
    }
    return result;
  }, [comments, activeFilter, activePlatform, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Show no brands state
  if (!brandLoading && !activeBrand) {
    return <NoBrandsState />;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex gap-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-8 w-20 rounded-full bg-muted animate-pulse" />)}</div>
        <SkeletonList count={4} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-xl font-bold text-foreground">Comments</h2>
            <BrandIndicator />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{unreadCount} unread comment{unreadCount !== 1 ? "s" : ""} across all platforms</p>
        </div>
        <div className="relative">
          <button onClick={handleSyncComments} disabled={syncing} className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50">
            {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Sync Comments
          </button>
          {/* Sync results dropdown */}
          <AnimatePresence>
            {syncResults && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 top-full mt-2 z-10 w-64 rounded-[var(--radius-sm)] border border-border bg-card p-3 shadow-lg"
              >
                {syncResults.map((r) => (
                  <div key={r.platform} className="flex items-center justify-between py-1.5">
                    <span className="text-xs font-medium text-foreground">{r.platform}</span>
                    <span className={`text-[10px] ${r.skipped ? "text-muted-foreground" : "text-success font-semibold"}`}>
                      {r.skipped ? r.reason : `${r.newComments} new`}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* System status banner */}
      {!bannerDismissed && enabledPlatforms.length === 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-amber-200 bg-amber-50 px-4 py-3">
          <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-amber-800">
              Comments will appear here once you connect your social platforms. Your replies are saved and will be sent when platforms are connected.
            </p>
            <button onClick={() => {}} className="mt-1 text-xs font-bold text-primary hover:underline">Connect Platforms</button>
          </div>
          <button onClick={dismissBanner} className="shrink-0 text-amber-400 hover:text-amber-600"><X className="h-3.5 w-3.5" /></button>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {statusFilters.map((f) => (
          <button key={f} onClick={() => setActiveFilter(f)} className={`rounded-full px-3.5 py-1.5 font-heading text-xs font-semibold transition-all ${activeFilter === f ? "gradient-bg text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
            {filterLabels[f]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
        {platformFilters.map((f) => (
          <button key={f} onClick={() => setActivePlatform(f)} className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${activePlatform === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            {f}
          </button>
        ))}
        <div className="ml-auto relative w-full sm:w-auto mt-2 sm:mt-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search comments..."
            className="h-8 w-full sm:w-48 rounded-[var(--radius-sm)] border border-border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center rounded-[16px] border-2 border-dashed border-border bg-card p-12 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 font-heading text-sm font-semibold text-foreground">
                {activeFilter === "All" ? "No comments yet" : activeFilter === "Unread" ? "No unread comments" : activeFilter === "Flagged" ? "No flagged comments" : "No comments match this filter"}
              </p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                {activeFilter === "All" ? "Only comments on posts published through Flowo will appear here. Connect your social platforms, publish posts, and click Sync Comments to fetch real comments." : ""}
              </p>
              {activeFilter === "All" && (
                <button onClick={handleSyncComments} disabled={syncing} className="mt-4 rounded-[var(--radius-sm)] gradient-bg px-6 py-2.5 text-xs font-bold text-primary-foreground">
                  {syncing ? "Syncing..." : "Sync Comments"}
                </button>
              )}
            </motion.div>
          ) : filtered.map((c) => {
            const sentimentCfg = sentimentConfig(c.sentiment);
            const SentimentIcon = sentimentCfg.icon;
            const isExpanded = expandedComments.has(c.id);
            const isLong = c.comment.length > 150;
            const showReplyBox = activeReplyId === c.id;

            return (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`relative rounded-[16px] border border-l-4 ${c.accent} border-border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover`}
              >
                {/* Checkbox on hover */}
                <div className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(c.id)}
                    onChange={() => toggleSelect(c.id)}
                    className="h-4 w-4 rounded border-border text-primary accent-primary cursor-pointer"
                  />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <c.platformIcon className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">{c.platform}</span>
                    <div className="rounded-full bg-lavender px-2 py-0.5 text-[10px] text-muted-foreground max-w-[200px] truncate">
                      On: {c.post}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${c.status === "unread" ? "bg-primary/10 text-primary" : c.status === "replied" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleToggleFlag(c.id)} className={`p-1 rounded transition-colors ${c.status === "flagged" ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`}>
                      <Flag className="h-3.5 w-3.5" fill={c.status === "flagged" ? "currentColor" : "none"} />
                    </button>
                    <button onClick={() => handleHide(c.id)} className="p-1 rounded text-muted-foreground hover:text-foreground">
                      <EyeOff className="h-3.5 w-3.5" />
                    </button>
                    <div className="relative">
                      <button onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)} className="p-1 rounded text-muted-foreground hover:text-foreground">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                      <AnimatePresence>
                        {openMenuId === c.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-7 z-10 w-40 rounded-[var(--radius-sm)] border border-border bg-card py-1 shadow-lg"
                          >
                            <button onClick={() => { navigator.clipboard.writeText(c.comment); toast.success("Copied"); setOpenMenuId(null); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-muted">
                              <Copy className="h-3 w-3" /> Copy Comment
                            </button>
                            <button onClick={() => handleHide(c.id)} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-muted">
                              <EyeOff className="h-3 w-3" /> Hide Comment
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <span className="text-[10px] text-muted-foreground ml-1">{c.time}</span>
                  </div>
                </div>

                {/* Commenter */}
                <div className="mt-3 flex items-start gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-bg text-[10px] font-bold text-primary-foreground">{c.user}</div>
                  <div className="flex-1">
                    <div>
                      <span className="font-heading text-xs font-bold text-foreground">{c.displayName}</span>
                      <span className="ml-1.5 text-[10px] text-muted-foreground">{c.username}</span>
                    </div>
                    <p className="mt-1 font-body text-sm text-foreground/80">
                      {isLong && !isExpanded ? c.comment.slice(0, 150) + "..." : c.comment}
                    </p>
                    {isLong && (
                      <button
                        onClick={() => setExpandedComments((prev) => { const n = new Set(prev); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; })}
                        className="mt-0.5 text-[11px] font-semibold text-primary hover:underline"
                      >
                        {isExpanded ? "Show less" : "Show more"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Sentiment badge */}
                <div className="mt-2.5">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${sentimentCfg.cls}`}>
                    <SentimentIcon className="h-3 w-3" /> {sentimentCfg.label}
                  </span>
                </div>

                {/* AI Suggested Reply */}
                {c.aiReply ? (
                  <div className="mt-3 rounded-[var(--radius-sm)] bg-lavender/50 p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[10px] font-bold text-primary">AI Suggested Reply</span>
                    </div>
                    <p className="font-body text-xs text-foreground/70">{c.aiReply}</p>
                  </div>
                ) : (
                  <div className="mt-3 rounded-[var(--radius-sm)] bg-muted/50 p-3">
                    <p className="text-[10px] text-muted-foreground">
                      AI reply suggestions available when OpenAI is connected
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleUseReply(c.id, c.aiReply)}
                    disabled={c.status === "replied" || !c.aiReply}
                    className="rounded-[var(--radius-sm)] gradient-bg px-3 py-1.5 text-[11px] font-bold text-primary-foreground disabled:opacity-50"
                  >
                    Use This Reply
                  </button>
                  <button
                    onClick={() => handleUseReply(c.id, c.aiReply)}
                    disabled={c.status === "replied"}
                    className="rounded-[var(--radius-sm)] bg-lavender px-3 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/15 disabled:opacity-50"
                  >
                    <Pencil className="inline h-3 w-3 mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => handleUseReply(c.id, "")}
                    disabled={c.status === "replied"}
                    className="rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted disabled:opacity-50"
                  >
                    Write My Own
                  </button>
                  <button
                    onClick={async () => {
                      if (c.dbId) await supabase.from("comments_cache").update({ is_replied: true }).eq("id", c.dbId);
                      setComments((prev) => prev.map((p) => p.id === c.id ? { ...p, status: "replied" as CommentStatus, accent: "border-l-success" } : p));
                      toast.success("Marked as done");
                    }}
                    disabled={c.status === "replied"}
                    className="rounded-[var(--radius-sm)] border border-success/30 bg-success/5 px-3 py-1.5 text-[11px] font-medium text-success hover:bg-success/10 disabled:opacity-50"
                  >
                    <Check className="inline h-3 w-3 mr-1" /> Mark as Done
                  </button>
                </div>

                {/* Reply textarea */}
                <AnimatePresence>
                  {showReplyBox && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-2">
                        <textarea
                          ref={replyRef}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="w-full rounded-[var(--radius-sm)] border border-primary/30 bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none min-h-[80px]"
                          placeholder="Write your reply..."
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">{replyText.length} characters</span>
                          <div className="flex gap-2">
                            <button onClick={() => { setActiveReplyId(null); setReplyText(""); }} className="rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted">
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSendReply(c.id)}
                              disabled={sendingReply || !replyText.trim()}
                              className="flex items-center gap-1 rounded-[var(--radius-sm)] gradient-bg px-4 py-1.5 text-[11px] font-bold text-primary-foreground disabled:opacity-50"
                            >
                              {sendingReply ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                              Send Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && comments.length < totalCount && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] text-muted-foreground">Showing {comments.length} of {totalCount} comments</p>
          <button
            onClick={() => { setPage((p) => p + 1); fetchComments(page + 1); }}
            className="rounded-[var(--radius-sm)] bg-lavender px-6 py-2 text-xs font-semibold text-primary hover:bg-primary/15"
          >
            Load More
          </button>
        </div>
      )}

      {/* Bulk actions bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-[16px] border border-border bg-card px-6 py-3 shadow-lg"
          >
            <span className="text-xs font-semibold text-foreground">{selectedIds.size} selected</span>
            <div className="h-4 w-px bg-border" />
            <button onClick={() => handleBulkAction("mark_read")} className="rounded-[var(--radius-sm)] bg-success/10 px-3 py-1.5 text-[11px] font-semibold text-success hover:bg-success/20">Mark as Read</button>
            <button onClick={() => handleBulkAction("flag")} className="rounded-[var(--radius-sm)] bg-amber-500/10 px-3 py-1.5 text-[11px] font-semibold text-amber-600 hover:bg-amber-500/20">Flag</button>
            <button onClick={() => handleBulkAction("hide")} className="rounded-[var(--radius-sm)] bg-muted px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted/80">Hide</button>
            <button onClick={() => handleBulkAction("delete")} className="rounded-[var(--radius-sm)] bg-destructive/10 px-3 py-1.5 text-[11px] font-semibold text-destructive hover:bg-destructive/20">Delete</button>
            <button onClick={() => setSelectedIds(new Set())} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommentsPage;
