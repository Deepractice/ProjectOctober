/**
 * Persistence interfaces for Agent SDK
 */

import type { AnyMessage } from "./message";

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
 *
 * Unified interface for all Agent data persistence operations.
 * Manages both sessions and messages in a single database.
 */
export interface AgentPersister {
  // ========================================
  // Session Operations
  // ========================================

  /**
   * Save session metadata
   * Creates or updates session in database
   */
  saveSession(session: SessionData): Promise<void>;

  /**
   * Get session by ID
   */
  getSession(id: string): Promise<SessionData | null>;

  /**
   * Get all sessions (sorted by last activity)
   */
  getAllSessions(): Promise<SessionData[]>;

  /**
   * Delete session and all its messages
   */
  deleteSession(id: string): Promise<void>;

  // ========================================
  // Message Operations
  // ========================================

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

  // ========================================
  // Lifecycle
  // ========================================

  /**
   * Close database connection
   */
  close(): void;
}
