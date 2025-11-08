/**
 * Browser-side API
 * Includes WebSocket Bridge for browser WebSocket connections
 * No Node.js specific dependencies
 */

// Re-export everything from common API
export * from "../common";

// Browser-specific: WebSocket Bridge (for browser WebSocket)
export { WebSocketBridge } from "~/facade/websocket";
export type { WebSocketLike } from "~/facade/websocket";

// Browser-specific: Browser Agent (for browser environment)
export {
  createBrowserAgent,
  createBrowserSession,
  BrowserAgent,
  BrowserSession,
} from "~/facade/browser";
