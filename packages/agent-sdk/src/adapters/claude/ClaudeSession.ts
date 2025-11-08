import type { Logger } from "@deepracticex/logger";
import type {
  SessionMetadata,
  SessionOptions,
  AgentAdapter,
  AdapterMessage,
  AnyMessage,
  MessagePersister,
} from "~/types";
import { BaseSession } from "~/core/base-session";

/**
 * ClaudeSession - Claude-specific Session implementation
 *
 * Extends BaseSession with Claude-specific logic:
 * - Transform Claude SDK messages to our domain types
 * - Handle Claude's session_id for resume functionality
 * - Handle tool_use and tool_result messages
 */
export class ClaudeSession extends BaseSession {
  private claudeSessionId: string | null = null;

  constructor(
    id: string,
    metadata: SessionMetadata,
    adapter: AgentAdapter,
    options: SessionOptions,
    logger: Logger,
    initialMessages: AnyMessage[] = [],
    initialTokenUsage?: any,
    messagePersister?: MessagePersister
  ) {
    super(
      id,
      metadata,
      adapter,
      options,
      logger,
      initialMessages,
      initialTokenUsage,
      messagePersister
    );
  }

  /**
   * Extract Claude session ID from adapter message
   */
  protected extractSessionId(msg: AdapterMessage): string | null {
    if (msg.sessionId && !this.claudeSessionId) {
      return msg.sessionId;
    }
    return null;
  }

  /**
   * Handle when Claude session ID is extracted
   * Store it for resume functionality
   */
  protected async onSessionIdExtracted(sessionId: string): Promise<void> {
    this.claudeSessionId = sessionId;
    this.logger.info({ ourId: this.id, claudeSessionId: sessionId }, "Claude session ID captured");

    // Update options to include resume for next send()
    this.options = {
      ...this.options,
      resume: sessionId,
    };
  }

  /**
   * Transform Claude adapter message to our domain message type
   */
  protected transformMessage(msg: AdapterMessage): AnyMessage | null {
    const timestamp = new Date();

    // Handle user messages
    if (msg.type === "user") {
      // Check if it's a tool_result message (internal, don't display)
      if (Array.isArray(msg.content)) {
        const hasToolResult = msg.content.some((block: any) => block.type === "tool_result");
        if (hasToolResult) {
          this.logger.debug({ sessionId: this.id }, "Skipping tool_result user message");
          return null;
        }
      }

      // Regular user message
      return {
        id: msg.uuid || `user-${Date.now()}`,
        type: "user",
        content: msg.content as any,
        timestamp,
      };
    }

    // Handle assistant messages
    if (msg.type === "assistant") {
      const content = msg.content;
      const results: AnyMessage[] = [];

      if (Array.isArray(content)) {
        // Process each content block
        for (const block of content) {
          if (block.type === "text" && block.text) {
            // Text content
            results.push({
              id: msg.uuid || `agent-${Date.now()}-${results.length}`,
              type: "agent",
              content: block.text,
              timestamp,
            });
          } else if (block.type === "tool_use") {
            // Tool use
            results.push({
              id: msg.uuid || `tool-${Date.now()}-${results.length}`,
              type: "agent",
              content: "",
              timestamp,
              isToolUse: true,
              toolName: block.name,
              toolInput: block.input ? JSON.stringify(block.input, null, 2) : "",
              toolId: block.id,
              toolResult: null,
            } as any);
          }
        }
      } else if (typeof content === "string") {
        // String content (fallback)
        results.push({
          id: msg.uuid || `agent-${Date.now()}`,
          type: "agent",
          content,
          timestamp,
        });
      }

      // Return first message (BaseSession will add it)
      // TODO: Handle multiple messages from single assistant response
      return results[0] || null;
    }

    // Skip other message types (system, result)
    return null;
  }
}
