/**
 * Agent Configuration Error
 *
 * Thrown when agent configuration is invalid.
 * This is a programming error that should be fixed before runtime.
 */

export class AgentConfigError extends Error {
  /**
   * The configuration field that caused the error
   */
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "AgentConfigError";
    this.field = field;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AgentConfigError);
    }
  }
}
