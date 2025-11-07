/**
 * @deepractice-ai/agent-types
 *
 * Shared TypeScript types for the Agent system.
 * This package provides type definitions used across:
 * - @deepractice-ai/agent-sdk (backend SDK)
 * - @deepractice-ai/agent (frontend + server)
 *
 * Single source of truth for all type definitions.
 */

// ============================================================================
// Message Types
// ============================================================================

export type {
  // Content blocks
  ContentBlock,
  TextBlock,
  ImageBlock,

  // Message types
  MessageType,
  BaseMessage,
  UserMessage,
  AgentMessage,
  ToolMessage,
  SystemMessage,
  ErrorMessage,
  AnyMessage,

  // Tool types
  ToolUse,
  ToolResult,
} from "./message";

// ============================================================================
// Session Types
// ============================================================================

export type {
  SessionState,
  SessionMetadata,
  TokenUsage,
  SessionOptions,
  SessionSummary,
  Session,
  MessageMetadata,
} from "./session";

// ============================================================================
// Event Types
// ============================================================================

export type {
  // Base
  BaseEvent,
  AnyEvent,

  // Session events
  SessionCreatedEvent,
  SessionUpdatedEvent,
  SessionProcessingEvent,
  SessionAbortedEvent,
  SessionCreateEvent,
  SessionEvent,

  // Message events
  MessageSendEvent,
  MessageUserEvent,
  MessageAgentEvent,
  MessageStreamingEvent,
  MessageCompleteEvent,
  MessageToolEvent,
  MessageToolResultEvent,
  MessageErrorEvent,
  MessageLoadedEvent,
  MessageEvent,

  // Agent events
  AgentProcessingEvent,
  AgentCompleteEvent,
  AgentErrorEvent,
  AgentEvent,

  // Error events
  ErrorUnknownEvent,
  ErrorEvent,
} from "./events";

// ============================================================================
// WebSocket Types
// ============================================================================

export type {
  // Client messages
  AgentCommandMessage,
  CreateSessionMessage,
  AbortSessionMessage,
  ClientMessage,

  // Server messages
  SessionCreatedMessage,
  SessionsUpdatedMessage,
  AgentResponseMessage,
  ClaudeOutputMessage,
  ClaudeStatusMessage,
  ClaudeErrorMessage,
  AgentCompleteMessage,
  SessionAbortedMessage,
  SessionStatusMessage,
  ServerMessage,

  // Union type
  WebSocketMessage,
} from "./websocket";
