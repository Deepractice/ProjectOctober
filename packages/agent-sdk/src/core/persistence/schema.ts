/**
 * Drizzle ORM schema for Agent persistence
 * Corresponds to agent-types for type safety
 */

import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

/**
 * Sessions table
 */
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  summary: text("summary"),
  createdAt: text("created_at").notNull(),
  lastActivity: text("last_activity").notNull(),
  cwd: text("cwd"),
  metadata: text("metadata"), // JSON string
});

/**
 * Messages table
 * Stores complete message history with ContentBlock[] structure
 */
export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    type: text("type").notNull(), // 'user' | 'agent' | 'error' | 'tool' | 'system'
    content: text("content").notNull(), // JSON string of ContentBlock[] or string
    timestamp: text("timestamp").notNull(),

    // Tool use related fields
    isToolUse: integer("is_tool_use", { mode: "boolean" }).default(false),
    toolName: text("tool_name"),
    toolInput: text("tool_input"), // JSON string
    toolId: text("tool_id"),
    toolResult: text("tool_result"), // JSON string
  },
  (table) => ({
    sessionIdx: index("idx_messages_session").on(table.sessionId),
    timestampIdx: index("idx_messages_timestamp").on(table.timestamp),
    typeIdx: index("idx_messages_type").on(table.type),
  })
);

/**
 * Type exports for use with drizzle queries
 */
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
