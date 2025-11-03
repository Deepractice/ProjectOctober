import React from 'react';
import Settings from '../Settings';
import QuickSettingsPanel from '../QuickSettingsPanel';
import VersionUpgradeModal from './VersionUpgradeModal';
import { useUIStore } from '../../stores';

function AppModals({
  // Settings Modal
  showSettings,
  onCloseSettings,
  projects,
  settingsInitialTab,

  // Version Modal
  showVersionModal,
  onCloseVersionModal,
  currentVersion,
  latestVersion,
  releaseInfo,

  // Quick Settings
  showQuickSettings,
  onToggleQuickSettings,
  activeTab,
  isMobile,
}) {
  const {
    autoExpandTools,
    setAutoExpandTools,
    showRawParameters,
    setShowRawParameters,
    showThinking,
    setShowThinking,
    autoScrollToBottom,
    setAutoScrollToBottom,
    sendByCtrlEnter,
    setSendByCtrlEnter,
  } = useUIStore();

  return (
    <>
      {/* Settings Modal */}
      <Settings
        isOpen={showSettings}
        onClose={onCloseSettings}
        projects={projects}
        initialTab={settingsInitialTab}
      />

      {/* Version Upgrade Modal */}
      <VersionUpgradeModal
        isOpen={showVersionModal}
        onClose={onCloseVersionModal}
        currentVersion={currentVersion}
        latestVersion={latestVersion}
        releaseInfo={releaseInfo}
      />

      {/* Quick Settings Panel */}
      {activeTab === 'chat' && (
        <QuickSettingsPanel
          isOpen={showQuickSettings}
          onToggle={onToggleQuickSettings}
          autoExpandTools={autoExpandTools}
          onAutoExpandChange={setAutoExpandTools}
          showRawParameters={showRawParameters}
          onShowRawParametersChange={setShowRawParameters}
          showThinking={showThinking}
          onShowThinkingChange={setShowThinking}
          autoScrollToBottom={autoScrollToBottom}
          onAutoScrollChange={setAutoScrollToBottom}
          sendByCtrlEnter={sendByCtrlEnter}
          onSendByCtrlEnterChange={setSendByCtrlEnter}
          isMobile={isMobile}
        />
      )}
    </>
  );
}

export default AppModals;
