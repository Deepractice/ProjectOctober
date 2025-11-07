import { WebSocket, WebSocketServer } from 'ws'
import type { Config } from '@deepractice-ai/agent-config'

export interface ServerOptions {
  host?: string
  loadEnv?: boolean
}

export interface ConnectedClient {
  ws: WebSocket
  id: string
}

export type ConnectedClients = Set<WebSocket>

export interface ServerContext {
  config: Config
  wss: WebSocketServer
  connectedClients: ConnectedClients
}
