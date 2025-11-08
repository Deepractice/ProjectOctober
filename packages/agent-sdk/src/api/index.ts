/**
 * Agent SDK Public API
 * Default export: Server API (backward compatible)
 *
 * For specific environments, use:
 * - @deepractice-ai/agent-sdk/sdk - Core SDK (no env deps)
 * - @deepractice-ai/agent-sdk/server - Server-side (Node.js + WebSocket Server)
 * - @deepractice-ai/agent-sdk/browser - Browser-side (WebSocket Bridge only)
 */

// Default: Export server API (backward compatible)
export * from "./server";
