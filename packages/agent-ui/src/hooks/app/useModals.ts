import { useState, useEffect } from "react";

/**
 * Hook for managing modal states
 */
export function useModals() {
  const [showSettings, setShowSettings] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState("tools");

  // Expose openSettings globally
  useEffect(() => {
    window.openSettings = (tab = "tools") => {
      setSettingsInitialTab(tab);
      setShowSettings(true);
    };
  }, []);

  return {
    showSettings,
    setShowSettings,
    showVersionModal,
    setShowVersionModal,
    showQuickSettings,
    setShowQuickSettings,
    settingsInitialTab,
    setSettingsInitialTab,
  };
}
