/**
 * SQLite implementation of MessagePersister
 */

import { eq, count } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { Logger } from "@deepracticex/logger";
import type { MessagePersister } from "~/types/persister";
import type { AnyMessage, ContentBlock } from "@deepractice-ai/agent-types";
import { messages } from "./schema";
import * as schema from "./schema";

/**
 * SQLite-based message persister
 * Stores complete ContentBlock[] structure for image support
 */
export class SQLiteMessagePersister implements MessagePersister {
  constructor(
    private db: BetterSQLite3Database<typeof schema>,
    private logger: Logger
  ) {}

  async saveMessage(sessionId: string, message: AnyMessage): Promise<void> {
    try {
      const now = new Date().toISOString();

      // Prepare content - handle both string and ContentBlock[]
      const content = "content" in message ? message.content : "";
      const contentJson = typeof content === "string" ? content : JSON.stringify(content);

      // Extract tool use information if present
      let isToolUse = false;
      let toolName: string | null = null;
      let toolInput: string | null = null;
      let toolId: string | null = null;
      let toolResult: string | null = null;

      if (message.type === "tool") {
        isToolUse = true;
        // Tool message has tool_use_id and result
        const toolMsg = message as any;
        toolId = toolMsg.tool_use_id || null;
        if (toolMsg.result) {
          toolResult = JSON.stringify(toolMsg.result);
        }
      } else if ("content" in message && Array.isArray(message.content)) {
        // Check if content contains tool use blocks
        // Note: ToolUse is not part of ContentBlock[], but may appear in runtime
        const toolUseBlock = (message.content as any[]).find(
          (block: any) => block.type === "tool_use"
        );
        if (toolUseBlock) {
          isToolUse = true;
          toolName = toolUseBlock.name;
          toolInput = JSON.stringify(toolUseBlock.input);
          toolId = toolUseBlock.id;
        }
      }

      await this.db.insert(messages).values({
        id: message.id,
        sessionId,
        type: message.type,
        content: contentJson,
        timestamp: now,
        isToolUse,
        toolName,
        toolInput,
        toolId,
        toolResult,
      });

      this.logger.debug("Message saved", {
        sessionId,
        messageId: message.id,
        type: message.type,
        isToolUse,
      });
    } catch (error) {
      this.logger.error("Failed to save message", {
        error,
        sessionId,
        messageId: message.id,
      });
      throw error;
    }
  }

  async saveMessages(sessionId: string, messageList: AnyMessage[]): Promise<void> {
    try {
      // Save messages sequentially (better-sqlite3 handles transactions internally)
      for (const message of messageList) {
        await this.saveMessage(sessionId, message);
      }

      this.logger.debug("Messages batch saved", {
        sessionId,
        count: messageList.length,
      });
    } catch (error) {
      this.logger.error("Failed to save messages batch", {
        error,
        sessionId,
        count: messageList.length,
      });
      throw error;
    }
  }

  async getMessages(sessionId: string, limit = 100, offset = 0): Promise<AnyMessage[]> {
    try {
      const rows = await this.db
        .select()
        .from(messages)
        .where(eq(messages.sessionId, sessionId))
        .orderBy(messages.timestamp)
        .limit(limit)
        .offset(offset);

      const result = rows.map((row) => {
        // Parse content back to ContentBlock[] or string
        let content: string | ContentBlock[];
        try {
          content = JSON.parse(row.content);
        } catch {
          // If parse fails, treat as string
          content = row.content;
        }

        return {
          id: row.id,
          type: row.type as AnyMessage["type"],
          content,
          timestamp: row.timestamp,
        } as AnyMessage;
      });

      this.logger.debug("Messages retrieved", {
        sessionId,
        count: result.length,
        limit,
        offset,
      });

      return result;
    } catch (error) {
      this.logger.error("Failed to get messages", {
        error,
        sessionId,
        limit,
        offset,
      });
      throw error;
    }
  }

  async deleteMessages(sessionId: string): Promise<void> {
    try {
      await this.db.delete(messages).where(eq(messages.sessionId, sessionId));

      this.logger.debug("Messages deleted", { sessionId });
    } catch (error) {
      this.logger.error("Failed to delete messages", { error, sessionId });
      throw error;
    }
  }

  async getMessageCount(sessionId: string): Promise<number> {
    try {
      const result = await this.db
        .select({ count: count() })
        .from(messages)
        .where(eq(messages.sessionId, sessionId));

      const total = result[0]?.count || 0;

      this.logger.debug("Message count retrieved", { sessionId, count: total });

      return total;
    } catch (error) {
      this.logger.error("Failed to get message count", { error, sessionId });
      throw error;
    }
  }
}
