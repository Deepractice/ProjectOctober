/**
 * UI Store - UI Preferences
 * Manages UI state with localStorage persistence
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UIState {
  // Preferences
  autoExpandTools: boolean;
  showRawParameters: boolean;
  showThinking: boolean;
  autoScrollToBottom: boolean;
  sendByCtrlEnter: boolean;
  sidebarVisible: boolean;

  // Actions
  toggleAutoExpandTools: () => void;
  toggleShowRawParameters: () => void;
  toggleShowThinking: () => void;
  toggleAutoScrollToBottom: () => void;
  toggleSendByCtrlEnter: () => void;
  toggleSidebar: () => void;

  setAutoExpandTools: (value: boolean) => void;
  setShowRawParameters: (value: boolean) => void;
  setShowThinking: (value: boolean) => void;
  setAutoScrollToBottom: (value: boolean) => void;
  setSendByCtrlEnter: (value: boolean) => void;
  setSidebarVisible: (value: boolean) => void;

  resetPreferences: () => void;
}

const defaultPreferences = {
  autoExpandTools: true,
  showRawParameters: false,
  showThinking: true,
  autoScrollToBottom: true,
  sendByCtrlEnter: false,
  sidebarVisible: true,
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      ...defaultPreferences,

      // Toggle actions
      toggleAutoExpandTools: () => set((state) => ({ autoExpandTools: !state.autoExpandTools })),
      toggleShowRawParameters: () =>
        set((state) => ({ showRawParameters: !state.showRawParameters })),
      toggleShowThinking: () => set((state) => ({ showThinking: !state.showThinking })),
      toggleAutoScrollToBottom: () =>
        set((state) => ({ autoScrollToBottom: !state.autoScrollToBottom })),
      toggleSendByCtrlEnter: () => set((state) => ({ sendByCtrlEnter: !state.sendByCtrlEnter })),
      toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),

      // Setter actions
      setAutoExpandTools: (value) => set({ autoExpandTools: value }),
      setShowRawParameters: (value) => set({ showRawParameters: value }),
      setShowThinking: (value) => set({ showThinking: value }),
      setAutoScrollToBottom: (value) => set({ autoScrollToBottom: value }),
      setSendByCtrlEnter: (value) => set({ sendByCtrlEnter: value }),
      setSidebarVisible: (value) => set({ sidebarVisible: value }),

      // Reset
      resetPreferences: () => set(defaultPreferences),
    }),
    {
      name: "agent-ui-preferences",
    }
  )
);
