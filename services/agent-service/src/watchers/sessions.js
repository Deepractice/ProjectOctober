/**
 * Sessions File Watcher
 * Monitors Agent project sessions folder and notifies clients of changes
 */
import path from "path";
import { WebSocket } from "ws";
import { getCurrentProject, getSessions } from "../projects.js";
import sessionManager from "../core/SessionManager.js";
import { logger } from "../utils/logger.js";

let projectsWatcher = null;

export async function setupSessionsWatcher(connectedClients) {
  const chokidar = (await import("chokidar")).default;
  const project = getCurrentProject();
  const sessionPath = project.claudeProjectDir;

  if (projectsWatcher) {
    projectsWatcher.close();
  }

  try {
    // Initialize chokidar watcher with optimized settings
    projectsWatcher = chokidar.watch(sessionPath, {
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/dist/**",
        "**/build/**",
        "**/*.tmp",
        "**/*.swp",
        "**/.DS_Store",
      ],
      persistent: true,
      ignoreInitial: true, // Don't fire events for existing files on startup
      followSymlinks: false,
      depth: 10, // Reasonable depth limit
      awaitWriteFinish: {
        stabilityThreshold: 100, // Wait 100ms for file to stabilize
        pollInterval: 50,
      },
    });

    // Debounce function to prevent excessive notifications
    let debounceTimer;
    const debouncedUpdate = async (eventType, filePath) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        // 🆕 Skip if any session is active
        if (sessionManager.hasActiveSession()) {
          const activeIds = sessionManager.getActiveSessionIds();
          logger.info(`⏭️ Skip file watcher - active sessions: ${activeIds.join(", ")}`);
          return;
        }

        try {
          await broadcastSessionsUpdate(connectedClients, {
            changeType: eventType,
            changedFile: path.relative(sessionPath, filePath),
          });
        } catch (error) {
          logger.error("❌ Error handling session changes:", error);
        }
      }, 1000); // 🆕 Increase from 300ms to 1000ms
    };

    // Set up event listeners
    projectsWatcher
      .on("add", (filePath) => debouncedUpdate("add", filePath))
      .on("change", (filePath) => debouncedUpdate("change", filePath))
      .on("unlink", (filePath) => debouncedUpdate("unlink", filePath))
      .on("addDir", (dirPath) => debouncedUpdate("addDir", dirPath))
      .on("unlinkDir", (dirPath) => debouncedUpdate("unlinkDir", dirPath))
      .on("error", (error) => {
        logger.error("❌ Chokidar watcher error:", error);
      })
      .on("ready", () => {
        logger.info("✅ Sessions watcher ready");
      });
  } catch (error) {
    logger.error("❌ Failed to setup sessions watcher:", error);
  }

  // 🆕 Setup SessionManager event listeners
  setupSessionManagerListeners(connectedClients);
}

/**
 * 🆕 Setup SessionManager event listeners
 * Listens to session lifecycle events and triggers updates
 */
function setupSessionManagerListeners(connectedClients) {
  logger.info("📡 Setting up SessionManager event listeners...");

  // Session created - trigger update
  sessionManager.on("session:created", async (sessionId, session) => {
    logger.info(`📡 Session created event received: ${sessionId}`);
    logger.info(`   Metadata: ${JSON.stringify(session.metadata)}`);

    // Wait a bit for file to be written (warmup creates the session file)
    await sleep(300);

    await broadcastSessionsUpdate(connectedClients, {
      reason: "session_created",
      sessionId,
    });
  });

  // Session completed - trigger update
  sessionManager.on("session:completed", async (sessionId, session) => {
    logger.info(`📡 Session completed event received: ${sessionId}`);
    logger.info(`   Duration: ${session.duration}ms`);

    // Wait for file to be fully written
    await sleep(500);

    await broadcastSessionsUpdate(connectedClients, {
      reason: "session_completed",
      sessionId,
    });
  });

  // Session aborted - trigger update
  sessionManager.on("session:aborted", async (sessionId, session) => {
    logger.info(`📡 Session aborted event received: ${sessionId}`);

    await sleep(300);

    await broadcastSessionsUpdate(connectedClients, {
      reason: "session_aborted",
      sessionId,
    });
  });

  // Session error - log and optionally notify
  sessionManager.on("session:error", (sessionId, session, error) => {
    logger.error(`❌ Session error event received: ${sessionId}`);
    logger.error(`   Error: ${error.message}`);
    // Could notify frontend with error details if needed
  });

  // Session timeout
  sessionManager.on("session:timeout", async (sessionId, session) => {
    logger.warn(`⏱️ Session timeout event received: ${sessionId}`);

    await broadcastSessionsUpdate(connectedClients, {
      reason: "session_timeout",
      sessionId,
    });
  });

  logger.info("✅ SessionManager event listeners set up");
}

/**
 * 🆕 Unified broadcast function
 * Fetches latest sessions and broadcasts to all connected clients
 */
async function broadcastSessionsUpdate(connectedClients, metadata = {}) {
  logger.info(`📤 Broadcasting sessions update (${metadata.reason || "file_change"})`);

  try {
    const startTime = Date.now();

    // Get updated sessions list (get up to 100 sessions)
    const updatedSessions = await getSessions(100);

    const elapsed = Date.now() - startTime;
    logger.info(`   Fetched ${updatedSessions.sessions?.length || 0} sessions in ${elapsed}ms`);

    // Notify all connected clients about the session changes
    const updateMessage = JSON.stringify({
      type: "sessions_updated",
      sessions: updatedSessions.sessions || [],
      timestamp: new Date().toISOString(),
      ...metadata,
    });

    let broadcastCount = 0;
    connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(updateMessage);
        broadcastCount++;
      }
    });

    logger.info(`   Broadcast to ${broadcastCount} clients`);
  } catch (error) {
    logger.error("❌ Error broadcasting sessions update:", error);
    throw error;
  }
}

/**
 * Sleep helper function
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function closeSessionsWatcher() {
  if (projectsWatcher) {
    projectsWatcher.close();
    projectsWatcher = null;
  }
}
