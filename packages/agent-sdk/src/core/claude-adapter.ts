import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import type { Logger } from "@deepracticex/logger";
import type { AgentConfig, SessionOptions } from "~/types";

/**
 * ClaudeAdapter - wraps @anthropic-ai/claude-agent-sdk
 *
 * Isolates Claude SDK dependency, makes it easier to:
 * - Mock in tests
 * - Swap SDK versions
 * - Add retry/error handling
 */
export class ClaudeAdapter {
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

  async *stream(prompt: string, options: SessionOptions = {}): AsyncGenerator<SDKMessage> {
    const sdkOptions = this.mapOptions(options);

    this.logger.debug(
      { promptLength: prompt.length, model: sdkOptions.model, resume: !!options.resume },
      "Starting Claude SDK stream"
    );

    try {
      const queryInstance = query({
        prompt,
        options: sdkOptions,
      });

      let messageCount = 0;
      for await (const message of queryInstance) {
        messageCount++;
        yield message;
      }

      this.logger.debug({ messageCount }, "Claude SDK stream completed");
    } catch (err) {
      this.logger.error({ err, promptLength: prompt.length }, "Claude SDK stream failed");
      throw err;
    }
  }

  private mapOptions(options: SessionOptions): any {
    const model = options.model || this.config.model || "claude-sonnet-4";
    return {
      cwd: this.config.workspace,
      model: this.normalizeModelName(model),
      resume: options.resume,
      mcpServers: this.config.mcpServers,
      permissionMode: "bypassPermissions",
      // Explicitly pass environment to ensure PATH is available for spawning processes
      env: process.env,
    };
  }

  private normalizeModelName(model: string): string {
    // Map full model names to SDK's short names
    const modelMap: Record<string, string> = {
      "claude-sonnet-4": "sonnet",
      "claude-opus-4": "opus",
      "claude-haiku-4": "haiku",
      "claude-haiku-4-5-20251001": "haiku", // Fast haiku variant
      "claude-3-5-sonnet": "sonnet",
      "claude-3-opus": "opus",
      "claude-3-haiku": "haiku",
    };

    return modelMap[model] || model;
  }
}
