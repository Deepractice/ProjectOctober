/**
 * Agent Abort Error
 *
 * Thrown when an agent operation is aborted.
 * Aligned with: AbortError from @anthropic-ai/claude-agent-sdk
 */

export class AgentAbortError extends Error {
  constructor(message: string = "Agent operation aborted") {
    super(message);
    this.name = "AgentAbortError";

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AgentAbortError);
    }
  }
}
