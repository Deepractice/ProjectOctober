---
"@deepractice-ai/agent-sdk": patch
---

Fix session abort to allow resuming conversation after stopping

- Change abort() to set session state to 'idle' instead of 'aborted'
- Remove messageSubject.complete() call in abort() to keep message stream open
- Session can now continue receiving messages after user clicks Stop button
