import React, { useState, useEffect } from 'react';
import {
  Download,
  ExternalLink,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { AuditJob, DiscoveredUrlItem } from '../types/index.ts';
import { UrlDetailModal } from './UrlDetailModal.tsx';

interface AuditReportViewProps {
  auditId: number;
  onBackToDashboard: () => void;
}

export const AuditReportView: React.FC<AuditReportViewProps> = ({
  auditId,
  onBackToDashboard,
}) => {
  const [audit, setAudit] = useState<AuditJob | null>(null);
  const [urls, setUrls] = useState<DiscoveredUrlItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected URL for separate deep report modal
  const [selectedUrlId, setSelectedUrlId] = useState<number | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'completed' | 'analyzing' | 'failed'>('ALL');

  const fetchAuditData = async () => {
    try {
      const [resAudit, resUrls] = await Promise.all([
        fetch(`/api/audit/${auditId}`),
        fetch(`/api/audit/${auditId}/urls`),
      ]);

      if (!resAudit.ok || !resUrls.ok) {
        throw new Error('Failed to load audit data');
      }

      const auditData = await resAudit.json();
      const urlsData = await resUrls.json();

      setAudit(auditData);
      setUrls(urlsData);
    } catch (err: any) {
      setError(err.message || 'Error fetching audit report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();

    // Auto-refresh if audit is still processing
    const interval = setInterval(() => {
      if (audit?.status === 'analyzing' || audit?.status === 'crawling') {
        fetchAuditData();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [auditId, audit?.status]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  const filteredUrls = urls.filter((item) => {
    const matchesSearch =
      item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportCsv = () => {
    window.location.href = `/api/audit/${auditId}/export`;
  };

  if (loading && !audit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Loading comprehensive audit report from PostgreSQL...</p>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-300 text-sm">
          {error || 'Audit not found.'}
        </div>
        <button
          onClick={onBackToDashboard}
          className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <button onClick={onBackToDashboard} className="hover:text-white transition">
              Audits
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-200">Audit #{audit.id}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <span>{audit.targetUrl}</span>
            <a
              href={audit.targetUrl}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-indigo-400"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit Date: {new Date(audit.createdAt).toLocaleDateString()} at{' '}
            {new Date(audit.createdAt).toLocaleTimeString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-800 transition"
          >
            <Download className="h-4 w-4 text-cyan-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3.5 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Audit Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl border ${getScoreColor(
              audit.overallScore
            )}`}
          >
            <span className="text-xl font-black">{audit.overallScore}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">Overall Visibility Index</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                  audit.status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                }`}
              >
                {audit.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Aggregated across {audit.analyzedUrls} analyzed pages on {new URL(audit.targetUrl).hostname}
            </p>
          </div>
        </div>

        {/* Real URL Progress counters */}
        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-slate-500 block">Total Discovered:</span>
            <span className="text-sm font-bold text-white">{audit.totalUrls} URLs</span>
          </div>
          <div>
            <span className="text-slate-500 block">Analyzed:</span>
            <span className="text-sm font-bold text-emerald-400">{audit.analyzedUrls} URLs</span>
          </div>
          <div>
            <span className="text-slate-500 block">Failed / Blocked:</span>
            <span className="text-sm font-bold text-rose-400">{audit.failedUrls} URLs</span>
          </div>
        </div>
      </div>

      {/* 5 Pillars Score Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">SEO Score</span>
          <div className={`text-2xl font-black ${getScoreColor(audit.seoScore).split(' ')[0]}`}>
            {audit.seoScore}/100
          </div>
          <p className="text-[10px] text-slate-400">Metadata, Headings, Crawlability</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">AEO Score</span>
          <div className={`text-2xl font-black ${getScoreColor(audit.aeoScore).split(' ')[0]}`}>
            {audit.aeoScore}/100
          </div>
          <p className="text-[10px] text-slate-400">Perplexity, ChatGPT Search FAQ</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">AIO Score</span>
          <div className={`text-2xl font-black ${getScoreColor(audit.aioScore).split(' ')[0]}`}>
            {audit.aioScore}/100
          </div>
          <p className="text-[10px] text-slate-400">Google AI Overviews Citability</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">GEO Score</span>
          <div className={`text-2xl font-black ${getScoreColor(audit.geoScore).split(' ')[0]}`}>
            {audit.geoScore}/100
          </div>
          <p className="text-[10px] text-slate-400">Entity Schemas & Authority Links</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">E-E-A-T Score</span>
          <div className={`text-2xl font-black ${getScoreColor(audit.eeatScore).split(' ')[0]}`}>
            {audit.eeatScore}/100
          </div>
          <p className="text-[10px] text-slate-400">Experience, Expertise, Trust Badges</p>
        </div>
      </div>

      {/* AI Recommendations Section */}
      {audit.recommendations && audit.recommendations.length > 0 && (
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Executive Recommendations (Gemini Powered)</h3>
              <p className="text-xs text-indigo-200/70">
                Actionable roadmap synthesized from real crawled evidence across all URLs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {audit.recommendations.map((rec) => (
              <div
                key={rec.id}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400">
                    {rec.category}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                      rec.priority === 'high'
                        ? 'bg-rose-500/20 text-rose-300'
                        : rec.priority === 'medium'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {rec.priority} Priority
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">{rec.title}</h4>
                <p className="text-xs text-slate-300">{rec.actionableSteps}</p>
                {rec.impact && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    <span>Impact: {rec.impact}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* URL-by-URL Analysis Explorer Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Layers className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Discovered URL Explorer</h3>
              <p className="text-xs text-slate-400">
                Click any individual URL to open its separate comprehensive report.
              </p>
            </div>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter URLs or titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 text-xs">
              <Filter className="h-3.5 w-3.5 text-slate-400 ml-2" />
              {(['ALL', 'completed', 'analyzing', 'failed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Discovered URL & Path</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-center">SEO</th>
                <th className="py-3 px-3 text-center">AEO</th>
                <th className="py-3 px-3 text-center">AIO</th>
                <th className="py-3 px-3 text-center">GEO</th>
                <th className="py-3 px-3 text-center">E-E-A-T</th>
                <th className="py-3 px-3 text-center">Overall</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
              {filteredUrls.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedUrlId(item.id)}
                  className="cursor-pointer hover:bg-indigo-600/10 transition group"
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-100 group-hover:text-indigo-300 transition truncate max-w-xs sm:max-w-md">
                      {item.title || item.path}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs sm:max-w-md">
                      {item.url}
                    </div>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    {item.status === 'completed' ? (
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        Completed
                      </span>
                    ) : item.status === 'analyzing' ? (
                      <span className="flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-400">
                        <Loader2 className="h-2.5 w-2.5 animate-spin" /> Analyzing
                      </span>
                    ) : item.status === 'failed' ? (
                      <span className="rounded-full bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-semibold text-rose-400">
                        Failed
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                        Queued
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center font-bold">
                    {item.seoScore !== undefined ? (
                      <span className={getScoreColor(item.seoScore).split(' ')[0]}>{item.seoScore}</span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center font-bold">
                    {item.aeoScore !== undefined ? (
                      <span className={getScoreColor(item.aeoScore).split(' ')[0]}>{item.aeoScore}</span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center font-bold">
                    {item.aioScore !== undefined ? (
                      <span className={getScoreColor(item.aioScore).split(' ')[0]}>{item.aioScore}</span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center font-bold">
                    {item.geoScore !== undefined ? (
                      <span className={getScoreColor(item.geoScore).split(' ')[0]}>{item.geoScore}</span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center font-bold">
                    {item.eeatScore !== undefined ? (
                      <span className={getScoreColor(item.eeatScore).split(' ')[0]}>{item.eeatScore}</span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {item.overallScore !== undefined ? (
                      <span
                        className={`rounded-lg px-2 py-0.5 font-bold ${getScoreColor(
                          item.overallScore
                        )}`}
                      >
                        {item.overallScore}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button className="flex items-center gap-1 ml-auto text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                      <span>View</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredUrls.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-slate-500">
                    No matching URLs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* URL Detail Modal */}
      {selectedUrlId && (
        <UrlDetailModal
          auditId={audit.id}
          urlId={selectedUrlId}
          onClose={() => setSelectedUrlId(null)}
        />
      )}
    </div>
  );
};
