---
"@deepractice-ai/agent": patch
"@deepractice-ai/agent-sdk": patch
---

Fix streaming output and UI bugs

- Remove fake token counter from AgentStatus component (real-time streaming output makes it unnecessary)
- Fix duplicate streaming messages by preventing multiple WebSocket connections
- Add streaming event support to session manager for real-time text updates
- Improve WebSocket connection management to prevent reconnection loops
