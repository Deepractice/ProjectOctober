/*
 * App.jsx - Main Application Component (Refactored with Zustand)
 *
 * STATE MANAGEMENT:
 * - Uses Zustand stores instead of Context API and local state
 * - connectionStore: WebSocket connection
 * - sessionStore: Sessions, Session Protection System
 * - uiStore: UI preferences with persistence
 * - messageStore: WebSocket message routing
 *
 * SESSION PROTECTION SYSTEM:
 * Implemented in sessionStore - tracks active sessions and prevents
 * updates during conversations to avoid message loss.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import MainContent from './components/MainContent';
import MobileNav from './components/MobileNav';
import DesktopSidebar from './components/App/DesktopSidebar';
import MobileSidebarOverlay from './components/App/MobileSidebarOverlay';
import AppModals from './components/App/AppModals';

import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import { useVersionCheck } from './hooks/useVersionCheck';
import { useResponsive } from './hooks/app/useResponsive';
import { useProjectInfo } from './hooks/app/useProjectInfo';
import { useModals } from './hooks/app/useModals';

// Import Zustand stores
import { useConnectionStore, useSessionStore, useUIStore, useMessageStore } from './stores';

// Main App component with routing
function AppContent() {
  const navigate = useNavigate();
  const { sessionId } = useParams();

  const { updateAvailable, latestVersion, currentVersion, releaseInfo } = useVersionCheck('siteboon', 'agent-ui');

  // Custom hooks
  const { isMobile, isPWA } = useResponsive();
  const { project } = useProjectInfo();
  const {
    showSettings,
    setShowSettings,
    showVersionModal,
    setShowVersionModal,
    showQuickSettings,
    setShowQuickSettings,
    settingsInitialTab,
  } = useModals();

  // Zustand stores
  const { connect, disconnect, send: sendMessage, isConnected } = useConnectionStore();
  const {
    sessions,
    selectedSession,
    setSelectedSession,
    isLoading: isLoadingSessions,
    refreshSessions,
    deleteSession: deleteSessionAPI,
    markSessionActive,
    markSessionInactive,
    markSessionProcessing,
    markSessionNotProcessing,
    processingSessions,
  } = useSessionStore();

  const {
    autoExpandTools,
    showRawParameters,
    showThinking,
    autoScrollToBottom,
    sendByCtrlEnter,
  } = useUIStore();

  // Local UI state (not persisted)
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'files'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [externalMessageUpdate, setExternalMessageUpdate] = useState(0);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Initialize WebSocket connection and fetch sessions
  useEffect(() => {
    connect();
    refreshSessions(true);

    return () => {
      disconnect();
    };
  }, [connect, disconnect, refreshSessions]);

  // TEMPORARILY DISABLED: Handle sessions_updated message for external file changes
  // This was causing infinite loop by re-registering handler on every selectedSession change
  // Handler is already registered in sessionStore.ts at module load time
  // TODO: Move external file change detection logic to sessionStore
  /*
  useEffect(() => {
    const messageStore = useMessageStore.getState();

    const handleSessionsUpdated = (message) => {
      // External file change detection
      if (message.changedFile && selectedSession) {
        const filename = message.changedFile.split('/').pop();
        const changedSessionId = filename.replace('.jsonl', '');

        if (changedSessionId === selectedSession.id) {
          const isSessionActive = useSessionStore.getState().isSessionActive(selectedSession.id);

          if (!isSessionActive) {
            setExternalMessageUpdate(prev => prev + 1);
          }
        }
      }
    };

    // Register handler
    messageStore.registerHandler('sessions_updated', handleSessionsUpdated);

    return () => {
      messageStore.unregisterHandler('sessions_updated');
    };
  }, [selectedSession]);
  */

  // Handle URL-based session loading
  useEffect(() => {
    if (sessionId && sessions.length > 0) {
      // Only update if session ID actually changed
      if (!selectedSession || selectedSession.id !== sessionId) {
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
          console.log('📍 [App] URL changed, updating selectedSession:', sessionId);
          setSelectedSession(session);
          setActiveTab('chat');
        }
      }
    }
  }, [sessionId, sessions.length, selectedSession?.id, setSelectedSession]);

  // Debug: Track selectedSession changes
  useEffect(() => {
    console.log('🔄 [App] selectedSession changed:', selectedSession?.id, 'Object ref:', selectedSession ? Object.keys(selectedSession).join(',') : 'null');
  }, [selectedSession]);

  // Debug: Track sessions array changes
  const sessionsRef = React.useRef(sessions);
  useEffect(() => {
    const refChanged = sessionsRef.current !== sessions;
    console.log('📊 [App] sessions array changed - Ref changed:', refChanged, 'Length:', sessions.length);
    sessionsRef.current = sessions;
  }, [sessions]);

  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    if (activeTab !== 'preview') {
      setActiveTab('chat');
    }

    if (isMobile) {
      setSidebarOpen(false);
    }
    navigate(`/session/${session.id}`);
  };

  const handleNewSession = async () => {
    try {
      setIsCreatingSession(true);

      // Call backend to create warmup session
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const { sessionId } = await response.json();
      console.log('✅ Warmup session created:', sessionId);

      // Navigate to new session
      navigate(`/session/${sessionId}`);
      setActiveTab('chat');

      if (isMobile) {
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error('❌ Error creating session:', error);
      alert('Failed to create new session. Please try again.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleSessionDelete = async (sessionId) => {
    if (selectedSession?.id === sessionId) {
      setSelectedSession(null);
      navigate('/');
    }

    try {
      await deleteSessionAPI(sessionId);
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleSidebarRefresh = () => {
    refreshSessions(true);
    // No need to manually update selectedSession - sessionStore already preserves references
  };


  return (
    <div className="fixed inset-0 flex bg-background">
      {/* Fixed Desktop Sidebar */}
      {!isMobile && (
        <DesktopSidebar
          sessions={sessions}
          selectedSession={selectedSession}
          onSessionSelect={handleSessionSelect}
          onNewSession={handleNewSession}
          onSessionDelete={handleSessionDelete}
          isLoading={isLoadingSessions}
          onRefresh={handleSidebarRefresh}
          onShowSettings={() => setShowSettings(true)}
          updateAvailable={updateAvailable}
          latestVersion={latestVersion}
          currentVersion={currentVersion}
          releaseInfo={releaseInfo}
          onShowVersionModal={() => setShowVersionModal(true)}
          isPWA={isPWA}
          isMobile={isMobile}
        />
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && (
        <MobileSidebarOverlay
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sessions={sessions}
          selectedSession={selectedSession}
          onSessionSelect={handleSessionSelect}
          onNewSession={handleNewSession}
          onSessionDelete={handleSessionDelete}
          isLoading={isLoadingSessions}
          onRefresh={handleSidebarRefresh}
          onShowSettings={() => setShowSettings(true)}
          updateAvailable={updateAvailable}
          latestVersion={latestVersion}
          currentVersion={currentVersion}
          releaseInfo={releaseInfo}
          onShowVersionModal={() => setShowVersionModal(true)}
          isPWA={isPWA}
          isMobile={isMobile}
        />
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${isMobile && !isInputFocused ? 'pb-16' : ''}`}>
        <MainContent
          selectedProject={project}
          selectedSession={selectedSession}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          ws={useConnectionStore.getState().ws}
          sendMessage={sendMessage}
          messages={useMessageStore.getState().recentMessages}
          isMobile={isMobile}
          isPWA={isPWA}
          onMenuClick={() => setSidebarOpen(true)}
          isLoading={isLoadingSessions}
          onInputFocusChange={setIsInputFocused}
          onSessionActive={markSessionActive}
          onSessionInactive={markSessionInactive}
          onSessionProcessing={markSessionProcessing}
          onSessionNotProcessing={markSessionNotProcessing}
          processingSessions={processingSessions}
          onNavigateToSession={(sessionId) => navigate(`/session/${sessionId}`)}
          onShowSettings={() => setShowSettings(true)}
          autoExpandTools={autoExpandTools}
          showRawParameters={showRawParameters}
          showThinking={showThinking}
          autoScrollToBottom={autoScrollToBottom}
          sendByCtrlEnter={sendByCtrlEnter}
          externalMessageUpdate={externalMessageUpdate}
        />
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isInputFocused={isInputFocused}
        />
      )}

      {/* All Modals */}
      <AppModals
        showSettings={showSettings}
        onCloseSettings={() => setShowSettings(false)}
        projects={project ? [project] : []}
        settingsInitialTab={settingsInitialTab}
        showVersionModal={showVersionModal}
        onCloseVersionModal={() => setShowVersionModal(false)}
        currentVersion={currentVersion}
        latestVersion={latestVersion}
        releaseInfo={releaseInfo}
        showQuickSettings={showQuickSettings}
        onToggleQuickSettings={setShowQuickSettings}
        activeTab={activeTab}
        isMobile={isMobile}
      />
    </div>
  );
}

// Root App component with router
function App() {
  return (
    <ThemeProvider>
      <ProtectedRoute>
        <Router>
          <Routes>
            <Route path="/" element={<AppContent />} />
            <Route path="/session/:sessionId" element={<AppContent />} />
          </Routes>
        </Router>
      </ProtectedRoute>
    </ThemeProvider>
  );
}

export default App;
