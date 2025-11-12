---
"@deepractice-ai/agent": minor
"@deepractice-ai/agent-sdk": minor
---

refactor: unify message streaming architecture using SDK events

Major refactor to eliminate duplicate message channels and establish single source of truth:

**Backend (agent-sdk):**

- Claude Session now uses only `streamEventSubject` for real-time messages
- `messageSubject` deprecated (kept for compatibility but not used)
- All SDK messages (stream_event, assistant, user, result) forwarded to stream
- User messages manually sent to stream in SDK format
- `messages[]` array maintained only for REST API historical queries

**Backend (WebSocket):**

- `sessions-broadcast.js`: Changed message format from `agent-response` to `sdk-event`
- `chat.js`: Removed stream subscription, only calls `send()` - messages broadcast via sessions-broadcast
- Unified single channel architecture prevents duplicate messages

**Frontend:**

- Added `sdk-event` handler in websocketAdapter
- Handles all SDK message types: stream_event, assistant, user, result
- Tool results now properly displayed from SDK user messages
- Maintains backward compatibility with `agent-response` messages

**Benefits:**

- ✅ Single source of truth for real-time messages
- ✅ No duplicate messages
- ✅ Tool results display correctly
- ✅ Consistent flow for first and subsequent conversations
- ✅ Simplified architecture with clear responsibilities
