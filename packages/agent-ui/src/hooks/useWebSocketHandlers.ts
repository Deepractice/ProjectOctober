/**
 * useWebSocketHandlers Hook - REFACTORED
 *
 * WebSocket message handlers that write to global messageStore.
 * Handlers are registered once and use refs to access latest state.
 *
 * Key Changes:
 * - Handlers call messageStore actions directly
 * - Zero re-registrations (empty dependency array)
 * - Latest state accessed via stateRef
 */

import { useEffect, useRef } from "react";
import { useMessageStore } from "../stores";
import {
  decodeHtmlEntities,
  formatUsageLimitText,
} from "../components/ChatInterface/MessageRenderer";
import { authenticatedFetch } from "../utils/api";
import safeLocalStorage from "../utils/safeLocalStorage";
import type { ChatMessage } from "../types";

export function useWebSocketHandlers({
  // Current session context
  currentSessionId,
  selectedSession,
  selectedProject,

  // State setters (still needed for non-message state)
  setIsLoading,
  setCanAbortSession,
  setAgentStatus,
  setIsSystemSessionChange,
  setTokenBudget,
  setCurrentSessionId,

  // Streaming refs
  streamBufferRef,
  streamTimerRef,

  // Callbacks
  onSessionProcessing,
  onNavigateToSession,
}) {
  // Store latest state in ref to avoid re-registering handlers
  const stateRef = useRef({
    currentSessionId,
    selectedSession,
    selectedProject,
    setIsLoading,
    setCanAbortSession,
    setAgentStatus,
    setIsSystemSessionChange,
    setTokenBudget,
    setCurrentSessionId,
    onSessionProcessing,
    onNavigateToSession,
  });

  // Update ref when props change (no re-registration)
  useEffect(() => {
    stateRef.current = {
      currentSessionId,
      selectedSession,
      selectedProject,
      setIsLoading,
      setCanAbortSession,
      setAgentStatus,
      setIsSystemSessionChange,
      setTokenBudget,
      setCurrentSessionId,
      onSessionProcessing,
      onNavigateToSession,
    };
  });

  // Register handlers ONCE on mount
  useEffect(() => {
    const messageStore = useMessageStore.getState();

    // Helper: Flush streaming buffer to store
    const flushStreamBuffer = (sessionId: string, isStreaming: boolean = true) => {
      if (streamTimerRef.current) {
        clearTimeout(streamTimerRef.current);
        streamTimerRef.current = null;
      }

      const chunk = streamBufferRef.current;
      streamBufferRef.current = "";

      if (!chunk) return;

      // Add chunk using the new API
      messageStore.addAssistantChunk(sessionId, chunk);

      // If streaming is complete, mark the last message as finished
      if (!isStreaming) {
        const messages = messageStore.getDisplayMessages(sessionId);
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.type === "assistant" && lastMsg.content) {
          messageStore.updateLastAssistantMessage(sessionId, lastMsg.content);
        }
      }
    };

    // Handler: agent-response
    const handleAgentResponse = (msg: any) => {
      const { currentSessionId, setIsSystemSessionChange, onNavigateToSession } = stateRef.current;

      // Only process for current session
      if (msg.sessionId && currentSessionId && msg.sessionId !== currentSessionId) {
        return;
      }

      const messageData = msg.data?.message || msg.data;

      // Handle streaming format
      if (messageData && typeof messageData === "object" && messageData.type) {
        // Streaming delta
        if (messageData.type === "content_block_delta" && messageData.delta?.text) {
          const decodedText = decodeHtmlEntities(messageData.delta.text);
          streamBufferRef.current += decodedText;

          if (!streamTimerRef.current) {
            streamTimerRef.current = setTimeout(() => {
              flushStreamBuffer(currentSessionId, true);
            }, 100);
          }
          return;
        }

        // Streaming stop
        if (messageData.type === "content_block_stop") {
          flushStreamBuffer(currentSessionId, false);
          return;
        }
      }

      // Handle system/init messages for session changes
      if (
        messageData.type === "system" &&
        messageData.subtype === "init" &&
        messageData.session_id
      ) {
        if (currentSessionId && messageData.session_id !== currentSessionId) {
          setIsSystemSessionChange(true);
          if (onNavigateToSession) {
            onNavigateToSession(messageData.session_id);
          }
        } else if (!currentSessionId) {
          sessionStorage.setItem("pendingNavigationSessionId", messageData.session_id);
        }
        return;
      }

      // Handle content (text, tool use)
      if (Array.isArray(messageData.content)) {
        for (const part of messageData.content) {
          if (part.type === "tool_use") {
            // Add tool use message
            messageStore.addToolUse(
              currentSessionId,
              part.name,
              part.input ? JSON.stringify(part.input, null, 2) : "",
              part.id
            );
          } else if (part.type === "text" && part.text?.trim()) {
            let content = decodeHtmlEntities(part.text);
            content = formatUsageLimitText(content);
            // Add assistant message
            messageStore.addAssistantMessage(currentSessionId, content);
          }
        }
      } else if (typeof messageData.content === "string" && messageData.content.trim()) {
        let content = decodeHtmlEntities(messageData.content);
        content = formatUsageLimitText(content);
        // Add assistant message
        messageStore.addAssistantMessage(currentSessionId, content);
      }

      // Handle tool results
      if (messageData.role === "user" && Array.isArray(messageData.content)) {
        for (const part of messageData.content) {
          if (part.type === "tool_result") {
            // Update the tool result
            messageStore.updateToolResult(currentSessionId, part.tool_use_id, {
              content: part.content,
              isError: part.is_error,
              timestamp: new Date(),
            });
          }
        }
      }
    };

    // Handler: claude-output (streaming)
    const handleAgentOutput = (msg: any) => {
      const { currentSessionId } = stateRef.current;

      if (msg.sessionId && currentSessionId && msg.sessionId !== currentSessionId) {
        return;
      }

      const cleaned = String(msg.data || "");
      if (cleaned.trim()) {
        streamBufferRef.current += streamBufferRef.current ? `\n${cleaned}` : cleaned;

        if (!streamTimerRef.current) {
          streamTimerRef.current = setTimeout(() => {
            flushStreamBuffer(currentSessionId, true);
          }, 100);
        }
      }
    };

    // Handler: claude-error
    const handleAgentError = (msg: any) => {
      const { currentSessionId } = stateRef.current;

      if (msg.sessionId && currentSessionId && msg.sessionId !== currentSessionId) {
        return;
      }

      // Add error message
      messageStore.addErrorMessage(currentSessionId, msg.error);
    };

    // Handler: agent-complete
    const handleAgentComplete = (msg: any) => {
      const {
        currentSessionId,
        selectedProject,
        selectedSession,
        setIsLoading,
        setCanAbortSession,
        setAgentStatus,
        setTokenBudget,
        setCurrentSessionId,
      } = stateRef.current;

      const completedSessionId =
        msg.sessionId || currentSessionId || sessionStorage.getItem("pendingSessionId");

      if (completedSessionId === currentSessionId || !currentSessionId) {
        setIsLoading(false);
        setCanAbortSession(false);
        setAgentStatus(null);

        // Note: No need to clear optimistic messages anymore
        // All messages are stored in single sessionMessages list

        // Fetch updated token usage
        if (selectedProject && selectedSession?.id) {
          const fetchUpdatedTokenUsage = async () => {
            try {
              const url = `/api/sessions/${selectedSession.id}/token-usage`;
              const response = await authenticatedFetch(url);
              if (response.ok) {
                const data = await response.json();
                setTokenBudget(data);
              }
            } catch (error) {
              console.error("Failed to fetch updated token usage:", error);
            }
          };
          fetchUpdatedTokenUsage();
        }
      }

      const pendingSessionId = sessionStorage.getItem("pendingSessionId");
      const pendingNavigationSessionId = sessionStorage.getItem("pendingNavigationSessionId");

      if (pendingSessionId && !currentSessionId && msg.exitCode === 0) {
        setCurrentSessionId(pendingSessionId);
        sessionStorage.removeItem("pendingSessionId");

        if (pendingNavigationSessionId) {
          sessionStorage.removeItem("pendingNavigationSessionId");
          const { onNavigateToSession } = stateRef.current;
          if (onNavigateToSession) {
            setTimeout(() => onNavigateToSession(pendingNavigationSessionId), 700);
          }
        }
      }

      if (selectedProject && msg.exitCode === 0) {
        safeLocalStorage.removeItem(`chat_messages_${selectedProject.name}`);
      }
    };

    // Handler: session-aborted
    const handleSessionAborted = (msg: any) => {
      const { currentSessionId, setIsLoading, setCanAbortSession, setAgentStatus } =
        stateRef.current;
      const abortedSessionId = msg.sessionId || currentSessionId;

      if (abortedSessionId === currentSessionId) {
        setIsLoading(false);
        setCanAbortSession(false);
        setAgentStatus(null);
      }

      // Add abort message
      messageStore.addAssistantMessage(abortedSessionId, "Session interrupted by user.");
    };

    // Handler: session-status
    const handleSessionStatus = (msg: any) => {
      const {
        currentSessionId,
        selectedSession,
        setIsLoading,
        setCanAbortSession,
        onSessionProcessing,
      } = stateRef.current;

      const statusSessionId = msg.sessionId;
      const isCurrentSession =
        statusSessionId === currentSessionId ||
        (selectedSession && statusSessionId === selectedSession.id);

      if (isCurrentSession && msg.isProcessing) {
        setIsLoading(true);
        setCanAbortSession(true);
        if (onSessionProcessing) {
          onSessionProcessing(statusSessionId);
        }
      }
    };

    // Handler: claude-status
    const handleAgentStatus = (msg: any) => {
      const { setAgentStatus, setIsLoading, setCanAbortSession } = stateRef.current;
      const statusData = msg.data;

      if (statusData) {
        let statusInfo = {
          text: "Working...",
          tokens: 0,
          can_interrupt: true,
        };

        if (statusData.message) {
          statusInfo.text = statusData.message;
        } else if (statusData.status) {
          statusInfo.text = statusData.status;
        } else if (typeof statusData === "string") {
          statusInfo.text = statusData;
        }

        if (statusData.tokens) {
          statusInfo.tokens = statusData.tokens;
        } else if (statusData.token_count) {
          statusInfo.tokens = statusData.token_count;
        }

        if (statusData.can_interrupt !== undefined) {
          statusInfo.can_interrupt = statusData.can_interrupt;
        }

        setAgentStatus(statusInfo);
        setIsLoading(true);
        setCanAbortSession(statusInfo.can_interrupt);
      }
    };

    // Register all handlers (ONCE)
    console.log("✅ Registering WebSocket handlers (one-time)");
    messageStore.registerHandler("agent-response", handleAgentResponse);
    messageStore.registerHandler("claude-output", handleAgentOutput);
    messageStore.registerHandler("claude-error", handleAgentError);
    messageStore.registerHandler("agent-complete", handleAgentComplete);
    messageStore.registerHandler("session-aborted", handleSessionAborted);
    messageStore.registerHandler("session-status", handleSessionStatus);
    messageStore.registerHandler("claude-status", handleAgentStatus);

    // Cleanup on unmount
    return () => {
      console.log("🧹 Unregistering WebSocket handlers");
      messageStore.unregisterHandler("agent-response");
      messageStore.unregisterHandler("claude-output");
      messageStore.unregisterHandler("claude-error");
      messageStore.unregisterHandler("agent-complete");
      messageStore.unregisterHandler("session-aborted");
      messageStore.unregisterHandler("session-status");
      messageStore.unregisterHandler("claude-status");
    };
  }, []); // Empty deps - register once on mount
}
