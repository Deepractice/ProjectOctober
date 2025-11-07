/**
 * Session Types - Shared across SDK, Frontend, and Backend
 */

import type { AnyMessage } from "./message";

// ============================================================================
// Session State
// ============================================================================

export type SessionState =
  | "created" // Session created but not started
  | "active" // Currently processing
  | "idle" // Waiting for input
  | "completed" // Finished normally
  | "error" // Encountered error
  | "aborted" // User aborted
  | "deleted"; // Deleted

// ============================================================================
// Session Metadata
// ============================================================================

export interface SessionMetadata {
  projectPath: string;
  startTime: Date | string;
  endTime?: Date | string;
  [key: string]: unknown;
}

// ============================================================================
// Token Usage
// ============================================================================

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

// ============================================================================
// Session Options
// ============================================================================

export interface SessionOptions {
  temperature?: number;
  maxTokens?: number;
  resume?: string; // Claude SDK session ID for resuming
  [key: string]: unknown;
}

// ============================================================================
// Session Summary (for list view)
// ============================================================================

export interface SessionSummary {
  id: string;
  summary: string;
  messageCount: number;
  lastActivity: Date | string;
  cwd: string;
  state?: SessionState;
}

// ============================================================================
// Full Session (with messages)
// ============================================================================

export interface Session {
  id: string;
  state: SessionState;
  createdAt: Date | string;
  messages: AnyMessage[];
  metadata: SessionMetadata;
  tokenUsage: TokenUsage;
  summary: string;
}

// ============================================================================
// Message Metadata (for pagination)
// ============================================================================

export interface MessageMetadata {
  hasMore: boolean;
  offset: number;
  total: number;
  lastLoadedAt?: number;
}
