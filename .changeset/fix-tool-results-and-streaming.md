---
"@deepractice-ai/agent": patch
"@deepractice-ai/agent-sdk": patch
---

Fix tool result display and new conversation streaming

**Tool Result Display**

- Fixed tool_result messages not being processed in claude-session.ts
- Tool results now correctly update corresponding tool use messages
- Added Bash tool result display (removed from hidden list)
- All tools (WebSearch, Bash, etc.) now show their execution results

**New Conversation Streaming**

- Fixed streaming response not displaying for new conversations
- Frontend now passes tempId to backend in POST /sessions/create
- Backend uses tempId for streaming events before real session ID is available
- Streaming events now match frontend's pending session ID
- Existing conversations continue to work normally (no breaking changes)

**Technical Changes**

- Modified transformSDKMessage to handle tool_result blocks and update existing messages
- Added tempId to SessionCreateOptions interface
- Session manager now uses frontend tempId for streaming events
- WebSocket adapter correctly forwards all streaming messages
