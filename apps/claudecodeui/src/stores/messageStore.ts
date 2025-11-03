/**
 * messageStore - Message Routing Layer
 *
 * Central message router that receives WebSocket messages from connectionStore
 * and routes them to appropriate handlers (mainly sessionStore).
 * Keeps recent messages for debugging purposes.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { MessageState, WebSocketMessageType, ChatMessage } from '../types';

// Message handler registry
const messageHandlers = new Map<WebSocketMessageType, (message: any) => void>();

export const useMessageStore = create<MessageState>()(
  devtools(
    (set, get) => ({
      // Message routing state (existing)
      recentMessages: [], // Keep last 100 messages for debugging
      processedMessageIds: new Set(),

      // Chat message storage - Single source of truth
      sessionMessages: new Map(),
      loadingSessions: new Set(),
      messageMetadata: new Map(),

      // Handle incoming WebSocket message
      handleMessage: (message) => {
        // Create unique message ID for deduplication
        const messageId = `${message.type}-${message.sessionId || 'null'}-${message.timestamp || Date.now()}`;

        // Skip if already processed
        if (get().processedMessageIds.has(messageId)) {
          console.log('⏭️ Skipping already processed message:', messageId);
          return;
        }

        // Mark as processed
        set((state) => {
          const newProcessedIds = new Set(state.processedMessageIds);
          newProcessedIds.add(messageId);

          // Keep set size manageable (last 100)
          if (newProcessedIds.size > 100) {
            const oldestId = Array.from(newProcessedIds)[0];
            newProcessedIds.delete(oldestId);
          }

          return { processedMessageIds: newProcessedIds };
        });

        // Record message for debugging
        set((state) => ({
          recentMessages: [
            ...state.recentMessages.slice(-99),
            { ...message, timestamp: Date.now(), messageId }
          ]
        }));

        console.log('🎯 Processing message:', message.type, 'sessionId:', message.sessionId);

        // Route to handler
        const handler = messageHandlers.get(message.type);
        if (handler) {
          handler(message);
        } else {
          console.warn('⚠️ Unhandled message type:', message.type);
        }
      },

      // Register message handler
      registerHandler: (type, handler) => {
        const wasRegistered = messageHandlers.has(type);
        messageHandlers.set(type, handler);
        console.log(`📝 ${wasRegistered ? 'RE-REGISTERING' : 'Registering'} handler for:`, type,
                    '| Total handlers:', messageHandlers.size,
                    '| Stack:', new Error().stack?.split('\n')[2]?.trim());
      },

      // Unregister message handler
      unregisterHandler: (type) => {
        const wasRegistered = messageHandlers.has(type);
        messageHandlers.delete(type);
        console.log(`🗑️ ${wasRegistered ? 'Unregistered' : 'Attempted to unregister non-existent'} handler:`, type,
                    '| Total handlers:', messageHandlers.size);
      },

      // Clear messages
      clearMessages: () => set({ recentMessages: [], processedMessageIds: new Set() }),

      // Get messages by type
      getMessagesByType: (type) => {
        return get().recentMessages.filter(msg => msg.type === type);
      },

      // Get messages by session
      getMessagesBySession: (sessionId) => {
        return get().recentMessages.filter(msg => msg.sessionId === sessionId);
      },

      // ====== Unified Message Operations ======

      // Add user message (sent by user)
      addUserMessage: (sessionId: string, content: string, images?: any[]) => {
        set(state => {
          const newMap = new Map(state.sessionMessages);
          const existing = newMap.get(sessionId) || [];
          const userMessage: ChatMessage = {
            type: 'user',
            content,
            images: images || [],
            timestamp: new Date(),
            id: `user-${Date.now()}-${Math.random()}`
          };
          newMap.set(sessionId, [...existing, userMessage]);
          return { sessionMessages: newMap };
        });
        console.log('💬 Added user message to session:', sessionId);
      },

      // Add complete assistant message
      addAssistantMessage: (sessionId: string, content: string) => {
        set(state => {
          const newMap = new Map(state.sessionMessages);
          const existing = newMap.get(sessionId) || [];
          const assistantMessage: ChatMessage = {
            type: 'assistant',
            content,
            timestamp: new Date(),
            id: `assistant-${Date.now()}-${Math.random()}`,
            isStreaming: false
          };
          newMap.set(sessionId, [...existing, assistantMessage]);
          return { sessionMessages: newMap };
        });
        console.log('🤖 Added assistant message to session:', sessionId);
      },

      // Add streaming chunk to last assistant message
      addAssistantChunk: (sessionId: string, chunk: string) => {
        set(state => {
          const newMap = new Map(state.sessionMessages);
          const messages = newMap.get(sessionId) || [];

          // Find or create streaming assistant message
          const lastMsg = messages[messages.length - 1];
          if (lastMsg && lastMsg.type === 'assistant' && lastMsg.isStreaming) {
            // Update existing streaming message
            const updated = [...messages];
            updated[updated.length - 1] = {
              ...lastMsg,
              content: (lastMsg.content || '') + chunk
            };
            newMap.set(sessionId, updated);
          } else {
            // Create new streaming message
            const streamingMsg: ChatMessage = {
              type: 'assistant',
              content: chunk,
              timestamp: new Date(),
              id: `assistant-stream-${Date.now()}`,
              isStreaming: true
            };
            newMap.set(sessionId, [...messages, streamingMsg]);
          }
          return { sessionMessages: newMap };
        });
      },

      // Mark last assistant message as complete (stop streaming)
      updateLastAssistantMessage: (sessionId: string, content: string) => {
        set(state => {
          const newMap = new Map(state.sessionMessages);
          const messages = newMap.get(sessionId);
          if (!messages || messages.length === 0) return {};

          const lastMsg = messages[messages.length - 1];
          if (lastMsg.type === 'assistant') {
            const updated = [...messages];
            updated[updated.length - 1] = {
              ...lastMsg,
              content,
              isStreaming: false
            };
            newMap.set(sessionId, updated);
            return { sessionMessages: newMap };
          }
          return {};
        });
      },

      // Add tool use message
      addToolUse: (sessionId: string, toolName: string, toolInput: string, toolId: string) => {
        set(state => {
          const newMap = new Map(state.sessionMessages);
          const existing = newMap.get(sessionId) || [];
          const toolMessage: ChatMessage = {
            type: 'assistant',
            content: '',
            timestamp: new Date(),
            id: `tool-${toolId}`,
            isToolUse: true,
            toolName,
            toolInput,
            toolId,
            toolResult: null
          };
          newMap.set(sessionId, [...existing, toolMessage]);
          return { sessionMessages: newMap };
        });
      },

      // Update tool result
      updateToolResult: (sessionId: string, toolId: string, result: any) => {
        set(state => {
          const newMap = new Map(state.sessionMessages);
          const messages = newMap.get(sessionId);
          if (!messages) return {};

          const updated = messages.map(msg =>
            msg.toolId === toolId ? { ...msg, toolResult: result } : msg
          );
          newMap.set(sessionId, updated);
          return { sessionMessages: newMap };
        });
      },

      // Add error message
      addErrorMessage: (sessionId: string, error: string) => {
        set(state => {
          const newMap = new Map(state.sessionMessages);
          const existing = newMap.get(sessionId) || [];
          const errorMessage: ChatMessage = {
            type: 'error',
            content: `Error: ${error}`,
            timestamp: new Date(),
            id: `error-${Date.now()}`
          };
          newMap.set(sessionId, [...existing, errorMessage]);
          return { sessionMessages: newMap };
        });
      },

      // ====== Session Lifecycle ======

      // Migrate session messages from old ID to new ID
      migrateSession: (oldSessionId: string, newSessionId: string) => {
        set(state => {
          const newMap = new Map(state.sessionMessages);
          const newMetadataMap = new Map(state.messageMetadata);

          // Migrate messages
          const messages = newMap.get(oldSessionId);
          if (messages) {
            newMap.set(newSessionId, messages);
            newMap.delete(oldSessionId);
          }

          // Migrate metadata
          const metadata = newMetadataMap.get(oldSessionId);
          if (metadata) {
            newMetadataMap.set(newSessionId, metadata);
            newMetadataMap.delete(oldSessionId);
          }

          return {
            sessionMessages: newMap,
            messageMetadata: newMetadataMap
          };
        });
        console.log('🔄 Migrated session messages:', oldSessionId, '→', newSessionId);
      },

      // Clear session messages
      clearSessionMessages: (sessionId: string) => {
        set(state => {
          const newSessionMap = new Map(state.sessionMessages);
          const newMetadataMap = new Map(state.messageMetadata);

          newSessionMap.delete(sessionId);
          newMetadataMap.delete(sessionId);

          return {
            sessionMessages: newSessionMap,
            messageMetadata: newMetadataMap
          };
        });
      },

      // ====== Legacy Methods (for backward compatibility) ======

      // Get display messages (now just returns sessionMessages)
      getDisplayMessages: (sessionId: string): ChatMessage[] => {
        if (!sessionId) return [];
        return get().sessionMessages.get(sessionId) || [];
      },

      // Set server messages (replace all) - kept for loading from API
      setServerMessages: (sessionId: string, messages: ChatMessage[]) => {
        set(state => {
          const newMap = new Map(state.sessionMessages);
          newMap.set(sessionId, messages);
          return { sessionMessages: newMap };
        });
      },

      // Check if session has messages
      hasSessionMessages: (sessionId: string): boolean => {
        const messages = get().sessionMessages.get(sessionId);
        return messages !== undefined && messages.length > 0;
      },

      // Set loading state
      setLoading: (sessionId: string, loading: boolean) => {
        set(state => {
          const newSet = new Set(state.loadingSessions);
          if (loading) {
            newSet.add(sessionId);
          } else {
            newSet.delete(sessionId);
          }
          return { loadingSessions: newSet };
        });
      },

      // Set metadata
      setMetadata: (sessionId: string, metadata: import('../types').MessageMetadata) => {
        set(state => {
          const newMap = new Map(state.messageMetadata);
          newMap.set(sessionId, metadata);
          return { messageMetadata: newMap };
        });
      },
    }),
    { name: 'MessageStore' }
  )
);
