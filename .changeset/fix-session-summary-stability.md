---
"@deepractice-ai/agent-sdk": minor
"@deepractice-ai/agent-service": patch
---

Unify session management and fix summary stability issue

- Add `summary()` method to Session interface for stable session summaries
- Implement summary generation in ClaudeSession with system message filtering (aligned with Claude Code CLI)
- Remove HistoricalSession class - all sessions are now ClaudeSession instances
- ClaudeSession now accepts initialMessages and initialTokenUsage in constructor
- Remove auto-upgrade logic in SessionManager.getSession()
- Fix bug where all session summaries changed to "New Session" after creating a new session
- Simplify SessionManager.deleteSession() to handle all sessions uniformly
