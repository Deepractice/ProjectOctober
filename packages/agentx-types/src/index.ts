/**
 * AgentX Types
 *
 * Core type definitions for the Deepractice AgentX ecosystem.
 */

// LLM domain
export type {
  LLMProvider,
  LLMConfig,
  LLMRequest,
  LLMResponse,
  StopReason,
  StreamChunk,
  TextChunk,
  ThinkingChunk,
  ToolUseChunk,
  TokenUsage,
} from "./llm";

// Message domain
export type {
  Message,
  UserMessage,
  AssistantMessage,
  SystemMessage,
  ToolMessage,
  MessageRole,
  ContentPart,
  TextPart,
  ThinkingPart,
  ImagePart,
  FilePart,
  ToolCallPart,
  ToolResultPart,
  ToolResultOutput,
} from "./message";

// Session domain
export type { Session } from "./session";

// Agent domain
export type { AgentMetadata } from "./agent";

// MCP (Model Context Protocol) domain
export {
  LATEST_PROTOCOL_VERSION,
  SUPPORTED_PROTOCOL_VERSIONS,
  type McpProtocolVersion,
} from "./mcp";
export type {
  // Tools
  JsonSchema,
  JsonSchemaProperty,
  McpTool,
  TextContent,
  ImageContent,
  ResourceContent,
  McpToolResult,
  ListToolsResult,
  // Resources
  McpResource,
  McpResourceTemplate,
  McpResourceContents,
  ListResourcesResult,
  ListResourceTemplatesResult,
  ReadResourceResult,
  // Prompts
  McpPromptArgument,
  McpPrompt,
  PromptTextContent,
  PromptImageContent,
  PromptResourceContent,
  McpPromptMessage,
  ListPromptsResult,
  GetPromptResult,
  // Server
  McpServerCapabilities,
  McpServerInfo,
  McpInitializeResult,
  // Transport
  McpStdioTransport,
  McpSseTransport,
  McpHttpTransport,
  McpSdkTransport,
  McpTransportConfig,
  // Request
  McpBaseParams,
  McpPaginatedParams,
  McpRequest,
  McpRequestOptions,
} from "./mcp";

// Type guards
export {
  isUserMessage,
  isAssistantMessage,
  isSystemMessage,
  isToolMessage,
  isTextPart,
  isThinkingPart,
  isImagePart,
  isFilePart,
  isToolCallPart,
  isToolResultPart,
} from "./guards";
