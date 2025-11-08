import type { Observable } from "rxjs";
import type { EventEmitter } from "eventemitter3";
import type { AnyMessage, ContentBlock } from "./message";
import type { SessionEvents } from "./events";

// Session state
export type SessionState =
  | "created"
  | "active"
  | "idle"
  | "completed"
  | "error"
  | "aborted"
  | "deleted";

// Session metadata
export interface SessionMetadata {
  projectPath: string;
  startTime: Date;
  endTime?: Date;
  [key: string]: unknown;
}

// Token usage
export interface TokenUsage {
  used: number;
  total: number;
  breakdown: {
    input: number;
    output: number;
    cacheRead: number;
    cacheCreation: number;
  };
}

// Session statistics
export interface SessionStatistics {
  duration: {
    total: number; // Total duration in milliseconds
    api: number; // API call duration in milliseconds
    thinking: number; // Time to first token in milliseconds
  };
  cost: {
    total: number; // Total cost in USD
    breakdown: {
      input: number; // Input token cost
      output: number; // Output token cost
      cacheRead: number; // Cache read cost
      cacheCreation: number; // Cache creation cost
    };
  };
  conversation: {
    turns: number; // Number of user sends
    messages: number; // Total message count
  };
}

// Pricing configuration
export interface PricingConfig {
  model: string;
  prices: {
    inputPerMillion: number; // Price per million input tokens
    outputPerMillion: number; // Price per million output tokens
    cacheReadPerMillion: number; // Cache read price per million tokens
    cacheCreationPerMillion: number; // Cache creation price per million tokens
  };
}

/**
 * Session interface - SDK-specific with Observable methods
 * This is different from agent-types Session which is a data structure
 *
 * Session extends EventEmitter for event-driven API
 */
export interface Session extends EventEmitter<SessionEvents> {
  readonly id: string;
  readonly createdAt: Date;
  readonly state: SessionState;

  // Actions
  send(content: string | ContentBlock[]): Promise<void>;
  abort(): Promise<void>;
  complete(): Promise<void>;
  delete(): Promise<void>;

  // Observables
  messages$(): Observable<AnyMessage>;
  statistics$(): Observable<SessionStatistics>;

  // Queries
  getMessages(limit?: number, offset?: number): AnyMessage[];
  getTokenUsage(): TokenUsage;
  getStatistics(): SessionStatistics;
  getMetadata(): SessionMetadata;
  summary(): string;

  // Utilities
  isActive(): boolean;
  isCompleted(): boolean;
}

/**
 * Options for creating a new session
 */
export interface SessionCreateOptions {
  id?: string; // Optional session ID (useful for browser)
  model?: string;
  summary?: string;
}
