import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { SessionItem } from "./SessionItem";
import type { Session } from "~/types";

interface SessionListProps {
  sessions: Session[];
  selectedSession: Session | null;
  isLoading: boolean;
  searchFilter: string;
  onSessionSelect: (session: Session) => void;
  onSessionDelete: (sessionId: string) => Promise<void>;
  onNewSession: () => void;
  isMobile?: boolean;
}

export function SessionList({
  sessions,
  selectedSession,
  isLoading,
  searchFilter,
  onSessionSelect,
  onSessionDelete,
  onNewSession,
  isMobile = false,
}: SessionListProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Auto-update timestamps every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every 60 seconds

    return () => clearInterval(timer);
  }, []);

  // Filter sessions based on search input
  const filteredSessions = sessions.filter((session) => {
    if (!searchFilter.trim()) return true;

    const searchLower = searchFilter.toLowerCase();
    const sessionName = (session.summary || "New Session").toLowerCase();

    return sessionName.includes(searchLower);
  });

  // Sort sessions by most recent activity
  const sortedSessions = [...filteredSessions].sort(
    (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  );

  return (
    <ScrollArea className="flex-1 md:px-2 md:py-3 overflow-y-auto overscroll-contain">
      <div className="md:space-y-1 pb-safe-area-inset-bottom">
        {isLoading ? (
          <div className="text-center py-12 md:py-8 px-4">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4 md:mb-3">
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-2 md:mb-1">
              Loading sessions...
            </h3>
            <p className="text-sm text-muted-foreground">Fetching your Agent sessions</p>
          </div>
        ) : sortedSessions.length === 0 ? (
          <div className="text-center py-12 md:py-8 px-4">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4 md:mb-3">
              <MessageSquare className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-2 md:mb-1">
              {searchFilter ? "No matching sessions" : "No sessions found"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchFilter
                ? "Try adjusting your search term"
                : "Create a new session to get started"}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {sortedSessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                isSelected={selectedSession?.id === session.id}
                currentTime={currentTime}
                onSelect={onSessionSelect}
                onDelete={onSessionDelete}
                isMobile={isMobile}
              />
            ))}
          </div>
        )}

        {/* New Session Button - Mobile floating button */}
        {isMobile && !isLoading && (
          <div className="px-3 py-3">
            <button
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg flex items-center justify-center gap-2 font-medium text-sm active:scale-[0.98] transition-all duration-150"
              onClick={onNewSession}
            >
              <MessageSquare className="w-4 h-4" />
              New Session
            </button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
