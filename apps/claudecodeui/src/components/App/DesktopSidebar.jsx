import React from 'react';
import { Settings as SettingsIcon, Sparkles } from 'lucide-react';
import Sidebar from '../Sidebar';
import { useUIStore } from '../../stores';

function DesktopSidebar({
  sessions,
  selectedSession,
  onSessionSelect,
  onNewSession,
  onSessionDelete,
  isLoading,
  onRefresh,
  onShowSettings,
  updateAvailable,
  latestVersion,
  currentVersion,
  releaseInfo,
  onShowVersionModal,
  isPWA,
  isMobile,
}) {
  const { sidebarVisible, setSidebarVisible } = useUIStore();

  return (
    <div
      className={`flex-shrink-0 border-r border-border bg-card transition-all duration-300 ${
        sidebarVisible ? 'w-80' : 'w-14'
      }`}
    >
      <div className="h-full overflow-hidden">
        {sidebarVisible ? (
          <Sidebar
            sessions={sessions}
            selectedSession={selectedSession}
            onSessionSelect={onSessionSelect}
            onNewSession={onNewSession}
            onSessionDelete={onSessionDelete}
            isLoading={isLoading}
            onRefresh={onRefresh}
            onShowSettings={onShowSettings}
            updateAvailable={updateAvailable}
            latestVersion={latestVersion}
            currentVersion={currentVersion}
            releaseInfo={releaseInfo}
            onShowVersionModal={onShowVersionModal}
            isPWA={isPWA}
            isMobile={isMobile}
            onToggleSidebar={() => setSidebarVisible(false)}
          />
        ) : (
          <div className="h-full flex flex-col items-center py-4 gap-4">
            <button
              onClick={() => setSidebarVisible(true)}
              className="p-2 hover:bg-accent rounded-md transition-colors duration-200 group"
              aria-label="Show sidebar"
              title="Show sidebar"
            >
              <svg
                className="w-5 h-5 text-foreground group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={onShowSettings}
              className="p-2 hover:bg-accent rounded-md transition-colors duration-200"
              aria-label="Settings"
              title="Settings"
            >
              <SettingsIcon className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
            </button>

            {updateAvailable && (
              <button
                onClick={onShowVersionModal}
                className="relative p-2 hover:bg-accent rounded-md transition-colors duration-200"
                aria-label="Update available"
                title="Update available"
              >
                <Sparkles className="w-5 h-5 text-blue-500" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DesktopSidebar;
