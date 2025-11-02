/**
 * useWebSocketHandlers Hook
 *
 * Extracts WebSocket message handling logic from ChatInterface.
 * This hook manages all WebSocket message handlers and their state updates.
 *
 * Design Principles:
 * - Single Responsibility: Only handles WebSocket messages
 * - Loose Coupling: Accepts state setters as parameters instead of managing state
 * - Testable: Pure message handling logic
 */

import { useEffect, useRef } from 'react';
import { useMessageStore } from '../stores';
import { decodeHtmlEntities, formatUsageLimitText } from '../components/ChatInterface/MessageRenderer';
import { authenticatedFetch } from '../utils/api';
import safeLocalStorage from '../utils/safeLocalStorage';

export function useWebSocketHandlers({
  // Current session context
  currentSessionId,
  selectedSession,
  selectedProject,

  // State setters for chat messages
  setChatMessages,
  setIsLoading,
  setCanAbortSession,
  setClaudeStatus,
  setIsSystemSessionChange,
  setTokenBudget,
  setCurrentSessionId,

  // Streaming refs
  streamBufferRef,
  streamTimerRef,

  // Callbacks
  onSessionProcessing,
  onNavigateToSession,

  // Settings
  autoScrollToBottom,
  scrollToBottom,
  isNearBottom
}) {
  useEffect(() => {
    const messageStore = useMessageStore.getState();

    // Handler for claude-response messages
    const handleClaudeResponse = (msg) => {
      // Only process if this is for the current session
      if (msg.sessionId && currentSessionId && msg.sessionId !== currentSessionId) {
        return;
      }

      const messageData = msg.data.message || msg.data;

      // Handle streaming format
      if (messageData && typeof messageData === 'object' && messageData.type) {
        if (messageData.type === 'content_block_delta' && messageData.delta?.text) {
          const decodedText = decodeHtmlEntities(messageData.delta.text);
          streamBufferRef.current += decodedText;
          if (!streamTimerRef.current) {
            streamTimerRef.current = setTimeout(() => {
              const chunk = streamBufferRef.current;
              streamBufferRef.current = '';
              streamTimerRef.current = null;
              if (!chunk) return;
              setChatMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.type === 'assistant' && !last.isToolUse && last.isStreaming) {
                  last.content = (last.content || '') + chunk;
                } else {
                  updated.push({ type: 'assistant', content: chunk, timestamp: new Date(), isStreaming: true });
                }
                return updated;
              });
            }, 100);
          }
          return;
        }
        if (messageData.type === 'content_block_stop') {
          if (streamTimerRef.current) {
            clearTimeout(streamTimerRef.current);
            streamTimerRef.current = null;
          }
          const chunk = streamBufferRef.current;
          streamBufferRef.current = '';
          if (chunk) {
            setChatMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.type === 'assistant' && !last.isToolUse && last.isStreaming) {
                last.content = (last.content || '') + chunk;
              } else {
                updated.push({ type: 'assistant', content: chunk, timestamp: new Date(), isStreaming: true });
              }
              return updated;
            });
          }
          setChatMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.type === 'assistant' && last.isStreaming) {
              last.isStreaming = false;
            }
            return updated;
          });
          return;
        }
      }

      // Handle system/init messages for session changes
      if (messageData.type === 'system' &&
          messageData.subtype === 'init' &&
          messageData.session_id &&
          currentSessionId &&
          messageData.session_id !== currentSessionId) {
        setIsSystemSessionChange(true);
        if (onNavigateToSession) {
          onNavigateToSession(messageData.session_id);
        }
        return;
      }

      if (messageData.type === 'system' &&
          messageData.subtype === 'init' &&
          messageData.session_id &&
          !currentSessionId) {
        sessionStorage.setItem('pendingNavigationSessionId', messageData.session_id);
        return;
      }

      // Handle different content types
      if (Array.isArray(messageData.content)) {
        for (const part of messageData.content) {
          if (part.type === 'tool_use') {
            const toolInput = part.input ? JSON.stringify(part.input, null, 2) : '';
            setChatMessages(prev => [...prev, {
              type: 'assistant',
              content: '',
              timestamp: new Date(),
              isToolUse: true,
              toolName: part.name,
              toolInput: toolInput,
              toolId: part.id,
              toolResult: null
            }]);
          } else if (part.type === 'text' && part.text?.trim()) {
            let content = decodeHtmlEntities(part.text);
            content = formatUsageLimitText(content);
            setChatMessages(prev => [...prev, {
              type: 'assistant',
              content: content,
              timestamp: new Date()
            }]);
          }
        }
      } else if (typeof messageData.content === 'string' && messageData.content.trim()) {
        let content = decodeHtmlEntities(messageData.content);
        content = formatUsageLimitText(content);
        setChatMessages(prev => [...prev, {
          type: 'assistant',
          content: content,
          timestamp: new Date()
        }]);
      }

      // Handle tool results
      if (messageData.role === 'user' && Array.isArray(messageData.content)) {
        for (const part of messageData.content) {
          if (part.type === 'tool_result') {
            setChatMessages(prev => prev.map(msg => {
              if (msg.isToolUse && msg.toolId === part.tool_use_id) {
                return {
                  ...msg,
                  toolResult: {
                    content: part.content,
                    isError: part.is_error,
                    timestamp: new Date()
                  }
                };
              }
              return msg;
            }));
          }
        }
      }
    };

    // Handler for claude-output (streaming)
    const handleClaudeOutput = (msg) => {
      if (msg.sessionId && currentSessionId && msg.sessionId !== currentSessionId) {
        return;
      }

      const cleaned = String(msg.data || '');
      if (cleaned.trim()) {
        streamBufferRef.current += (streamBufferRef.current ? `\n${cleaned}` : cleaned);
        if (!streamTimerRef.current) {
          streamTimerRef.current = setTimeout(() => {
            const chunk = streamBufferRef.current;
            streamBufferRef.current = '';
            streamTimerRef.current = null;
            if (!chunk) return;
            setChatMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.type === 'assistant' && !last.isToolUse && last.isStreaming) {
                last.content = last.content ? `${last.content}\n${chunk}` : chunk;
              } else {
                updated.push({ type: 'assistant', content: chunk, timestamp: new Date(), isStreaming: true });
              }
              return updated;
            });
          }, 100);
        }
      }
    };

    // Handler for claude-error
    const handleClaudeError = (msg) => {
      if (msg.sessionId && currentSessionId && msg.sessionId !== currentSessionId) {
        return;
      }

      setChatMessages(prev => [...prev, {
        type: 'error',
        content: `Error: ${msg.error}`,
        timestamp: new Date()
      }]);
    };

    // Handler for claude-complete
    const handleClaudeComplete = (msg) => {
      const completedSessionId = msg.sessionId || currentSessionId || sessionStorage.getItem('pendingSessionId');

      if (completedSessionId === currentSessionId || !currentSessionId) {
        setIsLoading(false);
        setCanAbortSession(false);
        setClaudeStatus(null);

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
              console.error('Failed to fetch updated token usage:', error);
            }
          };
          fetchUpdatedTokenUsage();
        }
      }

      const pendingSessionId = sessionStorage.getItem('pendingSessionId');
      const pendingNavigationSessionId = sessionStorage.getItem('pendingNavigationSessionId');

      if (pendingSessionId && !currentSessionId && msg.exitCode === 0) {
        setCurrentSessionId(pendingSessionId);
        sessionStorage.removeItem('pendingSessionId');

        if (pendingNavigationSessionId) {
          sessionStorage.removeItem('pendingNavigationSessionId');
          if (onNavigateToSession) {
            setTimeout(() => onNavigateToSession(pendingNavigationSessionId), 700);
          }
        }
      }

      if (selectedProject && msg.exitCode === 0) {
        safeLocalStorage.removeItem(`chat_messages_${selectedProject.name}`);
      }
    };

    // Handler for session-aborted
    const handleSessionAborted = (msg) => {
      const abortedSessionId = msg.sessionId || currentSessionId;

      if (abortedSessionId === currentSessionId) {
        setIsLoading(false);
        setCanAbortSession(false);
        setClaudeStatus(null);
      }

      setChatMessages(prev => [...prev, {
        type: 'assistant',
        content: 'Session interrupted by user.',
        timestamp: new Date()
      }]);
    };

    // Handler for session-status
    const handleSessionStatus = (msg) => {
      const statusSessionId = msg.sessionId;
      const isCurrentSession = statusSessionId === currentSessionId ||
                               (selectedSession && statusSessionId === selectedSession.id);
      if (isCurrentSession && msg.isProcessing) {
        setIsLoading(true);
        setCanAbortSession(true);
        if (onSessionProcessing) {
          onSessionProcessing(statusSessionId);
        }
      }
    };

    // Handler for claude-status
    const handleClaudeStatus = (msg) => {
      const statusData = msg.data;
      if (statusData) {
        let statusInfo = {
          text: 'Working...',
          tokens: 0,
          can_interrupt: true
        };

        if (statusData.message) {
          statusInfo.text = statusData.message;
        } else if (statusData.status) {
          statusInfo.text = statusData.status;
        } else if (typeof statusData === 'string') {
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

        setClaudeStatus(statusInfo);
        setIsLoading(true);
        setCanAbortSession(statusInfo.can_interrupt);
      }
    };

    // Register all handlers
    messageStore.registerHandler('claude-response', handleClaudeResponse);
    messageStore.registerHandler('claude-output', handleClaudeOutput);
    messageStore.registerHandler('claude-error', handleClaudeError);
    messageStore.registerHandler('claude-complete', handleClaudeComplete);
    messageStore.registerHandler('session-aborted', handleSessionAborted);
    messageStore.registerHandler('session-status', handleSessionStatus);
    messageStore.registerHandler('claude-status', handleClaudeStatus);

    // Cleanup handlers on unmount
    return () => {
      messageStore.unregisterHandler('claude-response');
      messageStore.unregisterHandler('claude-output');
      messageStore.unregisterHandler('claude-error');
      messageStore.unregisterHandler('claude-complete');
      messageStore.unregisterHandler('session-aborted');
      messageStore.unregisterHandler('session-status');
      messageStore.unregisterHandler('claude-status');
    };
  }, [
    currentSessionId,
    selectedSession,
    selectedProject,
    onSessionProcessing,
    onNavigateToSession,
    autoScrollToBottom,
    scrollToBottom,
    isNearBottom,
    setChatMessages,
    setIsLoading,
    setCanAbortSession,
    setClaudeStatus,
    setIsSystemSessionChange,
    setTokenBudget,
    setCurrentSessionId,
    streamBufferRef,
    streamTimerRef
  ]);
}
