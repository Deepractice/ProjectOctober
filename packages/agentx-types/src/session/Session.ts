import type { Message } from "~/message/Message";

/**
 * Session
 *
 * A conversation container that holds multiple messages.
 * Pure data structure with no behavior.
 */
export interface Session {
  /** Unique identifier */
  id: string;

  /** Session title */
  title: string;

  /** All messages in this session */
  messages: Message[];

  /** When this session was created */
  createdAt: Date;

  /** When this session was last updated */
  updatedAt: Date;

  /**
   * Optional metadata for application-layer extensions
   * Examples: tags, categories, userId, etc.
   */
  metadata?: Record<string, unknown>;
}
