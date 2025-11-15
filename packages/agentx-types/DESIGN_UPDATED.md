# Agent Types - Updated Design (Based on Claude SDK Analysis)

## Changes from Previous Version

### 1. Enhanced ToolResultContent

Added `isError` field to indicate tool execution failures:

```typescript
interface ToolResultContent {
  type: "tool-result";
  name: string;
  id: string;
  result: unknown;
  isError?: boolean; // ← NEW: Indicates if tool execution failed
}
```

**Rationale**: Claude SDK tracks tool execution errors. This is minimal metadata needed.

### 2. Enhanced ThinkingContent

Added optional `tokenCount` to track extended thinking usage:

```typescript
interface ThinkingContent {
  type: "thinking";
  reasoning: string;
  tokenCount?: number; // ← NEW: Tokens used for thinking
}
```

**Rationale**: Claude SDK has `maxThinkingTokens` option. We should track actual usage.

### 3. Simplified SystemContent

Removed complex subtypes, keep it simple:

```typescript
// Keep as is - use TextContent with role: "system" for most cases
// Add specific SystemContent only if truly needed
interface SystemContent {
  type: "system";
  message: string;
  level?: "info" | "warning" | "error";
}
```

**Rationale**: Most system messages are just text. Add this type only if we discover a real need.

---

## Final Minimal Type System

```typescript
// ============================================================================
// Message
// ============================================================================

export interface Message {
  id: string;
  role: MessageRole;
  content: MessageContent;
  timestamp: Date;
  parentId?: string; // For tool call threading
  usage?: TokenUsage; // For AI messages
}

export type MessageRole = "user" | "assistant" | "system" | "tool";

// ============================================================================
// Message Content
// ============================================================================

export type MessageContent =
  | TextContent
  | ThinkingContent
  | ToolCallContent
  | ToolResultContent
  | ImageContent
  | CodeContent;

export interface TextContent {
  type: "text";
  text: string;
}

export interface ThinkingContent {
  type: "thinking";
  reasoning: string;
  tokenCount?: number; // NEW
}

export interface ToolCallContent {
  type: "tool-call";
  name: string;
  id: string;
  input: Record<string, unknown>;
}

export interface ToolResultContent {
  type: "tool-result";
  name: string;
  id: string;
  result: unknown;
  isError?: boolean; // NEW
}

export interface ImageContent {
  type: "image";
  images: Image[];
}

export interface Image {
  data: string;
  name: string;
  mediaType: "image/png" | "image/jpeg" | "image/gif" | "image/webp";
}

export interface CodeContent {
  type: "code";
  code: string;
  language?: string;
}

// ============================================================================
// Token Usage
// ============================================================================

export interface TokenUsage {
  input: number;
  output: number;
  cacheRead?: number;
  cacheWrite?: number;
}

// ============================================================================
// Session
// ============================================================================

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

## What We Explicitly Excluded (and Why)

### 1. Streaming Types

- **Claude SDK Has**: `SDKPartialAssistantMessage`, stream events
- **Our Decision**: Runtime behavior, belongs in agent-sdk
- **Rationale**: agent-types is for data structures, not streaming protocol

### 2. Result/Statistics Types

- **Claude SDK Has**: `SDKResultMessage` with duration, cost, turns
- **Our Decision**: Computed at runtime in agent-sdk
- **Rationale**: Derived data, not core data structure

### 3. Permission Types

- **Claude SDK Has**: `PermissionDenial`, `PermissionUpdate`, etc.
- **Our Decision**: Runtime state management in agent-sdk
- **Rationale**: Permission system is behavior, not data

### 4. System Initialization

- **Claude SDK Has**: System message with `subtype: 'init'`, config info
- **Our Decision**: Not part of core types
- **Rationale**: Configuration is runtime concern

### 5. Compact Boundary

- **Claude SDK Has**: `compact_boundary` system messages
- **Our Decision**: Not part of core types
- **Rationale**: Conversation compaction is SDK feature

---

## Comparison: Claude SDK vs Our Design

| Feature               | Claude SDK              | Our Design                     | Decision                 |
| --------------------- | ----------------------- | ------------------------------ | ------------------------ |
| **Message Structure** | `SDKMessage` union      | `Message` interface            | ✅ Similar, ours simpler |
| **Content Types**     | Via Anthropic API types | 6 discriminated unions         | ✅ More structured       |
| **Thinking Support**  | Via `maxThinkingTokens` | `ThinkingContent` + tokenCount | ✅ Added                 |
| **Tool Tracking**     | `tool_use_id` + parent  | `id` + `parentId`              | ✅ Equivalent            |
| **Tool Errors**       | Via result content      | `isError` field                | ✅ Added                 |
| **Streaming**         | `stream_event` messages | Not included                   | ✅ Correct (runtime)     |
| **Session Stats**     | `SDKResultMessage`      | Not included                   | ✅ Correct (computed)    |
| **Permissions**       | Multiple types          | Not included                   | ✅ Correct (behavior)    |

---

## Final Type Count

| Category             | Count                                                 |
| -------------------- | ----------------------------------------------------- |
| **Core Types**       | 2 (Message, Session)                                  |
| **Enums**            | 1 (MessageRole)                                       |
| **Content Types**    | 6 (Text, Thinking, ToolCall, ToolResult, Image, Code) |
| **Supporting Types** | 2 (TokenUsage, Image)                                 |
| **Total**            | 11 types                                              |

**Still minimal, but now aligned with Claude SDK's actual needs.**

---

## Migration Notes

From previous design version:

1. ✅ Add `isError?: boolean` to `ToolResultContent`
2. ✅ Add `tokenCount?: number` to `ThinkingContent`
3. ❌ Keep SystemContent out (use TextContent with role: "system")
4. ❌ No metadata field yet (YAGNI)

**Breaking changes**: None (only adding optional fields)
