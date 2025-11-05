/**
 * Session Store - Business Logic Layer
 * Subscribes to EventBus for session-related events
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { eventBus } from "~/core/eventBus";
import { isSessionEvent } from "~/core/events";
import type { Session } from "~/types";

export interface SessionState {
  // State
  sessions: Session[];
  selectedSession: Session | null;
  isLoading: boolean;
  error: string | null;

  // Session Protection System
  activeSessions: Set<string>;
  processingSessions: Set<string>;

  // Actions
  setSessions: (sessions: Session[]) => void;
  setSelectedSession: (session: Session | null) => void;
  addSession: (session: Session) => void;
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
  removeSession: (sessionId: string) => void;

  // Session Protection
  markSessionActive: (sessionId: string) => void;
  markSessionInactive: (sessionId: string) => void;
  isSessionActive: (sessionId: string) => boolean;
  markSessionProcessing: (sessionId: string) => void;
  markSessionNotProcessing: (sessionId: string) => void;
  isSessionProcessing: (sessionId: string) => boolean;

  // Loading state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSessionStore = create<SessionState>()(
  devtools(
    (set, get) => ({
      // Initial state
      sessions: [],
      selectedSession: null,
      isLoading: false,
      error: null,
      activeSessions: new Set(),
      processingSessions: new Set(),

      // Actions
      setSessions: (sessions) => {
        console.log("[SessionStore] setSessions:", sessions.length);
        set({ sessions });
      },

      setSelectedSession: (session) => {
        console.log("[SessionStore] setSelectedSession:", session?.id);
        set({ selectedSession: session });
      },

      addSession: (session) =>
        set((state) => ({
          sessions: [session, ...state.sessions],
        })),

      updateSession: (sessionId, updates) =>
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, ...updates } : s)),
        })),

      removeSession: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          selectedSession: state.selectedSession?.id === sessionId ? null : state.selectedSession,
        })),

      // Session Protection
      markSessionActive: (sessionId) => {
        set((state) => ({
          activeSessions: new Set([...state.activeSessions, sessionId]),
        }));
        console.log("[SessionStore] Session marked active:", sessionId);
      },

      markSessionInactive: (sessionId) => {
        set((state) => {
          const newSet = new Set(state.activeSessions);
          newSet.delete(sessionId);
          return { activeSessions: newSet };
        });
        console.log("[SessionStore] Session marked inactive:", sessionId);
      },

      isSessionActive: (sessionId) => get().activeSessions.has(sessionId),

      markSessionProcessing: (sessionId) => {
        set((state) => ({
          processingSessions: new Set([...state.processingSessions, sessionId]),
        }));
        console.log("[SessionStore] Session processing:", sessionId);
      },

      markSessionNotProcessing: (sessionId) => {
        set((state) => {
          const newSet = new Set(state.processingSessions);
          newSet.delete(sessionId);
          return { processingSessions: newSet };
        });
        console.log("[SessionStore] Session not processing:", sessionId);
      },

      isSessionProcessing: (sessionId) => get().processingSessions.has(sessionId),

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
    }),
    { name: "SessionStore" }
  )
);

// Subscribe to EventBus (auto-setup on module load)
eventBus.on(isSessionEvent).subscribe(async (event) => {
  const store = useSessionStore.getState();

  switch (event.type) {
    case "session.create":
      // Handle session creation request
      try {
        console.log("[SessionStore] Creating new session...");
        const { createSession } = await import("~/api/agent");
        const sessionId = await createSession();
        console.log("[SessionStore] Session created:", sessionId);

        // Reload sessions to get the new one
        const { loadSessions } = await import("~/api/agent");
        await loadSessions();

        // Emit event to navigate to new session
        eventBus.emit({ type: "session.selected", sessionId });
      } catch (error) {
        console.error("[SessionStore] Failed to create session:", error);
        store.setError((error as Error).message);
      }
      break;

    case "session.refresh":
      // Handle session refresh request
      try {
        console.log("[SessionStore] Refreshing sessions...");
        const { loadSessions } = await import("~/api/agent");
        await loadSessions();
      } catch (error) {
        console.error("[SessionStore] Failed to refresh sessions:", error);
      }
      break;

    case "session.delete":
      // Handle session deletion request
      try {
        console.log("[SessionStore] Deleting session:", event.sessionId);
        const { deleteSession } = await import("~/api/agent");
        await deleteSession(event.sessionId);
        // The API already emits session.deleted event
      } catch (error) {
        console.error("[SessionStore] Failed to delete session:", error);
      }
      break;

    case "session.created":
      console.log("[SessionStore] Session created:", event.sessionId);
      break;

    case "session.updated":
      store.setSessions(event.sessions);
      break;

    case "session.deleted":
      store.removeSession(event.sessionId);
      break;

    case "session.selected":
      const session = store.sessions.find((s) => s.id === event.sessionId);
      if (session) {
        store.setSelectedSession(session);
      }
      break;

    case "session.processing":
      if (event.isProcessing) {
        store.markSessionProcessing(event.sessionId);
      } else {
        store.markSessionNotProcessing(event.sessionId);
        store.markSessionInactive(event.sessionId);
      }
      break;

    case "session.aborted":
      store.markSessionNotProcessing(event.sessionId);
      store.markSessionInactive(event.sessionId);
      break;
  }
});
