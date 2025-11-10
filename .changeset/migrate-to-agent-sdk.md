---
"@deepractice-ai/agent": minor
"@deepractice-ai/agent-sdk": minor
---

Migrate frontend to use agent-sdk directly, remove EventBus layer

**Frontend Changes:**

- Remove custom EventBus and WebSocket client implementation
- Create agentStore to manage BrowserAgent from agent-sdk
- Simplify messageStore and sessionStore to use SDK events directly
- Remove SessionManager, websocketAdapter, and custom WebSocket code
- Support empty session creation (create session first, send message later)

**Backend Changes:**

- Update configuration to use environment variables directly
- Simplify config structure (flatten nested config object)
- Remove legacy agent-config dependency

**SDK Changes:**

- Fix browser bundle to exclude Node.js dependencies (ws, fs, crypto)
- Update package exports structure (api/common, api/server, api/browser)
- Move ws and better-sqlite3 to peerDependencies (optional)
- Ensure browser API doesn't pull in server-only code

**Breaking Changes:**

- Frontend EventBus API removed (use SDK events directly)
- Session creation API changed (message parameter now optional)
- Configuration structure simplified
