import * as React from "react";
import { MessageSquare, RefreshCw } from "lucide-react";
import { SearchInput } from "../ui/SearchInput";
import { ActionBar } from "../ui/ActionBar";

export interface SessionSearchBarProps {
  /**
   * Current search value
   */
  value: string;
  /**
   * Callback when search value changes
   */
  onChange: (value: string) => void;
  /**
   * Callback when new session button is clicked
   */
  onCreate?: () => void;
  /**
   * Callback when refresh button is clicked
   */
  onRefresh?: () => void;
  /**
   * Whether refresh is in progress
   */
  isRefreshing?: boolean;
  /**
   * Whether the list is loading (hides the bar)
   */
  isLoading?: boolean;
  /**
   * Whether in mobile mode
   */
  isMobile?: boolean;
}

/**
 * SessionSearchBar - Search input with action buttons for sessions
 *
 * A composite component that combines SearchInput and ActionBar to provide
 * session search and management actions (new session, refresh).
 *
 * @example
 * ```tsx
 * <SessionSearchBar
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   onCreate={handleCreateSession}
 *   onRefresh={handleRefresh}
 *   isRefreshing={isRefreshing}
 * />
 * ```
 */
export const SessionSearchBar = React.forwardRef<HTMLDivElement, SessionSearchBarProps>(
  (
    {
      value,
      onChange,
      onCreate,
      onRefresh,
      isRefreshing = false,
      isLoading = false,
      isMobile = false,
    },
    ref
  ) => {
    if (isLoading) {
      return null;
    }

    return (
      <div ref={ref} className="px-3 md:px-4 py-2 border-b border-border space-y-2">
        {/* Search Input */}
        <SearchInput
          value={value}
          onChange={onChange}
          placeholder="Search sessions..."
          className="bg-muted/50 border-0 focus:bg-background focus:ring-1 focus:ring-primary/20"
        />

        {/* Action Buttons - Desktop only */}
        {!isMobile && (
          <ActionBar>
            <ActionBar.Primary onClick={onCreate}>
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              New Session
            </ActionBar.Primary>
            <ActionBar.Icon onClick={onRefresh} loading={isRefreshing} title="Refresh sessions">
              <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-300" />
            </ActionBar.Icon>
          </ActionBar>
        )}
      </div>
    );
  }
);

SessionSearchBar.displayName = "SessionSearchBar";
