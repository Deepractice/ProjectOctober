import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionStore } from "~/stores/sessionStore";
import { SidebarHeader } from "./SidebarHeader";
import { SessionSearchBar } from "./SessionSearchBar";
import { SessionList } from "./SessionList";
import type { Session } from "~/types";

interface SidebarProps {
  isMobile?: boolean;
  isPWA?: boolean;
}

export function Sidebar({ isMobile = false, isPWA = false }: SidebarProps) {
  const navigate = useNavigate();
  const [searchFilter, setSearchFilter] = useState("");

  // Get session state from store
  const sessions = useSessionStore((state) => state.sessions);
  const selectedSession = useSessionStore((state) => state.selectedSession);
  const isLoading = useSessionStore((state) => state.isLoading);

  // Get session actions from store
  const createNewSession = useSessionStore((state) => state.createNewSession);
  const selectSession = useSessionStore((state) => state.selectSession);
  const deleteSession = useSessionStore((state) => state.deleteSession);
  const refreshSessions = useSessionStore((state) => state.refreshSessions);

  // Session action handlers
  const handleNewSession = async () => {
    try {
      const sessionId = await createNewSession();
      // Navigate to new session
      navigate(`/session/${sessionId}`);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const handleSessionSelect = async (session: Session) => {
    try {
      console.log("[Sidebar] Selecting session:", session.id);
      await selectSession(session.id);
      // Navigate to session
      navigate(`/session/${session.id}`);
    } catch (error) {
      console.error("Failed to select session:", error);
    }
  };

  const handleSessionDelete = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
    } catch (error) {
      console.error("Failed to delete session:", error);
      throw error;
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshSessions();
    } catch (error) {
      console.error("Failed to refresh sessions:", error);
    }
  };

  return (
    <div
      className="h-full flex flex-col bg-card md:select-none"
      style={isPWA && isMobile ? { paddingTop: "44px" } : {}}
    >
      <SidebarHeader isMobile={isMobile} isPWA={isPWA} />

      <SessionSearchBar
        searchFilter={searchFilter}
        onSearchChange={setSearchFilter}
        onNewSession={handleNewSession}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        isMobile={isMobile}
      />

      <SessionList
        sessions={sessions}
        selectedSession={selectedSession}
        isLoading={isLoading}
        searchFilter={searchFilter}
        onSessionSelect={handleSessionSelect}
        onSessionDelete={handleSessionDelete}
        onNewSession={handleNewSession}
        isMobile={isMobile}
      />
    </div>
  );
}

export default Sidebar;
