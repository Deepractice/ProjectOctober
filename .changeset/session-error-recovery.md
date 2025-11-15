---
"@deepractice-ai/agent": minor
"@deepractice-ai/agent-sdk": minor
---

Implement session error recovery mechanism to handle recoverable errors

This change distinguishes between recoverable and fatal errors, allowing sessions to continue after temporary failures like insufficient credits or rate limits.

**Changes:**

SDK (`@deepractice-ai/agent-sdk`):

- Added `isRecoverableError()` utility function to detect recoverable errors (402, 429, timeouts, 503)
- Modified `ClaudeSession.send()` to return to `idle` state for recoverable errors instead of `error` state
- Added `_lastError` tracking and `getLastError()` public method
- Updated `Session` interface to include `getLastError()` method

Server (`apps/agent/server`):

- Added state guard in `chat.js` to prevent sending messages to completed sessions
- Enhanced error responses with `recoverable` and `state` flags

Frontend (`apps/agent/web`):

- Updated event types to include `recoverable` and `state` fields for error events
- Enhanced `WebSocketAdapter` to parse and forward error recovery information
- Improved `messageStore` to display context-aware error messages:
  - Recoverable: "⚠️ Error message ✅ Session still active, you can continue"
  - Fatal: "❌ Error message ⛔ Session failed, please create new session"

**User Impact:**

Before: Any API error (including temporary ones like insufficient credits) would permanently terminate the session, forcing users to create new sessions and lose conversation context.

After: Recoverable errors (insufficient credits, rate limits, timeouts) allow the session to remain active. Users can resolve the issue (e.g., add credits) and continue the conversation without losing context.
