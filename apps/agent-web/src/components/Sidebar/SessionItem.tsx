import { useState } from "react";
import { Clock, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import AgentLogo from "~/components/AgentLogo";
import { cn } from "~/lib/utils";
import type { Session } from "~/types";

// Time ago formatting helper
const formatTimeAgo = (dateString: string, currentTime: Date): string => {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return "Unknown";
  }

  const diffInMs = currentTime.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInSeconds < 60) return "Just now";
  if (diffInMinutes === 1) return "1 min ago";
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
  if (diffInHours === 1) return "1 hour ago";
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  if (diffInDays === 1) return "1 day ago";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  return date.toLocaleDateString();
};

interface SessionItemProps {
  session: Session;
  isSelected: boolean;
  currentTime: Date;
  onSelect: (session: Session) => void;
  onDelete: (sessionId: string) => Promise<void>;
  isMobile?: boolean;
}

export function SessionItem({
  session,
  isSelected,
  currentTime,
  onSelect,
  onDelete,
  isMobile = false,
}: SessionItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isDeleting) {
      console.log("⚠️ Delete already in progress for session:", session.id);
      return;
    }

    setIsDeleting(true);

    try {
      await onDelete(session.id);
    } catch (error) {
      console.error("Error deleting session:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Touch handler to prevent double-tap issues on iPad
  const handleTouchClick = (callback: () => void) => {
    return (e: React.TouchEvent) => {
      if (
        (e.target as HTMLElement).closest(".overflow-y-auto") ||
        (e.target as HTMLElement).closest("[data-scroll-container]")
      ) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      callback();
    };
  };

  // Calculate if session is active (within last 10 minutes)
  const sessionDate = new Date(session.lastActivity);
  const diffInMinutes = Math.floor((currentTime.getTime() - sessionDate.getTime()) / (1000 * 60));
  const isActive = diffInMinutes < 10;

  const sessionName = session.summary || "New Session";
  const sessionTime = session.lastActivity;
  const messageCount = session.messageCount || 0;

  return (
    <div className="group relative">
      {/* Active session indicator dot */}
      {isActive && (
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      )}

      {/* Mobile Session Item */}
      {isMobile && (
        <div
          className={cn(
            "p-3 mx-3 my-1 rounded-lg bg-card border border-border/50 active:scale-[0.98] transition-all duration-150",
            isSelected && "bg-primary/5 border-primary/20",
            isActive && !isSelected && "border-green-500/30 bg-green-50/5 dark:bg-green-900/5"
          )}
          onTouchEnd={handleTouchClick(() => onSelect(session))}
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0",
                isSelected ? "bg-primary/10" : "bg-muted/50"
              )}
            >
              <AgentLogo className="w-3 h-3" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium truncate text-foreground">{sessionName}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(sessionTime, currentTime)}
                </span>
                {messageCount > 0 && (
                  <Badge variant="secondary" className="text-xs px-1 py-0 ml-auto">
                    {messageCount}
                  </Badge>
                )}
              </div>
            </div>
            {/* Mobile delete button */}
            <button
              className="w-5 h-5 rounded-md bg-red-50 dark:bg-red-900/20 flex items-center justify-center active:scale-95 transition-transform opacity-70 ml-1"
              onTouchStart={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onTouchEnd={(e) => handleDelete(e)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="w-2.5 h-2.5 animate-spin rounded-full border border-red-600 dark:border-red-400 border-t-transparent" />
              ) : (
                <Trash2 className="w-2.5 h-2.5 text-red-600 dark:text-red-400" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Desktop Session Item */}
      {!isMobile && (
        <>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start p-2 h-auto font-normal text-left hover:bg-accent/50 transition-colors duration-200",
              isSelected && "bg-accent text-accent-foreground"
            )}
            onClick={() => onSelect(session)}
          >
            <div className="flex items-start gap-2 min-w-0 w-full">
              <AgentLogo className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium truncate text-foreground">{sessionName}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(sessionTime, currentTime)}
                  </span>
                  {messageCount > 0 && (
                    <Badge variant="secondary" className="text-xs px-1 py-0 ml-auto">
                      {messageCount}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Button>
          {/* Desktop hover delete button */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              className="w-6 h-6 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded flex items-center justify-center"
              onClick={(e) => handleDelete(e)}
              disabled={isDeleting}
              title="Delete this session permanently"
            >
              {isDeleting ? (
                <div className="w-3 h-3 animate-spin rounded-full border border-red-600 dark:border-red-400 border-t-transparent" />
              ) : (
                <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
