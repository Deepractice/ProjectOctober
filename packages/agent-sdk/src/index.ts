/**
 * Agent SDK Main Entry Point
 * Default export: Common API (no environment dependencies)
 *
 * Environment-specific imports:
 * - import { ... } from '@deepractice-ai/agent-sdk' - Common API (default, no env deps)
 * - import { ... } from '@deepractice-ai/agent-sdk/common' - Same as default
 * - import { ... } from '@deepractice-ai/agent-sdk/server' - Server-side (Node.js + WebSocket Server)
 * - import { ... } from '@deepractice-ai/agent-sdk/browser' - Browser-side (Browser Agent + WebSocket Bridge)
 */

// Re-export common API (default)
export * from "./api/common";
