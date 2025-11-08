/**
 * Session Manager - Browser Agent Management
 * Manages single BrowserAgent instance (single WebSocket)
 * Provides access to sessions through the agent
 */

import { createBrowserAgent } from "@deepractice-ai/agent-sdk/browser";
import type { BrowserAgent } from "@deepractice-ai/agent-sdk/browser";

class SessionManager {
  private agent: BrowserAgent | null = null;
  private wsUrl: string;
  private initializePromise: Promise<void> | null = null;

  constructor() {
    // Determine WebSocket URL based on environment
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    const port = import.meta.env.VITE_WS_PORT || window.location.port || "5200";
    this.wsUrl = `${protocol}//${host}:${port}/ws`;

    console.log("[SessionManager] Configured WebSocket URL:", this.wsUrl);
  }

  /**
   * Initialize the agent (creates single WebSocket connection)
   */
  async initialize(): Promise<void> {
    if (this.initializePromise) {
      return this.initializePromise;
    }

    this.initializePromise = (async () => {
      console.log("[SessionManager] Initializing BrowserAgent...");

      this.agent = createBrowserAgent(this.wsUrl, {
        reconnect: true,
        maxReconnectAttempts: 5,
      });

      // Setup agent-level event listeners
      this.agent.on("connected", () => {
        console.log("[SessionManager] Agent connected");
      });

      this.agent.on("disconnected", () => {
        console.warn("[SessionManager] Agent disconnected");
      });

      this.agent.on("reconnecting", ({ attempt, delay }) => {
        console.log(`[SessionManager] Reconnecting... attempt ${attempt}, delay ${delay}ms`);
      });

      this.agent.on("error", (error) => {
        console.error("[SessionManager] Agent error:", error);
      });

      await this.agent.initialize();

      console.log("[SessionManager] BrowserAgent initialized successfully");
    })();

    return this.initializePromise;
  }

  /**
   * Get agent instance
   */
  getAgent(): BrowserAgent {
    if (!this.agent) {
      throw new Error("SessionManager not initialized. Call initialize() first.");
    }
    return this.agent;
  }

  /**
   * Get or create a session (through the agent)
   */
  getSession(sessionId: string) {
    const agent = this.getAgent();
    return agent.getSession(sessionId);
  }

  /**
   * Check if session exists
   */
  hasSession(sessionId: string): boolean {
    if (!this.agent) return false;
    return this.agent.hasSession(sessionId);
  }

  /**
   * Remove session
   */
  async removeSession(sessionId: string): Promise<void> {
    const agent = this.getAgent();
    await agent.deleteSession(sessionId);
    console.log("[SessionManager] Removed session:", sessionId);
  }

  /**
   * Get all session IDs
   */
  getAllSessionIds(): string[] {
    if (!this.agent) return [];
    return this.agent.getSessionIds();
  }

  /**
   * Clean up agent and all sessions
   */
  async cleanup(): Promise<void> {
    if (this.agent) {
      await this.agent.destroy();
      this.agent = null;
      this.initializePromise = null;
      console.log("[SessionManager] Cleaned up agent and all sessions");
    }
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
