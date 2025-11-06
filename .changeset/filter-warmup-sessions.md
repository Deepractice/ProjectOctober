---
"@deepractice-ai/agent-sdk": patch
---

Filter out SDK warmup sessions from session list

Automatically filter out Claude SDK warmup/subagent sessions (agent-\* files) from the session manager. These internal SDK sessions are used for performance optimization and should not be exposed to the application layer.

Changes:

- Add isWarmupSession() helper to detect agent-\* session IDs
- Filter warmup sessions during loadHistoricalSessions()
- Filter warmup sessions in getSessions() output
- Log skipped warmup sessions for debugging

This ensures the business layer only sees real user sessions, keeping the SDK implementation details hidden.
