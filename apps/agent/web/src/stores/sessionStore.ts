/**
 * Session Store
 * Manages session list and selection
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Session } from "~/types";

export interface SessionState {
  // State
  sessions: Session[];
  selectedSession: Session | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  createNewSession: () => Promise<string>;
  selectSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  refreshSessions: () => Promise<void>;

  // Internal
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  removeSession: (sessionId: string) => void;
  setSelectedSession: (session: Session | null) => void;
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

      // Create new empty session
      createNewSession: async () => {
        try {
          console.log("[SessionStore] Creating new session...");

          const response = await fetch("/api/sessions/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ summary: "New conversation" }),
          });

          if (!response.ok) {
            throw new Error(`Failed to create session: ${response.statusText}`);
          }

          const data = await response.json();
          const sessionId = data.sessionId;

          console.log("[SessionStore] Session created:", sessionId);

          // Add to list
          const newSession: Session = {
            id: sessionId,
            summary: data.summary || "New conversation",
            messageCount: 0,
            lastActivity: new Date().toISOString(),
            cwd: data.cwd || ".",
          };

          get().addSession(newSession);
          get().setSelectedSession(newSession);

          return sessionId;
        } catch (error) {
          console.error("[SessionStore] Failed to create session:", error);
          get().setError((error as Error).message);
          throw error;
        }
      },

      // Select and load session messages
      selectSession: async (sessionId: string) => {
        try {
          const session = get().sessions.find((s) => s.id === sessionId);

          if (!session) {
            console.error("[SessionStore] Session not found:", sessionId);
            throw new Error(`Session ${sessionId} not found`);
          }

          console.log("[SessionStore] Selecting session:", sessionId);
          get().setSelectedSession(session);

          // Load messages
          const response = await fetch(`/api/sessions/${sessionId}/messages`);
          if (!response.ok) {
            throw new Error(`Failed to load messages: ${response.statusText}`);
          }

          const data = await response.json();

          // Update messageStore
          const { useMessageStore } = await import("./messageStore");
          useMessageStore.getState().setMessages(sessionId, data.messages || []);

          console.log("[SessionStore] Session selected and messages loaded");
        } catch (error) {
          console.error("[SessionStore] Failed to select session:", error);
          get().setError((error as Error).message);
          throw error;
        }
      },

      // Delete session
      deleteSession: async (sessionId: string) => {
        try {
          console.log("[SessionStore] Deleting session:", sessionId);

          const response = await fetch(`/api/sessions/${sessionId}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            throw new Error(`Failed to delete session: ${response.statusText}`);
          }

          get().removeSession(sessionId);

          // Clear messages
          const { useMessageStore } = await import("./messageStore");
          useMessageStore.getState().clearMessages(sessionId);

          console.log("[SessionStore] Session deleted");
        } catch (error) {
          console.error("[SessionStore] Failed to delete session:", error);
          get().setError((error as Error).message);
          throw error;
        }
      },

      // Refresh sessions from server
      refreshSessions: async () => {
        try {
          console.log("[SessionStore] Refreshing sessions...");
          get().setLoading(true);

          const response = await fetch("/api/sessions");
          if (!response.ok) {
            throw new Error(`Failed to load sessions: ${response.statusText}`);
          }

          const data = await response.json();
          get().setSessions(data.sessions || []);
          get().setLoading(false);

          console.log("[SessionStore] Sessions refreshed:", data.sessions?.length || 0);
        } catch (error) {
          console.error("[SessionStore] Failed to refresh sessions:", error);
          get().setError((error as Error).message);
          get().setLoading(false);
          throw error;
        }
      },

      // Internal actions
      setSessions: (sessions) => {
        set({ sessions });
      },

      addSession: (session) =>
        set((state) => ({
          sessions: [session, ...state.sessions],
        })),

      removeSession: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          selectedSession: state.selectedSession?.id === sessionId ? null : state.selectedSession,
        })),

      setSelectedSession: (session) => {
        set({ selectedSession: session });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },
    }),
    { name: "SessionStore" }
  )
);
