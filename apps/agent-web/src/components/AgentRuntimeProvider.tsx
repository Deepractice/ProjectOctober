/**
 * Agent Runtime Provider
 * Adapts EventBus stores to assistant-ui runtime
 */

import { ReactNode, useMemo } from "react";
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type ThreadMessageLike,
  type AppendMessage,
} from "@assistant-ui/react";
import { useMessageStore } from "~/stores/messageStore";
import { useSessionStore } from "~/stores/sessionStore";
import { sendMessage as sendWSMessage } from "~/api/agent";
import type { ChatMessage } from "~/types";

/**
 * Convert our ChatMessage format to assistant-ui ThreadMessageLike
 */
function convertToThreadMessage(msg: ChatMessage): ThreadMessageLike {
  return {
    id: msg.id || crypto.randomUUID(),
    role: msg.type === "user" ? "user" : "assistant",
    content: [
      {
        type: "text",
        text: msg.content,
      },
    ],
  };
}

/**
 * Convert assistant-ui ThreadMessageLike to our ChatMessage format
 */
function convertFromThreadMessage(msg: ThreadMessageLike): ChatMessage {
  const textContent = Array.isArray(msg.content)
    ? msg.content.find((c) => c.type === "text")
    : null;
  const text = textContent && "text" in textContent ? textContent.text : "";

  if (msg.role === "user") {
    return {
      id: msg.id || crypto.randomUUID(),
      type: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
  } else {
    return {
      id: msg.id || crypto.randomUUID(),
      type: "assistant",
      content: text,
      timestamp: new Date().toISOString(),
    };
  }
}

export function AgentRuntimeProvider({ children }: { children: ReactNode }) {
  const selectedSession = useSessionStore((s) => s.selectedSession);
  const sessionMessages = useMessageStore((s) => s.sessionMessages);
  const addUserMessage = useMessageStore((s) => s.addUserMessage);

  // Get messages for current session
  const messages = useMemo(() => {
    if (!selectedSession?.id) return [];
    const msgs = sessionMessages.get(selectedSession.id) || [];
    return msgs.map(convertToThreadMessage);
  }, [selectedSession?.id, sessionMessages]);

  // Handle new message from user
  const onNew = async (message: AppendMessage) => {
    if (!selectedSession?.id) {
      console.error("No session selected");
      return;
    }

    // Extract text content
    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || !("text" in textContent)) {
      throw new Error("Only text content is supported");
    }

    const userText = textContent.text;

    // Add user message to store
    addUserMessage(selectedSession.id, userText);

    // Send to backend via WebSocket
    try {
      await sendWSMessage(selectedSession.id, userText);
    } catch (error) {
      console.error("Failed to send message:", error);
      // TODO: Show error to user
    }
  };

  // Update messages (assistant-ui might call this for edits/branching)
  const setMessages = (
    newMessages:
      | readonly ThreadMessageLike[]
      | ((prev: readonly ThreadMessageLike[]) => readonly ThreadMessageLike[])
  ) => {
    if (!selectedSession?.id) return;

    const msgs = typeof newMessages === "function" ? newMessages(messages) : newMessages;

    // Convert back to our format and update store
    const convertedMessages = msgs.map(convertFromThreadMessage);
    useMessageStore.getState().setMessages(selectedSession.id, convertedMessages);
  };

  const runtime = useExternalStoreRuntime({
    messages,
    setMessages,
    onNew,
    convertMessage: (msg: ThreadMessageLike) => msg, // Already in correct format
  });

  return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
}
