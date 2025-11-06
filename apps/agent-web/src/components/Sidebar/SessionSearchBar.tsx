import { useState } from "react";
import { MessageSquare, RefreshCw, Search, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

interface SessionSearchBarProps {
  searchFilter: string;
  onSearchChange: (value: string) => void;
  onNewSession: () => void;
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
  isMobile?: boolean;
}

export function SessionSearchBar({
  searchFilter,
  onSearchChange,
  onNewSession,
  onRefresh,
  isLoading = false,
  isMobile = false,
}: SessionSearchBarProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="px-3 md:px-4 py-2 border-b border-border space-y-2">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search sessions..."
          value={searchFilter}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 text-sm bg-muted/50 border-0 focus:bg-background focus:ring-1 focus:ring-primary/20"
        />
        {searchFilter && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-accent rounded"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Action Buttons - Desktop only */}
      {!isMobile && (
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1 h-8 text-xs bg-primary hover:bg-primary/90 transition-all duration-200"
            onClick={onNewSession}
            title="Create new session"
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
            New Session
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 px-0 hover:bg-accent transition-colors duration-200 group"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh sessions"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""} group-hover:rotate-180 transition-transform duration-300`}
            />
          </Button>
        </div>
      )}
    </div>
  );
}
