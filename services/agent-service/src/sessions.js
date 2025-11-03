/**
 * SESSION MANAGEMENT MODULE
 * =========================
 *
 * This module manages session CRUD operations.
 * Message processing logic is handled by messages.js.
 *
 * ## Responsibilities
 * - Parse JSONL session files
 * - Get session messages with pagination
 * - Delete sessions
 * - Calculate session metadata (using messages.js)
 */

import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';
import readline from 'readline';
import { getCurrentProject } from './projects.js';
import {
  shouldFilterMessage,
  processMessageEntry,
  generateSummary,
  sortMessagesByTimestamp,
  isInvalidSummary
} from './messages.js';
import sessionManager from './core/SessionManager.js';
import { logger } from './utils/logger.js';

/**
 * Parse JSONL file and extract sessions with metadata
 * Filters out system messages from messageCount and summary
 */
async function parseJsonlSessions(filePath) {
  // 🆕 Try cache first
  const cached = await sessionManager.getCachedSession(filePath);
  if (cached) {
    return cached;
  }

  console.log(`📖 Parsing JSONL file: ${path.basename(filePath)}`);

  const sessions = new Map();
  const entries = [];
  const pendingSummaries = new Map();

  try {
    const fileStream = fsSync.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      if (line.trim()) {
        try {
          const entry = JSON.parse(line);
          entries.push(entry);

          // Handle summary entries that don't have sessionId yet
          if (entry.type === 'summary' && entry.summary && !entry.sessionId && entry.leafUuid) {
            pendingSummaries.set(entry.leafUuid, entry.summary);
          }

          if (entry.sessionId) {
            // Initialize session if not exists
            if (!sessions.has(entry.sessionId)) {
              sessions.set(entry.sessionId, {
                id: entry.sessionId,
                summary: 'New Session',
                messageCount: 0,
                lastActivity: new Date(),
                cwd: entry.cwd || '',
                lastUserMessage: null,
                lastAssistantMessage: null
              });
            }

            const session = sessions.get(entry.sessionId);

            // Apply pending summary
            if (session.summary === 'New Session' && entry.parentUuid && pendingSummaries.has(entry.parentUuid)) {
              session.summary = pendingSummaries.get(entry.parentUuid);
            }

            // Update summary from summary entries
            if (entry.type === 'summary' && entry.summary) {
              session.summary = entry.summary;
            }

            // Process message entry (updates session metadata)
            const shouldCount = processMessageEntry(entry, session);

            // Count non-system messages
            if (shouldCount) {
              session.messageCount++;
            }
          }
        } catch (parseError) {
          // Skip malformed lines silently
        }
      }
    }

    // Set final summary based on last message if no summary exists
    for (const session of sessions.values()) {
      if (session.summary === 'New Session') {
        const lastMessage = session.lastUserMessage || session.lastAssistantMessage;
        if (lastMessage) {
          session.summary = generateSummary(lastMessage);
        }
      }
    }

    // Filter out sessions with invalid summaries (Task Master errors)
    const allSessions = Array.from(sessions.values());
    const filteredSessions = allSessions.filter(session => !isInvalidSummary(session.summary));

    const result = {
      sessions: filteredSessions,
      entries: entries,
      filePath // 🆕 Include file path for cache tracking
    };

    // 🆕 Cache the result
    await sessionManager.setCachedSession(filePath, result);

    return result;
  } catch (error) {
    console.error('Error reading JSONL file:', error);
    return { sessions: [], entries: [], filePath };
  }
}

/**
 * Get messages for a specific session with pagination support
 * Filters out system messages before returning to frontend
 */
