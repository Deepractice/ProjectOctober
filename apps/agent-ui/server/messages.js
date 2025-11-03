/**
 * MESSAGE PROCESSING MODULE
 * =========================
 *
 * Centralized message filtering, validation, and extraction logic.
 * This module contains pure functions for message processing,
 * with no file I/O or external dependencies.
 *
 * ## Responsibilities
 * - Filter system messages
 * - Extract text content from messages
 * - Validate message types
 * - Generate summaries
 * - Sort messages
 */

// ══════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════

/**
 * System entry types that should be filtered out
 */
export const SYSTEM_ENTRY_TYPES = ['queue-operation', 'summary'];

/**
 * User message patterns that indicate system messages
 */
const USER_SYSTEM_MESSAGE_PATTERNS = [
  '<command-name>',
  '<command-message>',
  '<command-args>',
  '<local-command-stdout>',
  '<system-reminder>',
  'Caveat:',
  'This session is being continued from a previous',
  'Invalid API key',
  '{"subtasks":',
  'CRITICAL: You MUST respond with ONLY a JSON'
];

/**
 * Exact user message strings that indicate system messages
 */
const USER_SYSTEM_MESSAGE_EXACT = ['Warmup'];

/**
 * Assistant message patterns that indicate system messages
 */
const ASSISTANT_SYSTEM_MESSAGE_PATTERNS = [
  'Invalid API key',
  '{"subtasks":',
  'CRITICAL: You MUST respond with ONLY a JSON'
];

// ══════════════════════════════════════════════════════════
// FILTERING FUNCTIONS
// ══════════════════════════════════════════════════════════

/**
 * Check if entry is a system entry type
 */
export function isSystemEntry(entry) {
  return SYSTEM_ENTRY_TYPES.includes(entry.type);
}

/**
 * Check if user message content is a system message
 */
export function isSystemUserMessage(content) {
  const textContent = extractTextContent(content);

  if (typeof textContent !== 'string') {
    return false;
  }

  // Check exact matches
  if (USER_SYSTEM_MESSAGE_EXACT.includes(textContent)) {
    return true;
  }

  // Check patterns
  return USER_SYSTEM_MESSAGE_PATTERNS.some(pattern =>
    textContent.startsWith(pattern) || textContent.includes(pattern)
  );
}

/**
 * Check if assistant message content is a system message
 */
export function isSystemAssistantMessage(content) {
  const textContent = extractTextContent(content);

  if (typeof textContent !== 'string') {
    return false;
  }

  return ASSISTANT_SYSTEM_MESSAGE_PATTERNS.some(pattern =>
    textContent.startsWith(pattern) || textContent.includes(pattern)
  );
}

/**
 * Determine if an entry should be filtered out
 */
export function shouldFilterMessage(entry) {
  // Filter system entry types
  if (isSystemEntry(entry)) {
    return true;
  }

  // Filter API error messages
  if (entry.isApiErrorMessage === true) {
    return true;
  }

  // Filter user system messages
  if (entry.message?.role === 'user' && entry.message?.content) {
    return isSystemUserMessage(entry.message.content);
  }

  // Filter assistant system messages
  if (entry.message?.role === 'assistant' && entry.message?.content) {
    return isSystemAssistantMessage(entry.message.content);
  }

  return false;
}

// ══════════════════════════════════════════════════════════
// CONTENT EXTRACTION
// ══════════════════════════════════════════════════════════

/**
 * Extract text content from message content (handles both string and array formats)
 */
export function extractTextContent(content) {
  // String format
  if (typeof content === 'string') {
    return content;
  }

  // Array format (Claude API format)
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === 'text' && part.text) {
        return part.text;
      }
    }
  }

  return null;
}

/**
 * Extract user message text from entry
 */
export function extractUserMessageText(entry) {
  if (entry.message?.role !== 'user' || !entry.message?.content) {
    return null;
  }

  const textContent = extractTextContent(entry.message.content);

  if (typeof textContent === 'string' && textContent.length > 0) {
    return textContent;
  }

  return null;
}

/**
 * Extract assistant message text from entry
 */
export function extractAssistantMessageText(entry) {
  if (entry.message?.role !== 'assistant' || !entry.message?.content) {
    return null;
  }

  const textContent = extractTextContent(entry.message.content);

  if (typeof textContent === 'string' && textContent.length > 0) {
    return textContent;
  }

  return null;
}

// ══════════════════════════════════════════════════════════
// MESSAGE PROCESSING
// ══════════════════════════════════════════════════════════

/**
 * Process a message entry and update session metadata
 * Returns whether the message should be counted
 */
export function processMessageEntry(entry, session) {
  // Skip system entries
  if (isSystemEntry(entry)) {
    // Update lastActivity but don't count
    if (entry.timestamp) {
      session.lastActivity = new Date(entry.timestamp);
    }
    return false;
  }

  let shouldCount = true;

  // Process user message
  if (entry.message?.role === 'user') {
    if (isSystemUserMessage(entry.message.content)) {
      shouldCount = false;
    } else {
      const text = extractUserMessageText(entry);
      if (text) {
        session.lastUserMessage = text;
      }
    }
  }

  // Process assistant message
  if (entry.message?.role === 'assistant') {
    if (entry.isApiErrorMessage === true || isSystemAssistantMessage(entry.message.content)) {
      shouldCount = false;
    } else {
      const text = extractAssistantMessageText(entry);
      if (text) {
        session.lastAssistantMessage = text;
      }
    }
  }

  // Update lastActivity
  if (entry.timestamp) {
    session.lastActivity = new Date(entry.timestamp);
  }

  return shouldCount;
}

/**
 * Check if a message should be counted toward messageCount
 */
export function shouldCountMessage(entry) {
  return !shouldFilterMessage(entry);
}

// ══════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════

/**
 * Generate a summary from text (truncate if needed)
 */
export function generateSummary(text, maxLength = 50) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + '...';
}

/**
 * Sort messages by timestamp (ascending)
 */
export function sortMessagesByTimestamp(messages) {
  return messages.sort((a, b) =>
    new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
  );
}

/**
 * Check if a summary looks like a JSON error (Task Master errors)
 */
export function isInvalidSummary(summary) {
  return typeof summary === 'string' && summary.startsWith('{ "');
}
