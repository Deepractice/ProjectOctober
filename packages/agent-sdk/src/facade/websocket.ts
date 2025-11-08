/**
 * WebSocket Facade - Assembly and orchestration
 * Wraps WebSocket server creation from core layer
 */

export { createWebSocketServer } from "~/core/websocket/WebSocketServer";
export { WebSocketBridge } from "~/core/websocket/WebSocketBridge";
export type { WebSocketLike } from "~/core/websocket/WebSocketBridge";
