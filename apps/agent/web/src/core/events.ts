/**
 * Event Type Definitions
 * Unified event types for the EventBus
 */

import type { Session, ChatMessage } from "~/types";

// Session Events
export type SessionEvent =
  | { type: "session.navigate.new" } // User action: navigate to new session (lazy creation)
  | { type: "session.create"; message: string; tempId?: string } // Store action: create session with first message
  | { type: "session.created"; sessionId: string; messages: ChatMessage[]; oldTempId?: string } // Store update: session created
  | { type: "session.updated"; sessions: Session[] }
  | { type: "session.delete"; sessionId: string } // User action: delete session
  | { type: "session.deleted"; sessionId: string } // Store update: session deleted
  | { type: "session.refresh" } // User action: refresh sessions
  | { type: "session.selected"; sessionId: string }
  | { type: "session.processing"; sessionId: string; isProcessing: boolean }
  | { type: "session.abort"; sessionId: string } // User action: abort session
  | { type: "session.aborted"; sessionId: string }; // Store update: session aborted

// Message Events
export type MessageEvent =
  | { type: "message.send"; sessionId: string; content: string; images?: any[] } // User action: send message
  | { type: "message.user"; sessionId: string; content: string; images?: any[] } // Store update: user message added
  | { type: "message.loaded"; sessionId: string; messages: ChatMessage[] } // Store update: messages loaded from API
  | { type: "message.assistant"; sessionId: string; content: string }
  | { type: "message.streaming"; sessionId: string; chunk: string }
  | { type: "message.complete"; sessionId: string }
  | { type: "message.tool"; sessionId: string; toolName: string; toolInput: string; toolId: string }
  | { type: "message.toolResult"; sessionId: string; toolId: string; result: any }
  | {
      type: "message.error";
      sessionId: string;
      error: Error;
      recoverable?: boolean;
      state?: string;
    };

// Agent Events
export type AgentEvent =
  | { type: "agent.thinking"; sessionId: string }
  | { type: "agent.processing"; sessionId: string; status?: string; tokens?: number }
  | { type: "agent.complete"; sessionId: string }
  | { type: "agent.error"; sessionId: string; error: Error; recoverable?: boolean; state?: string }
  | { type: "agent.abort"; sessionId: string; timestamp: number };

// UI Events
export type UIEvent =
  | { type: "ui.loading"; isLoading: boolean }
  | { type: "ui.thinking"; sessionId: string; status: string; tokens?: number }
  | { type: "ui.toast"; message: string; level: "info" | "error" | "success" };

// Error Events
export type ErrorEvent =
  | { type: "error.websocket"; error: Error }
  | { type: "error.api"; error: Error }
  | { type: "error.unknown"; error: Error };

// Union Type
export type AppEvent = SessionEvent | MessageEvent | AgentEvent | UIEvent | ErrorEvent;

// Type Guards
export const isSessionEvent = (e: AppEvent): e is SessionEvent => e.type.startsWith("session.");
export const isMessageEvent = (e: AppEvent): e is MessageEvent => e.type.startsWith("message.");
export const isAgentEvent = (e: AppEvent): e is AgentEvent => e.type.startsWith("agent.");
export const isUIEvent = (e: AppEvent): e is UIEvent => e.type.startsWith("ui.");
export const isErrorEvent = (e: AppEvent): e is ErrorEvent => e.type.startsWith("error.");
