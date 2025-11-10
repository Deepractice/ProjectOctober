/**
 * App.tsx - Main Application Component
 *
 * SDK-driven architecture with Zustand stores
 */

import { useEffect, useState, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import Sidebar from "~/components/Sidebar";
import HeaderNav, { type TabType } from "~/components/HeaderNav";
import ChatInterface from "~/components/ChatInterface";
import { useAgentStore } from "~/stores/agentStore";
import { useSessionStore } from "~/stores/sessionStore";
import { useMessageStore } from "~/stores/messageStore";

function AppContent() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // Agent store
  const initializeAgent = useAgentStore((state) => state.initialize);
  const destroyAgent = useAgentStore((state) => state.destroy);
  const isConnected = useAgentStore((state) => state.isConnected);

  // Session store
  const sessions = useSessionStore((state) => state.sessions);
  const selectedSession = useSessionStore((state) => state.selectedSession);
  const selectSession = useSessionStore((state) => state.selectSession);
  const refreshSessions = useSessionStore((state) => state.refreshSessions);
  const createNewSession = useSessionStore((state) => state.createNewSession);

  // Message store
  const sendMessage = useMessageStore((state) => state.sendMessage);

  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Use ref to prevent double execution in React Strict Mode
  const promptProcessedRef = useRef(false);

  // Detect mobile viewport (1200px breakpoint)
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const shouldBeMobile = width < 1200;
      console.log("[App] Viewport check:", { width, shouldBeMobile });
      setIsMobile(shouldBeMobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Initialize agent and load sessions (only once on mount)
  useEffect(() => {
    console.log("[App] Initializing agent and loading sessions");

    // Initialize agent (establishes WebSocket connection)
    initializeAgent().catch((error) => {
      console.error("[App] Failed to initialize agent:", error);
    });

    // Load sessions from server
    refreshSessions().catch((error) => {
      console.error("[App] Failed to load sessions:", error);
    });

    return () => {
      console.log("[App] Cleaning up: destroying agent");
      destroyAgent();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  // Handle URL query parameter for auto-starting session with prompt
  useEffect(() => {
    const promptParam = searchParams.get("prompt");

    console.log("[App] URL prompt parameter check:", {
      promptParam,
      timestamp: Date.now(),
      alreadyProcessed: promptProcessedRef.current,
      isConnected,
    });

    if (promptParam && !promptProcessedRef.current && isConnected) {
      console.log("[App] 🚀 Auto-start with prompt parameter:", promptParam);

      // Mark as processed to prevent double execution
      promptProcessedRef.current = true;

      // Clear URL parameter immediately to prevent re-triggering on refresh
      setSearchParams({}, { replace: true });

      // Create new session then send message
      (async () => {
        try {
          console.log("[App] 📤 Creating new session for prompt...");
          const newSessionId = await createNewSession();
          console.log("[App] ✅ Session created:", newSessionId);

          // Navigate to new session
          navigate(`/session/${newSessionId}`, { replace: true });

          // Send the prompt message
          console.log("[App] 📤 Sending prompt message...");
          await sendMessage(newSessionId, promptParam, []);
          console.log("[App] ✅ Message sent");
        } catch (error) {
          console.error("[App] ❌ Failed to auto-start with prompt:", error);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]); // Depend on isConnected to wait for agent initialization

  // Handle URL-based session loading
  useEffect(() => {
    if (sessionId && sessions.length > 0) {
      // URL has sessionId - select it
      if (!selectedSession || selectedSession.id !== sessionId) {
        const session = sessions.find((s) => s.id === sessionId);
        if (session) {
          console.log("[App] URL changed, selecting session:", sessionId);
          selectSession(sessionId);
        }
      }
    } else if (!sessionId && selectedSession) {
      // URL is "/" and we have a selected session - clear it
      console.log("[App] URL is root, clearing selectedSession");
      useSessionStore.setState({ selectedSession: null });
    }
  }, [sessionId, sessions, selectedSession, selectSession]);

  // Close mobile sidebar when session changes
  useEffect(() => {
    if (isMobile && selectedSession) {
      setSidebarOpen(false);
    }
  }, [selectedSession, isMobile]);

  // Temporary project info (until we have proper project management)
  const selectedProject = selectedSession
    ? { name: "Current Project", path: ".", fullPath: "." }
    : null;

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Desktop Sidebar - Fixed on left */}
      {!isMobile && (
        <aside className="w-64 border-r border-border flex-shrink-0 overflow-y-auto bg-background">
          <Sidebar isMobile={false} isPWA={false} />
        </aside>
      )}

      {/* Mobile Sidebar - Overlay */}
      {isMobile && (
        <div
          className={`fixed inset-0 z-50 flex transition-all duration-150 ease-out ${
            sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        >
          <button
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-150 ease-out"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          />
          <div
            className={`relative w-[85vw] max-w-sm sm:w-80 bg-card border-r border-border transform transition-transform duration-150 ease-out ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            style={{ height: "calc(100vh - 80px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar isMobile={true} isPWA={false} />
          </div>
        </div>
      )}

      {/* Right Content Area - Full Height */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Navigation - Top of Right Side */}
        <HeaderNav
          selectedProject={selectedProject}
          selectedSession={selectedSession}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isMobile={isMobile}
          onMenuClick={isMobile ? () => setSidebarOpen(true) : undefined}
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
