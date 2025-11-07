/**
 * Event Types - For EventBus communication
 * Shared across Frontend and Backend
 */

import type { AnyMessage, ContentBlock } from "./message";
import type { SessionSummary } from "./session";

// ============================================================================
// Base Event
// ============================================================================

export interface BaseEvent {
  type: string;
  timestamp?: Date | string;
}

// ============================================================================
// Session Events
// ============================================================================

export interface SessionCreatedEvent extends BaseEvent {
  type: "session.created";
  sessionId: string;
  messages: AnyMessage[];
  oldTempId?: string; // For replacing pending session
}

export interface SessionUpdatedEvent extends BaseEvent {
  type: "session.updated";
  sessions: SessionSummary[];
}

export interface SessionProcessingEvent extends BaseEvent {
  type: "session.processing";
  sessionId: string;
  isProcessing: boolean;
}

export interface SessionAbortedEvent extends BaseEvent {
  type: "session.aborted";
  sessionId: string;
}

export interface SessionCreateEvent extends BaseEvent {
  type: "session.create";
  message: string;
  tempId?: string;
}

export type SessionEvent =
  | SessionCreatedEvent
  | SessionUpdatedEvent
  | SessionProcessingEvent
  | SessionAbortedEvent
  | SessionCreateEvent;

// ============================================================================
// Message Events
// ============================================================================

export interface MessageSendEvent extends BaseEvent {
  type: "message.send";
  sessionId: string;
  content: string | ContentBlock[];
  images?: Array<{ type: string; data: string }>;
}

export interface MessageUserEvent extends BaseEvent {
  type: "message.user";
  sessionId: string;
  content: string | ContentBlock[];
  images?: Array<{ type: string; data: string }>;
}

export interface MessageAgentEvent extends BaseEvent {
  type: "message.agent";
  sessionId: string;
  content: string;
}

export interface MessageStreamingEvent extends BaseEvent {
  type: "message.streaming";
  sessionId: string;
  chunk: string;
}

export interface MessageCompleteEvent extends BaseEvent {
  type: "message.complete";
  sessionId: string;
}

export interface MessageToolEvent extends BaseEvent {
  type: "message.tool";
  sessionId: string;
  toolName: string;
  toolInput: string;
  toolId: string;
}

export interface MessageToolResultEvent extends BaseEvent {
  type: "message.toolResult";
  sessionId: string;
  toolId: string;
  result: {
    content: string;
    isError: boolean;
    timestamp: Date | string;
  };
}

export interface MessageErrorEvent extends BaseEvent {
  type: "message.error";
  sessionId: string;
  error: Error;
}

export interface MessageLoadedEvent extends BaseEvent {
  type: "message.loaded";
  sessionId: string;
  messages: AnyMessage[];
}

export type MessageEvent =
  | MessageSendEvent
  | MessageUserEvent
  | MessageAgentEvent
  | MessageStreamingEvent
  | MessageCompleteEvent
  | MessageToolEvent
  | MessageToolResultEvent
  | MessageErrorEvent
  | MessageLoadedEvent;

// ============================================================================
// Agent Events
// ============================================================================

export interface AgentProcessingEvent extends BaseEvent {
  type: "agent.processing";
  sessionId: string;
  status: string;
  tokens?: number;
}

export interface AgentCompleteEvent extends BaseEvent {
  type: "agent.complete";
  sessionId: string;
}

export interface AgentErrorEvent extends BaseEvent {
  type: "agent.error";
  sessionId: string;
  error: Error;
}

export type AgentEvent = AgentProcessingEvent | AgentCompleteEvent | AgentErrorEvent;

// ============================================================================
// Error Events
// ============================================================================

export interface ErrorUnknownEvent extends BaseEvent {
  type: "error.unknown";
  error: Error;
}

export type ErrorEvent = ErrorUnknownEvent;

// ============================================================================
// Union Type
// ============================================================================

export type AnyEvent = SessionEvent | MessageEvent | AgentEvent | ErrorEvent;
