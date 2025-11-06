import { Observable, Subject } from "rxjs";
import { promises as fs } from "fs";
import fsSync from "fs";
import path from "path";
import os from "os";
import readline from "readline";
import type {
  AgentConfig,
  SessionOptions,
  SessionEvent,
  Session,
  PerformanceMetrics,
  AnyMessage,
  SessionMetadata,
  TokenUsage,
} from "~/types";
import { ClaudeSession } from "./claude-session";
import { ClaudeAdapter } from "./claude-adapter";
import type { Logger } from "@deepracticex/logger";

/**
 * SessionManager - manages all sessions lifecycle
 */
export class SessionManager {
  private sessions = new Map<string, ClaudeSession>();
  private sessionEventsSubject = new Subject<SessionEvent>();
  private adapter: ClaudeAdapter;
  private sessionDir: string;
  private metrics = {
    totalCreated: 0,
    totalResponseTime: 0,
  };
  private logger: Logger;

  constructor(
    private readonly config: AgentConfig,
    logger: Logger
  ) {
    this.logger = logger;
    this.adapter = new ClaudeAdapter(config, logger);
    this.sessionDir = this.resolveSessionDirectory(config.workspace);
    this.logger.debug({ sessionDir: this.sessionDir }, "SessionManager created");
  }

