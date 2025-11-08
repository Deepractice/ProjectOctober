/**
 * SQLite implementation of AgentPersister
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { mkdir } from "fs/promises";
import { dirname, join } from "path";
import { existsSync } from "fs";
import type { Logger } from "@deepracticex/logger";
import type { AgentPersister, SessionData } from "~/types/persister";
import { SQLiteMessagePersister } from "./sqlite-message-persister";
import * as schema from "./schema";
import { sessions } from "./schema";

/**
 * SQLite-based agent persister
 * Stores all agent data in .agentx/agent.db
 */
export class SQLiteAgentPersister implements AgentPersister {
  private db: BetterSQLite3Database<typeof schema>;
  public messages: SQLiteMessagePersister;

  constructor(
    workspace: string,
    private logger: Logger,
    options?: {
      dbPath?: string;
    }
  ) {
    // Default to .agentx/data/agent.db in workspace
    const dbPath = options?.dbPath || join(workspace, ".agentx", "data", "agent.db");

    logger.info("Initializing SQLite persister", { dbPath });

    // Ensure .agentx directory exists
    this.ensureDirectoryExists(dirname(dbPath));

    // Initialize database
    const sqlite = new Database(dbPath);
    this.db = drizzle(sqlite, { schema });

    // Initialize tables
    this.initializeTables();

    // Create message persister
    this.messages = new SQLiteMessagePersister(this.db, logger);

    logger.info("SQLite persister initialized", { dbPath });
  }

  /**
   * Ensure directory exists
   */
  private ensureDirectoryExists(dir: string): void {
    if (!existsSync(dir)) {
      mkdir(dir, { recursive: true }).catch((error) => {
        this.logger.error("Failed to create directory", { error, dir });
        throw error;
      });
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

      this.logger.debug("Database tables initialized");
    } catch (error) {
      this.logger.error("Failed to initialize tables", { error });
      throw error;
    }
  }

  /**
   * Save session metadata
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

      this.logger.debug("Session saved", { sessionId: session.id });
    } catch (error) {
      this.logger.error("Failed to save session", { error, sessionId: session.id });
      throw error;
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    try {
      // Better-sqlite3 doesn't have a close method on drizzle wrapper
      // The underlying Database instance will be closed when process exits
      this.logger.info("SQLite persister closed");
    } catch (error) {
      this.logger.error("Failed to close database", { error });
      throw error;
    }
  }
}
