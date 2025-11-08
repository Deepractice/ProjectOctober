/**
 * WebSocket Protocol for Agent SDK
 * Defines the message format for client-server communication
 */

import type http from "http";

/**
 * WebSocket Server Configuration
 */
export interface WebSocketServerConfig {
  port?: number;
  host?: string;
  path?: string;
  server?: http.Server;
}

/**
 * Agent WebSocket Server Instance
 */
export interface AgentWebSocketServer {
  port: number;
  host: string;
  close(): Promise<void>;
}

/**
 * WebSocket message types
 */
export type WebSocketMessageType =
  // Client → Server
  | "session:send" // Send message to AI
  | "session:abort" // Abort session
  | "session:complete" // Complete session
  | "session:delete" // Delete session
  // Server → Client
  | "event" // Session event notification
  | "error"; // Error response

/**
 * Base WebSocket message
 */
export interface BaseWebSocketMessage {
  type: WebSocketMessageType;
  sessionId: string;
  timestamp?: string;
}

/**
 * Client Messages (Client → Server)
 */

export interface SessionSendMessage extends BaseWebSocketMessage {
  type: "session:send";
  content: string | any[]; // string or ContentBlock[]
}

export interface SessionAbortMessage extends BaseWebSocketMessage {
  type: "session:abort";
}

export interface SessionCompleteMessage extends BaseWebSocketMessage {
  type: "session:complete";
}

export interface SessionDeleteMessage extends BaseWebSocketMessage {
  type: "session:delete";
}

export type ClientMessage =
  | SessionSendMessage
  | SessionAbortMessage
  | SessionCompleteMessage
  | SessionDeleteMessage;

/**
 * Server Messages (Server → Client)
 */

// Event message - wraps all Session EventEmitter events
export interface EventMessage extends BaseWebSocketMessage {
  type: "event";
  eventName: string; // e.g., "agent:speaking", "message:user"
  eventData: any; // Event payload
}

// Error message
export interface ErrorMessage extends BaseWebSocketMessage {
  type: "error";
  error: {
    message: string;
    code?: string;
    stack?: string;
  };
}

export type ServerMessage = EventMessage | ErrorMessage;

/**
 * All WebSocket messages
 */
export type WebSocketMessage = ClientMessage | ServerMessage;

/**
 * Helper to create event message
 */
export function createEventMessage(
  sessionId: string,
  eventName: string,
  eventData: any
): EventMessage {
  return {
    type: "event",
    sessionId,
    eventName,
    eventData,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Helper to create error message
 */
export function createErrorMessage(sessionId: string, error: Error | string): ErrorMessage {
  const errorObj = typeof error === "string" ? new Error(error) : error;

  return {
    type: "error",
    sessionId,
    error: {
      message: errorObj.message,
      stack: errorObj.stack,
    },
    timestamp: new Date().toISOString(),
  };
}