  /**
   * Resolve session directory path from workspace
   * Format: ~/.claude/projects/<encoded-workspace-path>/
   */
  private resolveSessionDirectory(workspace: string): string {
    const fullPath = path.resolve(workspace);
    const encodedName = fullPath.replace(/\//g, "-");
    return path.join(os.homedir(), ".claude", "projects", encodedName);
  }

  async createSession(options?: SessionOptions): Promise<Session> {
    const startTime = Date.now();

    const sessionId = this.generateId();

    this.logger.debug({ sessionId, model: options?.model }, "Creating session");

    const session = new ClaudeSession(
      sessionId,
      {
        projectPath: this.config.workspace,
        model: options?.model || this.config.model || "claude-sonnet-4",
        startTime: new Date(),
      },
      this.adapter,
      options,
      false, // No warmup session
      this.logger
    );

    this.sessions.set(sessionId, session);
    this.sessionEventsSubject.next({ type: "created", sessionId });

    this.metrics.totalCreated++;
    const responseTime = Date.now() - startTime;
    this.metrics.totalResponseTime += responseTime;

    this.logger.info({ sessionId, responseTime }, "Session created successfully");

    return session;
  }

  /**
   * Get a session by ID
   */
  getSession(id: string): Session | null {
    const session = this.sessions.get(id);

    if (!session) {
      return null;
    }

    if (session.state === "deleted") {
      return null;
    }

    return session;
  }

  getSessions(limit: number, offset: number): Session[] {
    // Filter out warmup sessions and get all real sessions
    const all = Array.from(this.sessions.values()).filter(
      (session) => !this.isWarmupSession(session.id)
    );

    // Sort by start time (newest first)
    all.sort((a, b) => {
      const timeA = a.getMetadata().startTime.getTime();
      const timeB = b.getMetadata().startTime.getTime();
      return timeB - timeA;
    });

    return all.slice(offset, offset + limit);
  }

  async deleteSession(id: string): Promise<void> {
    const session = this.sessions.get(id);
    if (session) {
      this.logger.debug({ sessionId: id }, "Deleting session");

      // Delete the .jsonl file if it exists
      const filePath = path.join(this.sessionDir, `${id}.jsonl`);
      try {
        await fs.unlink(filePath);
        this.logger.debug({ sessionId: id, filePath }, "Deleted session file");
      } catch (error) {
        if ((error as any).code !== "ENOENT") {
          this.logger.warn(
            { err: error, sessionId: id, filePath },
            "Failed to delete session file"
          );
        }
      }

      // Call delete() method to clean up session
      await session.delete();

      this.sessions.delete(id);
      this.sessionEventsSubject.next({ type: "deleted", sessionId: id });
      this.logger.info({ sessionId: id }, "Session deleted");
    } else {
      this.logger.warn({ sessionId: id }, "Attempted to delete non-existent session");
    }
  }

  sessionEvents$(): Observable<SessionEvent> {
    return this.sessionEventsSubject.asObservable();
  }

  activeCount(): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      // Count all sessions that are not completed (created, active)
      if (!session.isCompleted()) {
        count++;
      }
    }
    return count;
  }

  getMetrics(): PerformanceMetrics {
    return {
      avgResponseTime:
        this.metrics.totalCreated > 0
          ? this.metrics.totalResponseTime / this.metrics.totalCreated
          : 0,
      totalSessions: this.sessions.size,
      cacheHitRate: 0, // TODO: Calculate from actual cache stats
    };
  }

  destroy(): void {
    this.logger.info({ sessionCount: this.sessions.size }, "Destroying SessionManager");
    for (const session of this.sessions.values()) {
      session.delete().catch((err) => {
        this.logger.warn({ err, sessionId: session.id }, "Failed to delete session during destroy");
      });
    }
    this.sessions.clear();
    this.sessionEventsSubject.complete();
    this.logger.debug("SessionManager destroyed");
  }

  /**
   * Check if a session ID represents a warmup/subagent session
   * Warmup sessions have IDs like "agent-{shortId}" (e.g., agent-8c147a19)
   */
  private isWarmupSession(sessionId: string): boolean {
    return sessionId.startsWith("agent-") && sessionId.length < 20;
  }

  /**
   * Load all historical sessions from JSONL files on initialization
   * Filters out SDK warmup sessions (agent-*) automatically
   */
  async loadHistoricalSessions(): Promise<void> {
    this.logger.debug({ sessionDir: this.sessionDir }, "Loading historical sessions");

    try {
      const files = await fs.readdir(this.sessionDir);
      const jsonlFiles = files.filter((f) => f.endsWith(".jsonl"));

      this.logger.debug({ fileCount: jsonlFiles.length }, "Found session files");

      let loadedCount = 0;
      let skippedWarmup = 0;
      for (const file of jsonlFiles) {
        const sessionId = path.basename(file, ".jsonl");

        // Skip if already in memory (active session)
        if (this.sessions.has(sessionId)) {
          continue;
        }

        // Skip SDK warmup/subagent sessions
        if (this.isWarmupSession(sessionId)) {
          skippedWarmup++;
          this.logger.debug({ sessionId }, "Skipping warmup session");
          continue;
        }

        // Load historical session
        const filePath = path.join(this.sessionDir, file);
        const sessionData = await this.parseJsonlFile(filePath);

        if (sessionData) {
          // Create ClaudeSession with historical messages
          const session = new ClaudeSession(
            sessionId,
            sessionData.metadata,
            this.adapter,
            {}, // No options needed for historical sessions
            false, // Not from warmup pool
            this.logger,
            sessionData.messages, // Pass historical messages
            sessionData.tokenUsage // Pass token usage
          );

          this.sessions.set(sessionId, session);
          loadedCount++;
        }
      }

      this.logger.info(
        { loadedCount, skippedWarmup, totalFiles: jsonlFiles.length },
        "Historical sessions loaded"
      );
    } catch (error) {
      // Directory might not exist for new projects
      if ((error as any).code !== "ENOENT") {
        this.logger.error(
          { err: error, sessionDir: this.sessionDir },
          "Failed to load historical sessions"
        );
        throw error;
      }
      this.logger.debug(
        { sessionDir: this.sessionDir },
        "Session directory does not exist (new project)"
      );
    }
  }

  /**
   * Parse JSONL file and return session data
   */
  private async parseJsonlFile(filePath: string): Promise<{
    messages: AnyMessage[];
    metadata: SessionMetadata;
    tokenUsage: TokenUsage;
  } | null> {
    const sessionId = path.basename(filePath, ".jsonl");
    const messages: AnyMessage[] = [];
    let metadata: SessionMetadata | null = null;
    let tokenUsage: TokenUsage = {
      used: 0,
      total: 160000,
      breakdown: { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 },
    };

    try {
      const fileStream = fsSync.createReadStream(filePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        if (!line.trim()) continue;

        try {
          const entry = JSON.parse(line);

          // Extract metadata from first entry
          if (!metadata && entry.cwd) {
            metadata = {
              projectPath: entry.cwd,
              model: entry.message?.model || "unknown",
              startTime: new Date(entry.timestamp || Date.now()),
            };
          }

          // Parse message
          if (entry.type === "user" || entry.type === "assistant") {
            messages.push({
              id: entry.uuid || `${entry.type}-${Date.now()}`,
              type: entry.type,
              content: this.extractContent(entry.message),
              timestamp: new Date(entry.timestamp || Date.now()),
            });
          }

          // Extract token usage
          if (entry.message?.usage) {
            const usage = entry.message.usage;
            tokenUsage.breakdown.input += usage.input_tokens || 0;
            tokenUsage.breakdown.output += usage.output_tokens || 0;
            tokenUsage.breakdown.cacheRead += usage.cache_read_input_tokens || 0;
            tokenUsage.breakdown.cacheCreation += usage.cache_creation_input_tokens || 0;
            tokenUsage.used =
              tokenUsage.breakdown.input +
              tokenUsage.breakdown.output +
              tokenUsage.breakdown.cacheRead +
              tokenUsage.breakdown.cacheCreation;
          }
        } catch (_parseError) {
          // Skip malformed lines
          continue;
        }
      }

      if (!metadata) {
        metadata = {
          projectPath: this.config.workspace,
          model: "unknown",
          startTime: new Date(),
        };
      }

      return { messages, metadata, tokenUsage };
    } catch (error) {
      this.logger.error({ err: error, filePath, sessionId }, "Failed to parse session file");
      return null;
    }
  }

  /**
   * Extract content from SDK message format
   */
  private extractContent(message: any): string {
    if (!message) return "";

    if (typeof message.content === "string") {
      return message.content;
    }

    if (Array.isArray(message.content)) {
      return message.content
        .map((block: any) => {
          if (block.type === "text") return block.text;
          if (block.type === "tool_use") return `[Tool: ${block.name}]`;
          return "";
        })
        .join("\n");
    }

    return "";
  }

  private generateId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
