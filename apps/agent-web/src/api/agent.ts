/**
 * Agent API Facade
 * High-level API for agent operations
 */

import { wsClient } from "./websocket";
import { api } from "./rest";
import { eventBus } from "~/core/eventBus";
import { useSessionStore } from "~/stores/sessionStore";
import { useMessageStore } from "~/stores/messageStore";
import type { Session, ChatMessage } from "~/types";

/**
 * Send a message to the agent
 */
export async function sendMessage(
  sessionId: string,
  content: string,
  images?: File[]
): Promise<void> {
  // Emit user message event
  eventBus.emit({
    type: "message.user",
    sessionId,
    content,
    images,
  });

  // Mark session as active
  useSessionStore.getState().markSessionActive(sessionId);

  // Send via WebSocket
  wsClient.send({
    type: "agent-command",
    command: content,
    options: { sessionId },
  });
}

/**
 * Abort a session
 */
export async function abortSession(sessionId: string): Promise<void> {
  wsClient.send({
    type: "abort-session",
    sessionId,
  });
}

/**
 * Create a new session
 */
export async function createSession(): Promise<string> {
  const response = await api.createSession();
  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.statusText}`);
  }
  const { sessionId } = await response.json();
  console.log("[Agent API] Session created:", sessionId);
  return sessionId;
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await api.deleteSession(sessionId);
  eventBus.emit({ type: "session.deleted", sessionId });
  console.log("[Agent API] Session deleted:", sessionId);
}

/**
 * Load all sessions
 */
export async function loadSessions(limit: number = 100): Promise<Session[]> {
  const sessionStore = useSessionStore.getState();
  sessionStore.setLoading(true);

  try {
    const response = await api.sessions(limit);
    if (!response.ok) {
      throw new Error(`Failed to load sessions: ${response.statusText}`);
    }

    const data = await response.json();
    const sessions = data.sessions || [];

    eventBus.emit({ type: "session.updated", sessions });
    sessionStore.setLoading(false);

    console.log("[Agent API] Sessions loaded:", sessions.length);
    return sessions;
  } catch (error) {
    console.error("[Agent API] Failed to load sessions:", error);
    sessionStore.setLoading(false);
    sessionStore.setError((error as Error).message);
    throw error;
  }
}

/**
 * Load messages for a session
 */
export async function loadSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  const messageStore = useMessageStore.getState();

  try {
    const response = await api.sessionMessages(sessionId);
    if (!response.ok) {
      throw new Error(`Failed to load messages: ${response.statusText}`);
    }

    const data = await response.json();
    const messages = data.messages || [];

    messageStore.setMessages(sessionId, messages);
    console.log("[Agent API] Messages loaded:", sessionId, messages.length);
    return messages;
  } catch (error) {
    console.error("[Agent API] Failed to load messages:", error);
    throw error;
  }
}

/**
 * Connect to WebSocket
 */
export async function connectWebSocket(): Promise<void> {
  await wsClient.connect();
}

/**
 * Disconnect from WebSocket
 */
export function disconnectWebSocket(): void {
  wsClient.disconnect();
}
