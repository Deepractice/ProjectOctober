import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKMessage, SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";
import { randomUUID } from "crypto";
import type { Logger } from "@deepracticex/logger";
import type {
  AgentConfig,
  SessionOptions,
  ContentBlock,
  AgentAdapter,
  DomainMessage,
} from "~/types";

/**
 * ClaudeAdapter - wraps @anthropic-ai/claude-agent-sdk
 *
 * Implements AgentAdapter interface for Claude SDK
 *
 * Responsibilities:
 * - Call Claude SDK's query() function
 * - Transform Claude SDK messages to domain AnyMessage format
 * - Extract and manage Claude session IDs for resume functionality
 * - Handle multi-modal content (text + images)
 * - Handle tool_use and tool_result messages
 * - Return session option updates when Claude session ID is extracted
 *
 * Design principle: ALL Claude-specific logic lives here.
 * Session layer should have zero knowledge of Claude.
 */
export class ClaudeAdapter implements AgentAdapter {
  private logger: Logger;
  private claudeSessionId: string | null = null;

  constructor(
    private readonly config: AgentConfig,
    logger: Logger
  ) {
    this.logger = logger;
    this.logger.debug(
      { workspace: config.workspace, model: config.model },
      "ClaudeAdapter created"
    );
  }

  getName(): string {
    return "claude";
  }

  async *stream(
    prompt: string | ContentBlock[],
    options: SessionOptions = {}
  ): AsyncGenerator<DomainMessage> {
    // Use saved Claude session ID for resume
    const resumeSessionId = this.claudeSessionId || options.resume;
    const sdkOptions = this.mapOptions(options, resumeSessionId);
    const sdkPrompt = this.convertToSDKPrompt(prompt);

    const promptLength = typeof prompt === "string" ? prompt.length : JSON.stringify(prompt).length;

    this.logger.info(
      {
        promptLength,
        isMultiModal: typeof prompt !== "string",
        model: sdkOptions.model,
        cwd: sdkOptions.cwd,
        hasResume: !!resumeSessionId,
        claudeSessionId: this.claudeSessionId,
      },
      "Starting Claude SDK stream"
    );

    try {
      const queryInstance = query({
        prompt: sdkPrompt,
        options: sdkOptions,
      });

      let messageCount = 0;
      let sessionIdExtracted = false;

      for await (const sdkMessage of queryInstance) {
        messageCount++;

        this.logger.debug(
          {
            messageCount,
            messageType: sdkMessage.type,
            hasSessionId: !!(sdkMessage as any).session_id,
          },
          "Received message from Claude SDK"
        );

        // Extract Claude session ID (only once per stream)
        if (!sessionIdExtracted && (sdkMessage as any).session_id) {
          const extractedId = (sdkMessage as any).session_id as string;
          if (!this.claudeSessionId) {
            this.claudeSessionId = extractedId;
            sessionIdExtracted = true;
            this.logger.info(
              { claudeSessionId: this.claudeSessionId },
              "Claude session ID captured"
            );
          }
        }

        // Transform SDK message to domain messages
        const domainMessages = this.transformToDomain(sdkMessage);

        for (const domainMsg of domainMessages) {
          // If we just extracted session ID, attach options update
          if (sessionIdExtracted && !options.resume) {
            yield {
              ...domainMsg,
              updatedOptions: { resume: this.claudeSessionId! },
            };
            sessionIdExtracted = false; // Only send update once
          } else {
            yield domainMsg;
          }
        }

        // Extract token usage from result messages
        if (sdkMessage.type === "result" && "usage" in sdkMessage) {
          // Token usage is already attached to the last message
          // Just log it here
          this.logger.debug({ usage: sdkMessage.usage }, "Token usage from Claude");
        }
      }

      this.logger.info({ messageCount }, "Claude SDK stream completed");
    } catch (err) {
      this.logger.error({ err, promptLength }, "Claude SDK stream failed");
      throw err;
    }
  }

