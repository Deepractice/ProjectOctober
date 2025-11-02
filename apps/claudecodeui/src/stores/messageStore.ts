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

      // Chat message storage (new)
      sessionMessages: new Map(),
      optimisticMessages: new Map(),
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

      // ====== Chat Message Actions (NEW) ======

      // Get display messages (server + optimistic merged)
      getDisplayMessages: (sessionId: string): ChatMessage[] => {
        if (!sessionId) return [];
        const server = get().sessionMessages.get(sessionId) || [];
        const optimistic = get().optimisticMessages.get(sessionId) || [];
        return [...server, ...optimistic];
      },

      // Add optimistic message (user sending)
      addOptimisticMessage: (sessionId: string, message: ChatMessage) => {
        set(state => {
          const newMap = new Map(state.optimisticMessages);
          const existing = newMap.get(sessionId) || [];
          const messageWithOptimistic = { ...message, isOptimistic: true, id: message.id || `opt-${Date.now()}` };
          newMap.set(sessionId, [...existing, messageWithOptimistic]);
          return { optimisticMessages: newMap };
        });
      },

      // Clear optimistic messages (after server confirms)
      clearOptimisticMessages: (sessionId: string) => {
        set(state => {
          const newMap = new Map(state.optimisticMessages);
          newMap.delete(sessionId);
          return { optimisticMessages: newMap };
        });
      },

      // Set server messages (replace all)
      setServerMessages: (sessionId: string, messages: ChatMessage[]) => {
        set(state => {
          const newMap = new Map(state.sessionMessages);
          newMap.set(sessionId, messages);
          return { sessionMessages: newMap };
        });
      },

      // Append single server message
      appendServerMessage: (sessionId: string, message: ChatMessage) => {
        set(state => {
          const newMap = new Map(state.sessionMessages);
          const existing = newMap.get(sessionId) || [];
          const messageWithId = { ...message, id: message.id || `msg-${Date.now()}-${Math.random()}` };
          newMap.set(sessionId, [...existing, messageWithId]);
          return { sessionMessages: newMap };
        });
      },

      // Update specific message
      updateMessage: (sessionId: string, messageId: string, updates: Partial<ChatMessage>) => {
        set(state => {
          const newMap = new Map(state.sessionMessages);
          const messages = newMap.get(sessionId);
          if (!messages) return {};

          const updated = messages.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          );
          newMap.set(sessionId, updated);
          return { sessionMessages: newMap };
        });
      },

      // Check if session has messages
      hasSessionMessages: (sessionId: string): boolean => {
        const messages = get().sessionMessages.get(sessionId);
        return messages !== undefined && messages.length > 0;
      },

      // Clear session messages
      clearSessionMessages: (sessionId: string) => {
        set(state => {
          const newSessionMap = new Map(state.sessionMessages);
          const newOptimisticMap = new Map(state.optimisticMessages);
          const newMetadataMap = new Map(state.messageMetadata);

          newSessionMap.delete(sessionId);
          newOptimisticMap.delete(sessionId);
          newMetadataMap.delete(sessionId);

          return {
            sessionMessages: newSessionMap,
            optimisticMessages: newOptimisticMap,
            messageMetadata: newMetadataMap
          };
        });
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
