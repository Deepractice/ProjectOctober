import { Observable, Subject } from "rxjs";
import { promises as fs } from "fs";
import fsSync from "fs";
import path from "path";
import os from "os";
import readline from "readline";
import type {
  AgentConfig,
  SessionEvent,
  Session,
  PerformanceMetrics,
  AnyMessage,
  SessionMetadata,
  TokenUsage,
  SessionCreateOptions,
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

  /**
   * Create a new session with initial message (lazy session creation)
   *
   * IMPORTANT: initialMessage is REQUIRED. Sessions are only created when user sends first message.
   * This ensures we always get a real Claude SDK session_id immediately.
   *
   * Flow:
   * 1. Create ClaudeSession with placeholder ID
   * 2. Immediately send initialMessage
   * 3. SDK returns real session_id
   * 4. Update session map with real ID
   *
   * @param options Must include initialMessage
   * @returns Session with real SDK session_id
   */
  async createSession(options: SessionCreateOptions): Promise<Session> {
    const startTime = Date.now();

    // Use a placeholder ID temporarily - will be replaced with SDK session_id
    const placeholderId = `placeholder-${Date.now()}`;

    this.logger.debug(
      { placeholderId, model: options?.model, messageLength: options.initialMessage.length },
      "Creating session with initial message"
    );

    const session = new ClaudeSession(
      placeholderId,
      {
        projectPath: this.config.workspace,
        model: options?.model || this.config.model || "claude-sonnet-4",
        startTime: new Date(),
      },
      this.adapter,
      { model: options?.model }, // SessionOptions for adapter
      false, // No warmup session
      this.logger
    );

    // Temporarily add to map with placeholder ID
    this.sessions.set(placeholderId, session);

    // Send initial message immediately to get real SDK session_id
    this.logger.debug({ placeholderId }, "Sending initial message to capture SDK session_id");

    // Subscribe to stream events BEFORE sending to catch all events
    let currentSessionId = placeholderId;
    session.streamEvents$().subscribe({
      next: (streamEvent) => {
        // Forward stream events for real-time UI updates
        this.logger.info(
          { sessionId: currentSessionId, eventType: streamEvent.event?.type },
          "🌊 Forwarding stream event"
        );
        this.sessionEventsSubject.next({
          type: "streaming",
          sessionId: currentSessionId,
          streamEvent,
        });
      },
    });

    await session.send(options.initialMessage);

    // After send(), session must have realSessionId
    const realSessionId = (session as any).realSessionId;
    currentSessionId = realSessionId; // Update session ID for future events

    if (!realSessionId) {
      this.logger.error({ placeholderId }, "Failed to capture SDK session_id after send()");
      throw new Error("Failed to capture SDK session_id");
    }

    // Replace placeholder with real SDK session_id in map
    this.sessions.delete(placeholderId);
    this.sessions.set(realSessionId, session);

    // Update session's internal ID to real SDK session_id
    (session as any).id = realSessionId;

    this.logger.info(
      { placeholderId, realSessionId, messageCount: session.getMessages().length },
      "Session created with real SDK session_id"
    );

    this.sessionEventsSubject.next({ type: "created", sessionId: realSessionId });

    this.metrics.totalCreated++;
    const responseTime = Date.now() - startTime;
    this.metrics.totalResponseTime += responseTime;

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
          // sessionId from filename IS the real Claude SDK session_id
          // (JSONL files are named with SDK session_id)
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

          // For historical sessions, set realSessionId to enable resume
          (session as any).realSessionId = sessionId;

          // Subscribe to stream events for this historical session
          session.streamEvents$().subscribe({
            next: (streamEvent) => {
              this.logger.info(
                { sessionId, eventType: streamEvent.event?.type },
                "🌊 Forwarding stream event (historical session)"
              );
              this.sessionEventsSubject.next({
                type: "streaming",
                sessionId,
                streamEvent,
              });
            },
          });

          this.sessions.set(sessionId, session);
          loadedCount++;

          this.logger.debug(
            { sessionId, messageCount: sessionData.messages.length },
            "Historical session loaded with realSessionId set"
          );
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
            // Skip tool_result user messages (these are internal to Claude SDK)
            if (entry.type === "user" && entry.message?.content) {
              const content = entry.message.content;
              if (Array.isArray(content)) {
                const hasToolResult = content.some((block: any) => block.type === "tool_result");
                if (hasToolResult) {
                  // Skip this message - it's a tool result, not a real user message
                  continue;
                }
              }
            }

            const baseMessage: AnyMessage = {
              id: entry.uuid || `${entry.type}-${Date.now()}`,
              type: entry.type,
              content: this.extractContent(entry.message),
              timestamp: new Date(entry.timestamp || Date.now()),
            };

            // For assistant messages, check if it's a tool use
            if (entry.type === "assistant" && entry.message?.content) {
              const content = entry.message.content;
              if (Array.isArray(content)) {
                // Find tool_use block
                const toolBlock = content.find((block: any) => block.type === "tool_use");
                if (toolBlock) {
                  // This is a tool use message
                  (baseMessage as any).isToolUse = true;
                  (baseMessage as any).toolName = toolBlock.name;
                  (baseMessage as any).toolInput = toolBlock.input
                    ? JSON.stringify(toolBlock.input, null, 2)
                    : "";
                  (baseMessage as any).toolId = toolBlock.id;
                  (baseMessage as any).toolResult = null;
                  // Clear content for tool use messages
                  baseMessage.content = "";
                }
              }
            }

            messages.push(baseMessage);
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
}
