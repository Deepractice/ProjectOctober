/**
 * Session Core Module Errors
 * Internal errors for session module - not exposed to public API
 */

/**
 * Session state transition errors
 */
export class SessionStateTransitionError extends Error {
  constructor(
    message: string,
    public readonly sessionId: string,
    public readonly fromState: string,
    public readonly toState: string
  ) {
    super(message);
    this.name = "SessionStateTransitionError";
  }
}

/**
 * Session message errors
 */
export class SessionMessageError extends Error {
  constructor(
    message: string,
    public readonly sessionId: string
  ) {
    super(message);
    this.name = "SessionMessageError";
  }
}

/**
 * Session persistence errors
 */
export class SessionPersistenceError extends Error {
  constructor(
    message: string,
    public readonly sessionId: string,
    public readonly operation: string
  ) {
    super(message);
    this.name = "SessionPersistenceError";
  }
}
