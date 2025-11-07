/**
 * Persistence interfaces for Agent SDK
 */

import type { AnyMessage } from "@deepractice-ai/agent-types";

/**
 * Message persistence interface
 */
export interface MessagePersister {
  /**
   * Save a single message
   */
  saveMessage(sessionId: string, message: AnyMessage): Promise<void>;

  /**
   * Save multiple messages (batch operation)
   */
  saveMessages(sessionId: string, messages: AnyMessage[]): Promise<void>;

  /**
   * Get messages for a session
   * @param sessionId - Session ID
   * @param limit - Maximum number of messages to return
   * @param offset - Offset for pagination
   */
  getMessages(sessionId: string, limit?: number, offset?: number): Promise<AnyMessage[]>;

  /**
   * Delete all messages for a session
   */
  deleteMessages(sessionId: string): Promise<void>;

  /**
   * Get total message count for a session
   */
  getMessageCount(sessionId: string): Promise<number>;
}

/**
 * Session data for persistence
 */
export interface SessionData {
  id: string;
  summary?: string;
  createdAt: Date;
  lastActivity: Date;
  cwd?: string;
}

/**
 * Agent persistence interface
 * Aggregates all persistence operations
 */
export interface AgentPersister {
  /**
   * Message persistence
   */
  messages: MessagePersister;

  /**
   * Save session metadata
   * Must be called before saving any messages for this session
   */
  saveSession(session: SessionData): Promise<void>;

  // Future extensions:
  // settings: SettingsPersister;
  // cache: CachePersister;
}
