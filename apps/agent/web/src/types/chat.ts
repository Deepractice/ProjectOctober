/**
 * Chat Message Types (for UI rendering)
 * These are UI-specific types that extend or adapt the shared agent-types
 */

import type { ContentBlock, AgentMessage } from "@deepractice-ai/agent-types";

// Re-export ContentBlock from agent-types
export type { ContentBlock } from "@deepractice-ai/agent-types";

// UI-specific message type (includes "error" which is not in base types)
export type ChatMessageType = "user" | "agent" | "error";

// Base message for UI (with optional optimistic flag)
export interface BaseMessage {
  id: string;
  type: ChatMessageType;
  content: string | ContentBlock[];
  timestamp: Date | string;
  isOptimistic?: boolean; // Client-side pending message
}

// User message (extends base with deprecated images field)
export interface UserMessage extends BaseMessage {
  type: "user";
  content: string | ContentBlock[];
  images?: string[]; // Deprecated: kept for backward compatibility
}

// Error message (UI-specific)
export interface ErrorMessage extends BaseMessage {
  type: "error";
  error?: string;
}

// Agent message (alias for AgentMessage from agent-types)
// We keep this as a type alias to maintain compatibility
export type AssistantMessage = Omit<AgentMessage, "type"> & {
  type: "agent";
  timestamp: Date | string;
  isOptimistic?: boolean;
};

// Union type for all chat messages
export type ChatMessage = UserMessage | AssistantMessage | ErrorMessage;

/**
 * Message Metadata (for pagination and caching)
 */
export interface MessageMetadata {
  hasMore: boolean; // Has more messages to load
  offset: number; // Current pagination offset
  total: number; // Total message count
  lastLoadedAt: number; // Cache timestamp
}

/**
 * Project Info
 */
export interface ProjectInfo {
  name: string;
  path: string;
  fullPath: string;
}
