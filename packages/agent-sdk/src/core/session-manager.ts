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
import { WarmupPool } from "./warmup-pool";
import { HistoricalSession } from "./historical-session";
import type { Logger } from "@deepracticex/logger";

/**
 * SessionManager - manages all sessions lifecycle
 */
export class SessionManager {
  private sessions = new Map<string, ClaudeSession>();
  private sessionEventsSubject = new Subject<SessionEvent>();
  private adapter: ClaudeAdapter;
  private warmupPool: WarmupPool | null = null;
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

  setWarmupPool(pool: WarmupPool): void {
    this.warmupPool = pool;
  }

  async createSession(options?: SessionOptions): Promise<Session> {
    const startTime = Date.now();

    // Try to get warm session
    const warmSessionId = this.warmupPool?.acquire();
    const sessionId = warmSessionId || this.generateId();
    const isWarmSession = !!warmSessionId;

    this.logger.debug({ sessionId, isWarmSession, model: options?.model }, "Creating session");

    const session = new ClaudeSession(
      sessionId,
      {
        projectPath: this.config.workspace,
        model: options?.model || this.config.model || "claude-sonnet-4",
        startTime: new Date(),
      },
      this.adapter,
      options,
      isWarmSession,
      this.logger
    );

    this.sessions.set(sessionId, session);
    this.sessionEventsSubject.next({ type: "created", sessionId });

    this.metrics.totalCreated++;
    const responseTime = Date.now() - startTime;
    this.metrics.totalResponseTime += responseTime;

    this.logger.info({ sessionId, isWarmSession, responseTime }, "Session created successfully");

    return session;
  }

  getSession(id: string): Session | null {
    const session = this.sessions.get(id);
    if (session && session.state === "deleted") {
      return null;
    }
    return session || null;
  }

  getSessions(limit: number, offset: number): Session[] {
    const all = Array.from(this.sessions.values());

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
      // Skip historical sessions - they can't be deleted directly
      if (session instanceof HistoricalSession) {
        continue;
      }
      session.delete().catch((err) => {
        this.logger.warn({ err, sessionId: session.id }, "Failed to delete session during destroy");
      });
    }
    this.sessions.clear();
    this.sessionEventsSubject.complete();
    this.logger.debug("SessionManager destroyed");
  }

  /**
   * Load all historical sessions from JSONL files on initialization
   */
  async loadHistoricalSessions(): Promise<void> {
    this.logger.debug({ sessionDir: this.sessionDir }, "Loading historical sessions");

    try {
      const files = await fs.readdir(this.sessionDir);
      const jsonlFiles = files.filter((f) => f.endsWith(".jsonl"));

      this.logger.debug({ fileCount: jsonlFiles.length }, "Found session files");

      let loadedCount = 0;
      for (const file of jsonlFiles) {
        const sessionId = path.basename(file, ".jsonl");

        // Skip if already in memory (active session)
        if (this.sessions.has(sessionId)) {
          continue;
        }

        // Load historical session
        const filePath = path.join(this.sessionDir, file);
        const session = await this.parseJsonlFile(filePath);

        if (session) {
          this.sessions.set(sessionId, session as any);
          loadedCount++;
        }
      }

      this.logger.info(
        { loadedCount, totalFiles: jsonlFiles.length },
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
   * Parse JSONL file and create HistoricalSession
   */
  private async parseJsonlFile(filePath: string): Promise<HistoricalSession | null> {
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

      return new HistoricalSession(sessionId, messages, metadata, tokenUsage);
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
