/**
 * Event Type Definitions
 * Unified event types for the EventBus
 */

import type { Session, ChatMessage } from "~/types";

// Session Events
export type SessionEvent =
  | { type: "session.created"; sessionId: string }
  | { type: "session.updated"; sessions: Session[] }
  | { type: "session.deleted"; sessionId: string }
  | { type: "session.selected"; sessionId: string }
  | { type: "session.processing"; sessionId: string; isProcessing: boolean }
  | { type: "session.aborted"; sessionId: string };

// Message Events
export type MessageEvent =
  | { type: "message.user"; sessionId: string; content: string; images?: any[] }
  | { type: "message.assistant"; sessionId: string; content: string }
  | { type: "message.streaming"; sessionId: string; chunk: string }
  | { type: "message.complete"; sessionId: string }
  | { type: "message.tool"; sessionId: string; toolName: string; toolInput: string; toolId: string }
  | { type: "message.toolResult"; sessionId: string; toolId: string; result: any }
  | { type: "message.error"; sessionId: string; error: Error };

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
export type AppEvent = SessionEvent | MessageEvent | UIEvent | ErrorEvent;

// Type Guards
export const isSessionEvent = (e: AppEvent): e is SessionEvent => e.type.startsWith("session.");
export const isMessageEvent = (e: AppEvent): e is MessageEvent => e.type.startsWith("message.");
export const isUIEvent = (e: AppEvent): e is UIEvent => e.type.startsWith("ui.");
export const isErrorEvent = (e: AppEvent): e is ErrorEvent => e.type.startsWith("error.");
