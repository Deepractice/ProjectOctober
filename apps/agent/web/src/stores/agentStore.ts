/**
 * Agent Store
 * Manages global BrowserAgent instance and WebSocket connection
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createBrowserAgent } from "@deepractice-ai/agent-sdk/browser";
import type { BrowserAgent, VirtualSession } from "@deepractice-ai/agent-sdk/browser";

interface AgentState {
  // State
  agent: BrowserAgent | null;
  isInitialized: boolean;
  isConnected: boolean;
  error: Error | null;

  // Actions
  initialize: () => Promise<void>;
  getSession: (sessionId: string) => VirtualSession;
  destroy: () => Promise<void>;
}

export const useAgentStore = create<AgentState>()(
  devtools(
    (set, get) => ({
      // Initial state
      agent: null,
      isInitialized: false,
      isConnected: false,
      error: null,

      // Initialize BrowserAgent
      initialize: async () => {
        const { agent, isInitialized } = get();

        // Already initialized
        if (isInitialized && agent) {
          console.log("[AgentStore] Agent already initialized");
          return;
        }

        try {
          console.log("[AgentStore] Initializing BrowserAgent...");

          // Build WebSocket URL
          const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
          const host = window.location.hostname;
          const port = import.meta.env.VITE_WS_PORT || window.location.port || "5200";
          const wsUrl = `${protocol}//${host}:${port}/ws`;

          console.log("[AgentStore] WebSocket URL:", wsUrl);

          // Create agent
          const newAgent = createBrowserAgent(wsUrl, {
            reconnect: true,
            maxReconnectAttempts: 5,
          });

          // Setup agent-level event listeners
          newAgent.on("connected", () => {
            console.log("[AgentStore] ✅ Connected");
            set({ isConnected: true, error: null });
          });

          newAgent.on("disconnected", () => {
            console.warn("[AgentStore] ⚠️ Disconnected");
            set({ isConnected: false });
          });

          newAgent.on("reconnecting", ({ attempt, delay }) => {
            console.log(`[AgentStore] 🔄 Reconnecting... attempt ${attempt}, delay ${delay}ms`);
          });

          newAgent.on("error", (error) => {
            console.error("[AgentStore] ❌ Error:", error);
            set({ error });
          });

          // Initialize connection
          await newAgent.initialize();

          set({
            agent: newAgent,
            isInitialized: true,
            isConnected: true,
            error: null,
          });

          console.log("[AgentStore] ✅ Agent initialized successfully");
        } catch (error) {
          console.error("[AgentStore] ❌ Failed to initialize:", error);
          set({ error: error as Error, isInitialized: false });
          throw error;
        }
      },

      // Get session (creates VirtualSession if not exists)
      getSession: (sessionId: string): VirtualSession => {
        const { agent } = get();

        if (!agent) {
          throw new Error("Agent not initialized. Call initialize() first.");
        }

        return agent.getSession(sessionId);
      },

      // Cleanup
      destroy: async () => {
        const { agent } = get();

        if (agent) {
          console.log("[AgentStore] Destroying agent...");
          await agent.destroy();
          set({
            agent: null,
            isInitialized: false,
            isConnected: false,
            error: null,
          });
          console.log("[AgentStore] Agent destroyed");
        }
      },
    }),
    { name: "AgentStore" }
  )
);
