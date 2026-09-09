import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, X, Instagram, Linkedin, Twitter, Facebook, Plus, Clock, Trash2, GripVertical, Send, Edit2, RefreshCw, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDroppable, useDraggable,
  type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandStore } from "@/store/brand-store";
import BrandIndicator from "@/components/brand-indicator";
import NoBrandsState from "@/components/no-brands-state";
import { publishPost, cancelScheduledPost } from "@/services/publish.service";
import { generatePost } from "@/services/openai.service";
import { SkeletonChart } from "@/components/ui/loading-skeletons";

const platformIcons: Record<string, React.ElementType> = { Instagram, LinkedIn: Linkedin, Twitter, Facebook };
const platformColors: Record<string, string> = {
  Instagram: "bg-pink-100 text-pink-700",
  LinkedIn: "bg-blue-100 text-blue-700",
  Twitter: "bg-sky-100 text-sky-700",
  Facebook: "bg-indigo-100 text-indigo-700",
};
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_OF_WEEK = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const FILTERS = ["All Platforms","Instagram","LinkedIn","Twitter","Facebook"];

interface CalPost {
  id: string;
  day: number;
  month: number;
  year: number;
  platform: string;
  text: string;
  time: string;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
}

// Draggable post chip
const DraggablePost = ({ post, onClick }: { post: CalPost; onClick: () => void }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: post.id });
  const Icon = platformIcons[post.platform];
  return (
    <div ref={setNodeRef} className={`w-full flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[9px] font-medium cursor-grab active:cursor-grabbing transition-all ${platformColors[post.platform] || "bg-muted text-foreground"} ${isDragging ? "opacity-30 scale-95" : "hover:scale-105"}`}>
      <span {...listeners} {...attributes} className="shrink-0 cursor-grab touch-none">
        <GripVertical className="h-2.5 w-2.5 opacity-40" />
      </span>
      <button onClick={onClick} className="flex items-center gap-1 min-w-0 flex-1 text-left">
        {Icon && <Icon className="h-2.5 w-2.5 shrink-0" />}
        <span className="truncate">{post.text}</span>
      </button>
    </div>
  );
};

// Droppable day cell
const DroppableDay = ({ day, isToday, children }: { day: number; isToday: boolean; children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${day}` });
  return (
    <div ref={setNodeRef} className={`min-h-[80px] border-b border-r border-border p-1 sm:min-h-[100px] transition-colors ${isOver ? "bg-primary/10 ring-2 ring-inset ring-primary/30" : isToday ? "bg-primary/5" : "hover:bg-muted/30"}`}>
      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium ${isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{day}</span>
      <div className="mt-0.5 space-y-0.5">{children}</div>
    </div>
  );
};

const PostOverlay = ({ post }: { post: CalPost }) => {
  const Icon = platformIcons[post.platform];
  return (
    <div className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold shadow-lg ring-2 ring-primary/40 ${platformColors[post.platform] || "bg-muted"}`}>
      {Icon && <Icon className="h-3 w-3 shrink-0" />}
      <span className="truncate max-w-[160px]">{post.text}</span>
    </div>
  );
};

