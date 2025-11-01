import { useEffect } from 'react';
import { authenticatedFetch } from '../utils/api';
import safeLocalStorage from '../utils/safeLocalStorage';
import { decodeHtmlEntities, formatUsageLimitText } from '../components/ChatInterface/MessageRenderer';

/**
 * useWebSocket Hook
 *
 * Handles WebSocket message processing for Claude Code chat interface
 * Processes 16 different message types including:
 * - session-created, assistant-content, thinking, message-chunk, claude-complete
 * - tool-use, tool-result, user-message-chunk, code-execution, interactive-prompt
 * - session-aborted, file-ready, session-complete, projects_updated, taskmaster-project-updated
 * - session-permission-request
 *
 * @param {Object} params - WebSocket handler parameters
 * @param {Array} params.messages - WebSocket messages array
 * @param {string} params.currentSessionId - Current chat session ID
 * @param {Set} params.processingSessions - Set of sessions currently processing
 * @param {Function} params.setChatMessages - Update chat messages state
 * @param {Function} params.setIsLoading - Update loading state
 * @param {Function} params.setCanAbortSession - Update abort capability
 * @param {Function} params.setIsExecutingCode - Update code execution state
 * @param {Function} params.setInteractivePrompt - Update interactive prompt state
 * @param {Function} params.setPermissionMode - Update permission mode
 * @param {Function} params.setPermissionRequest - Update permission request
 * @param {Function} params.setIsSearchMode - Update search mode
 * @param {Function} params.setIsSnapshotMode - Update snapshot mode
 * @param {Function} params.setIsLoadingPdf - Update PDF loading state
 * @param {Function} params.onSessionActive - Callback when session becomes active
 * @param {Function} params.onSessionInactive - Callback when session becomes inactive
 * @param {Function} params.onSessionProcessing - Callback when session starts processing
 * @param {Function} params.onSessionNotProcessing - Callback when session stops processing
 * @param {Function} params.onReplaceTemporarySession - Callback to replace temporary session ID
 * @param {Function} params.onNavigateToSession - Callback to navigate to a session
 * @param {Function} params.createDiff - Function to create diff visualization
 * @param {Object} params.scrollContainerRef - Ref to scroll container
 * @param {Function} params.scrollToBottom - Function to scroll to bottom
 * @param {Function} params.isNearBottom - Function to check if near bottom
 * @param {boolean} params.autoScrollToBottom - Auto-scroll preference
 * @param {Object} params.streamBufferRef - Ref for streaming buffer
 * @param {Object} params.streamTimerRef - Ref for streaming timer
 * @param {Function} params.setIsSystemSessionChange - Set system session change flag
 * @param {Function} params.setClaudeStatus - Set Claude status
 * @param {Object} params.selectedProject - Selected project object
 * @param {Object} params.selectedSession - Selected session object
 * @param {Function} params.setCurrentSessionId - Set current session ID
 * @param {Function} params.setTokenBudget - Set token budget
 */
