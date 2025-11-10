/**
 * Agent API Layer (Legacy - mostly replaced by SDK)
 * Kept for backward compatibility with some components
 */

import { api } from "./rest";
import type { Session, ChatMessage } from "~/types";

/**
 * Load all sessions
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
 */
export async function loadSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  const response = await api.sessionMessages(sessionId);
  if (!response.ok) {
    throw new Error(`Failed to load messages: ${response.statusText}`);
  }

  const data = await response.json();
  return data.messages || [];
}
