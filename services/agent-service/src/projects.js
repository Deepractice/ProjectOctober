/**
 * PROJECT MANAGEMENT
 * ==================
 *
 * This module manages project configuration and session listing.
 * Session message operations are handled by sessions.js.
 *
 * ## Architecture Overview
 *
 * **Agent Sessions** (stored in ~/.claude/projects/)
 *    - Each project is a directory named with the project path encoded (/ replaced with -)
 *    - Contains .jsonl files with conversation history
 *
 * ## Project Configuration
 *
 * **Environment Variable**:
 *    - PROJECT_PATH: Absolute path to the project directory (required)
 *
 * ## Error Handling
 *
 * - Missing PROJECT_PATH throws an error on startup
 * - Missing ~/.claude directory is handled gracefully
 * - ENOENT errors are caught and handled without crashing
 * - Empty arrays returned when no sessions exist
 */

import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { parseJsonlSessions } from "./sessions.js";
import { config } from "./index.js";

// Get current project from configuration
function getCurrentProject() {
  const projectPath = config().projectPath;

  if (!projectPath) {
    throw new Error(
      "PROJECT_PATH environment variable is not set. Please set PROJECT_PATH=/path/to/project"
    );
  }

  const fullPath = path.resolve(projectPath);
  // Agent CLI encoding: replace / with -, keep leading -
  const encodedName = fullPath.replace(/\//g, "-");

  return {
    name: path.basename(fullPath),
    path: projectPath,
    fullPath: fullPath,
    claudeProjectDir: path.join(os.homedir(), ".claude", "projects", encodedName),
  };
}

// Get sessions for the current project
async function getSessions(limit = 5, offset = 0) {
  const project = getCurrentProject();
  const projectDir = project.claudeProjectDir;

  console.log("📁 getSessions - projectDir:", projectDir);

  try {
    const files = await fs.readdir(projectDir);
    console.log("📄 getSessions - all files:", files);

    // agent-*.jsonl files contain session start data at this point. This needs to be revisited
    // periodically to make sure only accurate data is there and no new functionality is added there
    const jsonlFiles = files.filter(
      (file) => file.endsWith(".jsonl") && !file.startsWith("agent-")
    );
    console.log("✅ getSessions - filtered jsonl files:", jsonlFiles);

    if (jsonlFiles.length === 0) {
      console.log("⚠️ getSessions - No jsonl files found, returning empty");
      return { sessions: [], hasMore: false, total: 0 };
    }

    // Sort files by modification time (newest first)
    const filesWithStats = await Promise.all(
      jsonlFiles.map(async (file) => {
        const filePath = path.join(projectDir, file);
        const stats = await fs.stat(filePath);
        return { file, mtime: stats.mtime };
      })
    );
    filesWithStats.sort((a, b) => b.mtime - a.mtime);

    const allSessions = new Map();
    const allEntries = [];
    const uuidToSessionMap = new Map();

    // Collect all sessions and entries from all files
    for (const { file } of filesWithStats) {
      const jsonlFile = path.join(projectDir, file);
      const result = await parseJsonlSessions(jsonlFile);

      result.sessions.forEach((session) => {
        if (!allSessions.has(session.id)) {
          allSessions.set(session.id, session);
        }
      });

      allEntries.push(...result.entries);

      // Early exit optimization for large projects
      if (
        allSessions.size >= (limit + offset) * 2 &&
        allEntries.length >= Math.min(3, filesWithStats.length)
      ) {
        break;
      }
    }

    // Build UUID-to-session mapping for timeline detection
    allEntries.forEach((entry) => {
      if (entry.uuid && entry.sessionId) {
        uuidToSessionMap.set(entry.uuid, entry.sessionId);
      }
    });

    // Group sessions by first user message ID
    const sessionGroups = new Map(); // firstUserMsgId -> { latestSession, allSessions[] }
    const sessionToFirstUserMsgId = new Map(); // sessionId -> firstUserMsgId

    // Find the first user message for each session
    allEntries.forEach((entry) => {
      if (entry.sessionId && entry.type === "user" && entry.parentUuid === null && entry.uuid) {
        // This is a first user message in a session (parentUuid is null)
        const firstUserMsgId = entry.uuid;

        if (!sessionToFirstUserMsgId.has(entry.sessionId)) {
          sessionToFirstUserMsgId.set(entry.sessionId, firstUserMsgId);

          const session = allSessions.get(entry.sessionId);
          if (session) {
            if (!sessionGroups.has(firstUserMsgId)) {
              sessionGroups.set(firstUserMsgId, {
                latestSession: session,
                allSessions: [session],
              });
            } else {
              const group = sessionGroups.get(firstUserMsgId);
              group.allSessions.push(session);

              // Update latest session if this one is more recent
              if (new Date(session.lastActivity) > new Date(group.latestSession.lastActivity)) {
                group.latestSession = session;
              }
            }
          }
        }
      }
    });

    // Collect all sessions that don't belong to any group (standalone sessions)
    const groupedSessionIds = new Set();
    sessionGroups.forEach((group) => {
      group.allSessions.forEach((session) => groupedSessionIds.add(session.id));
    });

    const standaloneSessionsArray = Array.from(allSessions.values()).filter(
      (session) => !groupedSessionIds.has(session.id)
    );

    // Combine grouped sessions (only show latest from each group) + standalone sessions
    const latestFromGroups = Array.from(sessionGroups.values()).map((group) => {
      const session = { ...group.latestSession };
      // Add metadata about grouping
      if (group.allSessions.length > 1) {
        session.isGrouped = true;
        session.groupSize = group.allSessions.length;
        session.groupSessions = group.allSessions.map((s) => s.id);
      }
      return session;
    });
    const visibleSessions = [...latestFromGroups, ...standaloneSessionsArray]
      .filter((session) => !session.summary.startsWith('{ "'))
      .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

    const total = visibleSessions.length;
    const paginatedSessions = visibleSessions.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      sessions: paginatedSessions,
      hasMore,
      total,
      offset,
      limit,
    };
  } catch (error) {
    console.error(`Error reading sessions:`, error);
    return { sessions: [], hasMore: false, total: 0 };
  }
}

export { getCurrentProject, getSessions };
