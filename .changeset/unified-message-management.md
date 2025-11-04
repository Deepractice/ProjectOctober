---
"agent-ui": minor
---

Refactor to unified message management architecture

## Problem

- User messages were lost when creating new sessions
- Message management scattered across multiple locations
- Optimistic messages and server messages stored separately causing sync issues
- `clearOptimisticMessages` on completion removed user messages

## Solution

Implemented unified message management with single source of truth:

### Architecture Changes

1. **Single message list**: Removed `optimisticMessages` Map, use only `sessionMessages`
2. **Unified API**: Created semantic methods for all message operations
   - `addUserMessage()` - Add user message
   - `addAssistantChunk()` - Add streaming chunk
   - `addAssistantMessage()` - Add complete assistant message
   - `addToolUse()` / `updateToolResult()` - Tool operations
   - `addErrorMessage()` - Error messages
   - `migrateSession()` - Session lifecycle
3. **Simplified rendering**: ChatMessages directly from `sessionMessages`, no merging needed

### Benefits

- ✅ User messages never lost
- ✅ Single source of truth
- ✅ Clear message lifecycle
- ✅ No sync issues between optimistic/server
- ✅ Easier to maintain and debug

### Migration

- ChatInterface uses `addUserMessage()` instead of `addOptimisticMessage()`
- useWebSocketHandlers uses specific methods for each message type
- Removed all `clearOptimisticMessages()` calls
- Legacy methods kept for backward compatibility

Related: #29