const ContentCalendar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeBrand, isLoading: brandLoading } = useBrandStore();
  const brandId = activeBrand?.id;
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [activeFilter, setActiveFilter] = useState("All Platforms");
  const [selectedPost, setSelectedPost] = useState<CalPost | null>(null);
  const [posts, setPosts] = useState<CalPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editing, setEditing] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Fetch posts from Supabase
  const fetchPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const startDate = new Date(currentYear, currentMonth, 1).toISOString();
    const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();

    let query = supabase
      .from("posts")
      .select("id, platform, content, status, scheduled_at, published_at, created_at")
      .eq("user_id", user.id);
    if (brandId) query = query.eq("brand_id", brandId);
    query = query
      .or(`scheduled_at.gte.${startDate},published_at.gte.${startDate},created_at.gte.${startDate}`)
      .or(`scheduled_at.lte.${endDate},published_at.lte.${endDate},created_at.lte.${endDate}`);
    const { data, error } = await query;

    if (!error && data) {
      const mapped: CalPost[] = data.map((p: any) => {
        const dateStr = p.scheduled_at || p.published_at || p.created_at;
        const d = new Date(dateStr);
        return {
          id: p.id,
          day: d.getDate(),
          month: d.getMonth(),
          year: d.getFullYear(),
          platform: p.platform,
          text: p.content,
          time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
          status: p.status || "draft",
          scheduled_at: p.scheduled_at,
          published_at: p.published_at,
        };
      }).filter((p: CalPost) => p.month === currentMonth && p.year === currentYear);
      setPosts(mapped);
    }
    setLoading(false);
  }, [user, currentMonth, currentYear, brandId]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const goToPrevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else setCurrentMonth(m => m - 1); };
  const goToNextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else setCurrentMonth(m => m + 1); };
  const goToToday = () => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = ((new Date(currentYear, currentMonth, 1).getDay() + 6) % 7);

  const filteredPosts = useMemo(() => {
    if (activeFilter === "All Platforms") return posts;
    return posts.filter(p => p.platform === activeFilter);
  }, [posts, activeFilter]);

  const handleGenerateContent = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      // Get user's default brand
      const { data: brands } = await supabase.from("brands").select("id, name, brand_description, tone").eq("user_id", user.id).limit(1);
      const brand = brands?.[0];
      if (!brand) { toast.error("Create a brand first"); setGenerating(false); return; }

      const platforms = ["Instagram", "LinkedIn", "Twitter"];
      const postsToCreate: any[] = [];

      for (let i = 0; i < 6; i++) {
        const platform = platforms[i % platforms.length];
        const day = Math.floor(Math.random() * daysInMonth) + 1;
        const result = await generatePost({ brandVoice: brand.brand_description || "", platform, topic: "Weekly content", tone: brand.tone?.[0] || "Professional" });
        const scheduledAt = new Date(currentYear, currentMonth, day, 10 + (i % 6), 0);
        postsToCreate.push({
          user_id: user.id,
          brand_id: brand.id,
          platform,
          content: result.content,
          status: "scheduled",
          scheduled_at: scheduledAt.toISOString(),
        });
      }

      const { error } = await supabase.from("posts").insert(postsToCreate);
      if (error) throw error;
      toast.success(`Generated ${postsToCreate.length} posts for ${MONTH_NAMES[currentMonth]}!`);
      fetchPosts();
    } catch (e: any) {
      toast.error(e.message || "Failed to generate content");
    }
    setGenerating(false);
  };

  const handleDeletePost = async (postId: string) => {
    await cancelScheduledPost(postId);
    await supabase.from("posts").delete().eq("id", postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
    setSelectedPost(null);
    toast.success("Post deleted");
  };

  const handlePostNow = async (postId: string) => {
    if (!user) return;
    setPublishing(true);
    const result = await publishPost(postId, user.id);
    setPublishing(false);
    if (result.success) {
      toast.success(`Post published${result.simulated ? " (simulated)" : ""}!`);
      setSelectedPost(null);
      fetchPosts();
    } else {
      toast.error(result.error || "Failed to publish");
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedPost) return;
    await supabase.from("posts").update({ content: editContent }).eq("id", selectedPost.id);
    setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, text: editContent } : p));
    setSelectedPost(prev => prev ? { ...prev, text: editContent } : null);
    setEditing(false);
    toast.success("Post updated");
  };

  const isTodayCell = (day: number) => day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  const draggedPost = useMemo(() => activeId ? posts.find(p => p.id === activeId) : null, [activeId, posts]);

  const handleDragStart = useCallback((e: DragStartEvent) => setActiveId(e.active.id as string), []);
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const overId = over.id as string;
    if (!overId.startsWith("day-")) return;
    const newDay = parseInt(overId.replace("day-", ""), 10);
    const postId = active.id as string;
    const post = posts.find(p => p.id === postId);
    if (!post || post.day === newDay) return;

    // Optimistic update
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, day: newDay } : p));

    // Update in Supabase
    if (post.scheduled_at) {
      const d = new Date(post.scheduled_at);
      d.setDate(newDay);
      await supabase.from("posts").update({ scheduled_at: d.toISOString() }).eq("id", postId);
      await supabase.from("scheduled_jobs").update({ scheduled_at: d.toISOString() }).eq("post_id", postId);
    }
    toast.success(`Post moved to ${MONTH_NAMES[currentMonth]} ${newDay}`);
  }, [posts, currentMonth]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex justify-between"><div className="h-6 w-32 rounded bg-muted animate-pulse" /><div className="h-9 w-48 rounded bg-muted animate-pulse" /></div>
        <SkeletonChart />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold text-foreground">Content Calendar</h2>
        <div className="flex items-center gap-2">
          <button onClick={goToToday} className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors">Today</button>
          <button onClick={goToPrevMonth} className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors"><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-[140px] text-center font-heading text-sm font-semibold text-foreground">{MONTH_NAMES[currentMonth]} {currentYear}</span>
          <button onClick={goToNextMonth} className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors"><ChevronRight className="h-4 w-4" /></button>
          <button onClick={handleGenerateContent} disabled={generating} className="ml-2 flex items-center gap-1.5 rounded-md gradient-bg px-4 py-2 font-heading text-xs font-bold text-primary-foreground hover:scale-105 transition-transform disabled:opacity-60">
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {generating ? "Generating..." : "Generate Content"}
          </button>
          <button onClick={() => navigate("/create")} className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors">
            <Plus className="h-3.5 w-3.5" /> New Post
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)} className={`rounded-pill px-3.5 py-1.5 font-heading text-xs font-semibold transition-all ${activeFilter === f ? "gradient-bg text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>{f}</button>
        ))}
        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" /> {filteredPosts.length} posts this month
        </span>
      </div>

      {/* Calendar grid */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden">
          <div className="grid grid-cols-7">
            {DAYS_OF_WEEK.map(d => (
              <div key={d} className="border-b border-border px-2 py-2 text-center font-heading text-[11px] font-semibold text-muted-foreground">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-border bg-muted/20 p-1 sm:min-h-[100px]" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayPosts = filteredPosts.filter(p => p.day === day);
              return (
                <DroppableDay key={day} day={day} isToday={isTodayCell(day)}>
                  {dayPosts.slice(0, 3).map(p => (
                    <DraggablePost key={p.id} post={p} onClick={() => { setSelectedPost(p); setEditContent(p.text); setEditing(false); }} />
                  ))}
                  {dayPosts.length > 3 && <span className="block px-1.5 text-[9px] font-medium text-muted-foreground">+{dayPosts.length - 3} more</span>}
                </DroppableDay>
              );
            })}
            {Array.from({ length: (7 - ((firstDayOfWeek + daysInMonth) % 7)) % 7 }).map((_, i) => (
              <div key={`trail-${i}`} className="min-h-[80px] border-b border-r border-border bg-muted/20 p-1 sm:min-h-[100px]" />
            ))}
          </div>
        </div>
        <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
          {draggedPost ? <PostOverlay post={draggedPost} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Post detail slide-over */}
      <AnimatePresence>
        {selectedPost && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPost(null)} className="fixed inset-0 z-40 bg-foreground/30" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-border bg-card p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-lg font-bold text-foreground">Post Details</h3>
                <button onClick={() => setSelectedPost(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold ${platformColors[selectedPost.platform] || "bg-muted"}`}>
                    {platformIcons[selectedPost.platform] && (() => { const Icon = platformIcons[selectedPost.platform]; return <Icon className="h-3 w-3" />; })()}
                    {selectedPost.platform}
                  </span>
                  <span className={`rounded-pill px-2 py-0.5 text-[10px] font-semibold ${selectedPost.status === "scheduled" ? "bg-amber-100 text-amber-700" : selectedPost.status === "published" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                    {selectedPost.status.charAt(0).toUpperCase() + selectedPost.status.slice(1)}
                  </span>
                </div>
                <div className="rounded-md bg-muted p-4">
                  {editing ? (
                    <div className="space-y-2">
                      <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full rounded-md border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[120px] resize-none" />
                      <div className="flex gap-2">
                        <button onClick={handleSaveEdit} className="rounded-md gradient-bg px-3 py-1.5 text-xs font-bold text-primary-foreground">Save</button>
                        <button onClick={() => setEditing(false)} className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p className="font-body text-sm text-foreground">{selectedPost.text}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{MONTH_NAMES[selectedPost.month]} {selectedPost.day}, {selectedPost.year} at {selectedPost.time}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setEditing(true)} className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"><Edit2 className="h-3 w-3" /> Edit</button>
                  <button onClick={() => handleDeletePost(selectedPost.id)} className="flex items-center gap-1 rounded-md border border-destructive px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"><Trash2 className="h-3 w-3" /> Delete</button>
                  <button onClick={() => handlePostNow(selectedPost.id)} disabled={publishing} className="flex items-center gap-1 rounded-md gradient-bg px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-60">
                    {publishing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Post Now
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContentCalendar;
