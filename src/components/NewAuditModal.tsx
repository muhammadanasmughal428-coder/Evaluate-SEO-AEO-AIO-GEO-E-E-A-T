import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface NewAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuditCreated: (auditId: number) => void;
  initialUrl?: string;
}

export const NewAuditModal: React.FC<NewAuditModalProps> = ({
  isOpen,
  onClose,
  onAuditCreated,
  initialUrl = '',
}) => {
  const { idToken } = useAuth();
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialUrl) {
      setUrl(initialUrl);
    }
  }, [isOpen, initialUrl]);

  // Active Job State
  const [activeAuditId, setActiveAuditId] = useState<number | null>(null);
  const [auditStatus, setAuditStatus] = useState<string>('idle');
  const [totalUrls, setTotalUrls] = useState<number>(0);
  const [analyzedUrls, setAnalyzedUrls] = useState<number>(0);
  const [failedUrls, setFailedUrls] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Suggested demo targets for instant testing
  const suggestions = [
    'https://nextjs.org',
    'https://stripe.com',
    'https://wikipedia.org',
    'https://react.dev',
  ];

  // Batch polling loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeAuditId && !isFinished) {
      const processBatch = async () => {
        try {
          const res = await fetch(`/api/audit/${activeAuditId}/process-batch`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
            },
          });
          const data = await res.json();
          if (data.isFinished || data.status === 'completed') {
            setIsFinished(true);
            setAuditStatus('completed');
            setAnalyzedUrls(data.analyzedUrls || 0);
            setFailedUrls(data.failedUrls || 0);
          } else {
            setAuditStatus(data.status || 'analyzing');
            setAnalyzedUrls(data.analyzedUrls || 0);
            setFailedUrls(data.failedUrls || 0);
            setTotalUrls(data.totalUrls || 0);
            timer = setTimeout(processBatch, 1800);
          }
        } catch (err: any) {
          console.error('Batch polling err:', err);
          timer = setTimeout(processBatch, 3000);
        }
      };

      timer = setTimeout(processBatch, 1000);
    }

    return () => clearTimeout(timer);
  }, [activeAuditId, isFinished, idToken]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    setLoading(true);
    setAuditStatus('crawling');

    try {
      const response = await fetch('/api/audit/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ url: cleanUrl }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate crawl');
      }

      setActiveAuditId(data.auditId);
      setTotalUrls(data.totalUrls);
      setAnalyzedUrls(data.analyzedUrls);
      setAuditStatus(data.status);
      if (data.status === 'completed') {
        setIsFinished(true);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while launching the audit');
      setAuditStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setActiveAuditId(null);
    setAuditStatus('idle');
    setTotalUrls(0);
    setAnalyzedUrls(0);
    setFailedUrls(0);
    setIsFinished(false);
    setError(null);
    setUrl('');
    onClose();
  };

  const handleOpenReport = () => {
    if (activeAuditId) {
      onAuditCreated(activeAuditId);
      resetModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Decorative corner glow */}
        <div className="absolute -top-16 -right-16 h-36 w-36 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Search className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Start Deep Website Audit</h2>
              <p className="text-xs text-slate-400">Discover internal URLs & evaluate SEO + AEO + AIO + GEO + E-E-A-T</p>
            </div>
          </div>
          <button
            onClick={resetModal}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        {!activeAuditId ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Public Website Target URL
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="absolute right-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Initiating...</span>
                    </>
                  ) : (
                    <>
                      <span>Start Audit</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Demo URLs */}
            <div>
              <span className="text-[11px] font-medium text-slate-400">Try popular websites:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setUrl(item)}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1 text-xs text-slate-300 hover:border-indigo-500/50 hover:text-indigo-300 transition"
                  >
                    {item.replace('https://', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* Pillar Badges */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400">Complete Multi-Pillar Analysis Included:</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[10px] font-medium">
                <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 py-1.5 text-indigo-300">
                  SEO
                </div>
                <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 py-1.5 text-cyan-300">
                  AEO (Perplexity/Chat)
                </div>
                <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 py-1.5 text-violet-300">
                  AIO (AI Overviews)
                </div>
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 py-1.5 text-amber-300">
                  GEO (Generative Engines)
                </div>
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 py-1.5 text-emerald-300 col-span-2 sm:col-span-1">
                  E-E-A-T
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}
          </form>
        ) : (
          /* Live Progress State */
          <div className="mt-6 space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {!isFinished ? (
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  )}
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {isFinished
                        ? 'Website Audit Complete!'
                        : auditStatus === 'crawling'
                        ? 'Crawling Root & Discovering URLs...'
                        : 'Analyzing Discovered URLs in Batches...'}
                    </h3>
                    <p className="text-xs text-slate-400 truncate max-w-sm">{url}</p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
                    isFinished
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                  }`}
                >
                  {isFinished ? 'Finished' : 'In Progress'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>URL Queue Progress:</span>
                  <span className="font-semibold text-slate-200">
                    {analyzedUrls} / {totalUrls} URLs analyzed
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                    style={{
                      width: `${totalUrls > 0 ? Math.min(100, (analyzedUrls / totalUrls) * 100) : 10}%`,
                    }}
                  />
                </div>
              </div>

              {/* Discovered URLs Real Counter */}
              <div className="grid grid-cols-3 gap-3 text-center pt-2 border-t border-slate-800/80">
                <div className="rounded-lg bg-slate-900/60 p-2 border border-slate-800">
                  <span className="text-xs text-slate-400">Total URLs</span>
                  <p className="text-base font-bold text-white">{totalUrls}</p>
                </div>
                <div className="rounded-lg bg-slate-900/60 p-2 border border-slate-800">
                  <span className="text-xs text-emerald-400">Analyzed</span>
                  <p className="text-base font-bold text-emerald-400">{analyzedUrls}</p>
                </div>
                <div className="rounded-lg bg-slate-900/60 p-2 border border-slate-800">
                  <span className="text-xs text-rose-400">Failed / Blocked</span>
                  <p className="text-base font-bold text-rose-400">{failedUrls}</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                Individual reports created in PostgreSQL for every URL
              </span>

              <button
                onClick={handleOpenReport}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 transition active:scale-95"
              >
                <span>{isFinished ? 'View Complete Report' : 'Open Live Report'}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
