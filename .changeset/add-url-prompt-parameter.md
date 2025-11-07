---
"@deepractice-ai/agent": minor
---

Add URL query parameter support for auto-starting sessions with initial prompt

Users can now start a new session automatically by providing a prompt in the URL query parameter:

- `http://localhost:5173/?prompt=your-message` will create a new session and send the message
- The prompt parameter is automatically cleared from the URL after processing
- Fixed React Strict Mode double execution issue using useRef
