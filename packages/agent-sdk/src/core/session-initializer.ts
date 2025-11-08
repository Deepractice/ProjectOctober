/**
 * SessionInitializer - Handle first message and session initialization
 * Ensures proper order: get realSessionId → save session → save messages
 */

import type { Logger } from "@deepracticex/logger";
import type { ClaudeAdapter } from "./claude-adapter";
import type { AgentPersister } from "~/types/persister";
import type { AnyMessage, ContentBlock, SessionOptions } from "~/types";

export interface SessionInitResult {
  realSessionId: string;
  firstUserMessage: AnyMessage;
}

/**
 * Handles the critical first-message flow:
 * 1. Send user message to Claude SDK
 * 2. Wait for first response to get realSessionId
 * 3. Save session record to database
 * 4. Save user message to database
 * 5. Return realSessionId for session to continue
 */
export class SessionInitializer {
  constructor(
    private adapter: ClaudeAdapter,
    private persister: AgentPersister,
    private logger: Logger
  ) {}

  /**
   * Initialize session by saving session record
   * Called when realSessionId is first captured
   *
   * @param realSessionId - Real session ID from Claude SDK
   * @param userMessage - The first user message to save
   * @param sessionMetadata - Metadata for session record
   */
  async initializeWithRealId(
    realSessionId: string,
    userMessage: AnyMessage,
    sessionMetadata: {
      projectPath: string;
      model: string;
      createdAt: Date;
    }
  ): Promise<void> {
    this.logger.info(
      {
        realSessionId,
        messageId: userMessage.id,
        hasImages: Array.isArray(userMessage.content),
      },
      "SessionInitializer: Initializing with real ID"
    );

    try {
      // Step 1: Save session record
      await this.persister.saveSession({
        id: realSessionId,
        summary: this.extractSummary(userMessage),
        createdAt: sessionMetadata.createdAt,
        lastActivity: new Date(),
        cwd: sessionMetadata.projectPath,
      });

      this.logger.info({ realSessionId }, "Session record saved");

      // Step 2: Save user message
      await this.persister.messages.saveMessage(realSessionId, userMessage);

      this.logger.info({ realSessionId, messageId: userMessage.id }, "User message saved");
    } catch (error) {
      this.logger.error(
        { error, realSessionId, messageId: userMessage.id },
        "Failed to initialize session"
      );
      throw error;
    }
  }

  /**
   * Extract session summary from first user message
   */
  private extractSummary(message: AnyMessage): string {
    const content = message.content;

    if (typeof content === "string") {
      return content.substring(0, 100);
    }

    if (Array.isArray(content)) {
      // For ContentBlock[], just use a generic summary
      return "New Session";
    }

    return "New Session";
  }
}
