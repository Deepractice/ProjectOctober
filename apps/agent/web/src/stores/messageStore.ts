/**
 * Message Store
 * Manages messages and subscribes to SDK session events
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useAgentStore } from "./agentStore";
import type { ChatMessage } from "~/types";

interface MessageState {
  sessionMessages: Map<string, ChatMessage[]>;
  activeSubscriptions: Map<string, () => void>;

  // Actions
  sendMessage: (sessionId: string, content: string, images?: File[]) => Promise<void>;
  subscribeToSession: (sessionId: string) => void;
  unsubscribeFromSession: (sessionId: string) => void;
  getMessages: (sessionId: string) => ChatMessage[];
  setMessages: (sessionId: string, messages: ChatMessage[]) => void;
  clearMessages: (sessionId: string) => void;

  // Internal
  addUserMessage: (sessionId: string, content: string, images?: any[]) => void;
  addAgentChunk: (sessionId: string, chunk: string) => void;
  completeStreaming: (sessionId: string) => void;
  addToolMessage: (sessionId: string, toolName: string, toolInput: string, toolId: string) => void;
  addError: (sessionId: string, error: string) => void;
}

export const useMessageStore = create<MessageState>()(
  devtools(
    (set, get) => ({
      sessionMessages: new Map(),
      activeSubscriptions: new Map(),

      // Send message via SDK
      sendMessage: async (sessionId, content, images) => {
        try {
          console.log("[MessageStore] Sending message to session:", sessionId);

          // 1. Optimistically add user message
          get().addUserMessage(sessionId, content, images);

          // 2. Get session from agentStore
          const session = useAgentStore.getState().getSession(sessionId);

          // 3. Send via SDK (supports multi-modal)
          if (images && images.length > 0) {
            const contentBlocks: any[] = [{ type: "text", text: content }];

            for (const file of images) {
              const base64 = await fileToBase64(file);
              contentBlocks.push({
                type: "image",
                source: {
                  type: "base64",
                  media_type: file.type,
                  data: base64,
                },
              });
            }

            await session.send(contentBlocks);
          } else {
            await session.send(content);
          }

          console.log("[MessageStore] Message sent successfully");
        } catch (error) {
          console.error("[MessageStore] Failed to send message:", error);
          get().addError(sessionId, (error as Error).message);
          throw error;
        }
      },

      // Subscribe to session events
      subscribeToSession: (sessionId) => {
        const { activeSubscriptions } = get();

        if (activeSubscriptions.has(sessionId)) {
          console.log("[MessageStore] Already subscribed to:", sessionId);
          return;
        }

        console.log("[MessageStore] Subscribing to session:", sessionId);

        const session = useAgentStore.getState().getSession(sessionId);

        // Event handlers
        const handleSpeaking = ({ chunk }: any) => {
          if (chunk) {
            get().addAgentChunk(sessionId, chunk);
          }
        };

        const handleStreamEnd = () => {
          get().completeStreaming(sessionId);
        };

        const handleToolCalling = ({ toolName, input, toolId }: any) => {
          get().addToolMessage(sessionId, toolName, JSON.stringify(input, null, 2), toolId || "");
        };

        const handleError = ({ error }: any) => {
          console.error("[MessageStore] Session error:", error);
          get().addError(sessionId, error.message);
        };

        // Attach listeners
        session.on("agent:speaking", handleSpeaking);
        session.on("stream:end", handleStreamEnd);
        session.on("agent:tool_calling", handleToolCalling);
        session.on("agent:error", handleError);

        // Store cleanup function
        const cleanup = () => {
          session.off("agent:speaking", handleSpeaking);
          session.off("stream:end", handleStreamEnd);
          session.off("agent:tool_calling", handleToolCalling);
          session.off("agent:error", handleError);
        };

        activeSubscriptions.set(sessionId, cleanup);
        console.log("[MessageStore] Subscribed to session:", sessionId);
      },

      // Unsubscribe from session
      unsubscribeFromSession: (sessionId) => {
        const { activeSubscriptions } = get();
        const cleanup = activeSubscriptions.get(sessionId);

        if (cleanup) {
          cleanup();
          activeSubscriptions.delete(sessionId);
          console.log("[MessageStore] Unsubscribed from session:", sessionId);
        }
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

      clearMessages: (sessionId) => {
        set((state) => {
          const newMap = new Map(state.sessionMessages);
          newMap.delete(sessionId);
          return { sessionMessages: newMap };
        });
      },

      // Internal state mutations
      addUserMessage: (sessionId, content, images) => {
        set((state) => {
          const newMap = new Map(state.sessionMessages);
          const messages = newMap.get(sessionId) || [];
          newMap.set(sessionId, [
            ...messages,
            {
              type: "user",
              content,
              images,
              timestamp: new Date(),
              id: crypto.randomUUID(),
            },
          ]);
          return { sessionMessages: newMap };
        });
      },

      addAgentChunk: (sessionId, chunk) => {
        set((state) => {
          const newMap = new Map(state.sessionMessages);
          const messages = newMap.get(sessionId) || [];
          const lastMsg = messages[messages.length - 1];

          if (lastMsg?.type === "agent" && lastMsg.isStreaming) {
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
                type: "agent",
                content: chunk,
                timestamp: new Date(),
                id: crypto.randomUUID(),
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
          if (lastMsg?.type === "agent" && lastMsg.isStreaming) {
            const updated = [...messages];
            updated[updated.length - 1] = { ...lastMsg, isStreaming: false };
            newMap.set(sessionId, updated);
            return { sessionMessages: newMap };
          }
          return {};
        });
      },

      addToolMessage: (sessionId, toolName, toolInput, toolId) => {
        set((state) => {
          const newMap = new Map(state.sessionMessages);
          const messages = newMap.get(sessionId) || [];
          newMap.set(sessionId, [
            ...messages,
            {
              type: "agent",
              content: "",
              timestamp: new Date(),
              id: crypto.randomUUID(),
              isToolUse: true,
              toolName,
              toolInput,
              toolId,
              toolResult: null,
            },
          ]);
          return { sessionMessages: newMap };
        });
      },

      addError: (sessionId, error) => {
        set((state) => {
          const newMap = new Map(state.sessionMessages);
          const messages = newMap.get(sessionId) || [];
          newMap.set(sessionId, [
            ...messages,
            {
              type: "error",
              content: `Error: ${error}`,
              timestamp: new Date(),
              id: crypto.randomUUID(),
            },
          ]);
          return { sessionMessages: newMap };
        });
      },
    }),
    { name: "MessageStore" }
  )
);

// Helper function
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
