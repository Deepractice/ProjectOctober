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
 * Convert File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Extract base64 data (remove data:image/...;base64, prefix)
      const base64Data = base64.split(",")[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Send message via WebSocket
 * Pure WebSocket send - no Store manipulation
 */
export async function sendMessageToBackend(
  sessionId: string,
  content: string,
  images?: File[]
): Promise<void> {
  // Convert images to base64 if provided
  let imageData: Array<{ type: string; data: string }> | undefined;

  if (images && images.length > 0) {
    imageData = await Promise.all(
      images.map(async (file) => ({
        type: file.type,
        data: await fileToBase64(file),
      }))
    );
  }

  wsClient.send({
    type: "agent-command",
    command: content,
    options: {
      sessionId,
      ...(imageData && { images: imageData }),
    },
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
