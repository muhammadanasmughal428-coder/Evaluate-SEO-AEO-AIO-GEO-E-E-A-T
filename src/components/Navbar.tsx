import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Globe,
  Sparkles,
  Database,
  LogIn,
  LogOut,
  PlusCircle,
  Cpu,
} from 'lucide-react';

interface NavbarProps {
  onStartAuditClick: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onStartAuditClick,
  setActiveTab,
}) => {
  const { user, signInWithGoogle, signOut, loading } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <Globe className="h-5 w-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-white">
                AI VISIBILITY AUDITOR
              </span>
              <span className="rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                PROD VERCEL
              </span>
            </div>
            <p className="text-[11px] text-slate-400">SEO • AEO • AIO • GEO • E-E-A-T Engine</p>
          </div>
        </div>

        {/* Center Live Badges */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-slate-300">
            <Database className="h-3.5 w-3.5 text-indigo-400" />
            <span>Cloud SQL PostgreSQL</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-slate-300">
            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            <span>Gemini Multi-Engine AI</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>URL-by-URL Deep Crawl</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onStartAuditClick}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:from-indigo-600 hover:to-violet-700 active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Audit Website</span>
          </button>

          {/* User Auth */}
          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-slate-800" />
          ) : user ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 p-1 pl-2">
              <span className="hidden sm:inline text-xs font-medium text-slate-300">
                {user.displayName || user.email?.split('@')[0]}
              </span>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="h-7 w-7 rounded-full border border-indigo-500/40 object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {(user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <button
                onClick={signOut}
                title="Sign Out"
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-800 transition"
            >
              <LogIn className="h-3.5 w-3.5 text-indigo-400" />
              <span>Google Sign-In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
