/**
 * Message Store - Business Logic Layer
 * Subscribes to EventBus for message-related events
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { eventBus } from "~/core/eventBus";
import { isMessageEvent } from "~/core/events";
import type { ChatMessage } from "~/types";

export interface MessageState {
  // State
  sessionMessages: Map<string, ChatMessage[]>;

  // Actions
  addUserMessage: (sessionId: string, content: string, images?: any[]) => void;
  addAssistantMessage: (sessionId: string, content: string) => void;
  addStreamingChunk: (sessionId: string, chunk: string) => void;
  completeStreaming: (sessionId: string) => void;
  addToolUse: (sessionId: string, toolName: string, toolInput: string, toolId: string) => void;
  updateToolResult: (sessionId: string, toolId: string, result: any) => void;
  addErrorMessage: (sessionId: string, error: string) => void;
  clearSessionMessages: (sessionId: string) => void;
  getMessages: (sessionId: string) => ChatMessage[];
  setMessages: (sessionId: string, messages: ChatMessage[]) => void;
}

export const useMessageStore = create<MessageState>()(
  devtools(
    (set, get) => ({
      // Initial state
      sessionMessages: new Map(),

      // Actions
      addUserMessage: (sessionId, content, images) => {
        set((state) => {
          const newMap = new Map(state.sessionMessages);
          const messages = newMap.get(sessionId) || [];
          newMap.set(sessionId, [
            ...messages,
            {
              type: "user",
              content,
              images: images || [],
              timestamp: new Date(),
              id: `user-${Date.now()}-${Math.random()}`,
            },
          ]);
          return { sessionMessages: newMap };
        });
        console.log("[MessageStore] User message added:", sessionId);
      },

      addAssistantMessage: (sessionId, content) => {
        set((state) => {
          const newMap = new Map(state.sessionMessages);
          const messages = newMap.get(sessionId) || [];
          newMap.set(sessionId, [
            ...messages,
            {
              type: "assistant",
              content,
              timestamp: new Date(),
              id: `assistant-${Date.now()}-${Math.random()}`,
              isStreaming: false,
            },
          ]);
          return { sessionMessages: newMap };
        });
        console.log("[MessageStore] Assistant message added:", sessionId);
      },

      addStreamingChunk: (sessionId, chunk) => {
        set((state) => {
          const newMap = new Map(state.sessionMessages);
          const messages = newMap.get(sessionId) || [];
          const lastMsg = messages[messages.length - 1];

          if (lastMsg && lastMsg.type === "assistant" && lastMsg.isStreaming) {
            // Append to existing streaming message
            const updated = [...messages];
            updated[updated.length - 1] = {
              ...lastMsg,
              content: (lastMsg.content || "") + chunk,
            };
            newMap.set(sessionId, updated);
          } else {
            // Create new streaming message
            newMap.set(sessionId, [
              ...messages,
              {
                type: "assistant",
                content: chunk,
                timestamp: new Date(),
                id: `stream-${Date.now()}`,
                isStreaming: true,
              },
            ]);
          }
          return { sessionMessages: newMap };
        });
      },

      completeStreaming: (sessionId) => {
        set((state) => {
          const newMap = new Map(state.sessionMessages);
          const messages = newMap.get(sessionId);
          if (!messages) return {};

          const lastMsg = messages[messages.length - 1];
          if (lastMsg && lastMsg.type === "assistant" && lastMsg.isStreaming) {
            const updated = [...messages];
            updated[updated.length - 1] = {
              ...lastMsg,
              isStreaming: false,
            };
            newMap.set(sessionId, updated);
            return { sessionMessages: newMap };
          }
          return {};
        });
        console.log("[MessageStore] Streaming completed:", sessionId);
      },

      addToolUse: (sessionId, toolName, toolInput, toolId) => {
        set((state) => {
          const newMap = new Map(state.sessionMessages);
          const messages = newMap.get(sessionId) || [];
          newMap.set(sessionId, [
            ...messages,
            {
              type: "assistant",
              content: "",
              timestamp: new Date(),
              id: `tool-${toolId}`,
              isToolUse: true,
              toolName,
              toolInput,
              toolId,
              toolResult: null,
            },
          ]);
          return { sessionMessages: newMap };
        });
        console.log("[MessageStore] Tool use added:", sessionId, toolName);
      },

      updateToolResult: (sessionId, toolId, result) => {
        set((state) => {
          const newMap = new Map(state.sessionMessages);
          const messages = newMap.get(sessionId);
          if (!messages) return {};

          const updated = messages.map((msg) =>
            msg.type === "assistant" && msg.toolId === toolId ? { ...msg, toolResult: result } : msg
          );
          newMap.set(sessionId, updated);
          return { sessionMessages: newMap };
        });
        console.log("[MessageStore] Tool result updated:", sessionId, toolId);
      },

      addErrorMessage: (sessionId, error) => {
        set((state) => {
          const newMap = new Map(state.sessionMessages);
          const messages = newMap.get(sessionId) || [];
          newMap.set(sessionId, [
            ...messages,
            {
              type: "error",
              content: `Error: ${error}`,
              timestamp: new Date(),
              id: `error-${Date.now()}`,
            },
          ]);
          return { sessionMessages: newMap };
        });
        console.log("[MessageStore] Error message added:", sessionId);
      },

      clearSessionMessages: (sessionId) => {
        set((state) => {
          const newMap = new Map(state.sessionMessages);
          newMap.delete(sessionId);
          return { sessionMessages: newMap };
        });
        console.log("[MessageStore] Messages cleared:", sessionId);
      },

      getMessages: (sessionId) => {
        return get().sessionMessages.get(sessionId) || [];
      },

      setMessages: (sessionId, messages) => {
        set((state) => {
          const newMap = new Map(state.sessionMessages);
          newMap.set(sessionId, messages);
          return { sessionMessages: newMap };
        });
      },
    }),
    { name: "MessageStore" }
  )
);

// Subscribe to EventBus (auto-setup on module load)
eventBus.on(isMessageEvent).subscribe((event) => {
  const store = useMessageStore.getState();

  switch (event.type) {
    case "message.user":
      store.addUserMessage(event.sessionId, event.content, event.images);
      break;

    case "message.assistant":
      store.addAssistantMessage(event.sessionId, event.content);
      break;

    case "message.streaming":
      store.addStreamingChunk(event.sessionId, event.chunk);
      break;

    case "message.complete":
      store.completeStreaming(event.sessionId);
      break;

    case "message.tool":
      store.addToolUse(event.sessionId, event.toolName, event.toolInput, event.toolId);
      break;

    case "message.toolResult":
      store.updateToolResult(event.sessionId, event.toolId, event.result);
      break;

    case "message.error":
      store.addErrorMessage(event.sessionId, event.error.message);
      break;
  }
});
