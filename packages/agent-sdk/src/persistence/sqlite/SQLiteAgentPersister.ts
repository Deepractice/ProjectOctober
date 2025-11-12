/**
 * SQLite implementation of AgentPersister
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { eq, count, desc } from "drizzle-orm";
import { dirname, join } from "path";
import { existsSync, mkdirSync } from "fs";
import type { Logger } from "@deepracticex/logger";
import type { AgentPersister, SessionData } from "~/types/persister";
import type { AnyMessage, ContentBlock } from "~/types/message";
import * as schema from "./schema";
import { sessions, messages } from "./schema";

/**
 * SQLite-based agent persister
 * Stores all agent data in .agentx/agent.db
 *
 * Unified persister for sessions and messages.
 */
export class SQLiteAgentPersister implements AgentPersister {
  private db: BetterSQLite3Database<typeof schema>;

  constructor(
    workspace: string,
    private logger: Logger,
    options?: {
      dbPath?: string;
    }
  ) {
    // Default to .agentx/data/agent.db in workspace
    const dbPath = options?.dbPath || join(workspace, ".agentx", "data", "agent.db");

    logger.info({ dbPath }, "Initializing SQLite persister");

    // Ensure .agentx directory exists
    this.ensureDirectoryExists(dirname(dbPath));

    // Initialize database
    const sqlite = new Database(dbPath);
    this.db = drizzle(sqlite, { schema });

    // Initialize tables
    this.initializeTables();

    logger.info({ dbPath }, "SQLite persister initialized");
  }

  // ========================================
  // Private helpers
  // ========================================

  /**
   * Ensure directory exists (synchronous)
   */
  private ensureDirectoryExists(dir: string): void {
    if (!existsSync(dir)) {
      // Use sync version to ensure directory exists before database opens
      try {
        mkdirSync(dir, { recursive: true });
        this.logger.debug({ dir }, "Directory created");
      } catch (error) {
        this.logger.error({ error, dir }, "Failed to create directory");
        throw error;
      }
    }
  }

  /**
   * Initialize database tables
   * Use the underlying SQLite instance for DDL operations
   */
  private initializeTables(): void {
    try {
      // Get the underlying SQLite database instance
      // Drizzle wraps it, but we need raw SQL for CREATE TABLE
      const sqlite = (this.db as any).session.client;

      // Create sessions table
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          summary TEXT,
          created_at TEXT NOT NULL,
          last_activity TEXT NOT NULL,
          cwd TEXT,
          metadata TEXT
        )
      `);

      // Create messages table
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          type TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          is_tool_use INTEGER DEFAULT 0,
          tool_name TEXT,
          tool_input TEXT,
          tool_id TEXT,
          tool_result TEXT,
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        )
      `);

      // Create indexes
      sqlite.exec(`
        CREATE INDEX IF NOT EXISTS idx_messages_session
        ON messages(session_id)
      `);

      sqlite.exec(`
        CREATE INDEX IF NOT EXISTS idx_messages_timestamp
        ON messages(timestamp)
      `);

      sqlite.exec(`
        CREATE INDEX IF NOT EXISTS idx_messages_type
        ON messages(type)
      `);

      sqlite.exec(`
        CREATE INDEX IF NOT EXISTS idx_sessions_last_activity
        ON sessions(last_activity)
      `);

