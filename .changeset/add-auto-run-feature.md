---
"@deepractice-ai/agent": minor
---

feat: add auto-run feature for Docker containers

- Add `/api/start-url` endpoint to support automatic prompt execution on startup
- Add `/auto` route to handle auto-run with prompt and session parameters
- Support `AUTO_RUN_PROMPT` and `AUTO_RUN_SESSION_ID` environment variables
- Backend manages one-time auto-run to prevent repeated execution
- Update Docker configuration and documentation with auto-run examples
