/**
 * useWebSocketState Hook
 *
 * Centralized state management for WebSocket chat interface.
 * Reduces ChatInterface from 20+ useState calls to a single hook.
 *
 * Design Principles:
 * - Single Source of Truth: All WebSocket-related state in one place
 * - Clean API: Returns both state and setters for flexibility
 * - Initialized State: Handles initial values from props
 */

import { useState, useRef } from 'react';

export function useWebSocketState({
  initialSessionId = null,
  initialPermissionMode = 'default'
}) {
  // Chat messages state
  const [chatMessages, setChatMessages] = useState([]);

  // Loading and session state
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(initialSessionId);
  const [canAbortSession, setCanAbortSession] = useState(false);

  // Agent status state
  const [claudeStatus, setAgentStatus] = useState(null);

  // Session management state
  const [isSystemSessionChange, setIsSystemSessionChange] = useState(false);

  // Token budget state
  const [tokenBudget, setTokenBudget] = useState(null);

  // Permission mode state
  const [permissionMode, setPermissionMode] = useState(initialPermissionMode);

  // Scroll state
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  // Streaming refs - for buffering streaming responses
  const streamBufferRef = useRef('');
  const streamTimerRef = useRef(null);

  return {
    // State values
    chatMessages,
    isLoading,
    currentSessionId,
    canAbortSession,
    claudeStatus,
    isSystemSessionChange,
    tokenBudget,
    permissionMode,
    isUserScrolledUp,

    // State setters
    setChatMessages,
    setIsLoading,
    setCurrentSessionId,
    setCanAbortSession,
    setAgentStatus,
    setIsSystemSessionChange,
    setTokenBudget,
    setPermissionMode,
    setIsUserScrolledUp,

    // Refs
    streamBufferRef,
    streamTimerRef
  };
}
