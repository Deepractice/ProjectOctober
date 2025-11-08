---
"@deepractice-ai/agent-sdk": major
---

BREAKING: Refactor session lifecycle - create before send

**Session Lifecycle Change:**

- Sessions can now be created independently without sending a message
- `SessionCreateOptions.initialMessage` removed
- Create session: `agent.createSession()`
- Send message: `session.send(message)`
- Applications should handle "create + send" at their own layer

**Unified Persistence:**

- Removed `MessagePersister` interface
- `AgentPersister` now manages both sessions and messages
- Merged `SQLiteMessagePersister` into `SQLiteAgentPersister`
- Single database interface for all Agent data

**Session Persistence:**

- Sessions are saved to database immediately on creation
- Every message is persisted as it arrives (fire-and-forget)
- Session metadata auto-updates after each conversation
- Historical sessions auto-loaded on `agent.initialize()`

**API Changes:**

```typescript
// Before (breaking)
const session = await agent.createSession({
  initialMessage: "Hello",
});

// After (new API)
const session = await agent.createSession();
await session.send("Hello");

// Or use convenience method
const session = await agent.chat("Hello");
```

**Architecture Improvements:**

- Clearer separation: create ≠ send
- Better testability: mock empty sessions
- Stateless restart: all sessions restored from DB
- Simplified types: unified persister interface

**New Features:**

- `AgentPersister.getAllSessions()` - load all sessions
- `SessionManager.loadHistoricalSessions()` - restore from DB
- Auto-save session metadata after each `send()`
- Support creating sessions without messages

**Migration Guide:**

```typescript
// Old code
const session = await agent.createSession({
  initialMessage: "Hello",
  model: "claude-sonnet-4",
});

// New code
const session = await agent.createSession({
  model: "claude-sonnet-4",
});
await session.send("Hello");
```

**Documentation:**

- Added `docs/architecture.md` - UML class diagrams + architecture explanation
- Added `docs/sequence-diagrams.md` - Complete flow diagrams with Mermaid
