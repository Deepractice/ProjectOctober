/**
 * WebSocket Message Types - For client-server communication
 */

import type { AnyMessage } from "./message";
import type { SessionSummary } from "./session";

// ============================================================================
// Client -> Server Messages
// ============================================================================

export interface AgentCommandMessage {
  type: "agent-command";
  command: string;
  options?: {
    sessionId?: string;
    images?: Array<{
      type: string;
      data: string;
    }>;
  };
}

export interface CreateSessionMessage {
  type: "create-session";
  message: string;
}

export interface AbortSessionMessage {
  type: "abort-session";
  sessionId: string;
}

export type ClientMessage = AgentCommandMessage | CreateSessionMessage | AbortSessionMessage;

// ============================================================================
// Server -> Client Messages
// ============================================================================

export interface SessionCreatedMessage {
  type: "session-created";
  sessionId: string;
  data?: {
    messages?: AnyMessage[];
  };
}

export interface SessionsUpdatedMessage {
  type: "sessions_updated";
  sessions: SessionSummary[];
}

export interface AgentResponseMessage {
  type: "agent-response";
  sessionId: string;
  data:
    | AnyMessage
    | {
        type: string;
        [key: string]: unknown;
      };
}

export interface ClaudeOutputMessage {
  type: "claude-output";
  sessionId: string;
  data: string;
}

export interface ClaudeStatusMessage {
  type: "claude-status";
  sessionId: string;
  data:
    | {
        message?: string;
        status?: string;
        tokens?: number;
        token_count?: number;
      }
    | string;
}

export interface ClaudeErrorMessage {
  type: "claude-error";
  sessionId: string;
  error: string;
}

export interface AgentCompleteMessage {
  type: "agent-complete";
  sessionId: string;
}

export interface SessionAbortedMessage {
  type: "session-aborted";
  sessionId: string;
}

export interface SessionStatusMessage {
  type: "session-status";
  sessionId: string;
  isProcessing: boolean;
}

export type ServerMessage =
  | SessionCreatedMessage
  | SessionsUpdatedMessage
  | AgentResponseMessage
  | ClaudeOutputMessage
  | ClaudeStatusMessage
  | ClaudeErrorMessage
  | AgentCompleteMessage
  | SessionAbortedMessage
  | SessionStatusMessage;

// ============================================================================
// Union Type (All WebSocket messages)
// ============================================================================

export type WebSocketMessage = ClientMessage | ServerMessage;
