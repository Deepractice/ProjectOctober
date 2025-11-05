/**
 * Agent API Layer
 * Pure network requests with NO business logic or Store dependencies
 * All business orchestration is handled by Stores via EventBus
 */

import { wsClient } from "./websocket";
import { api } from "./rest";
import type { Session, ChatMessage } from "~/types";

/**
 * Create a new session
 * Pure API call - returns sessionId
 */
export async function createSession(): Promise<string> {
  const response = await api.createSession();
  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.statusText}`);
  }
  const { sessionId } = await response.json();
  return sessionId;
}

/**
 * Delete a session
 * Pure API call - no event emission
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const response = await api.deleteSession(sessionId);
  if (!response.ok) {
    throw new Error(`Failed to delete session: ${response.statusText}`);
  }
}

/**
 * Load all sessions
 * Pure API call - returns sessions array
 */
export async function loadSessions(limit: number = 100): Promise<Session[]> {
  const response = await api.sessions(limit);
  if (!response.ok) {
    throw new Error(`Failed to load sessions: ${response.statusText}`);
  }

  const data = await response.json();
  return data.sessions || [];
}

/**
 * Load messages for a session
 * Pure API call - returns messages array
 */
export async function loadSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  const response = await api.sessionMessages(sessionId);
  if (!response.ok) {
    throw new Error(`Failed to load messages: ${response.statusText}`);
  }

  const data = await response.json();
  return data.messages || [];
}

/**
 * Send message via WebSocket
 * Pure WebSocket send - no Store manipulation
 */
export function sendMessageToBackend(sessionId: string, content: string): void {
  wsClient.send({
    type: "agent-command",
    command: content,
    options: { sessionId },
  });
}

/**
 * Abort session via WebSocket
 * Pure WebSocket send - no Store manipulation
 */
export function abortSessionBackend(sessionId: string): void {
  wsClient.send({
    type: "abort-session",
    sessionId,
  });
}

/**
 * Connect to WebSocket
 * Note: This is called by App.tsx on mount
 */
export async function connectWebSocket(): Promise<void> {
  const { wsClient } = await import("./websocket");
  await wsClient.connect();
}

/**
 * Disconnect from WebSocket
 */
export function disconnectWebSocket(): void {
  wsClient.disconnect();
}
