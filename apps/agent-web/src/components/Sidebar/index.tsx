import { useState } from "react";
import { useSessionStore } from "~/stores/sessionStore";
import { eventBus } from "~/core/eventBus";
import { SidebarHeader } from "./SidebarHeader";
import { SessionSearchBar } from "./SessionSearchBar";
import { SessionList } from "./SessionList";
import type { Session } from "~/types";

interface SidebarProps {
  isMobile?: boolean;
  isPWA?: boolean;
}

export function Sidebar({ isMobile = false, isPWA = false }: SidebarProps) {
  const [searchFilter, setSearchFilter] = useState("");

  // Get session state from store
  const sessions = useSessionStore((state) => state.sessions);
  const selectedSession = useSessionStore((state) => state.selectedSession);
  const isLoading = useSessionStore((state) => state.isLoading);

  // Session actions
  const handleNewSession = async () => {
    try {
      // Emit event to create new session
      eventBus.emit({ type: "session.create" });
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const handleSessionSelect = (session: Session) => {
    // Emit event to select session
    eventBus.emit({ type: "session.selected", sessionId: session.id });
  };

  const handleSessionDelete = async (sessionId: string) => {
    try {
      // Emit event to delete session
      eventBus.emit({ type: "session.delete", sessionId });
    } catch (error) {
      console.error("Failed to delete session:", error);
      throw error;
    }
  };

  const handleRefresh = async () => {
    try {
      // Emit event to refresh sessions
      eventBus.emit({ type: "session.refresh" });
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
