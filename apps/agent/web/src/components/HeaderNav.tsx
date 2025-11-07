/**
 * HeaderNav - Top navigation bar with session title and tab switching
 * Adapted from agent-ui MainContent.tsx header section
 */

import React from "react";
import AgentLogo from "~/components/AgentLogo";
import type { Session, ProjectInfo } from "~/types";

export type TabType = "chat" | "shell" | "files";

interface HeaderNavProps {
  selectedProject: ProjectInfo | null;
  selectedSession: Session | null;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export function HeaderNav({
  selectedProject,
  selectedSession,
  activeTab,
  onTabChange,
  onMenuClick,
  isMobile = false,
}: HeaderNavProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 sm:p-4 flex-shrink-0">
      <div className="flex items-center justify-between relative">
        {/* Left Side: Menu + Session Title */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Mobile Menu Button */}
          {isMobile && onMenuClick && (
            <button
              onClick={onMenuClick}
              onTouchStart={(e) => {
                e.preventDefault();
                onMenuClick();
              }}
              className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 touch-manipulation active:scale-95"
              title="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}

          {/* Session Title Display */}
          <div className="min-w-0 flex items-center gap-2">
            {/* Agent Logo (only show in chat tab with session) */}
            {/* {activeTab === "chat" && selectedSession && (
              <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                <AgentLogo className="w-5 h-5" />
              </div>
            )} */}

            <div className="flex-1 min-w-0">
              {activeTab === "chat" && selectedSession ? (
                // Chat with active session
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {selectedSession.title || selectedSession.summary || "New Session"}
                  </h2>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {selectedProject?.name}{" "}
                    <span className="hidden sm:inline">• {selectedSession.id}</span>
                  </div>
                </div>
              ) : activeTab === "chat" && !selectedSession ? (
                // Chat without session
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    New Session
                  </h2>
                  {selectedProject && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {selectedProject.name}
                    </div>
                  )}
                </div>
              ) : (
                // Other tabs
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    {activeTab === "files"
                      ? "Project Files"
                      : activeTab === "shell"
                        ? "Shell"
                        : "Project"}
                  </h2>
                  {selectedProject && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {selectedProject.name}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Tab Navigation */}
        <div className="flex-shrink-0 hidden sm:block">
          <div className="relative flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {/* Chat Tab */}
            <button
              onClick={() => onTabChange("chat")}
              className={`relative px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === "chat"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
              title="Chat"
            >
              <span className="flex items-center gap-1 sm:gap-1.5">
                <svg
                  className="w-3 sm:w-3.5 h-3 sm:h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span className="hidden md:hidden lg:inline">Chat</span>
              </span>
            </button>

            {/* Shell Tab */}
            <button
              onClick={() => onTabChange("shell")}
              className={`relative px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === "shell"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
              title="Shell"
            >
              <span className="flex items-center gap-1 sm:gap-1.5">
                <svg
                  className="w-3 sm:w-3.5 h-3 sm:h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <span className="hidden md:hidden lg:inline">Shell</span>
              </span>
            </button>

            {/* Files Tab */}
            <button
              onClick={() => onTabChange("files")}
              className={`relative px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === "files"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
              title="Files"
            >
              <span className="flex items-center gap-1 sm:gap-1.5">
                <svg
                  className="w-3 sm:w-3.5 h-3 sm:h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <span className="hidden md:hidden lg:inline">Files</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeaderNav;
