/**
 * uiStore - UI Preferences with Persistence
 *
 * Manages all UI-related preferences with automatic localStorage sync.
 * Replaces all useLocalStorage hooks in the app.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UIState } from '../types';

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // UI Preferences
      autoExpandTools: false,
      showRawParameters: false,
      showThinking: true,
      autoScrollToBottom: true,
      sendByCtrlEnter: false,
      sidebarVisible: true,

      // Toggle Actions
      toggleAutoExpandTools: () => set((state) => ({
        autoExpandTools: !state.autoExpandTools
      })),

      toggleShowRawParameters: () => set((state) => ({
        showRawParameters: !state.showRawParameters
      })),

      toggleShowThinking: () => set((state) => ({
        showThinking: !state.showThinking
      })),

      toggleAutoScrollToBottom: () => set((state) => ({
        autoScrollToBottom: !state.autoScrollToBottom
      })),

      toggleSendByCtrlEnter: () => set((state) => ({
        sendByCtrlEnter: !state.sendByCtrlEnter
      })),

      toggleSidebar: () => set((state) => ({
        sidebarVisible: !state.sidebarVisible
      })),

      // Setter Actions (for direct setting)
      setAutoExpandTools: (value) => set({ autoExpandTools: value }),
      setShowRawParameters: (value) => set({ showRawParameters: value }),
      setShowThinking: (value) => set({ showThinking: value }),
      setAutoScrollToBottom: (value) => set({ autoScrollToBottom: value }),
      setSendByCtrlEnter: (value) => set({ sendByCtrlEnter: value }),
      setSidebarVisible: (value) => set({ sidebarVisible: value }),

      // Reset all preferences to defaults
      resetPreferences: () => set({
        autoExpandTools: false,
        showRawParameters: false,
        showThinking: true,
        autoScrollToBottom: true,
        sendByCtrlEnter: false,
        sidebarVisible: true,
      }),
    }),
    {
      name: 'ui-preferences',
      version: 1,
      // Migrate old localStorage keys
      migrate: (persistedState, version) => {
        if (version === 0) {
          // Try to import old localStorage values
          try {
            const autoExpandTools = localStorage.getItem('autoExpandTools');
            const showRawParameters = localStorage.getItem('showRawParameters');
            const showThinking = localStorage.getItem('showThinking');
            const autoScrollToBottom = localStorage.getItem('autoScrollToBottom');
            const sendByCtrlEnter = localStorage.getItem('sendByCtrlEnter');
            const sidebarVisible = localStorage.getItem('sidebarVisible');

            return {
              ...persistedState,
              autoExpandTools: autoExpandTools ? JSON.parse(autoExpandTools) : false,
              showRawParameters: showRawParameters ? JSON.parse(showRawParameters) : false,
              showThinking: showThinking ? JSON.parse(showThinking) : true,
              autoScrollToBottom: autoScrollToBottom ? JSON.parse(autoScrollToBottom) : true,
              sendByCtrlEnter: sendByCtrlEnter ? JSON.parse(sendByCtrlEnter) : false,
              sidebarVisible: sidebarVisible ? JSON.parse(sidebarVisible) : true,
            };
          } catch (error) {
            console.error('Error migrating old localStorage:', error);
          }
        }
        return persistedState;
      },
    }
  )
);
