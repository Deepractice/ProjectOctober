import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKMessage, SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";
import type { Logger } from "@deepracticex/logger";
import type {
  AgentConfig,
  SessionOptions,
  ContentBlock,
  AgentAdapter,
  AdapterMessage,
} from "~/types";

/**
 * ClaudeAdapter - wraps @anthropic-ai/claude-agent-sdk
 *
 * Implements AgentAdapter interface for Claude SDK
 *
 * Responsibilities:
 * - Call Claude SDK's query() function
 * - Stream SDKMessages back
 * - Transform SDKMessage to AdapterMessage format
 * - Handle multi-modal content (text + images)
 *
 * What it doesn't do:
 * - Session management (handled by Session layer)
 * - Message persistence (handled by Persister)
 * - Message transformation to domain types (handled by ClaudeSession)
 */
export class ClaudeAdapter implements AgentAdapter {
  private logger: Logger;

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
  ): AsyncGenerator<AdapterMessage> {
    const sdkOptions = this.mapOptions(options);
    const sdkPrompt = this.convertToSDKPrompt(prompt);

    const promptLength = typeof prompt === "string" ? prompt.length : JSON.stringify(prompt).length;

    this.logger.info(
      {
        promptLength,
        isMultiModal: typeof prompt !== "string",
        model: sdkOptions.model,
        cwd: sdkOptions.cwd,
        hasResume: !!options.resume,
      },
      "Starting Claude SDK stream"
    );

    try {
      const queryInstance = query({
        prompt: sdkPrompt,
        options: sdkOptions,
      });

      let messageCount = 0;

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

        // Transform SDK message to adapter message
        yield this.transformToAdapterMessage(sdkMessage);
      }

      this.logger.info({ messageCount }, "Claude SDK stream completed");
    } catch (err) {
      this.logger.error({ err, promptLength }, "Claude SDK stream failed");
      throw err;
    }
  }

  /**
   * Transform Claude SDK message to generic AdapterMessage
   */
  private transformToAdapterMessage(sdkMessage: SDKMessage): AdapterMessage {
    const adapterMsg: AdapterMessage = {
      type: this.mapMessageType(sdkMessage.type),
      raw: sdkMessage,
    };

    // Extract session_id if present
    if ("session_id" in sdkMessage && sdkMessage.session_id) {
      adapterMsg.sessionId = sdkMessage.session_id;
    }

    // Extract UUID if present
    if ("uuid" in sdkMessage && sdkMessage.uuid) {
      adapterMsg.uuid = sdkMessage.uuid;
    }

    // Extract content
    if ("message" in sdkMessage && sdkMessage.message) {
      adapterMsg.content = (sdkMessage.message as any).content;
    }

    // Extract usage (for result messages)
    if (sdkMessage.type === "result" && "usage" in sdkMessage) {
      adapterMsg.usage = sdkMessage.usage as any;
    }

    return adapterMsg;
  }

  /**
   * Map Claude SDK message type to generic type
   */
  private mapMessageType(type: string): "user" | "assistant" | "system" | "result" {
    switch (type) {
      case "user":
        return "user";
      case "assistant":
        return "assistant";
      case "system":
        return "system";
      case "result":
        return "result";
      default:
        return "system";
    }
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
  private mapOptions(options: SessionOptions): any {
    const model = options.model || this.config.model || "claude-sonnet-4";
    return {
      cwd: this.config.workspace,
      model: this.normalizeModelName(model),
      resume: options.resume,
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
