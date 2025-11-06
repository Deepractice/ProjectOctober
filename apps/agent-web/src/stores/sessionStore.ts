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

  // Navigation state (for components to subscribe to)
  navigationTarget: string | null;

  // Session Protection System
  activeSessions: Set<string>;
  processingSessions: Set<string>;

  // Internal state actions (used by EventBus subscribers)
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

  // Business action methods (for components to call)
  createNewSession: () => Promise<void>;
  selectSession: (sessionId: string) => void;
  deleteSessionById: (sessionId: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
  abortSessionById: (sessionId: string) => void;
}

export const useSessionStore = create<SessionState>()(
  devtools(
    (set, get) => ({
      // Initial state
      sessions: [],
      selectedSession: null,
      isLoading: false,
      error: null,
      navigationTarget: null,
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
        set((state) => {
          // Update lastActivity when marking session as active
          const updatedSessions = state.sessions.map((s) =>
            s.id === sessionId ? { ...s, lastActivity: new Date().toISOString() } : s
          );
          return {
            activeSessions: new Set([...state.activeSessions, sessionId]),
            sessions: updatedSessions,
          };
        });
        console.log("[SessionStore] Session marked active and lastActivity updated:", sessionId);
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

      // Business action methods (components call these)
      createNewSession: async () => {
        // Lazy session creation: just navigate to root, don't call API
        // Session will be created when user sends first message
        eventBus.emit({ type: "session.navigate.new" });
      },

      selectSession: (sessionId: string) => {
        eventBus.emit({ type: "session.selected", sessionId });
      },

      deleteSessionById: async (sessionId: string) => {
        eventBus.emit({ type: "session.delete", sessionId });
      },

      refreshSessions: async () => {
        eventBus.emit({ type: "session.refresh" });
      },

      abortSessionById: (sessionId: string) => {
        eventBus.emit({ type: "session.abort", sessionId });
      },
    }),
    { name: "SessionStore" }
  )
);

// Subscribe to EventBus (auto-setup on module load)
eventBus.on(isSessionEvent).subscribe(async (event) => {
  const store = useSessionStore.getState();

  switch (event.type) {
    case "session.navigate.new":
      // Lazy session creation: just navigate to root
      console.log("[SessionStore] Navigating to new session (/)");

      // Only set navigationTarget if it's not already "/"
      const currentTarget = useSessionStore.getState().navigationTarget;
      if (currentTarget !== "/") {
        useSessionStore.setState({ navigationTarget: "/" });
      }
      break;

    case "session.create":
      // Business orchestration: create session with first message
      try {
        console.log("[SessionStore] Creating session with first message...");
        store.setLoading(true);

        const response = await fetch("/api/sessions/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: event.message }),
        });

        if (!response.ok) {
          throw new Error(`Failed to create session: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("[SessionStore] Session created with SDK session_id:", data.sessionId);

        // Reload sessions to include the new one
        const { loadSessions } = await import("~/api/agent");
        const sessions = await loadSessions();
        store.setSessions(sessions);
        store.setLoading(false);

        // Emit created event with messages
        eventBus.emit({
          type: "session.created",
          sessionId: data.sessionId,
          messages: data.messages || [],
        });

        // Navigate to new session
        eventBus.emit({ type: "session.selected", sessionId: data.sessionId });
      } catch (error) {
        console.error("[SessionStore] Failed to create session:", error);
        store.setError((error as Error).message);
        store.setLoading(false);
      }
      break;

    case "session.refresh":
      // Business orchestration: refresh sessions
      try {
        console.log("[SessionStore] Refreshing sessions...");
        store.setLoading(true);

        const { loadSessions } = await import("~/api/agent");
        const sessions = await loadSessions();
        store.setSessions(sessions);
        store.setLoading(false);
      } catch (error) {
        console.error("[SessionStore] Failed to refresh sessions:", error);
        store.setError((error as Error).message);
        store.setLoading(false);
      }
      break;

    case "session.delete":
      // Business orchestration: delete session
      try {
        console.log("[SessionStore] Deleting session:", event.sessionId);
        const { deleteSession } = await import("~/api/agent");
        await deleteSession(event.sessionId);

        // Emit session.deleted event to update UI
        eventBus.emit({ type: "session.deleted", sessionId: event.sessionId });
      } catch (error) {
        console.error("[SessionStore] Failed to delete session:", error);
        store.setError((error as Error).message);
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
      console.log("[SessionStore] Received session.selected event:", event.sessionId);
      const session = store.sessions.find((s) => s.id === event.sessionId);

      if (!session) {
        console.error("[SessionStore] Session not found in store:", event.sessionId);
        console.log(
          "[SessionStore] Available sessions:",
          store.sessions.map((s) => s.id)
        );
        break;
      }

      console.log("[SessionStore] Found session:", session.id, session.summary);
      store.setSelectedSession(session);
      console.log("[SessionStore] Updated selectedSession in store");

      // Set navigation target for App component to subscribe to
      useSessionStore.setState({ navigationTarget: event.sessionId });

      // Business orchestration: auto-load messages when session is selected
      (async () => {
        try {
          console.log("[SessionStore] Starting to load messages for session:", event.sessionId);

          const { loadSessionMessages } = await import("~/api/agent");
          const messages = await loadSessionMessages(event.sessionId);

          // Emit event to update messageStore
          eventBus.emit({
            type: "message.loaded",
            sessionId: event.sessionId,
            messages,
          });

          console.log("[SessionStore] Successfully loaded messages for session:", event.sessionId);
        } catch (error) {
          console.error(
            "[SessionStore] Failed to load messages for session:",
            event.sessionId,
            error
          );
        }
      })();
      break;

    case "session.processing":
      if (event.isProcessing) {
        store.markSessionProcessing(event.sessionId);
      } else {
        store.markSessionNotProcessing(event.sessionId);
        store.markSessionInactive(event.sessionId);
      }
      break;

    case "session.abort":
      // Business orchestration: handle user aborting a session
      try {
        console.log("[SessionStore] Aborting session:", event.sessionId);

        // Send abort command to backend via API
        const { abortSessionBackend } = await import("~/api/agent");
        abortSessionBackend(event.sessionId);

        // Emit session.aborted event for UI updates
        eventBus.emit({ type: "session.aborted", sessionId: event.sessionId });
      } catch (error) {
        console.error("[SessionStore] Failed to abort session:", error);
      }
      break;

    case "session.aborted":
      // Store update: mark session as not processing
      store.markSessionNotProcessing(event.sessionId);
      store.markSessionInactive(event.sessionId);
      break;
  }
});
