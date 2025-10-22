import React, { useState, useEffect } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { MessageSquare, Clock, RefreshCw, Settings, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

// Format time ago helper
const formatTimeAgo = (dateString, currentTime) => {
  const date = new Date(dateString);
  const now = currentTime;

  if (isNaN(date.getTime())) {
    return 'Unknown';
  }

  const diffInMs = now - date;
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInSeconds < 60) return 'Just now';
  if (diffInMinutes === 1) return '1 min ago';
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
  if (diffInHours === 1) return '1 hour ago';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  if (diffInDays === 1) return '1 day ago';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  return date.toLocaleDateString();
};

function Sidebar({
  projects,
  selectedProject,
  selectedSession,
  onSessionSelect,
  onNewSession,
  onRefresh,
  onShowSettings,
  isPWA,
  isMobile
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Get sessions from the fixed project
  const sessions = selectedProject?.sessions || [];

  return (
    <div
      className="h-full flex flex-col bg-card md:select-none"
      style={isPWA && isMobile ? { paddingTop: '44px' } : {}}
    >
      {/* Header */}
      <div className="md:p-4 md:border-b md:border-border">
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Claude Code UI</h1>
              <p className="text-sm text-muted-foreground">Session History</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 px-0 hover:bg-accent transition-colors duration-200 group"
              onClick={async () => {
                setIsRefreshing(true);
                try {
                  await onRefresh();
                } finally {
                  setIsRefreshing(false);
                }
              }}
              disabled={isRefreshing}
              title="Refresh sessions"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 px-0"
              onClick={onShowSettings}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* New Session Button */}
      <div className="p-3 border-b border-border">
        <Button
          variant="default"
          className="w-full justify-center gap-2"
          onClick={onNewSession}
        >
          <Plus className="w-4 h-4" />
          New Session
        </Button>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No sessions yet</p>
              <p className="text-xs text-muted-foreground mt-1">Click "New Session" to start</p>
            </div>
          ) : (
            sessions.map((session) => {
              const isSelected = selectedSession?.id === session.id;
              const sessionTitle = session.title || session.summary || 'Untitled Session';

              return (
                <Button
                  key={session.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start p-3 h-auto font-normal hover:bg-accent/50 text-left",
                    isSelected && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => onSessionSelect({ ...session, __provider: 'claude' })}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                      isSelected ? "bg-primary/20" : "bg-muted"
                    )}>
                      <MessageSquare className={cn(
                        "w-4 h-4",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {sessionTitle}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(session.updated_at || session.created_at, currentTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default Sidebar;