export function useWebSocket({
  messages,
  currentSessionId,
  processingSessions,
  setChatMessages,
  setIsLoading,
  setCanAbortSession,
  setIsExecutingCode,
  setInteractivePrompt,
  setPermissionMode,
  setPermissionRequest,
  setIsSearchMode,
  setIsSnapshotMode,
  setIsLoadingPdf,
  onSessionActive,
  onSessionInactive,
  onSessionProcessing,
  onSessionNotProcessing,
  onReplaceTemporarySession,
  onNavigateToSession,
  createDiff,
  scrollContainerRef,
  scrollToBottom,
  isNearBottom,
  autoScrollToBottom,
  // Additional parameters
  streamBufferRef,
  streamTimerRef,
  setIsSystemSessionChange,
  setClaudeStatus,
  selectedProject,
  selectedSession,
  setCurrentSessionId,
  setTokenBudget
}) {
  useEffect(() => {
    // Handle WebSocket messages
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];

      // Filter messages by session ID to prevent cross-session interference
      // Skip filtering for global messages that apply to all sessions
      const globalMessageTypes = ['projects_updated', 'taskmaster-project-updated', 'session-created', 'claude-complete'];
      const isGlobalMessage = globalMessageTypes.includes(latestMessage.type);

      // For new sessions (currentSessionId is null), allow messages through
      if (!isGlobalMessage && latestMessage.sessionId && currentSessionId && latestMessage.sessionId !== currentSessionId) {
        // Message is for a different session, ignore it
        console.log('⏭️ Skipping message for different session:', latestMessage.sessionId, 'current:', currentSessionId);
        return;
      }

      switch (latestMessage.type) {
        case 'session-created':
          // New session created by Claude CLI - we receive the real session ID here
          // Store it temporarily until conversation completes (prevents premature session association)
          if (latestMessage.sessionId && !currentSessionId) {
            sessionStorage.setItem('pendingSessionId', latestMessage.sessionId);
            
            // Session Protection: Replace temporary "new-session-*" identifier with real session ID
            // This maintains protection continuity - no gap between temp ID and real ID
            // The temporary session is removed and real session is marked as active
            if (onReplaceTemporarySession) {
              onReplaceTemporarySession(latestMessage.sessionId);
            }
          }
          break;

        case 'token-budget':
          // Token budget now fetched via API after message completion instead of WebSocket
          // This case is kept for compatibility but does nothing
          break;

        case 'claude-response':
          const messageData = latestMessage.data.message || latestMessage.data;
          
          // Handle Cursor streaming format (content_block_delta / content_block_stop)
          if (messageData && typeof messageData === 'object' && messageData.type) {
            if (messageData.type === 'content_block_delta' && messageData.delta?.text) {
              // Decode HTML entities and buffer deltas
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
              // Flush any buffered text and mark streaming message complete
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

          // Handle Claude CLI session duplication bug workaround:
          // When resuming a session, Claude CLI creates a new session instead of resuming.
          // We detect this by checking for system/init messages with session_id that differs
          // from our current session. When found, we need to switch the user to the new session.
          // This works exactly like new session detection - preserve messages during navigation.
          if (latestMessage.data.type === 'system' && 
              latestMessage.data.subtype === 'init' && 
              latestMessage.data.session_id && 
              currentSessionId && 
              latestMessage.data.session_id !== currentSessionId) {
            
            console.log('🔄 Claude CLI session duplication detected:', {
              originalSession: currentSessionId,
              newSession: latestMessage.data.session_id
            });
            
            // Mark this as a system-initiated session change to preserve messages
            // This works exactly like new session init - messages stay visible during navigation
            setIsSystemSessionChange(true);
            
            // Switch to the new session using React Router navigation
            // This triggers the session loading logic in App.jsx without a page reload
            if (onNavigateToSession) {
              onNavigateToSession(latestMessage.data.session_id);
            }
            return; // Don't process the message further, let the navigation handle it
          }
          
          // Handle system/init for new sessions (when currentSessionId is null)
          if (latestMessage.data.type === 'system' && 
              latestMessage.data.subtype === 'init' && 
              latestMessage.data.session_id && 
              !currentSessionId) {
            
            console.log('🔄 New session init detected:', {
              newSession: latestMessage.data.session_id
            });
            
            // Mark this as a system-initiated session change to preserve messages
            setIsSystemSessionChange(true);
            
            // Switch to the new session
            if (onNavigateToSession) {
              onNavigateToSession(latestMessage.data.session_id);
            }
            return; // Don't process the message further, let the navigation handle it
          }
          
          // For system/init messages that match current session, just ignore them
          if (latestMessage.data.type === 'system' && 
              latestMessage.data.subtype === 'init' && 
              latestMessage.data.session_id && 
              currentSessionId && 
              latestMessage.data.session_id === currentSessionId) {
            console.log('🔄 System init message for current session, ignoring');
            return; // Don't process the message further
          }
          
          // Handle different types of content in the response
          if (Array.isArray(messageData.content)) {
            for (const part of messageData.content) {
              if (part.type === 'tool_use') {
                // Add tool use message
                const toolInput = part.input ? JSON.stringify(part.input, null, 2) : '';
                setChatMessages(prev => [...prev, {
                  type: 'assistant',
                  content: '',
                  timestamp: new Date(),
                  isToolUse: true,
                  toolName: part.name,
                  toolInput: toolInput,
                  toolId: part.id,
                  toolResult: null // Will be updated when result comes in
                }]);
              } else if (part.type === 'text' && part.text?.trim()) {
                // Decode HTML entities and normalize usage limit message to local time
                let content = decodeHtmlEntities(part.text);
                content = formatUsageLimitText(content);

                // Add regular text message
                setChatMessages(prev => [...prev, {
                  type: 'assistant',
                  content: content,
                  timestamp: new Date()
                }]);
              }
            }
          } else if (typeof messageData.content === 'string' && messageData.content.trim()) {
            // Decode HTML entities and normalize usage limit message to local time
            let content = decodeHtmlEntities(messageData.content);
            content = formatUsageLimitText(content);

            // Add regular text message
            setChatMessages(prev => [...prev, {
              type: 'assistant',
              content: content,
              timestamp: new Date()
            }]);
          }
          
          // Handle tool results from user messages (these come separately)
          if (messageData.role === 'user' && Array.isArray(messageData.content)) {
            for (const part of messageData.content) {
              if (part.type === 'tool_result') {
                // Find the corresponding tool use and update it with the result
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
          break;
          
        case 'claude-output':
          {
            const cleaned = String(latestMessage.data || '');
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
          }
          break;
        case 'claude-interactive-prompt':
          // Handle interactive prompts from CLI
          setChatMessages(prev => [...prev, {
            type: 'assistant',
            content: latestMessage.data,
            timestamp: new Date(),
            isInteractivePrompt: true
          }]);
          break;

        case 'claude-error':
          setChatMessages(prev => [...prev, {
            type: 'error',
            content: `Error: ${latestMessage.error}`,
            timestamp: new Date()
          }]);
          break;
          
        case 'cursor-system':
          // Handle Cursor system/init messages similar to Claude
          try {
            const cdata = latestMessage.data;
            if (cdata && cdata.type === 'system' && cdata.subtype === 'init' && cdata.session_id) {
              // If we already have a session and this differs, switch (duplication/redirect)
              if (currentSessionId && cdata.session_id !== currentSessionId) {
                console.log('🔄 Cursor session switch detected:', { originalSession: currentSessionId, newSession: cdata.session_id });
                setIsSystemSessionChange(true);
                if (onNavigateToSession) {
                  onNavigateToSession(cdata.session_id);
                }
                return;
              }
              // If we don't yet have a session, adopt this one
              if (!currentSessionId) {
                console.log('🔄 Cursor new session init detected:', { newSession: cdata.session_id });
                setIsSystemSessionChange(true);
                if (onNavigateToSession) {
                  onNavigateToSession(cdata.session_id);
                }
                return;
              }
            }
            // For other cursor-system messages, avoid dumping raw objects to chat
          } catch (e) {
            console.warn('Error handling cursor-system message:', e);
          }
          break;
          
        case 'cursor-user':
          // Handle Cursor user messages (usually echoes)
          // Don't add user messages as they're already shown from input
          break;
          
        case 'cursor-tool-use':
          // Handle Cursor tool use messages
          setChatMessages(prev => [...prev, {
            type: 'assistant',
            content: `Using tool: ${latestMessage.tool} ${latestMessage.input ? `with ${latestMessage.input}` : ''}`,
            timestamp: new Date(),
            isToolUse: true,
            toolName: latestMessage.tool,
            toolInput: latestMessage.input
          }]);
          break;
        
        case 'cursor-error':
          // Show Cursor errors as error messages in chat
          setChatMessages(prev => [...prev, {
            type: 'error',
            content: `Cursor error: ${latestMessage.error || 'Unknown error'}`,
            timestamp: new Date()
          }]);
          break;
          
        case 'cursor-result':
          // Get session ID from message or fall back to current session
          const cursorCompletedSessionId = latestMessage.sessionId || currentSessionId;

          // Only update UI state if this is the current session
          if (cursorCompletedSessionId === currentSessionId) {
            setIsLoading(false);
            setCanAbortSession(false);
            setClaudeStatus(null);
          }

          // Always mark the completed session as inactive and not processing
          if (cursorCompletedSessionId) {
            if (onSessionInactive) {
              onSessionInactive(cursorCompletedSessionId);
            }
            if (onSessionNotProcessing) {
              onSessionNotProcessing(cursorCompletedSessionId);
            }
          }

          // Only process result for current session
          if (cursorCompletedSessionId === currentSessionId) {
            try {
              const r = latestMessage.data || {};
              const textResult = typeof r.result === 'string' ? r.result : '';
              // Flush buffered deltas before finalizing
              if (streamTimerRef.current) {
                clearTimeout(streamTimerRef.current);
                streamTimerRef.current = null;
              }
              const pendingChunk = streamBufferRef.current;
              streamBufferRef.current = '';

              setChatMessages(prev => {
                const updated = [...prev];
                // Try to consolidate into the last streaming assistant message
                const last = updated[updated.length - 1];
                if (last && last.type === 'assistant' && !last.isToolUse && last.isStreaming) {
                  // Replace streaming content with the final content so deltas don't remain
                  const finalContent = textResult && textResult.trim() ? textResult : (last.content || '') + (pendingChunk || '');
                  last.content = finalContent;
                  last.isStreaming = false;
                } else if (textResult && textResult.trim()) {
                  updated.push({ type: r.is_error ? 'error' : 'assistant', content: textResult, timestamp: new Date(), isStreaming: false });
                }
                return updated;
              });
            } catch (e) {
              console.warn('Error handling cursor-result message:', e);
            }
          }

          // Store session ID for future use and trigger refresh (for new sessions)
          const pendingCursorSessionId = sessionStorage.getItem('pendingSessionId');
          if (cursorCompletedSessionId && !currentSessionId && cursorCompletedSessionId === pendingCursorSessionId) {
            setCurrentSessionId(cursorCompletedSessionId);
            sessionStorage.removeItem('pendingSessionId');

            // Trigger a project refresh to update the sidebar with the new session
            if (window.refreshProjects) {
              setTimeout(() => window.refreshProjects(), 500);
            }
          }
          break;

        case 'cursor-output':
          // Handle Cursor raw terminal output; strip ANSI and ignore empty control-only payloads
          try {
            const raw = String(latestMessage.data ?? '');
            const cleaned = raw.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').trim();
            if (cleaned) {
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
          } catch (e) {
            console.warn('Error handling cursor-output message:', e);
          }
          break;
          
        case 'claude-complete':
          // Get session ID from message or fall back to current session
          const completedSessionId = latestMessage.sessionId || currentSessionId || sessionStorage.getItem('pendingSessionId');

          // Update UI state if this is the current session OR if we don't have a session ID yet (new session)
          if (completedSessionId === currentSessionId || !currentSessionId) {
            setIsLoading(false);
            setCanAbortSession(false);
            setClaudeStatus(null);

            // Fetch updated token usage after message completes
            if (selectedProject && selectedSession?.id) {
              const fetchUpdatedTokenUsage = async () => {
                try {
                  const url = `/api/projects/${selectedProject.name}/sessions/${selectedSession.id}/token-usage`;
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

          // Always mark the completed session as inactive and not processing
          if (completedSessionId) {
            if (onSessionInactive) {
              onSessionInactive(completedSessionId);
            }
            if (onSessionNotProcessing) {
              onSessionNotProcessing(completedSessionId);
            }
          }
          
          // If we have a pending session ID and the conversation completed successfully, use it
          const pendingSessionId = sessionStorage.getItem('pendingSessionId');
          if (pendingSessionId && !currentSessionId && latestMessage.exitCode === 0) {
                setCurrentSessionId(pendingSessionId);
            sessionStorage.removeItem('pendingSessionId');

            // No need to manually refresh - projects_updated WebSocket message will handle it
            console.log('✅ New session complete, ID set to:', pendingSessionId);
          }
          
          // Clear persisted chat messages after successful completion
          if (selectedProject && latestMessage.exitCode === 0) {
            safeLocalStorage.removeItem(`chat_messages_${selectedProject.name}`);
          }
          break;
          
        case 'session-aborted': {
          // Get session ID from message or fall back to current session
          const abortedSessionId = latestMessage.sessionId || currentSessionId;

          // Only update UI state if this is the current session
          if (abortedSessionId === currentSessionId) {
            setIsLoading(false);
            setCanAbortSession(false);
            setClaudeStatus(null);
          }

          // Always mark the aborted session as inactive and not processing
          if (abortedSessionId) {
            if (onSessionInactive) {
              onSessionInactive(abortedSessionId);
            }
            if (onSessionNotProcessing) {
              onSessionNotProcessing(abortedSessionId);
            }
          }

          setChatMessages(prev => [...prev, {
            type: 'assistant',
            content: 'Session interrupted by user.',
            timestamp: new Date()
          }]);
          break;
        }

        case 'session-status': {
          const statusSessionId = latestMessage.sessionId;
          const isCurrentSession = statusSessionId === currentSessionId ||
                                   (selectedSession && statusSessionId === selectedSession.id);
          if (isCurrentSession && latestMessage.isProcessing) {
            // Session is currently processing, restore UI state
            setIsLoading(true);
            setCanAbortSession(true);
            if (onSessionProcessing) {
              onSessionProcessing(statusSessionId);
            }
          }
          break;
        }

        case 'claude-status':
          // Handle Claude working status messages
          const statusData = latestMessage.data;
          if (statusData) {
            // Parse the status message to extract relevant information
            let statusInfo = {
              text: 'Working...',
              tokens: 0,
              can_interrupt: true
            };
            
            // Check for different status message formats
            if (statusData.message) {
              statusInfo.text = statusData.message;
            } else if (statusData.status) {
              statusInfo.text = statusData.status;
            } else if (typeof statusData === 'string') {
              statusInfo.text = statusData;
            }
            
            // Extract token count
            if (statusData.tokens) {
              statusInfo.tokens = statusData.tokens;
            } else if (statusData.token_count) {
              statusInfo.tokens = statusData.token_count;
            }
            
            // Check if can interrupt
            if (statusData.can_interrupt !== undefined) {
              statusInfo.can_interrupt = statusData.can_interrupt;
            }
            
            setClaudeStatus(statusInfo);
            setIsLoading(true);
            setCanAbortSession(statusInfo.can_interrupt);
          }
          break;
  
      }
    }
  }, [messages]);

  // No return value needed - this hook only handles side effects
}

