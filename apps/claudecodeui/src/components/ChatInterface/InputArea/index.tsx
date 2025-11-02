import React from 'react';
import ClaudeStatus from '../../ClaudeStatus';
import TokenUsagePie from '../../TokenUsagePie';
import ImageAttachments from './ImageAttachments';
import Textarea from './Textarea';

/**
 * InputArea component - Main input area for the chat interface
 */
function InputArea({
  // Refs
  textareaRef,
  inputContainerRef,

  // State
  isInputFocused,
  input,
  cursorPosition,
  isLoading,
  selectedProject,
  attachedImages,
  uploadingImages,
  imageErrors,
  permissionMode,
  selectedSession,
  claudeStatus,
  provider,
  showThinking,
  tokenBudget,
  isTextareaExpanded,
  isUserScrolledUp,
  chatMessages,
  showFileDropdown,
  filteredFiles,
  selectedFileIndex,
  showCommandMenu,
  filteredCommands,
  selectedCommandIndex,
  slashCommands,
  commandQuery,
  frequentCommands,
  sendByCtrlEnter,

  // Functions/Callbacks
  handleAbortSession,
  handleModeSwitch,
  scrollToBottom,
  setInput,
  setIsTextareaExpanded,
  handleSubmit,
  dropzoneProps,
  setAttachedImages,
  selectFile,
  setShowCommandMenu,
  setSlashPosition,
  setCommandQuery,
  setSelectedCommandIndex,
  handleCommandSelect,
  handleInputChange,
  handleTextareaClick,
  handleKeyDown,
  handlePaste,
  setIsInputFocused,
  setCursorPosition,
  setFilteredCommands,
  handleTranscript
}) {
  return (
    <div
      className={`p-2 sm:p-4 md:p-4 flex-shrink-0 ${
        isInputFocused ? 'pb-2 sm:pb-4 md:pb-6' : 'pb-2 sm:pb-4 md:pb-6'
      }`}
    >
      <div className="flex-1">
        <ClaudeStatus
          status={claudeStatus}
          isLoading={isLoading}
          onAbort={handleAbortSession}
          provider={provider}
        />
      </div>

      {/* Permission Mode Selector with scroll to bottom button - Above input, clickable for mobile */}
      <div ref={inputContainerRef} className="max-w-4xl mx-auto mb-3">
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleModeSwitch}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
              permissionMode === 'default'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                : permissionMode === 'acceptEdits'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600 hover:bg-green-100 dark:hover:bg-green-900/30'
                : permissionMode === 'bypassPermissions'
                ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30'
            }`}
            title="Click to change permission mode (or press Tab in input)"
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  permissionMode === 'default'
                    ? 'bg-gray-500'
                    : permissionMode === 'acceptEdits'
                    ? 'bg-green-500'
                    : permissionMode === 'bypassPermissions'
                    ? 'bg-orange-500'
                    : 'bg-blue-500'
                }`}
              />
              <span>
                {permissionMode === 'default' && 'Default Mode'}
                {permissionMode === 'acceptEdits' && 'Accept Edits'}
                {permissionMode === 'bypassPermissions' && 'Bypass Permissions'}
                {permissionMode === 'plan' && 'Plan Mode'}
              </span>
            </div>
          </button>

          {/* Token usage pie chart - positioned next to mode indicator */}
          <TokenUsagePie
            used={tokenBudget?.used || 0}
            total={
              tokenBudget?.total ||
              parseInt(import.meta.env.VITE_CONTEXT_WINDOW) ||
              160000
            }
          />

          {/* Clear input button - positioned to the right of token pie, only shows when there's input */}
          {input.trim() && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setInput('');
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto';
                  textareaRef.current.focus();
                }
                setIsTextareaExpanded(false);
              }}
              className="w-8 h-8 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center transition-all duration-200 group shadow-sm"
              title="Clear input"
            >
              <svg
                className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {/* Scroll to bottom button - positioned next to mode indicator */}
          {isUserScrolledUp && chatMessages.length > 0 && (
            <button
              onClick={scrollToBottom}
              className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:ring-offset-gray-800"
              title="Scroll to bottom"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
        {/* Image Attachments */}
        <ImageAttachments
          attachedImages={attachedImages}
          uploadingImages={uploadingImages}
          imageErrors={imageErrors}
          onRemoveImage={(index) => {
            setAttachedImages((prev) => prev.filter((_, i) => i !== index));
          }}
          isDragActive={dropzoneProps.isDragActive}
        />

        {/* Textarea Component */}
        <Textarea
          textareaRef={textareaRef}
          value={input}
          isLoading={isLoading}
          isExpanded={isTextareaExpanded}
          isInputFocused={isInputFocused}
          sendByCtrlEnter={sendByCtrlEnter}
          showFileDropdown={showFileDropdown}
          filteredFiles={filteredFiles}
          selectedFileIndex={selectedFileIndex}
          showCommandMenu={showCommandMenu}
          filteredCommands={filteredCommands}
          selectedCommandIndex={selectedCommandIndex}
          slashCommands={slashCommands}
          frequentCommands={frequentCommands}
          commandQuery={commandQuery}
          dropzoneProps={dropzoneProps}
          onChange={handleInputChange}
          onClick={handleTextareaClick}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          onInput={(e) => {
            // Immediate resize on input for better UX
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
            setCursorPosition(e.target.selectionStart);

            // Check if textarea is expanded (more than 2 lines worth of height)
            const lineHeight = parseInt(window.getComputedStyle(e.target).lineHeight);
            const isExpanded = e.target.scrollHeight > lineHeight * 2;
            setIsTextareaExpanded(isExpanded);
          }}
          onSelectFile={selectFile}
          onSubmit={handleSubmit}
          onImageUpload={dropzoneProps.open}
          onToggleCommandMenu={() => {
            const isOpening = !showCommandMenu;
            setShowCommandMenu(isOpening);
            setCommandQuery('');
            setSelectedCommandIndex(-1);

            // When opening, ensure all commands are shown
            if (isOpening) {
              setFilteredCommands(slashCommands);
            }

            if (textareaRef.current) {
              textareaRef.current.focus();
            }
          }}
          onCommandSelect={handleCommandSelect}
          onCloseCommandMenu={() => {
            setShowCommandMenu(false);
            setSlashPosition(-1);
            setCommandQuery('');
            setSelectedCommandIndex(-1);
          }}
          onTranscript={handleTranscript}
        />
      </form>
    </div>
  );
}

export default InputArea;
