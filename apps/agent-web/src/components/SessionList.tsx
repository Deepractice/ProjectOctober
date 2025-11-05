/**
 * Session List Component
 * Displays all sessions with CRUD operations
 */

import { useSessionStore } from "~/stores/sessionStore";
import { createSession, deleteSession } from "~/api/agent";
import type { Session } from "~/types";

export function SessionList() {
  const sessions = useSessionStore((s) => s.sessions);
  const selectedSession = useSessionStore((s) => s.selectedSession);
  const setSelectedSession = useSessionStore((s) => s.setSelectedSession);

  const handleNewSession = async () => {
    try {
      const sessionId = await createSession();
      console.log("[SessionList] New session created:", sessionId);
    } catch (error) {
      console.error("[SessionList] Failed to create session:", error);
      // TODO: Show error toast
    }
  };

  const handleSelectSession = (session: Session) => {
    setSelectedSession(session);
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteSession(sessionId);
      console.log("[SessionList] Session deleted:", sessionId);
    } catch (error) {
      console.error("[SessionList] Failed to delete session:", error);
      // TODO: Show error toast
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <button
          onClick={handleNewSession}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          + New Session
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No sessions yet. Create one to start chatting.
          </div>
        ) : (
          <ul className="p-2 space-y-1">
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  onClick={() => handleSelectSession(session)}
                  className={`
                    w-full px-3 py-2 rounded-md text-left text-sm transition-colors
                    flex items-center justify-between group
                    ${
                      selectedSession?.id === session.id
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    }
                  `}
                >
                  <span className="truncate flex-1">
                    {session.title || `Session ${session.id.slice(0, 8)}`}
                  </span>
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 ml-2"
                    title="Delete session"
                  >
                    ×
                  </button>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border text-xs text-muted-foreground">
        {sessions.length} session{sessions.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
