import * as React from "react";
import { Clock, Trash2 } from "lucide-react";
import { ListItem } from "../ui/ListItem";
import { TimeAgo } from "../ui/TimeAgo";
import { Badge } from "../ui/Badge";
import { AgentLogo } from "../ui/AgentLogo";

export interface SessionData {
  id: string;
  summary?: string;
  lastActivity: string;
  messageCount?: number;
}

export interface SessionItemProps {
  /**
   * Session data
   */
  session: SessionData;
  /**
   * Whether this session is selected
   */
  selected?: boolean;
  /**
   * Whether this session is active (within last 10 minutes)
   * If not provided, will be calculated automatically
   */
  active?: boolean;
  /**
   * Whether in mobile mode
   */
  isMobile?: boolean;
  /**
   * Callback when session is selected
   */
  onSelect?: (session: SessionData) => void;
  /**
   * Callback when session is deleted
   */
  onDelete?: (sessionId: string) => void;
}

/**
 * SessionItem - Display a single session in a list
 *
 * A composite component that combines ListItem, TimeAgo, Badge, and AgentLogo
 * to display session information. Stateless - all data and handlers come from props.
 *
 * @example
 * ```tsx
 * <SessionItem
 *   session={{
 *     id: "123",
 *     summary: "Planning Meeting",
 *     lastActivity: "2025-01-14T10:30:00Z",
 *     messageCount: 5
 *   }}
 *   selected={selectedId === "123"}
 *   onSelect={(session) => setSelected(session.id)}
 *   onDelete={(id) => deleteSession(id)}
 * />
 * ```
 */
export const SessionItem = React.forwardRef<HTMLDivElement, SessionItemProps>(
  ({ session, selected = false, active, isMobile = false, onSelect, onDelete }, ref) => {
    const [isDeleting, setIsDeleting] = React.useState(false);

    // Calculate active state if not provided
    const isActive = React.useMemo(() => {
      if (active !== undefined) return active;
      const sessionDate = new Date(session.lastActivity);
      const diffInMinutes = (Date.now() - sessionDate.getTime()) / (1000 * 60);
      return diffInMinutes < 10;
    }, [active, session.lastActivity]);

    const handleDelete = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!onDelete || isDeleting) return;

      setIsDeleting(true);
      try {
        await onDelete(session.id);
      } catch (error) {
        console.error("Failed to delete session:", error);
      } finally {
        setIsDeleting(false);
      }
    };

    return (
      <ListItem
        ref={ref}
        leading={<AgentLogo className="w-3 h-3" />}
        title={session.summary || "New Session"}
        subtitle={
          <div className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-muted-foreground" />
            <TimeAgo date={session.lastActivity} className="text-xs text-muted-foreground" />
          </div>
        }
        trailing={
          session.messageCount && session.messageCount > 0 ? (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              {session.messageCount}
            </Badge>
          ) : undefined
        }
        actions={
          onDelete ? (
            <button
              className="w-6 h-6 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded flex items-center justify-center"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete this session"
            >
              {isDeleting ? (
                <div className="w-3 h-3 animate-spin rounded-full border border-red-600 dark:border-red-400 border-t-transparent" />
              ) : (
                <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
              )}
            </button>
          ) : undefined
        }
        selected={selected}
        active={isActive}
        showActiveIndicator
        isMobile={isMobile}
        onClick={onSelect ? () => onSelect(session) : undefined}
      />
    );
  }
);

SessionItem.displayName = "SessionItem";
