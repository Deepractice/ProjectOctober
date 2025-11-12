/**
 * UI Store - UI Preferences and Agent Status Display
 * Manages UI state with localStorage persistence
 * Agent status display for current session (not persisted)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { eventBus } from "~/core/eventBus";
import { useSessionStore } from "./sessionStore";
import type { AppEvent } from "~/core/events";

export interface AgentStatus {
  text?: string;
  tokens?: number;
  can_interrupt?: boolean;
}

export interface UIState {
  // Preferences
  autoExpandTools: boolean;
  showRawParameters: boolean;
  showThinking: boolean;
  autoScrollToBottom: boolean;
  sendByCtrlEnter: boolean;
  sidebarVisible: boolean;

  // Agent Status Display (for current session only)
  agentStatus: AgentStatus | null;
  provider: "claude" | "cursor";

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

  // Agent Status Actions
  setAgentStatus: (status: AgentStatus | null) => void;
  setProvider: (provider: "claude" | "cursor") => void;
  clearAgentStatus: () => void;

  resetPreferences: () => void;
}

const defaultPreferences = {
  autoExpandTools: false,
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

      // Agent Status (not persisted)
      agentStatus: null,
      provider: "claude",

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

      // Agent Status Actions
      setAgentStatus: (status) => set({ agentStatus: status }),
      setProvider: (provider) => set({ provider }),
      clearAgentStatus: () => set({ agentStatus: null }),

      // Reset
      resetPreferences: () => set(defaultPreferences),
    }),
    {
      name: "agent-ui-preferences",
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Migration from version 0 to 1: reset autoExpandTools to false
        if (version === 0) {
          return {
            ...persistedState,
            autoExpandTools: false,
          };
        }
        return persistedState;
      },
    }
  )
);

// Subscribe to EventBus for agent status updates
eventBus.stream().subscribe((event: AppEvent) => {
  const uiStore = useUIStore.getState();
  const sessionStore = useSessionStore.getState();
  const currentSessionId = sessionStore.selectedSession?.id;

  if (!currentSessionId) return;

  switch (event.type) {
    // When user sends a message in current session
    case "message.user":
      if (event.sessionId === currentSessionId) {
        uiStore.setAgentStatus({
          text: "Thinking",
          can_interrupt: true,
        });
        sessionStore.markSessionProcessing(currentSessionId);
      }
      break;

    // Agent is processing
    case "agent.processing":
      if (event.sessionId === currentSessionId) {
        uiStore.setAgentStatus({
          text: event.status || "Processing",
          tokens: event.tokens,
          can_interrupt: true,
        });
        sessionStore.markSessionProcessing(currentSessionId);
      }
      break;

    // Agent completed
    case "agent.complete":
      if (event.sessionId === currentSessionId) {
        uiStore.clearAgentStatus();
      }
      sessionStore.markSessionNotProcessing(event.sessionId);
      break;

    // Agent error
    case "agent.error":
      if (event.sessionId === currentSessionId) {
        uiStore.clearAgentStatus();
      }
      sessionStore.markSessionNotProcessing(event.sessionId);
      break;

    // Session aborted
    case "session.aborted":
      if (event.sessionId === currentSessionId) {
        uiStore.clearAgentStatus();
      }
      sessionStore.markSessionNotProcessing(event.sessionId);
      break;

    // Session selected - clear status for new session
    case "session.selected":
      // Clear status when switching sessions
      uiStore.clearAgentStatus();
      break;
  }
});
