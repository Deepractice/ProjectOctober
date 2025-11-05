/**
 * App.tsx - Main Application Component
 *
 * EventBus-driven architecture with Zustand stores
 * Migrated from agent-ui with simplified structure
 */

import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from "react-router-dom";
import Sidebar from "~/components/Sidebar";
import HeaderNav, { type TabType } from "~/components/HeaderNav";
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
  const [activeTab, setActiveTab] = useState<TabType>("chat");

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

  // Temporary project info (until we have proper project management)
  const selectedProject = selectedSession
    ? { name: "Current Project", path: ".", fullPath: "." }
    : null;

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Sidebar - Full Height */}
      <aside className="w-64 border-r border-border flex-shrink-0 overflow-y-auto bg-background">
        <Sidebar isMobile={false} isPWA={false} />
      </aside>

      {/* Right Content Area - Full Height */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Navigation - Top of Right Side */}
        <HeaderNav
          selectedProject={selectedProject}
          selectedSession={selectedSession}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isMobile={false}
        />

        {/* Main Content - Below Header */}
        <main className="flex-1 overflow-hidden bg-background">
          {/* Chat Tab */}
          <div className={activeTab === "chat" ? "h-full" : "hidden"}>
            <ChatInterface />
          </div>

          {/* Shell Tab - Placeholder */}
          {activeTab === "shell" && (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Shell View
                </h3>
                <p className="text-gray-600 dark:text-gray-400">Coming soon...</p>
              </div>
            </div>
          )}

          {/* Files Tab - Placeholder */}
          {activeTab === "files" && (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  File Browser
                </h3>
                <p className="text-gray-600 dark:text-gray-400">Coming soon...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
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
