/**
 * WebSocket Message Types
 * These types extend or adapt the shared agent-types WebSocket messages
 */

import type {
  SessionCreatedMessage as BaseSessionCreatedMessage,
  SessionsUpdatedMessage as BaseSessionsUpdatedMessage,
  AgentCompleteMessage as BaseAgentCompleteMessage,
  SessionAbortedMessage as BaseSessionAbortedMessage,
  SessionStatusMessage as BaseSessionStatusMessage,
  AgentResponseMessage as BaseAgentResponseMessage,
} from "@deepractice-ai/agent-types";

// Re-export base types from agent-types
export type {
  SessionCreatedMessage,
  SessionsUpdatedMessage,
  AgentCompleteMessage,
  SessionAbortedMessage,
  SessionStatusMessage,
  AgentResponseMessage,
} from "@deepractice-ai/agent-types";

// UI-specific WebSocket message types (additional types not in agent-types)
export type WebSocketMessageType =
  | "session-created"
  | "sessions_updated"
  | "token-budget"
  | "agent-response"
  | "claude-output"
  | "claude-interactive-prompt"
  | "claude-error"
  | "agent-complete"
  | "session-aborted"
  | "session-status"
  | "claude-status";

interface LocalWebSocketMessage {
  type: WebSocketMessageType;
  sessionId?: string;
  timestamp?: string | number;
}

// Local AgentOutputMessage (not in agent-types)
export interface AgentOutputMessage extends LocalWebSocketMessage {
  type: "claude-output";
  sessionId: string;
  data?: any;
}

// Local AgentErrorMessage (not in agent-types)
export interface AgentErrorMessage extends LocalWebSocketMessage {
  type: "claude-error";
  sessionId: string;
  error?: string;
  data?: any;
}

// Union type (includes both agent-types messages and local extensions)
export type WebSocketMessage =
  | BaseSessionCreatedMessage
  | BaseSessionsUpdatedMessage
  | BaseAgentCompleteMessage
  | BaseSessionAbortedMessage
  | BaseSessionStatusMessage
  | BaseAgentResponseMessage
  | AgentOutputMessage
  | AgentErrorMessage
  | LocalWebSocketMessage;

/**
 * Message Store State - Unified Message Management
 */
export interface MessageState {
  // Message routing (existing)
  recentMessages: (WebSocketMessage & { messageId: string })[];
  processedMessageIds: Set<string>;

  // Chat message storage - Single source of truth
  sessionMessages: Map<string, import("./chat").ChatMessage[]>; // All messages
  loadingSessions: Set<string>; // Loading indicators
  messageMetadata: Map<string, import("./chat").MessageMetadata>; // Pagination metadata

  // Message routing actions (existing)
  handleMessage: (message: WebSocketMessage) => void;
  registerHandler: (type: WebSocketMessageType, handler: (message: any) => void) => void;
  unregisterHandler: (type: WebSocketMessageType) => void;
  clearMessages: () => void;
  getMessagesByType: (type: WebSocketMessageType) => WebSocketMessage[];
  getMessagesBySession: (sessionId: string) => WebSocketMessage[];

  // Unified chat message operations
  addUserMessage: (sessionId: string, content: string, images?: any[]) => void;
  addAgentMessage: (sessionId: string, content: string) => void;
  addAgentChunk: (sessionId: string, chunk: string) => void; // For streaming
  updateLastAgentMessage: (sessionId: string, content: string) => void;
  addToolUse: (sessionId: string, toolName: string, toolInput: string, toolId: string) => void;
  updateToolResult: (sessionId: string, toolId: string, result: any) => void;
  addErrorMessage: (sessionId: string, error: string) => void;

  // Session lifecycle
  migrateSession: (oldSessionId: string, newSessionId: string) => void;
  clearSessionMessages: (sessionId: string) => void;

  // Legacy methods (for backward compatibility during migration)
  setServerMessages: (sessionId: string, messages: import("./chat").ChatMessage[]) => void;
  getDisplayMessages: (sessionId: string) => import("./chat").ChatMessage[];
  hasSessionMessages: (sessionId: string) => boolean;
  setLoading: (sessionId: string, loading: boolean) => void;
  setMetadata: (sessionId: string, metadata: import("./chat").MessageMetadata) => void;
}