  /**
   * Transform Claude SDK message to domain AnyMessage format
   * Handles all Claude-specific message types and structures
   *
   * @param sdkMessage - Message from Claude SDK
   * @returns Array of domain messages (may be empty for skipped messages)
   */
  private transformToDomain(sdkMessage: SDKMessage): DomainMessage[] {
    const timestamp = new Date();
    const results: DomainMessage[] = [];

    // Handle user messages
    if (sdkMessage.type === "user") {
      // Check if it's a tool_result message (internal, don't display)
      if ("message" in sdkMessage && sdkMessage.message) {
        const content = (sdkMessage.message as any).content;
        if (Array.isArray(content)) {
          const hasToolResult = content.some((block: any) => block.type === "tool_result");
          if (hasToolResult) {
            this.logger.debug("Skipping tool_result user message");
            return [];
          }
        }
      }

      // Regular user message
      const content = "message" in sdkMessage ? (sdkMessage.message as any).content : "";
      results.push({
        id: (sdkMessage as any).uuid || randomUUID(),
        type: "user",
        content: content as any,
        timestamp,
      });
    }

    // Handle assistant messages
    if (sdkMessage.type === "assistant") {
      const content = "message" in sdkMessage ? (sdkMessage.message as any).content : null;

      if (Array.isArray(content)) {
        // Process each content block
        for (const block of content) {
          if (block.type === "text" && block.text) {
            // Text content
            results.push({
              id: (sdkMessage as any).uuid || randomUUID(),
              type: "agent",
              content: block.text,
              timestamp,
            });
          } else if (block.type === "tool_use") {
            // Tool use
            results.push({
              id: (sdkMessage as any).uuid || randomUUID(),
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
          id: (sdkMessage as any).uuid || randomUUID(),
          type: "agent",
          content,
          timestamp,
        });
      }
    }

    // Extract token usage from result messages and attach to last message
    if (sdkMessage.type === "result" && "usage" in sdkMessage && results.length > 0) {
      const lastMsg = results[results.length - 1];
      lastMsg.usage = sdkMessage.usage as any;
    }

    return results;
  }

  /**
   * Convert our prompt format to Claude SDK prompt format
   */
  private convertToSDKPrompt(
    content: string | ContentBlock[]
  ): string | AsyncIterable<SDKUserMessage> {
    // If it's just a string, return as-is
    if (typeof content === "string") {
      return content;
    }

    // For ContentBlock[], wrap in SDKUserMessage format
    return (async function* () {
      yield {
        type: "user" as const,
        session_id: "",
        message: {
          role: "user" as const,
          content: content as any,
        },
        parent_tool_use_id: null,
      } as SDKUserMessage;
    })();
  }

  /**
   * Map our SessionOptions to Claude SDK options
   */
  private mapOptions(options: SessionOptions, resumeSessionId?: string | null): any {
    const model = options.model || this.config.model || "claude-sonnet-4";
    return {
      cwd: this.config.workspace,
      model: this.normalizeModelName(model),
      resume: resumeSessionId || undefined,
      mcpServers: this.config.mcpServers,
      settingSources: ["user", "project", "local"],
      permissionMode: "bypassPermissions",
      env: process.env,
      executable: process.execPath,
      stderr: (data: string) => {
        this.logger.debug({ stderr: data }, "Claude SDK stderr");
      },
    };
  }

  /**
   * Normalize model name to Claude SDK's short names
   */
  private normalizeModelName(model: string): string {
    const modelMap: Record<string, string> = {
      "claude-sonnet-4": "sonnet",
      "claude-opus-4": "opus",
      "claude-haiku-4": "haiku",
      "claude-haiku-4-5-20251001": "haiku",
      "claude-3-5-sonnet": "sonnet",
      "claude-3-opus": "opus",
      "claude-3-haiku": "haiku",
    };

    return modelMap[model] || model;
  }
}
