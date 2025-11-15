/**
 * Message Store - Business Logic Layer
 * Subscribes to EventBus for message-related events
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { eventBus } from "~/core/eventBus";
import { isMessageEvent } from "~/core/events";
import type { ChatMessage } from "~/types";

// Generate stable unique IDs for messages
function generateMessageId(type: string): string {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: timestamp + random
  return `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export interface MessageState {
  // State
  sessionMessages: Map<string, ChatMessage[]>;
  loadingSessions: Set<string>;
  pendingSessionId: string | null; // Temporary session ID before backend creates real one

  // Internal state actions (used by EventBus subscribers)
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
  isLoadingMessages: (sessionId: string) => boolean;
  setLoadingMessages: (sessionId: string, loading: boolean) => void;

  // Business action methods (for components to call)
  sendMessage: (sessionId: string | undefined, content: string, images?: any[]) => void;
}

export const useMessageStore = create<MessageState>()(
  devtools(
    (set, get) => ({
      // Initial state
      sessionMessages: new Map(),
      loadingSessions: new Set(),
      pendingSessionId: null,

      // Actions
      addUserMessage: (sessionId, content, images) => {
        const messageId = generateMessageId("user");
        console.log("[MessageStore] 🟢 Adding user message:", {
          sessionId,
          messageId,
          contentPreview: content.substring(0, 50) + "...",
          hasImages: !!images?.length,
        });

        set((state) => {
          const newMap = new Map(state.sessionMessages);
          const messages = newMap.get(sessionId) || [];
          const newMessage: ChatMessage = {
            type: "user" as const,
            content,
            images: images || [],
            timestamp: new Date(),
            id: messageId,
          };
          newMap.set(sessionId, [...messages, newMessage]);

          console.log("[MessageStore] 📊 After adding user message:", {
            sessionId,
            totalMessages: newMap.get(sessionId)?.length,
            messageTypes: newMap.get(sessionId)?.map((m) => m.type),
          });

          return { sessionMessages: newMap };
        });
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
              id: generateMessageId("assistant"),
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
                id: generateMessageId("stream"),
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
              id: generateMessageId("tool"),
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
              id: generateMessageId("error"),
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
        console.log("[MessageStore] 📥 setMessages called:", {
          sessionId,
          messageCount: messages.length,
          messageTypes: messages.map((m) => m.type),
          messageIds: messages.map((m) => m.id),
        });

        set((state) => {
          const newMap = new Map(state.sessionMessages);
          const oldMessages = newMap.get(sessionId);

          console.log("[MessageStore] 📊 Replacing messages:", {
            sessionId,
            oldCount: oldMessages?.length || 0,
            newCount: messages.length,
            oldTypes: oldMessages?.map((m) => m.type) || [],
            newTypes: messages.map((m) => m.type),
          });

          newMap.set(sessionId, messages);

          console.log("[MessageStore] 📊 After setMessages:", {
            totalSessions: newMap.size,
            thisSessionMessages: newMap.get(sessionId)?.length,
          });

          return { sessionMessages: newMap };
        });
      },

      isLoadingMessages: (sessionId) => {
        return get().loadingSessions.has(sessionId);
      },

      setLoadingMessages: (sessionId, loading) => {
        set((state) => {
          const newSet = new Set(state.loadingSessions);
          if (loading) {
            newSet.add(sessionId);
          } else {
            newSet.delete(sessionId);
          }
          return { loadingSessions: newSet };
        });
        console.log("[MessageStore] Loading state:", sessionId, loading);
      },

      // Business action methods (components call these)
      sendMessage: (sessionId: string | undefined, content: string, images?: any[]) => {
        const { pendingSessionId } = get();

        // Case 1: Brand new session (no sessionId, no pending)
        if (!sessionId && !pendingSessionId) {
          // Generate temporary session ID
          const tempId = `pending-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
          console.log("[MessageStore] Creating new session with tempId:", tempId);

          // Store pending session ID
          set({ pendingSessionId: tempId });

          // Optimistically add user message to UI
          const store = get();
          store.addUserMessage(tempId, content, images);

          // Navigate to pending session URL immediately
          // We'll add a special navigation event for pending sessions
          const navEvent = new CustomEvent("navigate-to-pending", {
            detail: { sessionId: tempId },
          });
          window.dispatchEvent(navEvent);

          // Emit session.create event with tempId
          eventBus.emit({
            type: "session.create",
            message: content,
            tempId,
          });
          return;
        }

        // Case 2: Pending session sending additional message (shouldn't happen in current flow, but handle it)
        if (pendingSessionId && sessionId === pendingSessionId) {
          console.log("[MessageStore] Sending message to pending session:", pendingSessionId);
          // Just add to UI, wait for real session to be created
          const store = get();
          store.addUserMessage(pendingSessionId, content, images);
          return;
        }

        // Case 3: Existing real session - normal flow
        eventBus.emit({
          type: "message.send",
          sessionId: sessionId || pendingSessionId!,
          content,
          images,
        });
      },
    }),
    { name: "MessageStore" }
  )
);

// Subscribe to EventBus (auto-setup on module load)
import { isSessionEvent } from "~/core/events";

// Listen to session.created to load initial messages and handle tempId replacement
eventBus.on(isSessionEvent).subscribe(async (event) => {
  if (event.type === "session.created") {
    const store = useMessageStore.getState();
    const { oldTempId } = event;

    console.log("[MessageStore] Session created:", event.sessionId, "oldTempId:", oldTempId);

    // If this was a pending session, transfer messages from tempId to realId
    if (oldTempId) {
      const tempMessages = store.sessionMessages.get(oldTempId);
      if (tempMessages) {
        console.log("[MessageStore] Transferring messages from", oldTempId, "to", event.sessionId);
        // Set messages from backend (should include user message + assistant response)
        store.setMessages(event.sessionId, event.messages);
        // Clean up temp session messages
        store.clearSessionMessages(oldTempId);
      }
      // Clear pending session ID
      useMessageStore.setState({ pendingSessionId: null });
    } else {
      // Normal session creation (not from pending)
      store.setMessages(event.sessionId, event.messages);
    }
  }
});

eventBus.on(isMessageEvent).subscribe(async (event) => {
  const store = useMessageStore.getState();

  switch (event.type) {
    case "message.send":
      // Business orchestration: handle user sending a message
      try {
        console.log("[MessageStore] Received message.send event for session:", event.sessionId);
        console.log("[MessageStore] Message content:", event.content.substring(0, 100) + "...");

        // 1. Add user message to UI immediately
        console.log("[MessageStore] Adding user message to UI");
        store.addUserMessage(event.sessionId, event.content, event.images);
        console.log("[MessageStore] User message added to store");

        // 2. Emit message.user event for other stores (like UIStore)
        console.log("[MessageStore] Emitting message.user event for other stores");
        eventBus.emit({
          type: "message.user",
          sessionId: event.sessionId,
          content: event.content,
          images: event.images,
        });

        // 3. Mark session as active
        console.log("[MessageStore] Marking session as active");
        const { useSessionStore } = await import("~/stores/sessionStore");
        useSessionStore.getState().markSessionActive(event.sessionId);
        console.log("[MessageStore] Session marked as active");

        // 4. Send to backend via WebSocket (using pure API)
        console.log("[MessageStore] Sending command to backend via WebSocket");
        const { sendMessageToBackend } = await import("~/api/agent");
        await sendMessageToBackend(event.sessionId, event.content, event.images);
        console.log("[MessageStore] Command sent to backend successfully");
      } catch (error) {
        console.error("[MessageStore] Failed to send message:", error);
        store.addErrorMessage(event.sessionId, (error as Error).message);
      }
      break;

    case "message.loaded":
      // Store update: messages loaded from API
      console.log(
        "[MessageStore] Messages loaded for session:",
        event.sessionId,
        event.messages.length
      );
      store.setMessages(event.sessionId, event.messages);
      break;

    case "message.user":
      // This is now only for internal state updates (emitted by message.send handler)
      // Don't add message again, it's already added by message.send
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

    case "message.error": {
      // Format error message based on recoverability
      let errorMessage = event.error.message;

      if (event.recoverable) {
        // Recoverable error: friendly message with recovery hint
        errorMessage = `⚠️ ${event.error.message}\n\n✅ Your session is still active. You can continue sending messages.\n\nCommon solutions:\n• If credits insufficient: Recharge and try again\n• If network issue: Check connection and retry\n• If rate limited: Wait a moment and resend`;
        console.log("[MessageStore] Recoverable error:", {
          sessionId: event.sessionId,
          error: event.error.message,
          state: event.state,
        });
      } else {
        // Fatal error: clear indication session is terminated
        // Note: This is now rare since most errors are recoverable
        errorMessage = `❌ ${event.error.message}\n\n⛔ This session has failed and cannot continue. Please create a new session.`;
        console.error("[MessageStore] Fatal error:", {
          sessionId: event.sessionId,
          error: event.error.message,
          state: event.state,
        });
      }

      store.addErrorMessage(event.sessionId, errorMessage);
      break;
    }
  }
});
