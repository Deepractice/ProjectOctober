import { WebSocket, WebSocketServer } from "ws";
import type { AppConfig } from "./core/config.js";

export interface ServerOptions {
  host?: string;
  loadEnv?: boolean;
}

export interface ConnectedClient {
  ws: WebSocket;
  id: string;
}

export type ConnectedClients = Set<WebSocket>;

export interface ServerContext {
  config: AppConfig;
  wss: WebSocketServer;
  connectedClients: ConnectedClients;
}
