import React from 'react';
import Sidebar from '../Sidebar';

function MobileSidebarOverlay({
  isOpen,
  onClose,
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
  return (
    <div className={`fixed inset-0 z-50 flex transition-all duration-150 ease-out ${
      isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
    }`}>
      <button
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-150 ease-out"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close sidebar"
      />
      <div
        className={`relative w-[85vw] max-w-sm sm:w-80 bg-card border-r border-border transform transition-transform duration-150 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ height: 'calc(100vh - 80px)' }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
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
          onToggleSidebar={onClose}
        />
      </div>
    </div>
  );
}

export default MobileSidebarOverlay;
