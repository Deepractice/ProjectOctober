---
"@deepractice-ai/agent": patch
---

Fix WebSocket connection stability and prevent rapid reconnect loops

- Add error event handler to server chat WebSocket to capture connection errors
- Implement 30-second heartbeat mechanism (server sends ping, client auto-responds with pong)
- Add 10-second connection timeout to prevent hanging connections
- Enhance close event logging with code, reason, and wasClean flag for better debugging
- Adjust reconnection backoff strategy from 2s to 5s initial delay (5s → 10s → 20s → 30s)
- Improve reconnection attempt logging with progress counter (attempt X/5)

These changes prevent idle connection drops caused by network intermediaries and eliminate UI stuttering from frequent reconnect cycles. WebSocket connections now remain stable for extended periods.
