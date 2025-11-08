---
"@deepractice-ai/agent-sdk": minor
---

Add SessionInitializer to handle first message persistence

- Create SessionInitializer class to manage session and message saving order
- Ensure session record is saved before first user message
- Fix foreign key constraint issues during session creation
