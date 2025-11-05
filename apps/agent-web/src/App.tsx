/**
 * App.tsx - Main Application Component
 *
 * EventBus-driven architecture with Zustand stores
 * Migrated from agent-ui with simplified structure
 */

import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from "react-router-dom";
import Sidebar from "~/components/Sidebar";
import { Layout } from "~/components/Layout";
import ChatInterface from "~/components/ChatInterface";
import { connectWebSocket, disconnectWebSocket, loadSessions } from "~/api/agent";
import { useSessionStore } from "~/stores/sessionStore";
import { eventBus } from "~/core/eventBus";
import type { AppEvent } from "~/core/events";

// Import stores to ensure they're initialized and subscribed to EventBus
import "~/stores/sessionStore";
import "~/stores/messageStore";
import "~/stores/uiStore";

function AppContent() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { sessions, selectedSession, setSelectedSession } = useSessionStore();

  // Initialize WebSocket and load sessions
  useEffect(() => {
    connectWebSocket().catch((error) => {
      console.error("[App] Failed to connect WebSocket:", error);
    });

    loadSessions().catch((error) => {
      console.error("[App] Failed to load sessions:", error);
    });

    return () => {
      disconnectWebSocket();
    };
  }, []);

  // Handle URL-based session loading
  useEffect(() => {
    if (sessionId && sessions.length > 0) {
      if (!selectedSession || selectedSession.id !== sessionId) {
        const session = sessions.find((s) => s.id === sessionId);
        if (session) {
          console.log("[App] URL changed, selecting session:", sessionId);
          setSelectedSession(session);
        }
      }
    }
  }, [sessionId, sessions, selectedSession, setSelectedSession]);

  // Listen to session selection events
  useEffect(() => {
    const subscription = eventBus.stream().subscribe((event: AppEvent) => {
      if (event.type === "session.selected") {
        const session = sessions.find((s) => s.id === event.sessionId);
        if (session) {
          navigate(`/session/${session.id}`);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [sessions, navigate]);

  return (
    <Layout
      sidebar={<Sidebar isMobile={false} isPWA={false} />}
      main={<ChatInterface />}
    />
  );
}

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/session/:sessionId" element={<AppContent />} />
      </Routes>
    </Router>
  );
}
