import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import MessageComponent from "~/components/MessageRenderer";
import type { ChatMessage, Session, ProjectInfo } from "~/types";

interface MessagesAreaProps {
  // Refs
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;

  // State
  isLoadingSessionMessages: boolean;
  chatMessages: ChatMessage[];
  selectedSession: Session | null;
  currentSessionId: string | null;
  provider: string;
  isLoadingMoreMessages: boolean;
  hasMoreMessages: boolean;
  totalMessages: number;
  sessionMessages: ChatMessage[];
  visibleMessageCount: number;
  visibleMessages: ChatMessage[];
  isLoading: boolean;

  // Functions/Callbacks
  setProvider: (provider: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  loadEarlierMessages: () => void;
  createDiff: (oldContent: string, newContent: string) => string;
  onFileOpen: (filePath: string) => void;
  onShowSettings: () => void;
  autoExpandTools: boolean;
  showRawParameters: boolean;
  showThinking: boolean;
  selectedProject: ProjectInfo;
}

function MessagesArea({
  // Refs
  scrollContainerRef,
  messagesEndRef,

  // State
  isLoadingSessionMessages,
  chatMessages,
  selectedSession: _selectedSession,
  currentSessionId,
  provider: _provider,
  isLoadingMoreMessages,
  hasMoreMessages,
  totalMessages,
  sessionMessages,
  visibleMessageCount,
  visibleMessages,
  isLoading,

  // Functions/Callbacks
  setProvider: _setProvider,
  textareaRef: _textareaRef,
  loadEarlierMessages,
  createDiff,
  onFileOpen,
  onShowSettings,
  autoExpandTools,
  showRawParameters,
  showThinking,
  selectedProject,
}: MessagesAreaProps) {
  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSessionId || "empty"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="max-w-4xl mx-auto px-4 py-3 sm:py-4 space-y-3 sm:space-y-4"
        >
          {isLoadingSessionMessages && chatMessages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                <p>Loading session messages...</p>
              </div>
            </div>
          ) : chatMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center px-6 sm:px-4 py-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Start a New Conversation
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Type your message below to start chatting with Agent
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Loading indicator for older messages */}
              {isLoadingMoreMessages && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-3">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                    <p className="text-sm">Loading older messages...</p>
                  </div>
                </div>
              )}

              {/* Indicator showing there are more messages to load */}
              {hasMoreMessages && !isLoadingMoreMessages && (
                <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-2 border-b border-gray-200 dark:border-gray-700">
                  {totalMessages > 0 && (
                    <span>
                      Showing {sessionMessages.length} of {totalMessages} messages •
                      <span className="text-xs">Scroll up to load more</span>
                    </span>
                  )}
                </div>
              )}

              {/* Legacy message count indicator (for non-paginated view) */}
              {!hasMoreMessages && chatMessages.length > visibleMessageCount && (
                <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-2 border-b border-gray-200 dark:border-gray-700">
                  Showing last {visibleMessageCount} messages ({chatMessages.length} total) •
                  <button
                    className="ml-1 text-blue-600 hover:text-blue-700 underline"
                    onClick={loadEarlierMessages}
                  >
                    Load earlier messages
                  </button>
                </div>
              )}

              {visibleMessages.map((message, index) => {
                const prevMessage = index > 0 ? visibleMessages[index - 1] : null;

                return (
                  <div key={message.id}>
                    <MessageComponent
                      message={message}
                      index={index}
                      prevMessage={prevMessage}
                      createDiff={createDiff}
                      onFileOpen={onFileOpen}
                      onShowSettings={onShowSettings}
                      autoExpandTools={autoExpandTools}
                      showRawParameters={showRawParameters}
                      showThinking={showThinking}
                      selectedProject={selectedProject}
                    />
                  </div>
                );
              })}
            </>
          )}

          {isLoading && (
            <div className="chat-message assistant">
              <div className="w-full">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                    🤖
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Agent</div>
                  {/* Abort button removed - functionality not yet implemented at backend */}
                </div>
                <div className="w-full text-sm text-gray-500 dark:text-gray-400 pl-3 sm:pl-0">
                  <div className="flex items-center space-x-1">
                    <div className="animate-pulse">●</div>
                    <div className="animate-pulse" style={{ animationDelay: "0.2s" }}>
                      ●
                    </div>
                    <div className="animate-pulse" style={{ animationDelay: "0.4s" }}>
                      ●
                    </div>
                    <span className="ml-2">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default MessagesArea;
