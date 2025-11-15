# @deepractice-ai/agentx-types

Core type definitions for the Deepractice AgentX ecosystem.

## Overview

This package provides TypeScript type definitions for all AgentX components:

- **LLM** - Language model configuration and response types
- **Message** - Multi-role message system with rich content parts
- **Session** - Conversation session container
- **Agent** - Agent configuration and runtime options
- **MCP** - Model Context Protocol (tools, resources, prompts)

## Installation

```bash
pnpm add @deepractice-ai/agentx-types
```

## Type Domains

### 1. LLM Context (7 types)

```typescript
import type {
  LLMProvider,
  LLMConfig,
  LLMRequest,
  LLMResponse,
  StopReason,
  StreamChunk,
  TokenUsage,
} from "@deepractice-ai/agentx-types";

const config: LLMConfig = {
  provider: "anthropic",
  model: "claude-3-5-sonnet-20241022",
  maxTokens: 4096,
  temperature: 0.7,
};
```

### 2. Message System (13 types)

Multi-role messages with rich content parts:

```typescript
import type {
  Message,
  UserMessage,
  AssistantMessage,
  SystemMessage,
  ToolMessage,
  ContentPart,
  TextPart,
  ImagePart,
  ThinkingPart,
  ToolCallPart,
  ToolResultPart,
} from "@deepractice-ai/agentx-types";

// Example user message with image
const userMsg: UserMessage = {
  role: "user",
  content: [
    {
      type: "text",
      text: "What's in this image?",
    },
    {
      type: "image",
      data: "base64_encoded_image_data",
      mimeType: "image/jpeg",
    },
  ],
  timestamp: Date.now(),
};

// Example assistant message with thinking + tool use
const assistantMsg: AssistantMessage = {
  role: "assistant",
  content: [
    {
      type: "thinking",
      thinking: "User wants to analyze an image...",
    },
    {
      type: "tool_call",
      id: "call_1",
      name: "analyze_image",
      input: { imageUrl: "..." },
    },
  ],
  timestamp: Date.now(),
};
```

### 3. Session Container (1 type)

```typescript
import type { Session } from "@deepractice-ai/agentx-types";

const session: Session = {
  id: "sess_abc123",
  messages: [userMsg, assistantMsg],
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    title: "Image Analysis",
    tags: ["vision", "analysis"],
  },
};
```

### 4. Agent Configuration (3 types)

```typescript
import type { AgentConfig, AgentCallOptions, AgentInfo } from "@deepractice-ai/agentx-types";

// Agent creation config
const agentConfig: AgentConfig = {
  name: "Vision Analyst",
  llm: {
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
  },
  prompt: "You are an expert image analyst...",
  mcpServers: {
    vision: {
      type: "stdio",
      command: "npx",
      args: ["-y", "@deepractice-ai/vision-mcp"],
    },
  },
};

// Runtime call options
const callOptions: AgentCallOptions = {
  enableTools: true,
  allowedTools: ["analyze_image", "describe_scene"],
  abortSignal: new AbortController().signal,
};
```

### 5. MCP Protocol (42 types)

Complete Model Context Protocol type definitions:

```typescript
import type {
  // Tools
  McpTool,
  McpToolResult,
  ListToolsResult,
  // Resources
  McpResource,
  McpResourceContents,
  ListResourcesResult,
  ReadResourceResult,
  // Prompts
  McpPrompt,
  McpPromptMessage,
  GetPromptResult,
  // Server
  McpServerInfo,
  McpInitializeResult,
  // Transport
  McpTransportConfig,
  McpStdioTransport,
  McpSseTransport,
  McpHttpTransport,
  McpSdkTransport,
} from "@deepractice-ai/agentx-types";

// Example MCP tool definition
const tool: McpTool = {
  name: "analyze_image",
  description: "Analyzes an image and returns insights",
  inputSchema: {
    type: "object",
    properties: {
      imageUrl: {
        type: "string",
        description: "URL of the image to analyze",
      },
    },
    required: ["imageUrl"],
  },
};
```

## Type Guards

Convenience functions for type checking:

```typescript
import {
  isUserMessage,
  isAssistantMessage,
  isSystemMessage,
  isToolMessage,
  isTextPart,
  isImagePart,
  isThinkingPart,
  isToolCallPart,
  isToolResultPart,
} from "@deepractice-ai/agentx-types";

if (isUserMessage(message)) {
  // TypeScript knows message is UserMessage
  console.log(message.role); // "user"
}

if (isImagePart(part)) {
  // TypeScript knows part is ImagePart
  console.log(part.mimeType);
}
```

## Architecture

### Dependency Flow

```
agentx-types/        (Pure data types - THIS PACKAGE)
    ├── LLM              (Model configuration)
    ├── Message          (Content structure)
    ├── Session          (State container)
    ├── Agent Config     (Agent setup)
    └── MCP              (Tool protocol)
           ↓
agentx-core/         (Core implementations)
    ├── SessionManager   (CRUD + fork)
    ├── MessageManager   (Message handling)
    ├── LLMClient        (Model calls)
    ├── McpClient        (Tool execution)
    └── Agent            (Orchestration class)
           ↓
agentx-sdk/          (Public API)
    └── api/
        ├── createAgent()
        ├── chat()
        └── forkSession()
```

### Design Principles

1. **Pure Types** - No implementations, only type definitions
2. **Domain-Driven** - Types organized by domain (LLM, Message, Session, etc.)
3. **Minimal Dependencies** - Zero runtime dependencies
4. **Complete Exports** - All types exported from package root

## Complete Export List

### LLM Domain (7)

- `LLMProvider`, `LLMConfig`, `LLMRequest`, `LLMResponse`
- `StopReason`, `StreamChunk`, `TokenUsage`

### Message Domain (13)

- `Message`, `UserMessage`, `AssistantMessage`, `SystemMessage`, `ToolMessage`
- `MessageRole`, `ContentPart`, `TextPart`, `ThinkingPart`, `ImagePart`, `FilePart`
- `ToolCallPart`, `ToolResultPart`, `ToolResultOutput`

### Session Domain (1)

- `Session`

### Agent Domain (3)

- `AgentConfig`, `AgentCallOptions`, `AgentInfo`

### MCP Domain (42)

- **Tools (8)**: `JsonSchema`, `JsonSchemaProperty`, `McpTool`, `TextContent`, `ImageContent`, `ResourceContent`, `McpToolResult`, `ListToolsResult`
- **Resources (7)**: `McpResource`, `McpResourceTemplate`, `McpResourceContents`, `ListResourcesResult`, `ListResourceTemplatesResult`, `ReadResourceResult`
- **Prompts (8)**: `McpPromptArgument`, `McpPrompt`, `PromptTextContent`, `PromptImageContent`, `PromptResourceContent`, `McpPromptMessage`, `ListPromptsResult`, `GetPromptResult`
- **Server (3)**: `McpServerCapabilities`, `McpServerInfo`, `McpInitializeResult`
- **Transport (5)**: `McpStdioTransport`, `McpSseTransport`, `McpHttpTransport`, `McpSdkTransport`, `McpTransportConfig`
- **Request (4)**: `McpBaseParams`, `McpPaginatedParams`, `McpRequest`, `McpRequestOptions`
- **Protocol (3)**: `LATEST_PROTOCOL_VERSION`, `SUPPORTED_PROTOCOL_VERSIONS`, `McpProtocolVersion`

### Type Guards (10)

- `isUserMessage`, `isAssistantMessage`, `isSystemMessage`, `isToolMessage`
- `isTextPart`, `isThinkingPart`, `isImagePart`, `isFilePart`
- `isToolCallPart`, `isToolResultPart`

**Total: 79 exports**

## Documentation

For detailed documentation on each type:

- [LLM Types](./src/llm/README.md)
- [Message Types](./src/message/README.md)
- [Session Types](./src/session/README.md)
- [Agent Types](./src/agent/AgentConfig.ts)
- [MCP Types](./src/mcp/README.md)

## Development

```bash
# Type check
pnpm typecheck

# Build
pnpm build

# Clean
pnpm clean
```

## License

MIT
