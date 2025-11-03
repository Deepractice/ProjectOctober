import { useState, useCallback, useMemo } from 'react';
import { api, authenticatedFetch } from '../utils/api';

/**
 * useMessages Hook
 * 
 * Manages message loading and state for both Agent (JSONL) and Cursor (SQLite) session messages
 * 
 * @param {Object} options
 * @param {Object} options.selectedProject - Currently selected project
 * @param {Function} options.decodeHtmlEntities - Helper function to decode HTML entities
 * @param {number} options.MESSAGES_PER_PAGE - Number of messages to load per page (default: 20)
 * 
 * @returns {Object} Message state and handlers
 */
export function useMessages({ selectedProject, decodeHtmlEntities, MESSAGES_PER_PAGE = 20 }) {
  // Message state
  const [sessionMessages, setSessionMessages] = useState([]);
  const [isLoadingSessionMessages, setIsLoadingSessionMessages] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [messagesOffset, setMessagesOffset] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [totalMessages, setTotalMessages] = useState(0);

  /**
   * Load Agent session messages (JSONL format)
   * Supports pagination
   */
  const loadSessionMessages = useCallback(async (sessionId, loadMore = false) => {
    if (!sessionId) return [];

    const isInitialLoad = !loadMore;
    if (isInitialLoad) {
      setIsLoadingSessionMessages(true);
    } else {
      setIsLoadingMoreMessages(true);
    }

    try {
      const currentOffset = loadMore ? messagesOffset : 0;
      const response = await api.sessionMessages(sessionId, MESSAGES_PER_PAGE, currentOffset);
      if (!response.ok) {
        throw new Error('Failed to load session messages');
      }
      const data = await response.json();
      
      // Handle paginated response
      if (data.hasMore !== undefined) {
        setHasMoreMessages(data.hasMore);
        setTotalMessages(data.total);
        setMessagesOffset(currentOffset + (data.messages?.length || 0));
        return data.messages || [];
      } else {
        // Backward compatibility for non-paginated response
        const messages = data.messages || [];
        setHasMoreMessages(false);
        setTotalMessages(messages.length);
        return messages;
      }
    } catch (error) {
      console.error('Error loading session messages:', error);
      return [];
    } finally {
      if (isInitialLoad) {
        setIsLoadingSessionMessages(false);
      } else {
        setIsLoadingMoreMessages(false);
      }
    }
  }, [messagesOffset, MESSAGES_PER_PAGE]);

  const loadCursorSessionMessages = useCallback(async (projectPath, sessionId) => {
    if (!projectPath || !sessionId) return [];
    setIsLoadingSessionMessages(true);
    try {
      const url = `/api/cursor/sessions/${encodeURIComponent(sessionId)}?projectPath=${encodeURIComponent(projectPath)}`;
      const res = await authenticatedFetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      const blobs = data?.session?.messages || [];
      const converted = [];
      const toolUseMap = {}; // Map to store tool uses by ID for linking results
      
      // First pass: process all messages maintaining order
      for (let blobIdx = 0; blobIdx < blobs.length; blobIdx++) {
        const blob = blobs[blobIdx];
        const content = blob.content;
        let text = '';
        let role = 'assistant';
        let reasoningText = null; // Move to outer scope
        try {
          // Handle different Cursor message formats
          if (content?.role && content?.content) {
            // Direct format: {"role":"user","content":[{"type":"text","text":"..."}]}
            // Skip system messages
            if (content.role === 'system') {
              continue;
            }
            
            // Handle tool messages
            if (content.role === 'tool') {
              // Tool result format - find the matching tool use message and update it
              if (Array.isArray(content.content)) {
                for (const item of content.content) {
                  if (item?.type === 'tool-result') {
                    // Map ApplyPatch to Edit for consistency
                    let toolName = item.toolName || 'Unknown Tool';
                    if (toolName === 'ApplyPatch') {
                      toolName = 'Edit';
                    }
                    const toolCallId = item.toolCallId || content.id;
                    const result = item.result || '';
                    
                    // Store the tool result to be linked later
                    if (toolUseMap[toolCallId]) {
                      toolUseMap[toolCallId].toolResult = {
                        content: result,
                        isError: false
                      };
                    } else {
                      // No matching tool use found, create a standalone result message
                      converted.push({
                        type: 'assistant',
                        content: '',
                        timestamp: new Date(Date.now() + blobIdx * 1000),
                        blobId: blob.id,
                        sequence: blob.sequence,
                        rowid: blob.rowid,
                        isToolUse: true,
                        toolName: toolName,
                        toolId: toolCallId,
                        toolInput: null,
                        toolResult: {
                          content: result,
                          isError: false
                        }
                      });
                    }
                  }
                }
              }
              continue; // Don't add tool messages as regular messages
            } else {
              // User or assistant messages
              role = content.role === 'user' ? 'user' : 'assistant';
              
              if (Array.isArray(content.content)) {
                // Extract text, reasoning, and tool calls from content array
                const textParts = [];
                
                for (const part of content.content) {
                  if (part?.type === 'text' && part?.text) {
                    textParts.push(decodeHtmlEntities(part.text));
                  } else if (part?.type === 'reasoning' && part?.text) {
                    // Handle reasoning type - will be displayed in a collapsible section
                    reasoningText = decodeHtmlEntities(part.text);
                  } else if (part?.type === 'tool-call') {
                    // First, add any text/reasoning we've collected so far as a message
                    if (textParts.length > 0 || reasoningText) {
                      converted.push({
                        type: role,
                        content: textParts.join('\n'),
                        reasoning: reasoningText,
                        timestamp: new Date(Date.now() + blobIdx * 1000),
                        blobId: blob.id,
                        sequence: blob.sequence,
                        rowid: blob.rowid
                      });
                      textParts.length = 0;
                      reasoningText = null;
                    }
                    
                    // Tool call in assistant message - format like Agent
                    // Map ApplyPatch to Edit for consistency with Agent
                    let toolName = part.toolName || 'Unknown Tool';
                    if (toolName === 'ApplyPatch') {
                      toolName = 'Edit';
                    }
                    const toolId = part.toolCallId || `tool_${blobIdx}`;
                    
                    // Create a tool use message with Agent format
                    // Map Cursor args format to Agent format
                    let toolInput = part.args;
                    
                    if (toolName === 'Edit' && part.args) {
                      // ApplyPatch uses 'patch' format, convert to Edit format
                      if (part.args.patch) {
                        // Parse the patch to extract old and new content
                        const patchLines = part.args.patch.split('\n');
                        let oldLines = [];
                        let newLines = [];
                        let inPatch = false;
                        
                        for (const line of patchLines) {
                          if (line.startsWith('@@')) {
                            inPatch = true;
                          } else if (inPatch) {
                            if (line.startsWith('-')) {
                              oldLines.push(line.substring(1));
                            } else if (line.startsWith('+')) {
                              newLines.push(line.substring(1));
                            } else if (line.startsWith(' ')) {
                              // Context line - add to both
                              oldLines.push(line.substring(1));
                              newLines.push(line.substring(1));
                            }
                          }
                        }
                        
                        const filePath = part.args.file_path;
                        const absolutePath = filePath && !filePath.startsWith('/') 
                          ? `${projectPath}/${filePath}` 
                          : filePath;
                        toolInput = {
                          file_path: absolutePath,
                          old_string: oldLines.join('\n') || part.args.patch,
                          new_string: newLines.join('\n') || part.args.patch
                        };
                      } else {
                        // Direct edit format
                        toolInput = part.args;
                      }
                    } else if (toolName === 'Read' && part.args) {
                      // Map 'path' to 'file_path'
                      // Convert relative path to absolute if needed
                      const filePath = part.args.path || part.args.file_path;
                      const absolutePath = filePath && !filePath.startsWith('/') 
                        ? `${projectPath}/${filePath}` 
                        : filePath;
                      toolInput = {
                        file_path: absolutePath
                      };
                    } else if (toolName === 'Write' && part.args) {
                      // Map fields for Write tool
                      const filePath = part.args.path || part.args.file_path;
                      const absolutePath = filePath && !filePath.startsWith('/') 
                        ? `${projectPath}/${filePath}` 
                        : filePath;
                      toolInput = {
                        file_path: absolutePath,
                        content: part.args.contents || part.args.content
                      };
                    }
                    
                    const toolMessage = {
                      type: 'assistant',
                      content: '',
                      timestamp: new Date(Date.now() + blobIdx * 1000),
                      blobId: blob.id,
                      sequence: blob.sequence,
                      rowid: blob.rowid,
                      isToolUse: true,
                      toolName: toolName,
                      toolId: toolId,
                      toolInput: toolInput ? JSON.stringify(toolInput) : null,
                      toolResult: null // Will be filled when we get the tool result
                    };
                    converted.push(toolMessage);
                    toolUseMap[toolId] = toolMessage; // Store for linking results
                  } else if (part?.type === 'tool_use') {
                    // Old format support
                    if (textParts.length > 0 || reasoningText) {
                      converted.push({
                        type: role,
                        content: textParts.join('\n'),
                        reasoning: reasoningText,
                        timestamp: new Date(Date.now() + blobIdx * 1000),
                        blobId: blob.id,
                        sequence: blob.sequence,
                        rowid: blob.rowid
                      });
                      textParts.length = 0;
                      reasoningText = null;
                    }
                    
                    const toolName = part.name || 'Unknown Tool';
                    const toolId = part.id || `tool_${blobIdx}`;
                    
                    const toolMessage = {
                      type: 'assistant',
                      content: '',
                      timestamp: new Date(Date.now() + blobIdx * 1000),
                      blobId: blob.id,
                      sequence: blob.sequence,
                      rowid: blob.rowid,
                      isToolUse: true,
                      toolName: toolName,
                      toolId: toolId,
                      toolInput: part.input ? JSON.stringify(part.input) : null,
                      toolResult: null
                    };
                    converted.push(toolMessage);
                    toolUseMap[toolId] = toolMessage;
                  } else if (typeof part === 'string') {
                    textParts.push(part);
                  }
                }
                
                // Add any remaining text/reasoning
                if (textParts.length > 0) {
                  text = textParts.join('\n');
                  if (reasoningText && !text) {
                    // Just reasoning, no text
                    converted.push({
                      type: role,
                      content: '',
                      reasoning: reasoningText,
                      timestamp: new Date(Date.now() + blobIdx * 1000),
                      blobId: blob.id,
                      sequence: blob.sequence,
                      rowid: blob.rowid
                    });
                    text = ''; // Clear to avoid duplicate
                  }
                } else {
                  text = '';
                }
              } else if (typeof content.content === 'string') {
                text = content.content;
              }
            }
          } else if (content?.message?.role && content?.message?.content) {
            // Nested message format
            if (content.message.role === 'system') {
              continue;
            }
            role = content.message.role === 'user' ? 'user' : 'assistant';
            if (Array.isArray(content.message.content)) {
              text = content.message.content
                .map(p => (typeof p === 'string' ? p : (p?.text || '')))
                .filter(Boolean)
                .join('\n');
            } else if (typeof content.message.content === 'string') {
              text = content.message.content;
            }
          }
        } catch (e) {
          console.log('Error parsing blob content:', e);
        }
        if (text && text.trim()) {
          const message: any = {
            type: role,
            content: text,
            timestamp: new Date(Date.now() + blobIdx * 1000),
            blobId: blob.id,
            sequence: blob.sequence,
            rowid: blob.rowid
          };

          // Add reasoning if we have it
          if (reasoningText) {
            message.reasoning = reasoningText;
          }

          converted.push(message);
        }
      }
      
      // Sort messages by sequence/rowid to maintain chronological order
      converted.sort((a, b) => {
        // First sort by sequence if available (clean 1,2,3... numbering)
        if (a.sequence !== undefined && b.sequence !== undefined) {
          return a.sequence - b.sequence;
        }
        // Then try rowid (original SQLite row IDs)
        if (a.rowid !== undefined && b.rowid !== undefined) {
          return a.rowid - b.rowid;
        }
        // Fallback to timestamp
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });
      
      return converted;
    } catch (e) {
      console.error('Error loading Cursor session messages:', e);
      return [];
    } finally {
      setIsLoadingSessionMessages(false);
    }
  }, []);

  /**
   * Convert raw session messages to display format
   * Processes tool uses and results, filters system messages
   */
  const convertSessionMessages = useCallback((rawMessages) => {
    const converted = [];
    const toolResults = new Map(); // Map tool_use_id to tool result
    
    // First pass: collect all tool results
    for (const msg of rawMessages) {
      if (msg.message?.role === 'user' && Array.isArray(msg.message?.content)) {
        for (const part of msg.message.content) {
          if (part.type === 'tool_result') {
            toolResults.set(part.tool_use_id, {
              content: part.content,
              isError: part.is_error,
              timestamp: new Date(msg.timestamp || Date.now()),
              // Extract structured tool result data (e.g., for Grep, Glob)
              toolUseResult: msg.toolUseResult || null
            });
          }
        }
      }
    }
    
    // Second pass: process messages and attach tool results to tool uses
    for (const msg of rawMessages) {
      // Handle user messages
      if (msg.message?.role === 'user' && msg.message?.content) {
        let content = '';
        let messageType = 'user';
        
        if (Array.isArray(msg.message.content)) {
          // Handle array content, but skip tool results (they're attached to tool uses)
          const textParts = [];
          
          for (const part of msg.message.content) {
            if (part.type === 'text') {
              textParts.push(decodeHtmlEntities(part.text));
            }
            // Skip tool_result parts - they're handled in the first pass
          }
          
          content = textParts.join('\n');
        } else if (typeof msg.message.content === 'string') {
          content = decodeHtmlEntities(msg.message.content);
        } else {
          content = decodeHtmlEntities(String(msg.message.content));
        }
        
        // Skip command messages, system messages, and empty content
        const shouldSkip = !content ||
                          content.startsWith('<command-name>') ||
                          content.startsWith('<command-message>') ||
                          content.startsWith('<command-args>') ||
                          content.startsWith('<local-command-stdout>') ||
                          content.startsWith('<system-reminder>') ||
                          content.startsWith('Caveat:') ||
                          content.startsWith('This session is being continued from a previous') ||
                          content.startsWith('[Request interrupted');

        if (!shouldSkip) {
          // Unescape double-escaped newlines and other escape sequences
          content = content.replace(/\\n/g, '\n')
                           .replace(/\\t/g, '\t')
                           .replace(/\\r/g, '\r');
          converted.push({
            type: messageType,
            content: content,
            timestamp: msg.timestamp || new Date().toISOString()
          });
        }
      }
      
      // Handle assistant messages
      else if (msg.message?.role === 'assistant' && msg.message?.content) {
        if (Array.isArray(msg.message.content)) {
          for (const part of msg.message.content) {
            if (part.type === 'text') {
              // Unescape double-escaped newlines and other escape sequences
              let text = part.text;
              if (typeof text === 'string') {
                text = text.replace(/\\n/g, '\n')
                           .replace(/\\t/g, '\t')
                           .replace(/\\r/g, '\r');
              }
              converted.push({
                type: 'assistant',
                content: text,
                timestamp: msg.timestamp || new Date().toISOString()
              });
            } else if (part.type === 'tool_use') {
              // Get the corresponding tool result
              const toolResult = toolResults.get(part.id);

              converted.push({
                type: 'assistant',
                content: '',
                timestamp: msg.timestamp || new Date().toISOString(),
                isToolUse: true,
                toolName: part.name,
                toolInput: JSON.stringify(part.input),
                toolResult: toolResult ? {
                  content: typeof toolResult.content === 'string' ? toolResult.content : JSON.stringify(toolResult.content),
                  isError: toolResult.isError,
                  toolUseResult: toolResult.toolUseResult
                } : null,
                toolError: toolResult?.isError || false,
                toolResultTimestamp: toolResult?.timestamp || new Date()
              });
            }
          }
        } else if (typeof msg.message.content === 'string') {
          // Unescape double-escaped newlines and other escape sequences
          let text = msg.message.content;
          text = text.replace(/\\n/g, '\n')
                     .replace(/\\t/g, '\t')
                     .replace(/\\r/g, '\r');
          converted.push({
            type: 'assistant',
            content: text,
            timestamp: msg.timestamp || new Date().toISOString()
          });
        }
      }
    }
    
    return converted;
  }, [decodeHtmlEntities]);

  // Memoize expensive convertSessionMessages operation
  const convertedMessages = useMemo(() => {
    return convertSessionMessages(sessionMessages);
  }, [sessionMessages, convertSessionMessages]);

  return {
    // State
    sessionMessages,
    setSessionMessages,
    isLoadingSessionMessages,
    isLoadingMoreMessages,
    messagesOffset,
    setMessagesOffset,
    hasMoreMessages,
    setHasMoreMessages,
    totalMessages,
    setTotalMessages,

    // Functions
    loadSessionMessages,
    loadCursorSessionMessages,
    convertSessionMessages,
    convertedMessages,
    
    // Constants
    MESSAGES_PER_PAGE
  };
}
