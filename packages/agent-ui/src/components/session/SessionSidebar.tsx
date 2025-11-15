import * as React from "react";
import { SessionSearchBar } from "./SessionSearchBar";
import { SessionList, type SessionListProps } from "./SessionList";
import { AppHeader } from "../ui/AppHeader";
import { MessageSquare } from "lucide-react";

export interface SessionSidebarProps extends Omit<SessionListProps, "searchQuery"> {
  /**
   * Application title
   */
  title?: string;
  /**
   * Logo element
   */
  logo?: React.ReactNode;
  /**
   * Initial search value
   */
  initialSearch?: string;
  /**
   * Callback when new session is created
   */
  onCreate?: () => void;
  /**
   * Callback when sessions are refreshed
   */
  onRefresh?: () => void;
  /**
   * Callback when search value changes
   */
  onSearchChange?: (value: string) => void;
  /**
   * Whether refresh is in progress
   */
  isRefreshing?: boolean;
  /**
   * Whether running as PWA
   */
  isPWA?: boolean;
}

/**
 * SessionSidebar - Complete session management sidebar
 *
 * A composite component that combines AppHeader, SessionSearchBar, and SessionList
 * to provide a complete session management interface.
 *
 * @example
 * ```tsx
 * <SessionSidebar
 *   title="Deepractice Agent"
 *   sessions={sessions}
 *   selectedId={currentSession?.id}
 *   isLoading={isLoading}
 *   onSelect={(session) => setCurrentSession(session)}
 *   onDelete={(id) => deleteSession(id)}
 *   onCreate={createNewSession}
 *   onRefresh={refreshSessions}
 *   isRefreshing={isRefreshing}
 * />
 * ```
 */
export const SessionSidebar = React.forwardRef<HTMLDivElement, SessionSidebarProps>(
  (
    {
      title = "Deepractice Agent",
      logo = <MessageSquare className="w-4 h-4" />,
      sessions,
      selectedId,
      isLoading = false,
      initialSearch = "",
      isMobile = false,
      isPWA = false,
      onSelect,
      onDelete,
      onCreate,
      onRefresh,
      onSearchChange,
      isRefreshing = false,
    },
    ref
  ) => {
    const [searchQuery, setSearchQuery] = React.useState(initialSearch);

    const handleSearchChange = (value: string) => {
      setSearchQuery(value);
      onSearchChange?.(value);
    };

    return (
      <div
        ref={ref}
        className="h-full flex flex-col bg-card md:select-none"
        style={isPWA && isMobile ? { paddingTop: "44px" } : undefined}
      >
        {/* Header */}
        <>
          <AppHeader logo={logo} title={title} />
          <AppHeader logo={logo} title={title} isMobile isPWA={isPWA} />
        </>

        {/* Search Bar */}
        <SessionSearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          onCreate={onCreate}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          isLoading={isLoading}
          isMobile={isMobile}
        />

        {/* Session List */}
        <SessionList
          sessions={sessions}
          selectedId={selectedId}
          isLoading={isLoading}
          searchQuery={searchQuery}
          isMobile={isMobile}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      </div>
    );
  }
);

SessionSidebar.displayName = "SessionSidebar";
