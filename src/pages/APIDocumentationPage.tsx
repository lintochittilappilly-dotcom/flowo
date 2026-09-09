import { Code2, Lock, Zap, FileText, Terminal } from "lucide-react";
import { motion } from "framer-motion";
import InfoPageLayout from "@/components/info/InfoPageLayout";

const endpoints = [
  { method: "GET", path: "/v1/posts", desc: "List all scheduled and published posts" },
  { method: "POST", path: "/v1/posts", desc: "Create a new post or schedule content" },
  { method: "GET", path: "/v1/posts/:id", desc: "Retrieve a specific post by ID" },
  { method: "PUT", path: "/v1/posts/:id", desc: "Update an existing post" },
  { method: "DELETE", path: "/v1/posts/:id", desc: "Delete a post or cancel scheduled publish" },
  { method: "POST", path: "/v1/ai/generate", desc: "Generate AI content from a prompt" },
  { method: "GET", path: "/v1/analytics/overview", desc: "Get analytics overview for all platforms" },
  { method: "GET", path: "/v1/analytics/posts/:id", desc: "Get performance metrics for a specific post" },
  { method: "GET", path: "/v1/platforms", desc: "List connected social media platforms" },
  { method: "GET", path: "/v1/calendar", desc: "Get content calendar events" },
];

const methodColors: Record<string, string> = {
  GET: "bg-success/10 text-success",
  POST: "bg-primary/10 text-primary",
  PUT: "bg-yellow-500/10 text-yellow-600",
  DELETE: "bg-destructive/10 text-destructive",
};

const features = [
  { icon: <Lock className="h-5 w-5" />, title: "Authentication", desc: "API key + JWT Bearer tokens. Rate limited by plan tier." },
  { icon: <Zap className="h-5 w-5" />, title: "Rate Limits", desc: "Free: 100/min, Pro: 500/min, Business: 1000/min" },
  { icon: <FileText className="h-5 w-5" />, title: "Response Format", desc: "JSON responses with consistent error handling and pagination" },
  { icon: <Terminal className="h-5 w-5" />, title: "SDKs", desc: "Official JavaScript/TypeScript SDK. Python SDK coming Q3 2026." },
];

const codeExample = `// Install: npm install @flowo/sdk

import { Flowo } from '@flowo/sdk';

const flowo = new Flowo({ apiKey: 'your-api-key' });

// Generate AI content
const content = await flowo.ai.generate({
  prompt: 'Share a tip about social media consistency',
  platform: 'instagram',
  tone: 'casual',
});

// Schedule the post
await flowo.posts.create({
  content: content.caption,
  platforms: ['instagram', 'linkedin'],
  scheduledAt: '2026-03-15T10:00:00Z',
});`;

const APIDocumentationPage = () => (
  <InfoPageLayout badge="Developers" badgeIcon={<Code2 className="h-4 w-4" />} title="API Documentation" description="Build powerful integrations with Flowo's RESTful API.">
    {/* Features */}
    <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {features.map((f, i) => (
        <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} className="rounded-xl border bg-card p-5 shadow-sm">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-lavender text-primary">{f.icon}</span>
          <h3 className="font-heading text-sm font-bold text-foreground">{f.title}</h3>
          <p className="mt-1 font-body text-xs text-muted-foreground">{f.desc}</p>
        </motion.div>
      ))}
    </div>

    {/* Quick Start */}
    <section className="mb-12">
      <h2 className="mb-6 border-l-4 border-primary pl-4 font-heading text-2xl font-bold text-foreground">Quick Start</h2>
      <div className="overflow-hidden rounded-xl border bg-foreground">
        <div className="flex items-center gap-2 border-b border-primary-foreground/10 px-4 py-2">
          <div className="h-3 w-3 rounded-full bg-destructive/60" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
          <div className="h-3 w-3 rounded-full bg-success/60" />
          <span className="ml-2 font-mono text-xs text-primary-foreground/50">example.ts</span>
        </div>
        <pre className="overflow-x-auto p-6 font-mono text-sm leading-relaxed text-primary-foreground/80">
          <code>{codeExample}</code>
        </pre>
      </div>
    </section>

    {/* Endpoints */}
    <section>
      <h2 className="mb-6 border-l-4 border-primary pl-4 font-heading text-2xl font-bold text-foreground">API Endpoints</h2>
      <p className="mb-4 font-body text-sm text-muted-foreground">Base URL: <code className="rounded bg-lavender px-2 py-0.5 font-mono text-xs text-primary">https://api.flowo.com</code></p>
      <div className="space-y-2">
        {endpoints.map((ep) => (
          <div key={ep.method + ep.path} className="flex items-center gap-4 rounded-lg border bg-card px-5 py-3 shadow-sm">
            <span className={`w-16 shrink-0 rounded-md px-2 py-1 text-center font-mono text-xs font-bold ${methodColors[ep.method]}`}>{ep.method}</span>
            <code className="shrink-0 font-mono text-sm text-foreground">{ep.path}</code>
            <span className="hidden font-body text-sm text-muted-foreground sm:block">{ep.desc}</span>
          </div>
        ))}
      </div>
    </section>
  </InfoPageLayout>
);

export default APIDocumentationPage;
