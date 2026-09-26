import React from 'react';
import {
  LayoutDashboard,
  FileSearch,
  MessageSquare,
  GraduationCap,
  Globe2,
  Server,
  PlusCircle,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onStartAuditClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onStartAuditClick,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reports', label: 'Audit Reports & URLs', icon: FileSearch },
    { id: 'ai-chat', label: 'ChatGPT AI Assistant', icon: MessageSquare, badge: 'Multilingual' },
    { id: 'student', label: 'Student Hub & SI Units', icon: GraduationCap, badge: '0$ Free' },
    { id: 'websites', label: 'Professional Websites & Addresses', icon: Globe2, badge: 'Maps' },
    { id: 'settings', label: 'Vercel & Architecture', icon: Server },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between shrink-0 hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div>
          <button
            onClick={onStartAuditClick}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 p-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Launch Deep Audit</span>
          </button>
        </div>

        {/* Menu Navigation */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Platform
          </p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-300 border border-indigo-500/20">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Database & Vercel Info Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>Engine Status</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Live
          </span>
        </div>
        <div className="text-[10px] text-slate-400 space-y-1">
          <p>• Multi-URL Queue Processor</p>
          <p>• E-E-A-T & AI Overviews Ready</p>
          <p>• Real-time HTML Token Parser</p>
        </div>
      </div>
    </aside>
  );
};
