/**
 * Server-side API (Node.js only)
 * Includes WebSocket Server functionality
 * Requires 'ws' package (Node.js native WebSocket server)
 */

// Re-export everything from common API
export * from "../common";

// Server-specific: WebSocket Server
export { createWebSocketServer, WebSocketBridge } from "~/facade/websocket";
export type { WebSocketLike } from "~/facade/websocket";

// Server-specific types
export type { WebSocketServerConfig, AgentWebSocketServer } from "~/types";
