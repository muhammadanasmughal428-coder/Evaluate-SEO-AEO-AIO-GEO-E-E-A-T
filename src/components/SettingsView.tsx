import React from 'react';
import {
  Server,
  Database,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  ExternalLink,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            VERCEL & CLOUD READY
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
          Production Architecture & Vercel Compatibility
        </h1>
        <p className="text-xs text-slate-400">
          Engineered for production deployment on Vercel with PostgreSQL connection pooling, background batch crawl processing, and SSRF security.
        </p>
      </div>

      {/* Grid of Key Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Server className="h-4 w-4" />
            <span>Async Batch Jobs</span>
          </div>
          <p className="text-xs text-slate-300">
            Prevents Vercel serverless request timeouts (10s/60s limits) by chunking crawls into micro-batches with persistent progress stored in PostgreSQL.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <Database className="h-4 w-4" />
            <span>PostgreSQL Pooling</span>
          </div>
          <p className="text-xs text-slate-300">
            Uses isolated <code>pg.Pool</code> object connection method with connection pooling and SSL options to avoid connection exhaustion in serverless environments.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            <span>SSRF Protection</span>
          </div>
          <p className="text-xs text-slate-300">
            Crawler strictly blocks localhost, 127.0.0.1, AWS/GCP metadata IPs (169.254.169.254), and RFC1918 private subnets prior to socket connection.
          </p>
        </div>
      </div>

      {/* Backend API Endpoints Reference */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Terminal className="h-4 w-4 text-indigo-400" />
          <span>Production Server API Endpoints</span>
        </h3>

        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between rounded-xl bg-slate-950 p-3 border border-slate-800">
            <span className="text-emerald-400 font-bold">POST /api/audit/start</span>
            <span className="text-slate-400 font-sans">Validates target, crawls root, queues internal paths</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-950 p-3 border border-slate-800">
            <span className="text-emerald-400 font-bold">POST /api/audit/:id/process-batch</span>
            <span className="text-slate-400 font-sans">Processes next batch of queued URLs without timeout</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-950 p-3 border border-slate-800">
            <span className="text-indigo-400 font-bold">GET /api/audit/:id</span>
            <span className="text-slate-400 font-sans">Retrieves aggregated visibility scores and AI recommendations</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-950 p-3 border border-slate-800">
            <span className="text-indigo-400 font-bold">GET /api/audit/:id/urls/:urlId</span>
            <span className="text-slate-400 font-sans">Retrieves isolated individual report for a specific URL</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-950 p-3 border border-slate-800">
            <span className="text-indigo-400 font-bold">GET /api/audit/:id/export</span>
            <span className="text-slate-400 font-sans">Streams structured CSV of all URLs and pillar scores</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-950 p-3 border border-slate-800">
            <span className="text-cyan-400 font-bold">POST /api/chat</span>
            <span className="text-slate-400 font-sans">Gemini 3.8 Flash multimodal chat with image reasoning</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-950 p-3 border border-slate-800">
            <span className="text-cyan-400 font-bold">POST /api/student/solve</span>
            <span className="text-slate-400 font-sans">Camera homework/code analysis and mathematical solver</span>
          </div>
        </div>
      </div>

      {/* Formula & Pillars */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Cpu className="h-4 w-4 text-cyan-400" />
          <span>Multi-Pillar Weight Formula</span>
        </h3>
        <p className="text-xs text-slate-300">
          The Overall Visibility Index is mathematically synthesized across 5 independent dimensions:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center text-xs">
          <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
            <span className="text-indigo-400 font-bold block text-sm">30%</span>
            <span className="font-semibold text-white">Classic SEO</span>
            <p className="text-[10px] text-slate-400 mt-1">Titles, descriptions, headings, HTTP status, canonicals</p>
          </div>
          <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
            <span className="text-cyan-400 font-bold block text-sm">20%</span>
            <span className="font-semibold text-white">AEO</span>
            <p className="text-[10px] text-slate-400 mt-1">FAQ structures, FAQPage Schema, concise answer blocks</p>
          </div>
          <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
            <span className="text-violet-400 font-bold block text-sm">15%</span>
            <span className="font-semibold text-white">AIO</span>
            <p className="text-[10px] text-slate-400 mt-1">Semantic &lt;main&gt; &lt;article&gt; tags, definition density</p>
          </div>
          <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
            <span className="text-amber-400 font-bold block text-sm">15%</span>
            <span className="font-semibold text-white">GEO</span>
            <p className="text-[10px] text-slate-400 mt-1">Entity Schemas (Organization/Product) & authority links</p>
          </div>
          <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
            <span className="text-emerald-400 font-bold block text-sm">20%</span>
            <span className="font-semibold text-white">E-E-A-T</span>
            <p className="text-[10px] text-slate-400 mt-1">Author byline, HTTPS, About, Contact, Privacy links</p>
          </div>
        </div>
      </div>
    </div>
  );
};
