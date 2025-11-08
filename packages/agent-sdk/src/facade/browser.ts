/**
 * Browser Facade - Assembly and orchestration
 * Wraps browser agent creation from browser layer
 */

import { BrowserAgent } from "~/core/browser/BrowserAgent";
import { BrowserSession } from "~/core/browser/BrowserSession";

export { BrowserAgent, BrowserSession };

/**
 * Create a browser agent (recommended - single WebSocket, multiple sessions)
 */
export function createBrowserAgent(
  wsUrl: string,
  config?: { reconnect?: boolean; reconnectDelay?: number; maxReconnectAttempts?: number }
): BrowserAgent {
  return new BrowserAgent(wsUrl, config);
}

/**
 * Create a browser session (legacy - one WebSocket per session)
 * @deprecated Use createBrowserAgent() instead for better resource efficiency
 */
export function createBrowserSession(sessionId: string, wsUrl: string): BrowserSession {
  return new BrowserSession(sessionId, wsUrl);
}
