import React, { useState, useEffect } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

import { MessageSquare, Clock, Trash2, Settings, RefreshCw, Search, X } from 'lucide-react';
import { cn } from '../lib/utils';
import AgentLogo from './AgentLogo';
import { api } from '../utils/api';

// Move formatTimeAgo outside component to avoid recreation on every render
const formatTimeAgo = (dateString, currentTime) => {
  const date = new Date(dateString);
  const now = currentTime;

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Unknown';
  }

  const diffInMs = now.getTime() - date.getTime();
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
  sessions,
  selectedSession,
  onSessionSelect,
  onNewSession,
  onSessionDelete,
  isLoading,
  onRefresh,
  onShowSettings,
  updateAvailable,
  latestVersion,
  currentVersion,
  releaseInfo,
  onShowVersionModal,
  isPWA,
  isMobile,
  onToggleSidebar
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [deletingSessionId, setDeletingSessionId] = useState(null);

  // Touch handler to prevent double-tap issues on iPad (only for buttons, not scroll areas)
  const handleTouchClick = (callback) => {
    return (e) => {
      // Only prevent default for buttons/clickable elements, not scrollable areas
      if (e.target.closest('.overflow-y-auto') || e.target.closest('[data-scroll-container]')) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      callback();
    };
  };

  // Auto-update timestamps every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every 60 seconds

    return () => clearInterval(timer);
  }, []);

  const deleteSession = async (sessionId) => {
    // Prevent duplicate calls
    if (deletingSessionId === sessionId) {
      console.log('⚠️ Delete already in progress for session:', sessionId);
      return;
    }

    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    // Mark as deleting
    setDeletingSessionId(sessionId);

    try {
      const response = await api.deleteSession(sessionId);

      if (response.ok) {
        // Call parent callback if provided
        if (onSessionDelete) {
          onSessionDelete(sessionId);
        }
      } else {
        console.error('Failed to delete session');
        alert('Failed to delete session. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Error deleting session. Please try again.');
    } finally {
      // Clear deleting state
      setDeletingSessionId(null);
    }
  };

  // Filter sessions based on search input
  const filteredSessions = (sessions || []).filter(session => {
    if (!searchFilter.trim()) return true;

    const searchLower = searchFilter.toLowerCase();
    const sessionName = (session.summary || 'New Session').toLowerCase();

    return sessionName.includes(searchLower);
  });

  // Sort sessions by most recent activity
  const sortedSessions = [...filteredSessions].sort((a, b) =>
    new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  );

  return (
    <div
      className="h-full flex flex-col bg-card md:select-none"
      style={isPWA && isMobile ? { paddingTop: '44px' } : {}}
    >
      {/* Header */}
      <div className="md:p-4 md:border-b md:border-border">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Agent UI</h1>
              <p className="text-sm text-muted-foreground">AI coding assistant interface</p>
            </div>
          </div>
          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 px-0 hover:bg-accent transition-colors duration-200"
              onClick={onToggleSidebar}
              title="Hide sidebar"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
          )}
        </div>

        {/* Mobile Header */}
        <div
          className="md:hidden p-3 border-b border-border"
          style={isPWA && isMobile ? { paddingTop: '16px' } : {}}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Agent UI</h1>
                <p className="text-sm text-muted-foreground">Sessions</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="w-8 h-8 rounded-md bg-background border border-border flex items-center justify-center active:scale-95 transition-all duration-150"
                onClick={async () => {
                  setIsRefreshing(true);
                  try {
                    await onRefresh();
                  } finally {
                    setIsRefreshing(false);
                  }
                }}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 text-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Filter and Actions */}
      {!isLoading && (
        <div className="px-3 md:px-4 py-2 border-b border-border space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search sessions..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-9 h-9 text-sm bg-muted/50 border-0 focus:bg-background focus:ring-1 focus:ring-primary/20"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
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
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''} group-hover:rotate-180 transition-transform duration-300`} />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Sessions List */}
      <ScrollArea className="flex-1 md:px-2 md:py-3 overflow-y-auto overscroll-contain">
        <div className="md:space-y-1 pb-safe-area-inset-bottom">
          {isLoading ? (
            <div className="text-center py-12 md:py-8 px-4">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4 md:mb-3">
                <div className="w-6 h-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              </div>
              <h3 className="text-base font-medium text-foreground mb-2 md:mb-1">Loading sessions...</h3>
              <p className="text-sm text-muted-foreground">
                Fetching your Agent sessions
              </p>
            </div>
          ) : sortedSessions.length === 0 ? (
            <div className="text-center py-12 md:py-8 px-4">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4 md:mb-3">
                <MessageSquare className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-medium text-foreground mb-2 md:mb-1">
                {searchFilter ? 'No matching sessions' : 'No sessions found'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchFilter ? 'Try adjusting your search term' : 'Create a new session to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {sortedSessions.map((session) => {
                // Calculate if session is active (within last 10 minutes)
                const sessionDate = new Date(session.lastActivity);
                const diffInMinutes = Math.floor((currentTime.getTime() - sessionDate.getTime()) / (1000 * 60));
                const isActive = diffInMinutes < 10;

                // Get session display values
                const sessionName = session.summary || 'New Session';
                const sessionTime = session.lastActivity;
                const messageCount = session.messageCount || 0;

                return (
                  <div key={session.id} className="group relative">
                    {/* Active session indicator dot */}
                    {isActive && (
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      </div>
                    )}

                    {/* Mobile Session Item */}
                    <div className="md:hidden">
                      <div
                        className={cn(
                          "p-3 mx-3 my-1 rounded-lg bg-card border border-border/50 active:scale-[0.98] transition-all duration-150",
                          selectedSession?.id === session.id && "bg-primary/5 border-primary/20",
                          isActive && selectedSession?.id !== session.id && "border-green-500/30 bg-green-50/5 dark:bg-green-900/5"
                        )}
                        onClick={() => onSessionSelect(session)}
                        onTouchEnd={handleTouchClick(() => onSessionSelect(session))}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0",
                            selectedSession?.id === session.id ? "bg-primary/10" : "bg-muted/50"
                          )}>
                            <AgentLogo className="w-3 h-3" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium truncate text-foreground">
                              {sessionName}
                            </div>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(session.id);
                            }}
                            onTouchEnd={handleTouchClick(() => deleteSession(session.id))}
                            disabled={deletingSessionId === session.id}
                          >
                            {deletingSessionId === session.id ? (
                              <div className="w-2.5 h-2.5 animate-spin rounded-full border border-red-600 dark:border-red-400 border-t-transparent" />
                            ) : (
                              <Trash2 className="w-2.5 h-2.5 text-red-600 dark:text-red-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Session Item */}
                    <div className="hidden md:block">
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start p-2 h-auto font-normal text-left hover:bg-accent/50 transition-colors duration-200",
                          selectedSession?.id === session.id && "bg-accent text-accent-foreground"
                        )}
                        onClick={() => onSessionSelect(session)}
                      >
                        <div className="flex items-start gap-2 min-w-0 w-full">
                          <AgentLogo className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium truncate text-foreground">
                              {sessionName}
                            </div>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                          disabled={deletingSessionId === session.id}
                          title="Delete this session permanently"
                        >
                          {deletingSessionId === session.id ? (
                            <div className="w-3 h-3 animate-spin rounded-full border border-red-600 dark:border-red-400 border-t-transparent" />
                          ) : (
                            <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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

      {/* Version Update Notification */}
      {updateAvailable && (
        <div className="md:p-2 border-t border-border/50 flex-shrink-0">
          {/* Desktop Version Notification */}
          <div className="hidden md:block">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 p-3 h-auto font-normal text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200 border border-blue-200 dark:border-blue-700 rounded-lg mb-2"
              onClick={onShowVersionModal}
            >
              <div className="relative">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {releaseInfo?.title || `Version ${latestVersion}`}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">Update available</div>
              </div>
            </Button>
          </div>

          {/* Mobile Version Notification */}
          <div className="md:hidden p-3 pb-2">
            <button
              className="w-full h-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl flex items-center justify-start gap-3 px-4 active:scale-[0.98] transition-all duration-150"
              onClick={onShowVersionModal}
            >
              <div className="relative">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {releaseInfo?.title || `Version ${latestVersion}`}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">Update available</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Settings Section */}
      <div className="md:p-2 md:border-t md:border-border flex-shrink-0">
        {/* Mobile Settings */}
        <div className="md:hidden p-4 pb-20 border-t border-border/50">
          <button
            className="w-full h-14 bg-muted/50 hover:bg-muted/70 rounded-2xl flex items-center justify-start gap-4 px-4 active:scale-[0.98] transition-all duration-150"
            onClick={onShowSettings}
          >
            <div className="w-10 h-10 rounded-2xl bg-background/80 flex items-center justify-center">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-lg font-medium text-foreground">Settings</span>
          </button>
        </div>

        {/* Desktop Settings */}
        <Button
          variant="ghost"
          className="hidden md:flex w-full justify-start gap-2 p-2 h-auto font-normal text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200"
          onClick={onShowSettings}
        >
          <Settings className="w-3 h-3" />
          <span className="text-xs">Settings</span>
        </Button>
      </div>
    </div>
  );
}

export default Sidebar;
