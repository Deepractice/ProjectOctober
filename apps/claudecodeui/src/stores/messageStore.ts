/**
 * messageStore - Message Routing Layer
 *
 * Central message router that receives WebSocket messages from connectionStore
 * and routes them to appropriate handlers (mainly sessionStore).
 * Keeps recent messages for debugging purposes.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Message handler registry
const messageHandlers = new Map();

export const useMessageStore = create(
  devtools(
    (set, get) => ({
      // State
      recentMessages: [], // Keep last 100 messages for debugging
      processedMessageIds: new Set(),

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
        messageHandlers.set(type, handler);
        console.log('📝 Registered handler for:', type);
      },

      // Unregister message handler
      unregisterHandler: (type) => {
        messageHandlers.delete(type);
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
    }),
    { name: 'MessageStore' }
  )
);
