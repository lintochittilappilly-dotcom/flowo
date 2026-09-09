import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key, Plus, Copy, Check, Loader2, X, AlertTriangle, Trash2,
  Code, Shield, Clock, Activity, ExternalLink, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PlanGate } from "@/components/plan-gate/plan-gate";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/* ───── types ───── */

interface ApiKeyPerms {
  brands?: { read?: boolean; write?: boolean };
  posts?: { read?: boolean; write?: boolean; publish?: boolean };
  analytics?: { read?: boolean };
  comments?: { read?: boolean; write?: boolean };
  // Legacy flat format
  read?: boolean;
  write?: boolean;
  publish?: boolean;
}

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: ApiKeyPerms;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  total_requests: number;
  created_at: string;
}

interface RequestLog {
  id: string;
  method: string;
  endpoint: string;
  status_code: number;
  response_time_ms: number | null;
  created_at: string;
  ip_address: string | null;
}

/* ───── constants ───── */

const API_ENDPOINTS = [
  { method: "GET", path: "/v1/brands", desc: "List all your brands", perm: "brands:read" },
  { method: "GET", path: "/v1/brands/:id", desc: "Get a specific brand", perm: "brands:read" },
  { method: "PATCH", path: "/v1/brands/:id", desc: "Update a brand", perm: "brands:write" },
  { method: "POST", path: "/v1/posts", desc: "Create a new post", perm: "posts:write" },
  { method: "GET", path: "/v1/posts", desc: "List all posts", perm: "posts:read" },
  { method: "GET", path: "/v1/posts/:id", desc: "Get a single post", perm: "posts:read" },
  { method: "PATCH", path: "/v1/posts/:id", desc: "Update a post", perm: "posts:write" },
  { method: "DELETE", path: "/v1/posts/:id", desc: "Delete a post", perm: "posts:write" },
  { method: "POST", path: "/v1/posts/:id/publish", desc: "Publish immediately", perm: "posts:publish" },
  { method: "POST", path: "/v1/posts/:id/schedule", desc: "Schedule a post", perm: "posts:write" },
  { method: "GET", path: "/v1/analytics", desc: "Get analytics data", perm: "analytics:read" },
  { method: "GET", path: "/v1/comments", desc: "List comments", perm: "comments:read" },
  { method: "POST", path: "/v1/comments/:id/reply", desc: "Reply to comment", perm: "comments:write" },
  { method: "GET", path: "/v1/usage", desc: "Current month usage", perm: "—" },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  POST: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PATCH: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/* ───── component ───── */

const ApiAccessTab = () => {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateStep, setGenerateStep] = useState<1 | 2>(1);
  const [showKeyReveal, setShowKeyReveal] = useState(false);
  const [revealedKey, setRevealedKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Generate form state
  const [keyName, setKeyName] = useState("");
  const [keyExpiry, setKeyExpiry] = useState<"never" | "30" | "90" | "365">("never");
  const [perms, setPerms] = useState<ApiKeyPerms>({
    brands: { read: true, write: false },
    posts: { read: true, write: true, publish: false },
    analytics: { read: true },
    comments: { read: true, write: false },
  });

  // Usage
  const [apiUsage, setApiUsage] = useState(0);
  const [usageChart, setUsageChart] = useState<{ day: string; calls: number }[]>([]);

  // Logs drawer
  const [logsOpen, setLogsOpen] = useState(false);
  const [logsKey, setLogsKey] = useState<ApiKey | null>(null);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const apiBaseUrl = `https://mguavdrifefyzswdiqww.supabase.co/functions/v1/api-v1/v1`;

  useEffect(() => {
    if (!user) return;
    loadKeys();
    loadUsage();
  }, [user]);

  const loadKeys = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke("api-keys", {
        method: "GET",
      });
      if (!error && data?.data) setKeys(data.data);
    } catch {
      // Fallback to direct query
      const { data } = await supabase
        .from("api_keys")
        .select("id, name, key_prefix, permissions, last_used_at, expires_at, is_active, total_requests, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setKeys((data as any[]) ?? []);
    }
    setLoading(false);
  }, [user]);

  const loadUsage = async () => {
    if (!user) return;
    const { data } = await supabase.rpc("get_current_usage", { p_user_id: user.id });
    if (data) setApiUsage((data as any).api_calls_made ?? 0);

    // Load real log data for chart
    const { data: logData } = await supabase
      .from("api_request_logs")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString())
      .order("created_at", { ascending: true });

    const dayMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dayMap[key] = 0;
    }
    (logData ?? []).forEach((r: any) => {
      const key = new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dayMap[key] !== undefined) dayMap[key]++;
    });
    setUsageChart(Object.entries(dayMap).map(([day, calls]) => ({ day, calls })));
  };

  const handleGenerate = async () => {
    if (!keyName.trim()) { toast.error("Enter a key name"); return; }
    if (!user) return;
    setGenerating(true);

    try {
      const expiresAt = keyExpiry === "never" ? "never" : parseInt(keyExpiry);

      const { data, error } = await supabase.functions.invoke("api-keys", {
        method: "POST",
        body: {
          name: keyName,
          permissions: perms,
          expires_at: expiresAt,
        },
      });

      if (error) throw new Error("Failed to generate key");

      setRevealedKey(data.key);
      setGenerateStep(2);
      loadKeys();
    } catch (e: any) {
      toast.error(e.message || "Failed to generate key");
    }
    setGenerating(false);
  };

  const handleRevoke = async (keyId: string) => {
    try {
      await supabase.functions.invoke(`api-keys/${keyId}`, { method: "DELETE" });
    } catch {
      await supabase.from("api_keys").update({ is_active: false } as any).eq("id", keyId);
    }
    toast.success("API key revoked");
    loadKeys();
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(revealedKey);
    setCopied(true);
    toast.success("API key copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const openLogs = async (key: ApiKey) => {
    setLogsKey(key);
    setLogsOpen(true);
    setLogsLoading(true);
    const { data } = await supabase
      .from("api_request_logs")
      .select("id, method, endpoint, status_code, response_time_ms, created_at, ip_address")
      .eq("api_key_id", key.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setLogs((data as RequestLog[]) ?? []);
    setLogsLoading(false);
  };

  const closeGenerateModal = () => {
    setShowGenerate(false);
    setGenerateStep(1);
    setKeyName("");
    setKeyExpiry("never");
    setRevealedKey("");
    setCopied(false);
    setPerms({
      brands: { read: true, write: false },
      posts: { read: true, write: true, publish: false },
      analytics: { read: true },
      comments: { read: true, write: false },
    });
  };

  const togglePerm = (group: string, field: string) => {
    setPerms((prev) => ({
      ...prev,
      [group]: {
        ...(prev as any)[group],
        [field]: !(prev as any)[group]?.[field],
      },
    }));
  };

  return (
    <PlanGate feature="api_access">
      <div className="space-y-6">
        {/* Header Card */}
        <div className="rounded-xl bg-[hsl(var(--sidebar-background))] p-6 text-foreground border border-border">
          <div className="flex items-center gap-3 mb-3">
            <Code className="h-6 w-6 text-primary" />
            <h3 className="font-heading text-lg font-bold">Flowo Public API</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Programmatically manage your brands, posts, and analytics.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <code className="rounded-lg bg-muted px-3 py-1.5 text-xs font-mono text-foreground">
              {apiBaseUrl}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(apiBaseUrl);
                toast.success("API base URL copied!");
              }}
              className="rounded-md bg-muted p-1.5 hover:bg-accent transition-colors"
            >
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <a
              href="/api-docs"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline ml-auto"
            >
              API Documentation <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* API Keys Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-heading text-sm font-bold text-foreground">
              Your API Keys
            </h4>
            <button
              onClick={() => setShowGenerate(true)}
              className="flex items-center gap-1.5 rounded-lg gradient-bg px-4 py-2 text-xs font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              <Plus className="h-3.5 w-3.5" /> Generate New Key
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : keys.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <Key className="mx-auto h-8 w-8 text-muted-foreground/30" />
              <p className="mt-3 text-sm font-semibold text-muted-foreground">
                No API keys yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Generate your first API key to start using the Flowo API.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Name</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Key</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Permissions</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Last Used</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k) => (
                    <tr
                      key={k.id}
                      className={`border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer transition-colors ${!k.is_active ? "opacity-50" : ""}`}
                      onClick={() => k.is_active && openLogs(k)}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-foreground">{k.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {(k.total_requests ?? 0).toLocaleString()} requests
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <code className="rounded-md bg-muted px-2 py-1 text-[11px] font-mono text-foreground">
                          {k.key_prefix}
                        </code>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {(k.permissions?.brands?.read || k.permissions?.read) && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Read</span>
                          )}
                          {(k.permissions?.posts?.write || k.permissions?.write) && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Write</span>
                          )}
                          {(k.permissions?.posts?.publish || k.permissions?.publish) && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Publish</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                        {relativeTime(k.last_used_at)}
                      </td>
                      <td className="px-4 py-3">
                        {k.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            Revoked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {k.is_active && (
                            <>
                              <button
                                onClick={() => openLogs(k)}
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                title="View logs"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleRevoke(k.id)}
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                title="Revoke key"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* API Usage Stats */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h4 className="font-heading text-sm font-bold text-foreground">
                API Usage This Month
              </h4>
            </div>
            <span className="text-sm font-heading font-bold text-foreground">
              {apiUsage.toLocaleString()} calls
            </span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageChart}>
                <defs>
                  <linearGradient id="apiG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Area type="monotone" dataKey="calls" stroke="hsl(var(--primary))" fill="url(#apiG)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rate Limit Info */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-primary" />
            <h4 className="font-heading text-sm font-bold text-foreground">Rate Limits & Policies</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Requests / Hour", value: "1,000", icon: Clock },
              { label: "Max Active Keys", value: "10", icon: Key },
              { label: "Key Expiry", value: "Configurable", icon: Shield },
              { label: "Log Retention", value: "90 days", icon: Activity },
            ].map((item, i) => (
              <div key={i} className="rounded-lg border border-border p-3 text-center">
                <item.icon className="mx-auto h-4 w-4 text-muted-foreground mb-1.5" />
                <p className="text-sm font-bold text-foreground">{item.value}</p>
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* API Quick Reference */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-heading text-sm font-bold text-foreground">API Quick Reference</h4>
            <a href="/api-docs" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
              Full Docs <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="mb-4">
            <p className="text-[10px] font-semibold text-muted-foreground mb-1">BASE URL</p>
            <code className="block rounded-lg bg-muted px-3 py-2 text-xs font-mono text-foreground">{apiBaseUrl}</code>
          </div>

          <div className="space-y-1.5 mb-6">
            {API_ENDPOINTS.map((ep, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold font-mono ${METHOD_COLORS[ep.method]}`}>
                  {ep.method}
                </span>
                <code className="flex-1 text-xs font-mono text-foreground truncate">{ep.path}</code>
                <span className="text-[10px] text-muted-foreground hidden sm:block shrink-0">{ep.desc}</span>
                <span className="text-[9px] text-muted-foreground/60 hidden lg:block shrink-0">{ep.perm}</span>
              </div>
            ))}
          </div>

          {/* Code Example */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground mb-2">EXAMPLE REQUESTS</p>
            <pre className="rounded-lg bg-muted p-4 text-[11px] font-mono text-foreground overflow-x-auto leading-relaxed">
{`# List your brands
curl -X GET ${apiBaseUrl}/brands \\
  -H "Authorization: Bearer flw_live_YOUR_KEY_HERE" \\
  -H "Content-Type: application/json"

# Create a scheduled post
curl -X POST ${apiBaseUrl}/posts \\
  -H "Authorization: Bearer flw_live_YOUR_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "brand_id": "your-brand-uuid",
    "platform": "instagram",
    "content": "Your post content #hashtag",
    "scheduled_at": "2026-04-01T10:00:00Z"
  }'`}
            </pre>
          </div>
        </div>

        {/* ───── Generate Key Modal ───── */}
        <AnimatePresence>
          {showGenerate && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
              onClick={closeGenerateModal}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-[24px] border border-border bg-card shadow-2xl overflow-hidden"
              >
                {generateStep === 1 ? (
                  <div className="p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading text-base font-bold text-foreground">Generate New API Key</h3>
                      <button onClick={closeGenerateModal} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Key Name */}
                    <div>
                      <label className="font-heading text-xs font-semibold text-foreground">Key Name</label>
                      <input
                        value={keyName}
                        onChange={(e) => setKeyName(e.target.value)}
                        placeholder="e.g. Production API"
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>

                    {/* Expiry */}
                    <div>
                      <label className="font-heading text-xs font-semibold text-foreground">Expiry</label>
                      <div className="mt-1.5 flex gap-2 flex-wrap">
                        {([["never", "Never"], ["30", "30 days"], ["90", "90 days"], ["365", "1 year"]] as const).map(
                          ([val, label]) => (
                            <button
                              key={val}
                              onClick={() => setKeyExpiry(val)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                keyExpiry === val
                                  ? "gradient-bg text-primary-foreground"
                                  : "border border-border text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {label}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Permissions */}
                    <div>
                      <label className="font-heading text-xs font-semibold text-foreground">Permissions</label>
                      <div className="mt-3 space-y-4">
                        {/* Brands */}
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Brands</p>
                          <div className="space-y-1.5">
                            <PermToggle label="Read — Fetch brand list and details" checked={perms.brands?.read ?? true} onChange={() => togglePerm("brands", "read")} />
                            <PermToggle label="Write — Create and update brands" checked={perms.brands?.write ?? false} onChange={() => togglePerm("brands", "write")} />
                          </div>
                        </div>
                        {/* Posts */}
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Posts</p>
                          <div className="space-y-1.5">
                            <PermToggle label="Read — Fetch posts and drafts" checked={perms.posts?.read ?? true} onChange={() => togglePerm("posts", "read")} />
                            <PermToggle label="Write — Create, edit, delete posts" checked={perms.posts?.write ?? true} onChange={() => togglePerm("posts", "write")} />
                            <PermToggle label="Publish — Publish posts to platforms" checked={perms.posts?.publish ?? false} onChange={() => togglePerm("posts", "publish")} warning />
                          </div>
                          {perms.posts?.publish && (
                            <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 dark:bg-amber-950/30 dark:border-amber-800">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                                This allows the API key to publish content to your connected social accounts.
                              </p>
                            </div>
                          )}
                        </div>
                        {/* Analytics */}
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Analytics</p>
                          <PermToggle label="Read — Fetch analytics data" checked={perms.analytics?.read ?? true} onChange={() => togglePerm("analytics", "read")} />
                        </div>
                        {/* Comments */}
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Comments</p>
                          <div className="space-y-1.5">
                            <PermToggle label="Read — Fetch comments" checked={perms.comments?.read ?? true} onChange={() => togglePerm("comments", "read")} />
                            <PermToggle label="Write — Send replies and flag comments" checked={perms.comments?.write ?? false} onChange={() => togglePerm("comments", "write")} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleGenerate}
                      disabled={generating || !keyName.trim()}
                      className="w-full rounded-lg gradient-bg py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
                    >
                      {generating ? (
                        <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                      ) : (
                        "Generate API Key"
                      )}
                    </button>
                  </div>
                ) : (
                  /* Step 2 — Reveal Key */
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 dark:bg-amber-950/30 dark:border-amber-800">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                          This is the only time you will see this key.
                        </p>
                        <p className="text-[11px] text-amber-600 dark:text-amber-400">
                          Copy it now and store it safely. We cannot show it again.
                        </p>
                      </div>
                    </div>

                    <div className="relative rounded-lg bg-muted p-4">
                      <code className="block break-all text-sm font-mono text-foreground pr-12 leading-relaxed">
                        {revealedKey}
                      </code>
                      <button
                        onClick={handleCopyKey}
                        className="absolute top-3 right-3 rounded-md bg-background border border-border p-2 hover:bg-accent transition-colors"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-muted-foreground text-center">
                      Store this key securely. Treat it like a password.
                    </p>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          handleCopyKey();
                          closeGenerateModal();
                        }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg gradient-bg py-2.5 text-sm font-bold text-primary-foreground"
                      >
                        <Copy className="h-4 w-4" /> Copy & Close
                      </button>
                      <button
                        onClick={closeGenerateModal}
                        className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
                      >
                        I've copied my key
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ───── Logs Drawer ───── */}
        <Sheet open={logsOpen} onOpenChange={setLogsOpen}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="font-heading">
                Request Logs — {logsKey?.name}
              </SheetTitle>
              <p className="text-xs text-muted-foreground">
                <code className="font-mono">{logsKey?.key_prefix}</code> ·{" "}
                {(logsKey?.total_requests ?? 0).toLocaleString()} total requests
              </p>
            </SheetHeader>

            <div className="mt-4">
              {logsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="mx-auto h-6 w-6 text-muted-foreground/30" />
                  <p className="mt-2 text-sm text-muted-foreground">No requests logged yet</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                      <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold font-mono ${METHOD_COLORS[log.method] ?? "bg-muted text-muted-foreground"}`}>
                        {log.method}
                      </span>
                      <code className="flex-1 text-[11px] font-mono text-foreground truncate">
                        {log.endpoint}
                      </code>
                      <span
                        className={`shrink-0 text-[10px] font-bold ${
                          log.status_code < 300
                            ? "text-emerald-600"
                            : log.status_code < 500
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {log.status_code}
                      </span>
                      {log.response_time_ms != null && (
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {log.response_time_ms}ms
                        </span>
                      )}
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {relativeTime(log.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </PlanGate>
  );
};

/* ───── small sub-component ───── */

function PermToggle({
  label,
  checked,
  onChange,
  warning,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  warning?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="rounded accent-primary h-3.5 w-3.5"
      />
      <span className={`text-xs ${warning ? "text-amber-700 dark:text-amber-300" : "text-foreground"}`}>
        {label}
      </span>
    </label>
  );
}

export default ApiAccessTab;
