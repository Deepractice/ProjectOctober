/**
 * Agent Web - Business Application Layer
 * EventBus-driven architecture with Zustand stores
 * Now using assistant-ui for chat interface
 */

import { useEffect } from "react";
import { connectWebSocket, disconnectWebSocket, loadSessions } from "~/api/agent";
import { Layout } from "~/components/Layout";
import { SessionList } from "~/components/SessionList";
import { ChatArea } from "~/components/ChatArea";
import { AgentRuntimeProvider } from "~/components/AgentRuntimeProvider";

// Import stores to ensure they're initialized and subscribed to EventBus
import "~/stores/sessionStore";
import "~/stores/messageStore";
import "~/stores/uiStore";

export function App() {
  useEffect(() => {
    // Initialize WebSocket connection
    connectWebSocket().catch((error) => {
      console.error("[App] Failed to connect WebSocket:", error);
    });

    // Load sessions on mount
    loadSessions().catch((error) => {
      console.error("[App] Failed to load sessions:", error);
    });

    // Cleanup on unmount
    return () => {
      disconnectWebSocket();
    };
  }, []);

  return (
    <AgentRuntimeProvider>
      <Layout sidebar={<SessionList />} main={<ChatArea />} />
    </AgentRuntimeProvider>
  );
}
