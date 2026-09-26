import React, { useState, useEffect } from 'react';
import {
  Globe,
  FileCheck2,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  PlusCircle,
  Loader2,
} from 'lucide-react';
import { AuditJob } from '../types/index.ts';
import { ProfessionalResourcesSection } from './ProfessionalResourcesSection.tsx';

interface DashboardStats {
  totalWebsites: number;
  totalAudits: number;
  totalUrls: number;
  completedAudits: number;
  recentAudits: AuditJob[];
  averages: {
    overall: number;
    seo: number;
    aeo: number;
    aio: number;
    geo: number;
    eeat: number;
  };
}

interface DashboardViewProps {
  onStartAuditClick: (url?: string) => void;
  onSelectAudit: (auditId: number) => void;
  onNavigateToWebsites?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onStartAuditClick,
  onSelectAudit,
  onNavigateToWebsites,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) {
        throw new Error('Failed to load dashboard metrics');
      }
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Aggregating PostgreSQL metrics...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
                Next-Gen Search Visibility Engine
              </span>
              <span className="text-xs text-slate-400">• Vercel Edge Compatible</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Evaluate SEO, AEO, AIO, GEO & E-E-A-T
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Crawl any public domain, automatically discover internal pages, and extract granular evidence for classical Google search, ChatGPT Search, Perplexity, and AI Overviews.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onStartAuditClick()}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-xl shadow-indigo-600/30 transition hover:from-indigo-600 hover:to-purple-700 active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Launch New Audit</span>
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Real Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Domains</span>
            <Globe className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{stats?.totalWebsites || 0}</p>
          <span className="text-[11px] text-slate-400 font-medium">Monitored in Cloud SQL</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Audits Run</span>
            <FileCheck2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{stats?.totalAudits || 0}</p>
          <span className="text-[11px] text-emerald-400 font-medium">
            {stats?.completedAudits || 0} completed successfully
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Discovered Pages</span>
            <Layers className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{stats?.totalUrls || 0}</p>
          <span className="text-[11px] text-slate-400 font-medium">Internal URLs cataloged</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Global Avg Score</span>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-indigo-400">
            {stats?.averages.overall || 0}
            <span className="text-sm font-normal text-slate-400">/100</span>
          </p>
          <span className="text-[11px] text-slate-400 font-medium">Across all audited pages</span>
        </div>
      </div>

      {/* 5 Pillar Benchmark Averages */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">5-Pillar Global Benchmarks</h3>
            <p className="text-xs text-slate-400">
              Live calculated averages across all completed audits in the PostgreSQL database.
            </p>
          </div>
          <Sparkles className="h-4 w-4 text-indigo-400" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Avg SEO</span>
            <div className={`text-xl font-bold ${getScoreColor(stats?.averages.seo || 0).split(' ')[0]}`}>
              {stats?.averages.seo || 0}%
            </div>
            <p className="text-[10px] text-slate-400">Search Engine Optim.</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Avg AEO</span>
            <div className={`text-xl font-bold ${getScoreColor(stats?.averages.aeo || 0).split(' ')[0]}`}>
              {stats?.averages.aeo || 0}%
            </div>
            <p className="text-[10px] text-slate-400">Answer Engines (Perplexity)</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Avg AIO</span>
            <div className={`text-xl font-bold ${getScoreColor(stats?.averages.aio || 0).split(' ')[0]}`}>
              {stats?.averages.aio || 0}%
            </div>
            <p className="text-[10px] text-slate-400">Google AI Overviews</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Avg GEO</span>
            <div className={`text-xl font-bold ${getScoreColor(stats?.averages.geo || 0).split(' ')[0]}`}>
              {stats?.averages.geo || 0}%
            </div>
            <p className="text-[10px] text-slate-400">Generative Engines (LLMs)</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Avg E-E-A-T</span>
            <div className={`text-xl font-bold ${getScoreColor(stats?.averages.eeat || 0).split(' ')[0]}`}>
              {stats?.averages.eeat || 0}%
            </div>
            <p className="text-[10px] text-slate-400">Trust & Authority</p>
          </div>
        </div>
      </div>

      {/* Recent Audits Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Recent Audit Jobs</h3>
          </div>
          <span className="text-xs text-slate-400">Click any row to open website audit report</span>
        </div>

        {stats?.recentAudits && stats.recentAudits.length > 0 ? (
          <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 overflow-hidden">
            {stats.recentAudits.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectAudit(item.id)}
                className="flex flex-wrap items-center justify-between p-4 bg-slate-950/60 hover:bg-indigo-600/10 cursor-pointer transition gap-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border font-bold text-sm ${getScoreColor(
                      item.overallScore
                    )}`}
                  >
                    {item.overallScore}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{item.targetUrl}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()} • {item.analyzedUrls} / {item.totalUrls} URLs analyzed
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-2 text-xs">
                    <span className="text-slate-400">SEO: {item.seoScore}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-400">AEO: {item.aeoScore}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-400">GEO: {item.geoScore}</span>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                      item.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                    }`}
                  >
                    {item.status}
                  </span>

                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-800 p-10 text-center space-y-3">
            <Globe className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">No websites audited yet.</p>
            <button
              onClick={() => onStartAuditClick()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition"
            >
              <span>Audit Your First Domain</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Professional Resources Section: Store and manage professional website links & business addresses */}
      <ProfessionalResourcesSection
        onStartAuditForDomain={(url) => onStartAuditClick(url)}
        onNavigateToFullDirectory={onNavigateToWebsites}
      />
    </div>
  );
};