      this.logger.debug("Database tables initialized");
    } catch (error) {
      this.logger.error({ error }, "Failed to initialize tables");
      throw error;
    }
  }

  // ========================================
  // Session Operations
  // ========================================

  /**
   * Save session metadata
   * Creates or updates session in database
   */
  async saveSession(session: SessionData): Promise<void> {
    try {
      await this.db
        .insert(sessions)
        .values({
          id: session.id,
          summary: session.summary || null,
          createdAt: session.createdAt.toISOString(),
          lastActivity: session.lastActivity.toISOString(),
          cwd: session.cwd || null,
          metadata: null,
        })
        .onConflictDoUpdate({
          target: sessions.id,
          set: {
            summary: session.summary || null,
            lastActivity: session.lastActivity.toISOString(),
          },
        });

      this.logger.debug({ sessionId: session.id }, "Session saved");
    } catch (error) {
      this.logger.error({ error, sessionId: session.id }, "Failed to save session");
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  async getSession(id: string): Promise<SessionData | null> {
    try {
      const rows = await this.db.select().from(sessions).where(eq(sessions.id, id)).limit(1);

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      return {
        id: row.id,
        summary: row.summary || undefined,
        createdAt: new Date(row.createdAt),
        lastActivity: new Date(row.lastActivity),
        cwd: row.cwd || undefined,
      };
    } catch (error) {
      this.logger.error({ error, sessionId: id }, "Failed to get session");
      throw error;
    }
  }

  /**
   * Get all sessions (sorted by last activity, newest first)
   */
  async getAllSessions(): Promise<SessionData[]> {
    try {
      const rows = await this.db.select().from(sessions).orderBy(desc(sessions.lastActivity));

      const result = rows.map((row) => ({
        id: row.id,
        summary: row.summary || undefined,
        createdAt: new Date(row.createdAt),
        lastActivity: new Date(row.lastActivity),
        cwd: row.cwd || undefined,
      }));

      this.logger.debug({ count: result.length }, "Retrieved all sessions");

      return result;
    } catch (error) {
      this.logger.error({ error }, "Failed to get all sessions");
      throw error;
    }
  }

  /**
   * Delete session and all its messages
   */
  async deleteSession(id: string): Promise<void> {
    try {
      // Delete session (CASCADE will delete messages automatically)
      await this.db.delete(sessions).where(eq(sessions.id, id));

      this.logger.debug({ sessionId: id }, "Session deleted");
    } catch (error) {
      this.logger.error({ error, sessionId: id }, "Failed to delete session");
      throw error;
    }
  }

  // ========================================
  // Message Operations
  // ========================================

  /**
   * Save a single message
   */
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

      if ("content" in message && Array.isArray(message.content)) {
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

      this.logger.debug(
        {
          sessionId,
          messageId: message.id,
          type: message.type,
          isToolUse,
        },
        "Message saved"
      );
    } catch (error) {
      this.logger.error(
        {
          error,
          sessionId,
          messageId: message.id,
        },
        "Failed to save message"
      );
      throw error;
    }
  }

  /**
   * Save multiple messages (batch operation)
   */
  async saveMessages(sessionId: string, messageList: AnyMessage[]): Promise<void> {
    try {
      // Save messages sequentially (better-sqlite3 handles transactions internally)
      for (const message of messageList) {
        await this.saveMessage(sessionId, message);
      }

      this.logger.debug(
        {
          sessionId,
          count: messageList.length,
        },
        "Messages batch saved"
      );
    } catch (error) {
      this.logger.error(
        {
          error,
          sessionId,
          count: messageList.length,
        },
        "Failed to save messages batch"
      );
      throw error;
    }
  }

  /**
   * Get messages for a session
   */
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
          timestamp: new Date(row.timestamp),
        } as AnyMessage;
      });

      this.logger.debug(
        {
          sessionId,
          count: result.length,
          limit,
          offset,
        },
        "Messages retrieved"
      );

      return result;
    } catch (error) {
      this.logger.error(
        {
          error,
          sessionId,
          limit,
          offset,
        },
        "Failed to get messages"
      );
      throw error;
    }
  }

  /**
   * Delete all messages for a session
   */
  async deleteMessages(sessionId: string): Promise<void> {
    try {
      await this.db.delete(messages).where(eq(messages.sessionId, sessionId));

      this.logger.debug({ sessionId }, "Messages deleted");
    } catch (error) {
      this.logger.error({ error, sessionId }, "Failed to delete messages");
      throw error;
    }
  }

  /**
   * Get total message count for a session
   */
  async getMessageCount(sessionId: string): Promise<number> {
    try {
      const result = await this.db
        .select({ count: count() })
        .from(messages)
        .where(eq(messages.sessionId, sessionId));

      const total = result[0]?.count || 0;

      this.logger.debug({ sessionId, count: total }, "Message count retrieved");

      return total;
    } catch (error) {
      this.logger.error({ error, sessionId }, "Failed to get message count");
      throw error;
    }
  }

  // ========================================
  // Lifecycle
  // ========================================

  /**
   * Close database connection
   */
  close(): void {
    try {
      // Better-sqlite3 doesn't have a close method on drizzle wrapper
      // The underlying Database instance will be closed when process exits
      this.logger.info("SQLite persister closed");
    } catch (error) {
      this.logger.error({ error }, "Failed to close database");
      throw error;
    }
  }
}
