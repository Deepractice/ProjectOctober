/**
 * useWebSocket Hook - Final Integration
 *
 * High-level WebSocket integration for chat interface.
 * Combines state management (useWebSocketState) and message handling (useWebSocketHandlers).
 *
 * This hook reduces ChatInterface complexity by:
 * - Centralizing all WebSocket-related state
 * - Encapsulating message handling logic
 * - Providing a clean, minimal API
 *
 * Usage in ChatInterface:
 *   const ws = useWebSocket({
 *     selectedProject,
 *     selectedSession,
 *     onSessionProcessing,
 *     onNavigateToSession,
 *     scrollToBottom,
 *     isNearBottom,
 *     autoScrollToBottom
 *   });
 *
 * Then access: ws.chatMessages, ws.isLoading, ws.setPermissionMode, etc.
 */

import { useWebSocketState } from "./useWebSocketState";
import { useWebSocketHandlers } from "./useWebSocketHandlers";
import { useEffect } from "react";

export function useWebSocket({
  // Project and session context
  selectedProject,
  selectedSession,

  // Session lifecycle callbacks
  onSessionProcessing,
  onNavigateToSession,

  // Scroll behavior
  scrollToBottom,
  isNearBottom,
  autoScrollToBottom,
}) {
  // Initialize state management
  const state = useWebSocketState({
    initialSessionId: selectedSession?.id || null,
    initialPermissionMode: "bypassPermissions", // Fixed to bypass mode
  });

  // Permission mode is locked to bypassPermissions
  // No localStorage loading or mode switching allowed

  // Setup WebSocket message handlers (now writes to messageStore)
  useWebSocketHandlers({
    currentSessionId: state.currentSessionId,
    selectedSession,
    selectedProject,
    setIsLoading: state.setIsLoading,
    setCanAbortSession: state.setCanAbortSession,
    setAgentStatus: state.setAgentStatus,
    setIsSystemSessionChange: state.setIsSystemSessionChange,
    setTokenBudget: state.setTokenBudget,
    setCurrentSessionId: state.setCurrentSessionId,
    streamBufferRef: state.streamBufferRef,
    streamTimerRef: state.streamTimerRef,
    onSessionProcessing,
    onNavigateToSession,
  });

  // Return complete API
  return {
    // State values
    chatMessages: state.chatMessages,
    isLoading: state.isLoading,
    currentSessionId: state.currentSessionId,
    canAbortSession: state.canAbortSession,
    claudeStatus: state.claudeStatus,
    isSystemSessionChange: state.isSystemSessionChange,
    tokenBudget: state.tokenBudget,
    permissionMode: state.permissionMode,
    isUserScrolledUp: state.isUserScrolledUp,

    // State setters (for external control when needed)
    setChatMessages: state.setChatMessages,
    setIsLoading: state.setIsLoading,
    setCurrentSessionId: state.setCurrentSessionId,
    setCanAbortSession: state.setCanAbortSession,
    setAgentStatus: state.setAgentStatus,
    setIsSystemSessionChange: state.setIsSystemSessionChange,
    setTokenBudget: state.setTokenBudget,
    setPermissionMode: state.setPermissionMode,
    setIsUserScrolledUp: state.setIsUserScrolledUp,

    // Refs (for streaming)
    streamBufferRef: state.streamBufferRef,
    streamTimerRef: state.streamTimerRef,
  };
}
