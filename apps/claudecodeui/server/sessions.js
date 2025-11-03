/**
 * SESSION MESSAGE MANAGEMENT
 * ==========================
 *
 * This module manages session messages and operations.
 * Sessions belong to a project (managed by projects.js).
 *
 * ## Architecture
 *
 * **Backend Responsibility**:
 *    - Filter system messages (Warmup, command output, etc)
 *    - Calculate messageCount excluding system messages
 *    - Generate summary based on real user messages only
 *    - Return clean message lists
 *
 * **Frontend Responsibility**:
 *    - Display what backend provides
 *    - No knowledge of technical implementation details (Warmup)
 *    - Trust backend-calculated metrics
 *
 * ## System Message Filtering
 *
 * The following are considered system messages and excluded from:
 * - messageCount calculation
 * - summary generation
 * - message lists returned to frontend
 *
 * **User message patterns**:
 * - `<command-name>`, `<command-message>`, `<command-args>`, `<local-command-stdout>`
 * - `<system-reminder>`, `Caveat:`
 * - `This session is being continued from a previous`
 * - `Invalid API key`
 * - `{"subtasks":`, `CRITICAL: You MUST respond with ONLY a JSON`
 * - `Warmup` (session initialization message)
 *
 * **Assistant message patterns**:
 * - API error messages (flagged with isApiErrorMessage)
 * - Messages containing Task Master JSON responses
 */

import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';
import readline from 'readline';
import { getCurrentProject } from './projects.js';

/**
 * Check if a user message is a system message that should be filtered
 */
function isSystemUserMessage(content) {
  let textContent = content;
  if (Array.isArray(content) && content.length > 0 && content[0].type === 'text') {
    textContent = content[0].text;
  }

  return typeof textContent === 'string' && (
    textContent.startsWith('<command-name>') ||
    textContent.startsWith('<command-message>') ||
    textContent.startsWith('<command-args>') ||
    textContent.startsWith('<local-command-stdout>') ||
    textContent.startsWith('<system-reminder>') ||
    textContent.startsWith('Caveat:') ||
    textContent.startsWith('This session is being continued from a previous') ||
    textContent.startsWith('Invalid API key') ||
    textContent.includes('{"subtasks":') ||
    textContent.includes('CRITICAL: You MUST respond with ONLY a JSON') ||
    textContent === 'Warmup'
  );
}

/**
 * Check if an assistant message is a system message that should be filtered
 */
function isSystemAssistantMessage(content) {
  let textContent = content;

  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === 'text' && part.text) {
        textContent = part.text;
        break;
      }
    }
  }

  return typeof textContent === 'string' && (
    textContent.startsWith('Invalid API key') ||
    textContent.includes('{"subtasks":') ||
    textContent.includes('CRITICAL: You MUST respond with ONLY a JSON')
  );
}

/**
 * Parse JSONL file and extract sessions with metadata
 * Filters out system messages from messageCount and summary
 */
async function parseJsonlSessions(filePath) {
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

            // Apply pending summary if this entry has a parentUuid that matches a pending summary
            if (session.summary === 'New Session' && entry.parentUuid && pendingSummaries.has(entry.parentUuid)) {
              session.summary = pendingSummaries.get(entry.parentUuid);
            }

            // Update summary from summary entries with sessionId
            if (entry.type === 'summary' && entry.summary) {
              session.summary = entry.summary;
            }

            // Track last user and assistant messages (skip system messages)
            let shouldCountMessage = true;

            if (entry.message?.role === 'user' && entry.message?.content) {
              const content = entry.message.content;

              if (isSystemUserMessage(content)) {
                shouldCountMessage = false;
              } else {
                // Extract text for lastUserMessage
                let textContent = content;
                if (Array.isArray(content) && content.length > 0 && content[0].type === 'text') {
                  textContent = content[0].text;
                }
                if (typeof textContent === 'string' && textContent.length > 0) {
                  session.lastUserMessage = textContent;
                }
              }
            } else if (entry.message?.role === 'assistant' && entry.message?.content) {
              // Skip API error messages
              if (entry.isApiErrorMessage === true) {
                shouldCountMessage = false;
              } else if (isSystemAssistantMessage(entry.message.content)) {
                shouldCountMessage = false;
              } else {
                // Extract text for lastAssistantMessage
                let assistantText = null;
                if (Array.isArray(entry.message.content)) {
                  for (const part of entry.message.content) {
                    if (part.type === 'text' && part.text) {
                      assistantText = part.text;
                      break;
                    }
                  }
                } else if (typeof entry.message.content === 'string') {
                  assistantText = entry.message.content;
                }

                if (assistantText) {
                  session.lastAssistantMessage = assistantText;
                }
              }
            }

            // Only count non-system messages
            if (shouldCountMessage) {
              session.messageCount++;
            }

            if (entry.timestamp) {
              session.lastActivity = new Date(entry.timestamp);
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
          session.summary = lastMessage.length > 50 ? lastMessage.substring(0, 50) + '...' : lastMessage;
        }
      }
    }

    // Filter out sessions with JSON responses (Task Master errors)
    const allSessions = Array.from(sessions.values());
    const filteredSessions = allSessions.filter(session => !session.summary.startsWith('{ "'));

    return {
      sessions: filteredSessions,
      entries: entries
    };
  } catch (error) {
    console.error('Error reading JSONL file:', error);
    return { sessions: [], entries: [] };
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
              // Filter out system messages
              let isSystemMessage = false;

              if (entry.message?.role === 'user' && entry.message?.content) {
                isSystemMessage = isSystemUserMessage(entry.message.content);
              } else if (entry.message?.role === 'assistant' && entry.message?.content) {
                // Skip API error messages
                if (entry.isApiErrorMessage === true) {
                  isSystemMessage = true;
                } else {
                  isSystemMessage = isSystemAssistantMessage(entry.message.content);
                }
              }

              // Only include non-system messages
              if (!isSystemMessage) {
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
    const sortedMessages = messages.sort((a, b) =>
      new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
    );

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

    // Check all JSONL files to find which one contains the session
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
        // Filter out all entries for this session
        const filteredLines = lines.filter(line => {
          try {
            const data = JSON.parse(line);
            return data.sessionId !== sessionId;
          } catch {
            return true; // Keep malformed lines
          }
        });

        // Write back the filtered content
        await fs.writeFile(jsonlFile, filteredLines.join('\n') + (filteredLines.length > 0 ? '\n' : ''));
        return true;
      }
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
  deleteSession,
  isSystemUserMessage,
  isSystemAssistantMessage
};
