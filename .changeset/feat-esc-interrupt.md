---
"@deepractice-ai/agent": minor
---

feat: implement ESC key interruption using Claude SDK's interrupt API

Added proper interruption support by leveraging Claude SDK's built-in interrupt functionality:

- Add global ESC key listener in ChatInterface to abort active sessions
- Implement interrupt() method in ClaudeAdapter that calls SDK's query.interrupt()
- Update ClaudeSession.abort() to properly interrupt the underlying SDK query
- Store current query instance in adapter for clean interruption

Users can now press ESC during agent processing to immediately stop the current operation.
