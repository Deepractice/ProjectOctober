/**
 * SessionManager - Session State Management with EventEmitter
 *
 * Responsibilities:
 * 1. Track active session lifecycle (created → processing → completed/error/aborted)
 * 2. Emit events for state changes (listened by watchers)
 * 3. Manage session parse cache (avoid re-parsing unchanged files)
 * 4. Provide state query API (used by file watcher to skip updates)
 * 5. Handle session timeouts
 *
 * Design Principles:
 * - File system is the Single Source of Truth
 * - SessionManager only manages "active state" and "performance cache"
 * - Initialize from filesystem on startup
 * - Events are isolated (listener errors don't crash manager)
 *
 * Architecture:
 * claude-sdk → SessionManager → watchers → sessions.js
 *    (write)   (state+events)  (listen)    (parse+cache)
 */

import { EventEmitter } from "events";
import { promises as fs } from "fs";
import { logger } from "../utils/logger.js";

class SessionManager extends EventEmitter {
  constructor() {
    super();

    // Active sessions: sessionId -> SessionState
    // Only tracks sessions currently being processed
    this.activeSessions = new Map();

    // Parse cache: filePath -> { mtime, data }
    // Purpose: avoid re-parsing unchanged historical session files
    this.sessionCache = new Map();

    // Initialization state
    this.initialized = false;

    // Timeout configuration
    this.SESSION_TIMEOUT = 5 * 60 * 1000; // 5 min for created state
    this.PROCESSING_TIMEOUT = 10 * 60 * 1000; // 10 min for processing state

    // Metrics
    this.metrics = {
      totalProcessed: 0,
      totalErrors: 0,
      totalAborted: 0,
      totalTimeout: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };

    logger.info("🎯 SessionManager constructed");

    // Start timeout checker
    this.startTimeoutChecker();
  }

  // ===== Initialization =====

  /**
   * Initialize from filesystem (call once on startup)
   * Warms up the cache by loading existing sessions
   */
  async initialize(sessionFilesPath) {
    if (this.initialized) {
      logger.warn("⚠️ SessionManager already initialized, skipping");
      return;
    }

    logger.info("🔄 SessionManager initializing from filesystem...");
    logger.info(`📁 Session files path: ${sessionFilesPath}`);

    try {
      // Import getSessions here to avoid circular dependency
      const { getSessions } = await import("../projects.js");

      // Load all sessions to warm up cache
      const startTime = Date.now();
      const sessions = await getSessions(100);
      const elapsed = Date.now() - startTime;

      logger.info(`✅ SessionManager initialized in ${elapsed}ms`);
      logger.info(`📦 Loaded ${sessions.sessions?.length || 0} sessions into cache`);

      this.initialized = true;
    } catch (error) {
      logger.error({ err: error }, "❌ Failed to initialize SessionManager");
      // Continue anyway, cache will be empty
      this.initialized = true;
    }
  }

  // ===== Session Lifecycle =====

  /**
   * Create a new session
   * Called when session is first created (usually when session ID is captured)
   */
  createSession(sessionId, metadata = {}) {
    if (this.activeSessions.has(sessionId)) {
      logger.warn(`⚠️ Session ${sessionId} already exists, returning existing`);
      return this.activeSessions.get(sessionId);
    }

    const session = {
      id: sessionId,
      status: "created",
      startTime: Date.now(),
      lastUpdateTime: Date.now(),
      metadata,
    };

    this.activeSessions.set(sessionId, session);
    logger.info(`✨ Session created: ${sessionId}`);
    logger.info(`   Metadata:`, JSON.stringify(metadata));
    logger.info(`   Active sessions: ${this.activeSessions.size}`);

    this.safeEmit("session:created", sessionId, session);

    return session;
  }

  /**
   * Mark session as processing
   * Called when Claude starts responding (first text message received)
   */
  startProcessing(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      logger.warn(`⚠️ Cannot start processing: session ${sessionId} not found`);
      return false;
    }

    if (session.status !== "created") {
      logger.warn(`⚠️ Session ${sessionId} already ${session.status}, cannot start processing`);
      return false;
    }

    session.status = "processing";
    session.processingStartTime = Date.now();
    session.lastUpdateTime = Date.now();

    logger.info(`⚙️ Session processing: ${sessionId}`);
    logger.info(`   Time to start: ${session.processingStartTime - session.startTime}ms`);

    this.safeEmit("session:processing", sessionId, session);

