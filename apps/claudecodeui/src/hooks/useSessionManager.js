/**
 * useSessionManager - Centralized Session Management Hook
 *
 * Single source of truth for session state management
 * Handles all session CRUD operations and synchronization
 *
 * Features:
 * - Unified session state management
 * - Automatic sync on WebSocket events
 * - Debounced updates to prevent excessive renders
 * - Retry logic for failed operations
 * - Optimistic updates for better UX
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '../utils/api';

/**
 * Session Manager Hook
 *
 * @returns {Object} Session manager interface
 */
export function useSessionManager() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Track pending operations to prevent race conditions
  const pendingOperations = useRef(new Set());
  const refreshTimerRef = useRef(null);
  const lastFetchTime = useRef(0);

  // Minimum interval between fetches (ms) to prevent excessive API calls
  const MIN_FETCH_INTERVAL = 100;

  /**
   * Fetch sessions from API
   * @param {boolean} force - Force fetch even if recently fetched
   */
  const fetchSessions = useCallback(async (force = false) => {
    const now = Date.now();

    console.log('🔍 fetchSessions called, force:', force, 'time since last:', now - lastFetchTime.current);

    // Prevent excessive fetches unless forced
    if (!force && (now - lastFetchTime.current) < MIN_FETCH_INTERVAL) {
      console.log('⏭️ Skipping fetch - too soon after last fetch');
      return;
    }

    const operationId = `fetch-${Date.now()}`;
    pendingOperations.current.add(operationId);

    try {
      setIsLoading(true);
      setError(null);

      console.log('📡 Fetching sessions from API...');
      const response = await api.sessions(100); // Get up to 100 sessions
      const data = await response.json();
      const sessionsArray = data.sessions || [];

      console.log('📦 Received sessions from API:', sessionsArray.length, 'sessions');
      lastFetchTime.current = Date.now();

      // Optimize to preserve object references when data hasn't changed
      setSessions(prevSessions => {
        console.log('🔄 Comparing sessions - prev:', prevSessions.length, 'new:', sessionsArray.length);

        // If no previous sessions, just set the new data
        if (prevSessions.length === 0) {
          console.log('✅ No previous sessions, setting', sessionsArray.length, 'sessions');
          return sessionsArray;
        }

        // Check if the sessions data has actually changed
        const hasChanges = sessionsArray.some((newSession, index) => {
          const prevSession = prevSessions[index];
          if (!prevSession) return true;

          // Compare key properties that would affect UI
          return (
            newSession.id !== prevSession.id ||
            newSession.title !== prevSession.title ||
            newSession.created_at !== prevSession.created_at ||
            newSession.updated_at !== prevSession.updated_at
          );
        }) || sessionsArray.length !== prevSessions.length;

        // Only update if there are actual changes
        if (hasChanges) {
          console.log('✅ Sessions changed, updating to:', sessionsArray.length, 'sessions');
          return sessionsArray;
        }

        console.log('⏭️ No changes detected, keeping previous sessions');
        return prevSessions;
      });

    } catch (err) {
      console.error('❌ Error fetching sessions:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      pendingOperations.current.delete(operationId);
    }
  }, []);

  /**
   * Debounced refresh to prevent excessive updates
   * Useful when multiple events fire in quick succession
   */
  const debouncedRefresh = useCallback((delay = 200) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = setTimeout(() => {
      fetchSessions(true);
      refreshTimerRef.current = null;
    }, delay);
  }, [fetchSessions]);

  /**
   * Immediate refresh (cancels any pending debounced refresh)
   */
  const refreshNow = useCallback(() => {
    console.log('🔄 refreshNow called');
    if (refreshTimerRef.current) {
      console.log('⏹️ Cancelling pending debounced refresh');
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    fetchSessions(true);
  }, [fetchSessions]);

  /**
   * Handle session created event from WebSocket
   * Optimistically adds placeholder, then refreshes
   */
  const handleSessionCreated = useCallback((sessionId, tempData = null) => {
    console.log('📝 Session created:', sessionId);

    if (tempData) {
      // Optimistic update - add placeholder immediately
      setSessions(prev => {
        // Check if session already exists
        if (prev.some(s => s.id === sessionId)) {
          return prev;
        }

        // Add new session at the beginning
        return [
          {
            id: sessionId,
            title: 'New Session',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...tempData
          },
          ...prev
        ];
      });
    }

    // Refresh to get actual data from server
    debouncedRefresh(200);
  }, [debouncedRefresh]);

  /**
   * Handle session updated event from WebSocket
   * @param {Object} updatedSession - Updated session data
   */
  const handleSessionUpdated = useCallback((updatedSession) => {
    console.log('🔄 Session updated:', updatedSession.id);

    setSessions(prev => {
      const index = prev.findIndex(s => s.id === updatedSession.id);

      if (index === -1) {
        // Session doesn't exist, add it
        return [updatedSession, ...prev];
      }

      // Update existing session
      const newSessions = [...prev];
      newSessions[index] = {
        ...newSessions[index],
        ...updatedSession,
        updated_at: new Date().toISOString()
      };

      return newSessions;
    });

    // Also refresh to ensure consistency
    debouncedRefresh(500);
  }, [debouncedRefresh]);

  /**
   * Handle session deleted event
   * Optimistically removes, then refreshes to confirm
   */
  const handleSessionDeleted = useCallback((sessionId) => {
    console.log('🗑️ Session deleted:', sessionId);

    // Optimistic update - remove immediately
    setSessions(prev => prev.filter(s => s.id !== sessionId));

    // Refresh to confirm
    debouncedRefresh(300);
  }, [debouncedRefresh]);

  /**
   * Handle sessions_updated WebSocket event
   * @param {Array} updatedSessions - Full sessions array from server
   */
  const handleSessionsUpdated = useCallback((updatedSessions) => {
    console.log('📡 Sessions updated from WebSocket:', updatedSessions.length);

    setSessions(prevSessions => {
      // Check if the sessions data has actually changed
      const hasChanges = updatedSessions.some((newSession, index) => {
        const prevSession = prevSessions[index];
        if (!prevSession) return true;

        return (
          newSession.id !== prevSession.id ||
          newSession.title !== prevSession.title ||
          newSession.updated_at !== prevSession.updated_at
        );
      }) || updatedSessions.length !== prevSessions.length;

      return hasChanges ? updatedSessions : prevSessions;
    });
  }, []);

  /**
   * Get session by ID
   */
  const getSessionById = useCallback((sessionId) => {
    return sessions.find(s => s.id === sessionId);
  }, [sessions]);

  /**
   * Delete session (API call + state update)
   */
  const deleteSession = useCallback(async (sessionId) => {
    try {
      // Optimistic update
      handleSessionDeleted(sessionId);

      // API call
      await api.deleteSession(sessionId);

      console.log('✅ Session deleted successfully:', sessionId);
    } catch (err) {
      console.error('❌ Error deleting session:', err);
      // Rollback - refresh to get actual state
      refreshNow();
      throw err;
    }
  }, [handleSessionDeleted, refreshNow]);

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    fetchSessions(true);
  }, [fetchSessions]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  /**
   * Expose global refresh function for backward compatibility
   */
  useEffect(() => {
    window.refreshSessions = refreshNow;

    return () => {
      delete window.refreshSessions;
    };
  }, [refreshNow]);

  return {
    // State
    sessions,
    isLoading,
    error,

    // Core operations
    refreshSessions: refreshNow,
    debouncedRefresh,

    // Event handlers (for WebSocket integration)
    handleSessionCreated,
    handleSessionUpdated,
    handleSessionDeleted,
    handleSessionsUpdated,

    // Utilities
    getSessionById,
    deleteSession,
  };
}
