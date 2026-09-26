import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { AuditReportView } from './components/AuditReportView.tsx';
import { AiChatView } from './components/AiChatView.tsx';
import { StudentLearningView } from './components/StudentLearningView.tsx';
import { WebsitesView } from './components/WebsitesView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { NewAuditModal } from './components/NewAuditModal.tsx';

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isNewAuditModalOpen, setIsNewAuditModalOpen] = useState(false);
  const [auditTargetUrl, setAuditTargetUrl] = useState('');
  const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null);

  const handleStartAuditClick = (url?: string) => {
    if (url) {
      setAuditTargetUrl(url);
    }
    setIsNewAuditModalOpen(true);
  };

  const handleAuditCreated = (auditId: number) => {
    setSelectedAuditId(auditId);
    setActiveTab('reports');
  };

  const handleSelectAudit = (auditId: number) => {
    setSelectedAuditId(auditId);
    setActiveTab('reports');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navbar */}
      <Navbar
        onStartAuditClick={handleStartAuditClick}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex flex-1">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab !== 'reports') {
              // keep selectedAuditId if returning to reports
            }
          }}
          onStartAuditClick={handleStartAuditClick}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              onStartAuditClick={handleStartAuditClick}
              onSelectAudit={handleSelectAudit}
              onNavigateToWebsites={() => setActiveTab('websites')}
            />
          )}

          {activeTab === 'reports' && (
            selectedAuditId ? (
              <AuditReportView
                auditId={selectedAuditId}
                onBackToDashboard={() => setActiveTab('dashboard')}
              />
            ) : (
              <DashboardView
                onStartAuditClick={handleStartAuditClick}
                onSelectAudit={handleSelectAudit}
                onNavigateToWebsites={() => setActiveTab('websites')}
              />
            )
          )}

          {activeTab === 'ai-chat' && <AiChatView />}

          {activeTab === 'student' && <StudentLearningView />}

          {activeTab === 'websites' && (
            <WebsitesView
              onStartAuditForDomain={(url) => {
                handleStartAuditClick(url);
              }}
            />
          )}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* New Audit Modal */}
      <NewAuditModal
        isOpen={isNewAuditModalOpen}
        initialUrl={auditTargetUrl}
        onClose={() => {
          setIsNewAuditModalOpen(false);
          setAuditTargetUrl('');
        }}
        onAuditCreated={handleAuditCreated}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