    return true;
  }

  /**
   * Update session activity (prevent timeout)
   * Called periodically during streaming to keep session alive
   */
  touchSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.lastUpdateTime = Date.now();
      // Don't log every touch to avoid spam
    } else {
      logger.warn(`⚠️ Cannot touch: session ${sessionId} not found`);
    }
  }

  /**
   * Mark session as completed
   * Called when streaming finishes successfully
   */
  completeSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      logger.warn(`⚠️ Cannot complete: session ${sessionId} not found`);
      return false;
    }

    session.status = "completed";
    session.completedTime = Date.now();
    session.duration = session.completedTime - session.startTime;

    logger.info(`✅ Session completed: ${sessionId}`);
    logger.info(`   Duration: ${session.duration}ms`);
    logger.info(
      `   Processing time: ${session.completedTime - (session.processingStartTime || session.startTime)}ms`
    );

    this.activeSessions.delete(sessionId);
    this.metrics.totalProcessed++;

    logger.info(`   Active sessions remaining: ${this.activeSessions.size}`);

    this.safeEmit("session:completed", sessionId, session);

    return true;
  }

  /**
   * Mark session as error
   * Called when an error occurs during processing
   */
  errorSession(sessionId, error) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      logger.warn(`⚠️ Cannot error: session ${sessionId} not found`);
      return false;
    }

    session.status = "error";
    session.error = error;
    session.errorTime = Date.now();

    logger.info(`❌ Session error: ${sessionId}`);
    logger.info(`   Error message: ${error.message}`);
    logger.info(`   Error type: ${error.constructor.name}`);
    logger.info(`   Stack trace:`, error.stack);

    this.activeSessions.delete(sessionId);
    this.metrics.totalErrors++;

    logger.info(`   Active sessions remaining: ${this.activeSessions.size}`);

    this.safeEmit("session:error", sessionId, session, error);

    return true;
  }

  /**
   * Mark session as aborted
   * Called when user interrupts the session
   */
  abortSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      logger.warn(`⚠️ Cannot abort: session ${sessionId} not found`);
      return false;
    }

    session.status = "aborted";
    session.abortedTime = Date.now();

    logger.info(`🛑 Session aborted: ${sessionId}`);
    logger.info(`   Was in status: ${session.status}`);
    logger.info(`   Time alive: ${session.abortedTime - session.startTime}ms`);

    this.activeSessions.delete(sessionId);
    this.metrics.totalAborted++;

    logger.info(`   Active sessions remaining: ${this.activeSessions.size}`);

    this.safeEmit("session:aborted", sessionId, session);

    return true;
  }

  /**
   * Handle session timeout
   * Called by timeout checker when session is inactive too long
   */
  timeoutSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    session.status = "timeout";
    session.timeoutTime = Date.now();
    const inactiveTime = session.timeoutTime - session.lastUpdateTime;

    logger.info(`⏱️ Session timeout: ${sessionId}`);
    logger.info(`   Previous status: ${session.status}`);
    logger.info(`   Inactive for: ${Math.round(inactiveTime / 1000)}s`);
    logger.info(`   Total alive: ${Math.round((session.timeoutTime - session.startTime) / 1000)}s`);

    this.activeSessions.delete(sessionId);
    this.metrics.totalTimeout++;

    logger.info(`   Active sessions remaining: ${this.activeSessions.size}`);

    this.safeEmit("session:timeout", sessionId, session);

    return true;
  }

  // ===== Timeout Management =====

  /**
   * Start periodic timeout checker
   * Runs every minute to check for stale sessions
   */
  startTimeoutChecker() {
    logger.info("⏰ Starting session timeout checker");
    logger.info(`   Created state timeout: ${this.SESSION_TIMEOUT / 1000}s`);
    logger.info(`   Processing state timeout: ${this.PROCESSING_TIMEOUT / 1000}s`);

    setInterval(() => {
      const now = Date.now();
      const timedOutSessions = [];

      for (const [sessionId, session] of this.activeSessions.entries()) {
        const timeSinceUpdate = now - session.lastUpdateTime;

        const timeout =
          session.status === "processing" ? this.PROCESSING_TIMEOUT : this.SESSION_TIMEOUT;

        if (timeSinceUpdate > timeout) {
          logger.warn(`⏱️ Detected timeout for session ${sessionId}`);
          logger.warn(`   Status: ${session.status}`);
          logger.warn(`   Inactive: ${Math.round(timeSinceUpdate / 1000)}s`);
          logger.warn(`   Timeout threshold: ${Math.round(timeout / 1000)}s`);

          timedOutSessions.push(sessionId);
        }
      }

      // Process timeouts
      for (const sessionId of timedOutSessions) {
        this.timeoutSession(sessionId);
      }

      // Log periodic status if there are active sessions
      if (this.activeSessions.size > 0) {
        logger.info(`🔍 Timeout check: ${this.activeSessions.size} active sessions`);
      }
    }, 60 * 1000); // Check every minute
  }

  // ===== State Query =====

  /**
   * Check if any session is currently active
   * Used by file watcher to skip updates during active sessions
   */
  hasActiveSession() {
    return this.activeSessions.size > 0;
  }

  /**
   * Check if a specific session is processing
   */
  isSessionProcessing(sessionId) {
    const session = this.activeSessions.get(sessionId);
    return session && session.status === "processing";
  }

  /**
   * Get all active session IDs
   */
  getActiveSessionIds() {
    return Array.from(this.activeSessions.keys());
  }

  /**
   * Get session state
   */
  getSession(sessionId) {
    return this.activeSessions.get(sessionId);
  }

  // ===== Cache Management =====

  /**
   * Get cached parse result (for historical sessions)
   * Returns null if file changed or not cached
   */
  async getCachedSession(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const cached = this.sessionCache.get(filePath);

      if (cached && cached.mtime === stats.mtimeMs) {
        this.metrics.cacheHits++;
        logger.info(`📦 Cache hit: ${filePath}`);
        logger.info(`   Cache hit rate: ${this.getCacheHitRate().toFixed(2)}%`);
        return cached.data;
      }

      this.metrics.cacheMisses++;
      if (cached) {
        logger.info(`🔄 Cache miss (file changed): ${filePath}`);
        logger.info(`   Cached mtime: ${cached.mtime}, Current mtime: ${stats.mtimeMs}`);
      } else {
        logger.info(`🔄 Cache miss (not cached): ${filePath}`);
      }
      return null;
    } catch (error) {
      logger.warn(`⚠️ Cache check failed for ${filePath}: ${error.message}`);
      return null;
    }
  }

  /**
   * Cache parse result
   */
  async setCachedSession(filePath, data) {
    try {
      const stats = await fs.stat(filePath);
      this.sessionCache.set(filePath, {
        mtime: stats.mtimeMs,
        data,
      });
      logger.info(`💾 Cached: ${filePath}`);
      logger.info(`   Cache size: ${this.sessionCache.size} entries`);
    } catch (error) {
      logger.error(`❌ Failed to cache ${filePath}: ${error.message}`);
    }
  }

  /**
   * Invalidate cache for specific file
   * Called when we know a file has changed
   */
  invalidateCacheForFile(filePath) {
    if (this.sessionCache.has(filePath)) {
      this.sessionCache.delete(filePath);
      logger.info(`🗑️ Cache invalidated: ${filePath}`);
      logger.info(`   Cache size: ${this.sessionCache.size} entries`);
      return true;
    }
    return false;
  }

  /**
   * Clean up stale cache entries
   * Removes cached entries for files that changed or were deleted
   */
  async cleanupCache() {
    logger.info("🧹 Starting cache cleanup...");
    logger.info(`   Cache size before: ${this.sessionCache.size}`);

    const keysToDelete = [];

    for (const [filePath, cached] of this.sessionCache.entries()) {
      try {
        const stats = await fs.stat(filePath);
        if (stats.mtimeMs !== cached.mtime) {
          keysToDelete.push(filePath);
          logger.info(`   🗑️ Stale cache (file changed): ${filePath}`);
        }
      } catch (error) {
        // File deleted
        keysToDelete.push(filePath);
        logger.info(`   🗑️ Stale cache (file deleted): ${filePath}`);
      }
    }

    keysToDelete.forEach((key) => this.sessionCache.delete(key));

    logger.info(`✅ Cache cleanup complete`);
    logger.info(`   Removed: ${keysToDelete.length} entries`);
    logger.info(`   Cache size after: ${this.sessionCache.size}`);

    return keysToDelete.length;
  }

  /**
   * Clear all cache
   */
  clearCache() {
    const size = this.sessionCache.size;
    this.sessionCache.clear();
    logger.info(`🗑️ Cleared all cache: ${size} entries removed`);
    return size;
  }

  // ===== Event Safety =====

  /**
   * Safe emit - catch listener errors
   * Prevents listener errors from crashing the SessionManager
   */
  safeEmit(event, ...args) {
    try {
      logger.info(`📡 Emitting event: ${event}`);
      this.emit(event, ...args);
    } catch (error) {
      logger.error(`❌ Error in ${event} listener:`, error.message);
      logger.error("   Stack:", error.stack);
      // Emit error event (if not already emitting error to avoid loop)
      if (event !== "error") {
        try {
          this.emit("error", error);
        } catch (nestedError) {
          logger.error("❌ Error in error handler:", nestedError.message);
        }
      }
    }
  }

  // ===== Metrics & Debug =====

  /**
   * Get cache hit rate
   */
  getCacheHitRate() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    if (total === 0) return 0;
    return (this.metrics.cacheHits / total) * 100;
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const totalSessions =
      this.metrics.totalProcessed +
      this.metrics.totalErrors +
      this.metrics.totalAborted +
      this.metrics.totalTimeout;

    return {
      ...this.metrics,
      activeSessions: this.activeSessions.size,
      cacheSize: this.sessionCache.size,
      cacheHitRate: this.getCacheHitRate(),
      totalSessions,
    };
  }

  /**
   * Print debug info
   */
  debug() {
    logger.info("===== SessionManager Debug =====");
    logger.info("Initialized:", this.initialized);
    logger.info("Active Sessions:", this.activeSessions.size);

    for (const [id, session] of this.activeSessions.entries()) {
      logger.info(`  - ${id}: ${session.status} (age: ${Date.now() - session.startTime}ms)`);
    }

    logger.info("Cache Size:", this.sessionCache.size);
    logger.info("Metrics:", JSON.stringify(this.getMetrics(), null, 2));
    logger.info("================================");
  }
}

// Export singleton
const sessionManager = new SessionManager();
export default sessionManager;
