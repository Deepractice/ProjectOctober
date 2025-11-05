import type { Logger } from "@deepracticex/logger";
import type { AgentConfig } from "~/types";
import { ClaudeAdapter } from "./claude-adapter";

interface WarmSession {
  sessionId: string;
  createdAt: Date;
}

/**
 * WarmupPool - maintains pre-warmed sessions for fast startup
 */
export class WarmupPool {
  private pool: WarmSession[] = [];
  private readonly poolSize: number;
  private readonly adapter: ClaudeAdapter;
  private isRefilling = false;
  private logger: Logger;

  constructor(config: AgentConfig, logger: Logger) {
    this.poolSize = config.warmupPoolSize || 3;
    this.logger = logger;
    this.adapter = new ClaudeAdapter(config, logger);
    this.logger.debug({ poolSize: this.poolSize }, "WarmupPool created");
  }

  async initialize(): Promise<void> {
    this.logger.info({ poolSize: this.poolSize }, "Initializing warmup pool");
    // Create warmup sessions sequentially to avoid resource conflicts
    // (lock files, shell snapshots, etc.)
    try {
      for (let i = 0; i < this.poolSize; i++) {
        this.logger.debug({ index: i + 1, total: this.poolSize }, "Warming up session");
        const warm = await this.warmupOne();
        this.pool.push(warm);
      }
      this.logger.info({ poolSize: this.pool.length }, "Warmup pool initialized");
    } catch (err) {
      this.logger.error(
        { err, poolSize: this.poolSize, currentSize: this.pool.length },
        "Failed to initialize warmup pool"
      );
      throw err;
    }
  }

  acquire(): string | null {
    const session = this.pool.shift();
    if (session) {
      this.logger.debug(
        { sessionId: session.sessionId, remainingPoolSize: this.pool.length },
        "Acquired warm session from pool"
      );
      // Async refill, don't block
      void this.refill();
      return session.sessionId;
    }
    this.logger.warn("No warm session available in pool");
    return null;
  }

  size(): number {
    return this.pool.length;
  }

  destroy(): void {
    this.logger.info({ poolSize: this.pool.length }, "Destroying warmup pool");
    this.pool = [];
  }

  private async warmupOne(): Promise<WarmSession> {
    const startTime = Date.now();
    try {
      const sessionId = await this.adapter.warmup();
      const duration = Date.now() - startTime;
      this.logger.debug({ sessionId, duration }, "Warm session created");
      return {
        sessionId,
        createdAt: new Date(),
      };
    } catch (err) {
      this.logger.error({ err, duration: Date.now() - startTime }, "Failed to create warm session");
      throw err;
    }
  }

  private async refill(): Promise<void> {
    if (this.isRefilling) {
      this.logger.debug("Pool refill already in progress");
      return;
    }

    const deficit = this.poolSize - this.pool.length;
    if (deficit > 0) {
      this.logger.debug(
        { deficit, currentSize: this.pool.length, targetSize: this.poolSize },
        "Refilling warmup pool"
      );
    }

    this.isRefilling = true;

    try {
      while (this.pool.length < this.poolSize) {
        const warm = await this.warmupOne();
        this.pool.push(warm);
      }
      if (deficit > 0) {
        this.logger.info({ poolSize: this.pool.length }, "Warmup pool refilled");
      }
    } catch (err) {
      this.logger.error(
        { err, currentSize: this.pool.length, targetSize: this.poolSize },
        "Failed to refill warmup pool"
      );
    } finally {
      this.isRefilling = false;
    }
  }
}
