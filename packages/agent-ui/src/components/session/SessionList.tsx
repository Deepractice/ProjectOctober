import * as React from "react";
import { SessionItem, type SessionData } from "./SessionItem";
import { EmptyState } from "../ui/EmptyState";
import { LoadingState } from "../ui/LoadingState";
import { ScrollArea } from "../ui/ScrollArea";
import { MessageSquare } from "lucide-react";

export interface SessionListProps {
  /**
   * Array of sessions to display
   */
  sessions: SessionData[];
  /**
   * Currently selected session ID
   */
  selectedId?: string;
  /**
   * Whether the list is loading
   */
  isLoading?: boolean;
  /**
   * Search filter query
   */
  searchQuery?: string;
  /**
   * Whether in mobile mode
   */
  isMobile?: boolean;
  /**
   * Callback when a session is selected
   */
  onSelect?: (session: SessionData) => void;
  /**
   * Callback when a session is deleted
   */
  onDelete?: (sessionId: string) => void;
}

/**
 * SessionList - Display a list of sessions with loading and empty states
 *
 * A composite component that handles session list rendering, including:
 * - Loading state
 * - Empty state (no sessions / no search results)
 * - Filtered and sorted session list
 *
 * @example
 * ```tsx
 * <SessionList
 *   sessions={sessions}
 *   selectedId={currentSession?.id}
 *   isLoading={isLoading}
 *   searchQuery={searchFilter}
 *   onSelect={(session) => setCurrentSession(session)}
 *   onDelete={(id) => deleteSession(id)}
 * />
 * ```
 */
export const SessionList = React.forwardRef<HTMLDivElement, SessionListProps>(
  (
    {
      sessions,
      selectedId,
      isLoading = false,
      searchQuery = "",
      isMobile = false,
      onSelect,
      onDelete,
    },
    ref
  ) => {
    // Filter sessions based on search query
    const filteredSessions = React.useMemo(() => {
      if (!searchQuery.trim()) return sessions;

      const query = searchQuery.toLowerCase();
      return sessions.filter((session) => {
        const summary = (session.summary || "New Session").toLowerCase();
        return summary.includes(query);
      });
    }, [sessions, searchQuery]);

    // Sort sessions by most recent activity
    const sortedSessions = React.useMemo(() => {
      return [...filteredSessions].sort(
        (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );
    }, [filteredSessions]);

    return (
      <ScrollArea ref={ref} className="flex-1 md:px-2 md:py-3 overflow-y-auto overscroll-contain">
        <div className="md:space-y-1 pb-safe-area-inset-bottom">
          {isLoading ? (
            <LoadingState title="Loading sessions..." description="Fetching your Agent sessions" />
          ) : sortedSessions.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="w-6 h-6" />}
              title={searchQuery ? "No matching sessions" : "No sessions found"}
              description={
                searchQuery
                  ? "Try adjusting your search term"
                  : "Create a new session to get started"
              }
            />
          ) : (
            <div className="space-y-1">
              {sortedSessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  selected={selectedId === session.id}
                  isMobile={isMobile}
                  onSelect={onSelect}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    );
  }
);

SessionList.displayName = "SessionList";
