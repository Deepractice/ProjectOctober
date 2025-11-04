import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import AgentLogo from "../../AgentLogo.jsx";
import MessageComponent from "../MessageRenderer";

function MessagesArea({
  // Refs
  scrollContainerRef,
  messagesEndRef,

  // State
  isLoadingSessionMessages,
  chatMessages,
  selectedSession,
  currentSessionId,
  provider,
  isLoadingMoreMessages,
  hasMoreMessages,
  totalMessages,
  sessionMessages,
  visibleMessageCount,
  visibleMessages,
  isLoading,

  // Functions/Callbacks
  setProvider,
  textareaRef,
  loadEarlierMessages,
  createDiff,
  onFileOpen,
  onShowSettings,
  autoExpandTools,
  showRawParameters,
  showThinking,
  selectedProject,
}) {
  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden px-0 py-3 sm:p-4 space-y-3 sm:space-y-4 relative"
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

          <AnimatePresence mode="popLayout">
            {visibleMessages.map((message, index) => {
              const prevMessage = index > 0 ? visibleMessages[index - 1] : null;

              return (
                <motion.div
                  key={`message-${index}-${message.timestamp || ""}`}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  transition={{
                    duration: 0.3,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                >
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
                </motion.div>
              );
            })}
          </AnimatePresence>
        </>
      )}

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="chat-message assistant"
          >
            <div className="w-full">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 p-1 bg-transparent">
                  <AgentLogo className="w-full h-full" />
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
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessagesArea;
