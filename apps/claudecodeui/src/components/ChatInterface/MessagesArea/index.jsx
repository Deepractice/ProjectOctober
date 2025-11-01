import React from 'react';
import ClaudeLogo from '../../ClaudeLogo.jsx';
import NextTaskBanner from '../../NextTaskBanner.jsx';
import MessageComponent from '../MessageRenderer';

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
  setInput,
  textareaRef,
  tasksEnabled,
  onShowAllTasks,
  loadEarlierMessages,
  createDiff,
  onFileOpen,
  onShowSettings,
  autoExpandTools,
  showRawParameters,
  showThinking,
  selectedProject
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
          {!selectedSession && !currentSessionId && (
            <div className="text-center px-6 sm:px-4 py-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Choose Your AI Assistant</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Select a provider to start a new conversation
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                {/* Claude Button */}
                <button
                  onClick={() => {
                    setProvider('claude');
                    localStorage.setItem('selected-provider', 'claude');
                    // Focus input after selection
                    setTimeout(() => textareaRef.current?.focus(), 100);
                  }}
                  className={`group relative w-64 h-32 bg-white dark:bg-gray-800 rounded-xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-xl ${
                    provider === 'claude'
                      ? 'border-blue-500 shadow-lg ring-2 ring-blue-500/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <ClaudeLogo className="w-10 h-10" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Claude</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">by Anthropic</p>
                    </div>
                  </div>
                  {provider === 'claude' && (
                    <div className="absolute top-2 right-2">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ready to use Claude AI. Start typing your message below.
              </p>

              {/* Show NextTaskBanner when provider is selected and ready */}
              {provider && tasksEnabled && (
                <div className="mt-4 px-4 sm:px-0">
                  <NextTaskBanner
                    onStartTask={() => setInput('Start the next task')}
                    onShowAllTasks={onShowAllTasks}
                  />
                </div>
              )}
            </div>
          )}
          {selectedSession && (
            <div className="text-center text-gray-500 dark:text-gray-400 px-6 sm:px-4">
              <p className="font-bold text-lg sm:text-xl mb-3">Continue your conversation</p>
              <p className="text-sm sm:text-base leading-relaxed">
                Ask questions about your code, request changes, or get help with development tasks
              </p>

              {/* Show NextTaskBanner for existing sessions too */}
              {tasksEnabled && (
                <div className="mt-4 px-4 sm:px-0">
                  <NextTaskBanner
                    onStartTask={() => setInput('Start the next task')}
                    onShowAllTasks={onShowAllTasks}
                  />
                </div>
              )}
            </div>
          )}
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
              <MessageComponent
                key={index}
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
            );
          })}
        </>
      )}

      {isLoading && (
        <div className="chat-message assistant">
          <div className="w-full">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 p-1 bg-transparent">
                <ClaudeLogo className="w-full h-full" />
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Claude</div>
              {/* Abort button removed - functionality not yet implemented at backend */}
            </div>
            <div className="w-full text-sm text-gray-500 dark:text-gray-400 pl-3 sm:pl-0">
              <div className="flex items-center space-x-1">
                <div className="animate-pulse">●</div>
                <div className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</div>
                <div className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</div>
                <span className="ml-2">Thinking...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessagesArea;
