/**
 * Agent SDK Error
 *
 * Single error class with error codes for better error handling
 */

/**
 * Error codes for all SDK errors
 */
export enum AgentErrorCode {
  // Configuration errors
  CONFIG_INVALID = "CONFIG_INVALID",
  CONFIG_MISSING = "CONFIG_MISSING",

  // Authentication errors
  AUTH_INVALID_KEY = "AUTH_INVALID_KEY",
  AUTH_EXPIRED = "AUTH_EXPIRED",
  AUTH_DENIED = "AUTH_DENIED",

  // Network errors
  NETWORK_ERROR = "NETWORK_ERROR",
  NETWORK_TIMEOUT = "NETWORK_TIMEOUT",
  NETWORK_UNAVAILABLE = "NETWORK_UNAVAILABLE",

  // Agent state errors
  AGENT_NOT_INITIALIZED = "AGENT_NOT_INITIALIZED",
  AGENT_ALREADY_INITIALIZED = "AGENT_ALREADY_INITIALIZED",

  // Session state errors
  SESSION_INVALID_STATE = "SESSION_INVALID_STATE",
  SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
  SESSION_ALREADY_COMPLETED = "SESSION_ALREADY_COMPLETED",

  // Persistence errors
  PERSISTENCE_SAVE_FAILED = "PERSISTENCE_SAVE_FAILED",
  PERSISTENCE_LOAD_FAILED = "PERSISTENCE_LOAD_FAILED",
  PERSISTENCE_DELETE_FAILED = "PERSISTENCE_DELETE_FAILED",

  // Validation errors
  VALIDATION_FAILED = "VALIDATION_FAILED",

  // Adapter errors
  ADAPTER_ERROR = "ADAPTER_ERROR",
  ADAPTER_STREAM_ERROR = "ADAPTER_STREAM_ERROR",

  // Unknown error
  UNKNOWN = "UNKNOWN",
}

/**
 * Agent SDK Error class
 */
export class AgentError extends Error {
  constructor(
    message: string,
    public readonly code: AgentErrorCode,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AgentError";
    Error.captureStackTrace?.(this, this.constructor);
  }

  /**
   * Check if error is a specific code
   */
  is(code: AgentErrorCode): boolean {
    return this.code === code;
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
    };
  }
}

/**
 * Error factory for common errors
 */
export const AgentErrors = {
  // Config
  configInvalid: (message: string, context?: Record<string, unknown>) =>
    new AgentError(message, AgentErrorCode.CONFIG_INVALID, context),

  configMissing: (field: string, context?: Record<string, unknown>) =>
    new AgentError(`Missing required config: ${field}`, AgentErrorCode.CONFIG_MISSING, {
      ...context,
      field,
    }),

  // Auth
  authInvalidKey: (message = "Invalid API key", context?: Record<string, unknown>) =>
    new AgentError(message, AgentErrorCode.AUTH_INVALID_KEY, context),

  authExpired: (message = "API key expired", context?: Record<string, unknown>) =>
    new AgentError(message, AgentErrorCode.AUTH_EXPIRED, context),

  authDenied: (message = "Access denied", context?: Record<string, unknown>) =>
    new AgentError(message, AgentErrorCode.AUTH_DENIED, context),

  // Network
  network: (message: string, statusCode?: number, context?: Record<string, unknown>) =>
    new AgentError(message, AgentErrorCode.NETWORK_ERROR, { ...context, statusCode }),

  timeout: (message: string, timeoutMs: number, context?: Record<string, unknown>) =>
    new AgentError(message, AgentErrorCode.NETWORK_TIMEOUT, { ...context, timeoutMs }),

  unavailable: (message = "Network unavailable", context?: Record<string, unknown>) =>
    new AgentError(message, AgentErrorCode.NETWORK_UNAVAILABLE, context),

  // Agent state
  notInitialized: (message = "Agent not initialized. Call initialize() first.") =>
    new AgentError(message, AgentErrorCode.AGENT_NOT_INITIALIZED),

  alreadyInitialized: (message = "Agent already initialized") =>
    new AgentError(message, AgentErrorCode.AGENT_ALREADY_INITIALIZED),

  // Session state
  sessionInvalidState: (
    message: string,
    currentState: string,
    expectedState: string,
    context?: Record<string, unknown>
  ) =>
    new AgentError(message, AgentErrorCode.SESSION_INVALID_STATE, {
      ...context,
      currentState,
      expectedState,
    }),

  sessionNotFound: (sessionId: string) =>
    new AgentError(`Session not found: ${sessionId}`, AgentErrorCode.SESSION_NOT_FOUND, {
      sessionId,
    }),

  sessionCompleted: (message = "Session already completed") =>
    new AgentError(message, AgentErrorCode.SESSION_ALREADY_COMPLETED),

  // Persistence
  persistenceSave: (message: string, context?: Record<string, unknown>) =>
    new AgentError(message, AgentErrorCode.PERSISTENCE_SAVE_FAILED, context),

  persistenceLoad: (message: string, context?: Record<string, unknown>) =>
    new AgentError(message, AgentErrorCode.PERSISTENCE_LOAD_FAILED, context),

  persistenceDelete: (message: string, context?: Record<string, unknown>) =>
    new AgentError(message, AgentErrorCode.PERSISTENCE_DELETE_FAILED, context),

  // Validation
  validation: (
    message: string,
    field?: string,
    value?: unknown,
    context?: Record<string, unknown>
  ) => new AgentError(message, AgentErrorCode.VALIDATION_FAILED, { ...context, field, value }),

  // Adapter
  adapter: (message: string, adapterName: string, context?: Record<string, unknown>) =>
    new AgentError(message, AgentErrorCode.ADAPTER_ERROR, { ...context, adapterName }),

  adapterStream: (message: string, context?: Record<string, unknown>) =>
    new AgentError(message, AgentErrorCode.ADAPTER_STREAM_ERROR, context),

  // Unknown
  unknown: (message: string, context?: Record<string, unknown>) =>
    new AgentError(message, AgentErrorCode.UNKNOWN, context),
};
