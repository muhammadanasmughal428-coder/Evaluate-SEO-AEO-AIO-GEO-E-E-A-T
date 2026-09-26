import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Code,
  FileText,
  Clock,
  Zap,
  Globe,
  Tag,
  Loader2,
} from 'lucide-react';
import { IndividualUrlReport } from '../types/index.ts';

interface UrlDetailModalProps {
  auditId: number;
  urlId: number | null;
  onClose: () => void;
}

export const UrlDetailModal: React.FC<UrlDetailModalProps> = ({
  auditId,
  urlId,
  onClose,
}) => {
  const [report, setReport] = useState<IndividualUrlReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'findings' | 'meta' | 'headings' | 'schemas' | 'aeo_aio' | 'eeat'>('findings');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    if (!urlId) return;

    const fetchUrlReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/audit/${auditId}/urls/${urlId}`);
        if (!res.ok) {
          throw new Error('Failed to load URL report');
        }
        const data = await res.json();
        setReport(data);
      } catch (err: any) {
        setError(err.message || 'Error loading URL report');
      } finally {
        setLoading(false);
      }
    };

    fetchUrlReport();
  }, [auditId, urlId]);

  if (!urlId) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="flex items-center gap-1 rounded bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-semibold text-rose-400">
            <AlertTriangle className="h-3 w-3" /> Critical
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
            <AlertTriangle className="h-3 w-3" /> Warning
          </span>
        );
      case 'good':
        return (
          <span className="flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Passed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
            <Info className="h-3 w-3" /> Info
          </span>
        );
    }
  };

  const filteredFindings = report?.findings?.filter((f) => {
    if (categoryFilter === 'ALL') return true;
    return f.category === categoryFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-950/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Globe className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Individual URL Report
                </span>
                {report && (
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-mono">
                    HTTP {report.statusCode || 200}
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-lg" title={report?.url}>
                {report?.title || report?.url || 'URL Audit Report'}
              </h2>
              <a
                href={report?.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-300 transition truncate"
              >
                <span>{report?.url}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {report && (
              <div
                className={`flex flex-col items-center justify-center rounded-xl border px-3 py-1.5 ${getScoreColor(
                  report.overallScore
                )}`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider">Overall</span>
                <span className="text-lg font-black">{report.overallScore}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              <p className="text-sm font-medium">Extracting URL analysis data from database...</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
              {error}
            </div>
          )}

          {report && (
            <>
              {/* Pillar Score Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">SEO</span>
                  <div className={`text-xl font-bold mt-1 ${getScoreColor(report.seoScore).split(' ')[0]}`}>
                    {report.seoScore}/100
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">AEO</span>
                  <div className={`text-xl font-bold mt-1 ${getScoreColor(report.aeoScore).split(' ')[0]}`}>
                    {report.aeoScore}/100
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">AIO</span>
                  <div className={`text-xl font-bold mt-1 ${getScoreColor(report.aioScore).split(' ')[0]}`}>
                    {report.aioScore}/100
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">GEO</span>
                  <div className={`text-xl font-bold mt-1 ${getScoreColor(report.geoScore).split(' ')[0]}`}>
                    {report.geoScore}/100
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">E-E-A-T</span>
                  <div className={`text-xl font-bold mt-1 ${getScoreColor(report.eeatScore).split(' ')[0]}`}>
                    {report.eeatScore}/100
                  </div>
                </div>
              </div>

              {/* Quick Performance Strip */}
              <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-2.5 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Response: {report.performanceData?.responseTimeMs || 0} ms</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Word Count: {report.performanceData?.wordCount || 0} words</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span>Schemas: {report.structuredData?.length || 0} detected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Protocol: {report.url.startsWith('https://') ? 'Secure HTTPS' : 'Insecure HTTP'}</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-800 gap-1 overflow-x-auto text-xs">
                <button
                  onClick={() => setActiveTab('findings')}
                  className={`px-4 py-2 font-medium border-b-2 transition whitespace-nowrap ${
                    activeTab === 'findings'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Findings & Evidence ({report.findings?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('meta')}
                  className={`px-4 py-2 font-medium border-b-2 transition whitespace-nowrap ${
                    activeTab === 'meta'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Meta & Social Tags
                </button>
                <button
                  onClick={() => setActiveTab('headings')}
                  className={`px-4 py-2 font-medium border-b-2 transition whitespace-nowrap ${
                    activeTab === 'headings'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Headings Hierarchy
                </button>
                <button
                  onClick={() => setActiveTab('aeo_aio')}
                  className={`px-4 py-2 font-medium border-b-2 transition whitespace-nowrap ${
                    activeTab === 'aeo_aio'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  AEO & AIO Signals
                </button>
                <button
                  onClick={() => setActiveTab('eeat')}
                  className={`px-4 py-2 font-medium border-b-2 transition whitespace-nowrap ${
                    activeTab === 'eeat'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  GEO & E-E-A-T Signals
                </button>
                <button
                  onClick={() => setActiveTab('schemas')}
                  className={`px-4 py-2 font-medium border-b-2 transition whitespace-nowrap ${
                    activeTab === 'schemas'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  JSON-LD Schemas
                </button>
              </div>

              {/* Tab 1: Findings */}
              {activeTab === 'findings' && (
                <div className="space-y-4">
                  {/* Category Filter */}
                  <div className="flex flex-wrap items-center gap-2">
                    {['ALL', 'SEO', 'AEO', 'AIO', 'GEO', 'EEAT'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          categoryFilter === cat
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {filteredFindings?.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400">
                              {item.category}
                            </span>
                            <h4 className="text-xs font-bold text-white">{item.title}</h4>
                          </div>
                          {getSeverityBadge(item.severity)}
                        </div>

                        <p className="text-xs text-slate-300">{item.description}</p>

                        {item.evidence && (
                          <div className="rounded-lg bg-slate-900 border border-slate-800 p-2 text-xs font-mono text-slate-300">
                            <span className="text-[10px] font-semibold uppercase text-slate-500 block mb-0.5">
                              Real Crawl Evidence:
                            </span>
                            {item.evidence}
                          </div>
                        )}

                        {item.recommendation && (
                          <div className="text-xs text-emerald-400 flex items-start gap-1.5 pt-1">
                            <span className="font-semibold text-emerald-300 shrink-0">Fix:</span>
                            <span>{item.recommendation}</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {filteredFindings?.length === 0 && (
                      <p className="text-center py-8 text-xs text-slate-500">No findings in this category.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Meta */}
              {activeTab === 'meta' && (
                <div className="space-y-4 text-xs">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                    <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Primary Metadata</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-500 block">Title Tag:</span>
                        <p className="font-medium text-slate-200 mt-0.5">{report.metaData?.title || 'None detected'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Meta Description:</span>
                        <p className="font-medium text-slate-200 mt-0.5">{report.metaData?.description || 'None detected'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Canonical URL:</span>
                        <p className="font-mono text-indigo-400 mt-0.5">{report.metaData?.canonical || 'None detected'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Robots Meta:</span>
                        <p className="font-mono text-slate-300 mt-0.5">{report.metaData?.robots || 'index, follow (default)'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                    <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Open Graph Social Tags</h4>
                    {Object.keys(report.metaData?.og || {}).length > 0 ? (
                      <div className="space-y-1.5">
                        {Object.entries(report.metaData.og || {}).map(([key, val]) => (
                          <div key={key} className="flex justify-between border-b border-slate-900 pb-1 font-mono">
                            <span className="text-indigo-400">{key}</span>
                            <span className="text-slate-300 truncate max-w-md">{val}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500">No OpenGraph tags detected.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Headings */}
              {activeTab === 'headings' && (
                <div className="space-y-4 text-xs">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-indigo-400" />
                      <h4 className="font-bold text-slate-200">H1 Headings ({report.headings?.h1?.length || 0})</h4>
                    </div>
                    {report.headings?.h1?.length ? (
                      <ul className="space-y-1 pl-4 list-disc text-slate-200 font-medium">
                        {report.headings.h1.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-rose-400">No H1 heading detected!</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-cyan-400" />
                      <h4 className="font-bold text-slate-200">H2 Headings ({report.headings?.h2?.length || 0})</h4>
                    </div>
                    {report.headings?.h2?.length ? (
                      <ul className="space-y-1 pl-4 list-disc text-slate-300">
                        {report.headings.h2.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500">No H2 headings detected.</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-violet-400" />
                      <h4 className="font-bold text-slate-200">H3 Headings ({report.headings?.h3?.length || 0})</h4>
                    </div>
                    {report.headings?.h3?.length ? (
                      <ul className="space-y-1 pl-4 list-disc text-slate-400">
                        {report.headings.h3.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500">No H3 headings detected.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: AEO & AIO */}
              {activeTab === 'aeo_aio' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                    <h4 className="font-bold text-cyan-400 text-sm">AEO Readiness (Answer Engines)</h4>
                    <p className="text-slate-400">Optimized for Perplexity, ChatGPT Search, and Copilot direct answer retrieval.</p>
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex justify-between">
                        <span className="text-slate-400">FAQ Content Detected:</span>
                        <span className="font-semibold text-white">{report.aeoFindings?.hasFaq ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">FAQPage Schema:</span>
                        <span className="font-semibold text-white">{report.aeoFindings?.hasFaqSchema ? 'Yes' : 'Missing'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Section Subheadings (H2):</span>
                        <span className="font-semibold text-white">{report.aeoFindings?.h2Count || 0} headings</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                    <h4 className="font-bold text-violet-400 text-sm">AIO Readiness (Google AI Overviews)</h4>
                    <p className="text-slate-400">Semantic landmark structuring for multi-sentence snippet extraction.</p>
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex justify-between">
                        <span className="text-slate-400">&lt;main&gt; Landmark:</span>
                        <span className="font-semibold text-white">{report.aioFindings?.hasMain ? 'Present' : 'Missing'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">&lt;article&gt; Landmark:</span>
                        <span className="font-semibold text-white">{report.aioFindings?.hasArticle ? 'Present' : 'Missing'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Heading Hierarchy:</span>
                        <span className="font-semibold text-white">{report.aioFindings?.headingHierarchy ? 'Standard' : 'Irregular'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: GEO & EEAT */}
              {activeTab === 'eeat' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                    <h4 className="font-bold text-amber-400 text-sm">GEO (Generative Engine Optimization)</h4>
                    <p className="text-slate-400">Entity linking in knowledge bases and external citation signals.</p>
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Entity Schema (Org/Product):</span>
                        <span className="font-semibold text-white">{report.geoFindings?.hasEntitySchema ? 'Detected' : 'Missing'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">External Authority Links:</span>
                        <span className="font-semibold text-white">{report.geoFindings?.externalLinksCount || 0} links</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                    <h4 className="font-bold text-emerald-400 text-sm">E-E-A-T Quality Signals</h4>
                    <p className="text-slate-400">Experience, Expertise, Authoritativeness, and Trustworthiness markers.</p>
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Author Attribution:</span>
                        <span className="font-semibold text-white">{report.eeatFindings?.hasAuthor ? 'Detected' : 'Missing'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">HTTPS Security:</span>
                        <span className="font-semibold text-emerald-400">{report.eeatFindings?.isHttps ? 'Encrypted' : 'Insecure'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">About Page Link:</span>
                        <span className="font-semibold text-white">{report.eeatFindings?.hasAbout ? 'Found' : 'Not Found'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Contact Page Link:</span>
                        <span className="font-semibold text-white">{report.eeatFindings?.hasContact ? 'Found' : 'Not Found'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Privacy & Terms Links:</span>
                        <span className="font-semibold text-white">
                          {report.eeatFindings?.hasPrivacy && report.eeatFindings?.hasTerms ? 'Both Present' : 'Incomplete'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: Schemas */}
              {activeTab === 'schemas' && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-cyan-400" />
                    <h4 className="font-bold text-slate-200">Discovered JSON-LD Schemas ({report.structuredData?.length || 0})</h4>
                  </div>
                  {report.structuredData?.length ? (
                    <pre className="rounded-lg bg-slate-900 border border-slate-800 p-3 font-mono text-[11px] text-cyan-300 overflow-x-auto max-h-96">
                      {JSON.stringify(report.structuredData, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-slate-500">No JSON-LD structured data detected on this page.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
