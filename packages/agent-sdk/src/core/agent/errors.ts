/**
 * Agent Core Module Errors
 * Internal errors for agent module - not exposed to public API
 */

/**
 * Agent initialization errors
 */
export class AgentInitializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentInitializationError";
  }
}

/**
 * Agent state errors
 */
export class AgentStateError extends Error {
  constructor(
    message: string,
    public readonly currentState: string,
    public readonly requiredState: string
  ) {
    super(message);
    this.name = "AgentStateError";
  }
}

/**
 * Session management errors
 */
export class SessionManagementError extends Error {
  constructor(
    message: string,
    public readonly sessionId?: string
  ) {
    super(message);
    this.name = "SessionManagementError";
  }
}