async function getSessionMessages(sessionId, limit = null, offset = 0) {
  const project = getCurrentProject();
  const projectDir = project.claudeProjectDir;

  try {
    const files = await fs.readdir(projectDir);
    const jsonlFiles = files.filter(file => file.endsWith('.jsonl') && !file.startsWith('agent-'));

    if (jsonlFiles.length === 0) {
      return { messages: [], total: 0, hasMore: false };
    }

    const messages = [];

    // Process all JSONL files to find messages for this session
    for (const file of jsonlFiles) {
      const jsonlFile = path.join(projectDir, file);
      const fileStream = fsSync.createReadStream(jsonlFile);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      for await (const line of rl) {
        if (line.trim()) {
          try {
            const entry = JSON.parse(line);
            if (entry.sessionId === sessionId) {
              // Filter out system messages using centralized logic
              if (!shouldFilterMessage(entry)) {
                messages.push(entry);
              }
            }
          } catch (parseError) {
            console.warn('Error parsing line:', parseError.message);
          }
        }
      }
    }

    // Sort messages by timestamp
    const sortedMessages = sortMessagesByTimestamp(messages);
    const total = sortedMessages.length;

    // If no limit is specified, return all messages (backward compatibility)
    if (limit === null) {
      return sortedMessages;
    }

    // Apply pagination - for recent messages, we need to slice from the end
    const startIndex = Math.max(0, total - offset - limit);
    const endIndex = total - offset;
    const paginatedMessages = sortedMessages.slice(startIndex, endIndex);
    const hasMore = startIndex > 0;

    return {
      messages: paginatedMessages,
      total,
      hasMore,
      offset,
      limit
    };
  } catch (error) {
    console.error(`Error reading messages for session ${sessionId}:`, error);
    return limit === null ? [] : { messages: [], total: 0, hasMore: false };
  }
}

/**
 * Delete a session and all its messages
 */
async function deleteSession(sessionId) {
  const project = getCurrentProject();
  const projectDir = project.claudeProjectDir;

  try {
    const files = await fs.readdir(projectDir);
    const jsonlFiles = files.filter(file => file.endsWith('.jsonl'));

    if (jsonlFiles.length === 0) {
      throw new Error('No session files found for this project');
    }

    let deletedFromAnyFile = false;
    let totalEntriesRemoved = 0;
    let filesModified = 0;
    let filesDeleted = 0;

    // Check ALL JSONL files (not just the first one) to ensure complete deletion
    for (const file of jsonlFiles) {
      const jsonlFile = path.join(projectDir, file);
      const content = await fs.readFile(jsonlFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      // Check if this file contains the session
      const hasSession = lines.some(line => {
        try {
          const data = JSON.parse(line);
          return data.sessionId === sessionId;
        } catch {
          return false;
        }
      });

      if (hasSession) {
        // Collect all UUIDs related to this session
        const sessionUUIDs = new Set();
        lines.forEach(line => {
          try {
            const data = JSON.parse(line);
            if (data.sessionId === sessionId) {
              if (data.leafUuid) sessionUUIDs.add(data.leafUuid);
              if (data.parentUuid) sessionUUIDs.add(data.parentUuid);
            }
          } catch {
            // Skip malformed lines
          }
        });

        // Filter out all entries for this session and related summary entries
        const filteredLines = lines.filter(line => {
          try {
            const data = JSON.parse(line);
            // Remove if:
            // 1. Has matching sessionId
            // 2. Or is a summary entry with matching leafUuid
            if (data.sessionId === sessionId) {
              return false;
            }
            if (data.type === 'summary' && data.leafUuid && sessionUUIDs.has(data.leafUuid)) {
              return false;
            }
            return true;
          } catch {
            return true; // Keep malformed lines
          }
        });

        const entriesRemovedFromFile = lines.length - filteredLines.length;
        totalEntriesRemoved += entriesRemovedFromFile;

        logger.info(`🗑️ Deleting from ${path.basename(jsonlFile)}: ${entriesRemovedFromFile} entries removed`);

        // If file is empty after deletion, delete the file itself
        if (filteredLines.length === 0) {
          await fs.unlink(jsonlFile);
          logger.info(`🗑️ File deleted (was empty): ${path.basename(jsonlFile)}`);
          filesDeleted++;
        } else {
          // Write back the filtered content
          await fs.writeFile(jsonlFile, filteredLines.join('\n') + '\n');
          logger.info(`💾 File updated with ${filteredLines.length} remaining entries`);
          filesModified++;
        }

        // Invalidate cache for this file
        sessionManager.invalidateCacheForFile(jsonlFile);
        deletedFromAnyFile = true;

        // Continue checking other files instead of returning early
      }
    }

    if (deletedFromAnyFile) {
      logger.info(`✅ Session ${sessionId} deleted completely`);
      logger.info(`   Total entries removed: ${totalEntriesRemoved}`);
      logger.info(`   Files modified: ${filesModified}`);
      logger.info(`   Files deleted: ${filesDeleted}`);
      logger.info(`   Cache invalidated for all affected files`);
      return true;
    }

    throw new Error(`Session ${sessionId} not found in any files`);
  } catch (error) {
    console.error(`Error deleting session ${sessionId}:`, error);
    throw error;
  }
}

export {
  parseJsonlSessions,
  getSessionMessages,
  deleteSession
};
