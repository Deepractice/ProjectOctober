/**
 * sessionStore - Session State and Business Logic
 *
 * Manages all session-related state and business logic including:
 * - Session CRUD operations
 * - Session Protection System (activeSessions, processingSessions)
 * - WebSocket message handlers for session-related events
 * - Session lifecycle management
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { api } from '../utils/api';
import { useMessageStore } from './messageStore';
import type { SessionState } from '../types';

export const useSessionStore = create<SessionState>()(
  devtools(
    (set, get) => ({
      // State
      sessions: [],
      selectedSession: null,
      isLoading: false,
      error: null,

      // Session Protection System
      activeSessions: new Set(), // Sessions with active conversations (prevents updates)
      processingSessions: new Set(), // Sessions currently processing (thinking)

      // Tracking
      lastFetchTime: 0,
      pendingOperations: new Set(),

      // CRUD Operations
      setSessions: (sessions) => set({ sessions }),

      setSelectedSession: (session) => set({ selectedSession: session }),

      addSession: (session) => set((state) => ({
        sessions: [session, ...state.sessions]
      })),

      updateSession: (sessionId, updates) => set((state) => ({
        sessions: state.sessions.map(s =>
          s.id === sessionId ? { ...s, ...updates } : s
        )
      })),

      removeSession: (sessionId) => set((state) => ({
        sessions: state.sessions.filter(s => s.id !== sessionId),
        selectedSession: state.selectedSession?.id === sessionId ? null : state.selectedSession
      })),

      // Session Protection System
      markSessionActive: (sessionId) => {
        if (!sessionId) return;
        set((state) => ({
          activeSessions: new Set([...state.activeSessions, sessionId])
        }));
        console.log('🔒 Session marked as active:', sessionId);
      },

      markSessionInactive: (sessionId) => {
        if (!sessionId) return;
        set((state) => {
          const newSet = new Set(state.activeSessions);
          newSet.delete(sessionId);
          return { activeSessions: newSet };
        });
        console.log('🔓 Session marked as inactive:', sessionId);
      },

      isSessionActive: (sessionId) => get().activeSessions.has(sessionId),

      markSessionProcessing: (sessionId) => {
        if (!sessionId) return;
        set((state) => ({
          processingSessions: new Set([...state.processingSessions, sessionId])
        }));
        console.log('⚙️ Session marked as processing:', sessionId);
      },

      markSessionNotProcessing: (sessionId) => {
        if (!sessionId) return;
        set((state) => {
          const newSet = new Set(state.processingSessions);
          newSet.delete(sessionId);
          return { processingSessions: newSet };
        });
        console.log('✅ Session marked as not processing:', sessionId);
      },

      isSessionProcessing: (sessionId) => get().processingSessions.has(sessionId),

      // Replace temporary session ID with real one
      replaceTemporarySession: (realSessionId) => {
        if (!realSessionId) return;
        set((state) => {
          const newSet = new Set();
          for (const sessionId of state.activeSessions) {
            if (!sessionId.startsWith('new-session-')) {
              newSet.add(sessionId);
            }
          }
          newSet.add(realSessionId);
          return { activeSessions: newSet };
        });
        console.log('🔄 Replaced temporary session with real ID:', realSessionId);
      },

      // API Operations
      refreshSessions: async (force = false) => {
        const now = Date.now();
        const MIN_FETCH_INTERVAL = 100;

        // Prevent excessive fetches unless forced
        if (!force && (now - get().lastFetchTime) < MIN_FETCH_INTERVAL) {
          console.log('⏭️ Skipping fetch - too soon after last fetch');
          return;
        }

        const operationId = `fetch-${Date.now()}`;
        get().pendingOperations.add(operationId);

        try {
          set({ isLoading: true, error: null });

          console.log('📡 Fetching sessions from API...');
          const response = await api.sessions(100);
          const data = await response.json();
          const sessionsArray = data.sessions || [];

          console.log('📦 Received sessions from API:', sessionsArray.length, 'sessions');

          // Optimize to preserve object references when data hasn't changed
          set((state) => {
            if (state.sessions.length === 0) {
              console.log('✅ No previous sessions, setting', sessionsArray.length, 'sessions');
              return { sessions: sessionsArray, lastFetchTime: now };
            }

            // Check if sessions data has actually changed
            const hasChanges = sessionsArray.some((newSession, index) => {
              const prevSession = state.sessions[index];
              if (!prevSession) return true;

              return (
                newSession.id !== prevSession.id ||
                newSession.title !== prevSession.title ||
                newSession.created_at !== prevSession.created_at ||
                newSession.updated_at !== prevSession.updated_at
              );
            }) || sessionsArray.length !== state.sessions.length;

            if (hasChanges) {
              console.log('✅ Sessions changed, updating to:', sessionsArray.length, 'sessions');
              return { sessions: sessionsArray, lastFetchTime: now };
            }

            console.log('⏭️ No changes detected, keeping previous sessions');
            return { lastFetchTime: now };
          });

        } catch (err) {
          console.error('❌ Error fetching sessions:', err);
          set({ error: err.message });
        } finally {
          set({ isLoading: false });
          const ops = get().pendingOperations;
          ops.delete(operationId);
        }
      },

      deleteSession: async (sessionId) => {
        const oldSessions = get().sessions;

        // Optimistic update
        get().removeSession(sessionId);

        try {
          await api.deleteSession(sessionId);
          console.log('✅ Session deleted successfully:', sessionId);
        } catch (err) {
          console.error('❌ Error deleting session:', err);
          // Rollback
          set({ sessions: oldSessions });
          throw err;
        }
      },

      // Helper: Check if update is additive (new sessions) vs modifying existing
      isUpdateAdditive: (updatedSessions, selectedSession) => {
        if (!selectedSession) return true;

        const currentSessions = get().sessions;
        const currentSelected = currentSessions?.find(s => s.id === selectedSession.id);
        const updatedSelected = updatedSessions?.find(s => s.id === selectedSession.id);

        if (!currentSelected || !updatedSelected) return false;

        const sessionUnchanged =
          currentSelected.id === updatedSelected.id &&
          currentSelected.updated_at === updatedSelected.updated_at;

        return sessionUnchanged;
      },

      // WebSocket Message Handlers
      handleSessionCreated: (sessionId, tempData = null) => {
        console.log('📝 Session created:', sessionId);

        if (tempData) {
          // Optimistic update
          get().addSession({
            id: sessionId,
            title: 'New Session',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...tempData
          });
        }

        // Refresh to get actual data
        setTimeout(() => get().refreshSessions(true), 200);
      },

      handleSessionsUpdated: (updatedSessions) => {
        console.log('📡 Sessions updated from WebSocket:', updatedSessions?.length || 0);

        // Check for active sessions
        const { selectedSession, activeSessions } = get();
        const hasActiveSession = (selectedSession && activeSessions.has(selectedSession.id)) ||
          (activeSessions.size > 0 && Array.from(activeSessions).some(id => id.startsWith('new-session-')));

        if (hasActiveSession) {
          const isAdditiveUpdate = get().isUpdateAdditive(updatedSessions, selectedSession);

          if (!isAdditiveUpdate) {
            console.log('⏭️ Skipping session update - protecting active session');
            return;
          }
        }

        // Update sessions
        set((state) => {
          const hasChanges = updatedSessions?.some((newSession, index) => {
            const prevSession = state.sessions[index];
            if (!prevSession) return true;

            return (
              newSession.id !== prevSession.id ||
              newSession.title !== prevSession.title ||
              newSession.updated_at !== prevSession.updated_at
            );
          }) || updatedSessions?.length !== state.sessions.length;

          return hasChanges ? { sessions: updatedSessions || [] } : {};
        });
      },

      handleClaudeComplete: (sessionId) => {
        console.log('✅ Claude complete for session:', sessionId);
        get().markSessionInactive(sessionId);
        get().markSessionNotProcessing(sessionId);
      },

      handleSessionAborted: (sessionId) => {
        console.log('⚠️ Session aborted:', sessionId);
        get().markSessionInactive(sessionId);
        get().markSessionNotProcessing(sessionId);
      },

      handleSessionStatus: (sessionId, isProcessing) => {
        if (isProcessing) {
          get().markSessionProcessing(sessionId);
        } else {
          get().markSessionNotProcessing(sessionId);
        }
      },
    }),
    { name: 'SessionStore' }
  )
);

// Register message handlers with messageStore
// This happens once when the module loads
const registerHandlers = () => {
  const messageStore = useMessageStore.getState();

  messageStore.registerHandler('session-created', (msg) => {
    useSessionStore.getState().handleSessionCreated(msg.sessionId);
  });

  messageStore.registerHandler('sessions_updated', (msg) => {
    useSessionStore.getState().handleSessionsUpdated(msg.sessions);
  });

  messageStore.registerHandler('claude-complete', (msg) => {
    const sessionId = msg.sessionId || sessionStorage.getItem('pendingSessionId');
    if (sessionId) {
      useSessionStore.getState().handleClaudeComplete(sessionId);
    }
  });

  messageStore.registerHandler('session-aborted', (msg) => {
    const sessionId = msg.sessionId;
    if (sessionId) {
      useSessionStore.getState().handleSessionAborted(sessionId);
    }
  });

  messageStore.registerHandler('session-status', (msg) => {
    const sessionId = msg.sessionId;
    if (sessionId) {
      useSessionStore.getState().handleSessionStatus(sessionId, msg.isProcessing);
    }
  });
};

// Auto-register handlers
registerHandlers();

// Expose refreshSessions globally for backward compatibility
if (typeof window !== 'undefined') {
  window.refreshSessions = () => {
    useSessionStore.getState().refreshSessions(true);
  };
}
