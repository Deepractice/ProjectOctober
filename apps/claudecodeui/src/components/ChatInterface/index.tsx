/*
 * ChatInterface.jsx - Chat Component with Session Protection Integration
 * 
 * SESSION PROTECTION INTEGRATION:
 * ===============================
 * 
 * This component integrates with the Session Protection System to prevent project updates
 * from interrupting active conversations:
 * 
 * Key Integration Points:
 * 1. handleSubmit() - Marks session as active when user sends message (including temp ID for new sessions)
 * 2. session-created handler - Replaces temporary session ID with real WebSocket session ID  
 * 3. claude-complete handler - Marks session as inactive when conversation finishes
 * 4. session-aborted handler - Marks session as inactive when conversation is aborted
 * 
 * This ensures uninterrupted chat experience by coordinating with App.jsx to pause sidebar updates.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';

import { authenticatedFetch } from '../../utils/api';
import { useDiffCalculation } from '../../hooks/useDiffCalculation';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useMessages } from '../../hooks/useMessages';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useChatScrolling } from '../../hooks/chat/useChatScrolling';
import { useChatInput } from '../../hooks/chat/useChatInput';
import safeLocalStorage from '../../utils/safeLocalStorage';
import { decodeHtmlEntities, formatUsageLimitText } from './MessageRenderer';
import MessagesArea from './MessagesArea';
import InputArea from './InputArea';
import CommandPalette from './CommandPalette';
import FileAutocomplete from './FileAutocomplete';
import ClaudeStatusBar from './ClaudeStatusBar';
import { useMessageStore } from '../../stores';

// ChatInterface: Main chat component with Session Protection System integration
// 
// Session Protection System prevents automatic project updates from interrupting active conversations:
// - onSessionActive: Called when user sends message to mark session as protected
// - onSessionInactive: Called when conversation completes/aborts to re-enable updates
// - onReplaceTemporarySession: Called to replace temporary session ID with real WebSocket session ID
//
// This ensures uninterrupted chat experience by pausing sidebar refreshes during conversations.
function ChatInterface({ selectedProject, selectedSession, ws, sendMessage, messages, onFileOpen, onInputFocusChange, onSessionActive, onSessionInactive, onSessionProcessing, onSessionNotProcessing, processingSessions, onReplaceTemporarySession, onNavigateToSession, onShowSettings, autoExpandTools, showRawParameters, showThinking, autoScrollToBottom, sendByCtrlEnter, externalMessageUpdate, onTaskClick, onShowAllTasks }) {

  // Diff calculation hook for file edit diffs
  const createDiff = useDiffCalculation();

  // Image upload hook for drag-and-drop and paste support
  const {
    attachedImages,
    uploadingImages,
    imageErrors,
    setAttachedImages,
    setUploadingImages,
    setImageErrors,
    handleImageFiles,
    handlePaste,
    dropzoneProps
  } = useImageUpload();

  // Chat input hook - handles input state, debouncing, textarea sizing, draft persistence
  const {
    input,
    setInput,
    debouncedInput,
    cursorPosition,
    setCursorPosition,
    isInputFocused,
    setIsInputFocused,
    isTextareaExpanded,
    setIsTextareaExpanded,
    textareaRef,
    inputContainerRef,
    handleTranscript,
    handleTextareaClick,
    clearInput
  } = useChatInput({ selectedProject });

  // UI state and refs (non-input, non-scroll)
  const messagesEndRef = useRef(null);
  const isLoadingSessionRef = useRef(false);
  const handleSubmitRef = useRef(null);
  const [visibleMessageCount, setVisibleMessageCount] = useState(100);
  const [provider, setProvider] = useState(() => {
    return localStorage.getItem('selected-provider') || 'claude';
  });
  const [cursorModel, setCursorModel] = useState(() => {
    return localStorage.getItem('cursor-model') || 'gpt-5';
  });

  // WebSocket state management - centralized in useWebSocket hook
  // Note: scrollToBottom and isNearBottom are defined later as callbacks
  const wsState = useWebSocket({
    selectedProject,
    selectedSession,
    onSessionProcessing,
    onNavigateToSession,
    scrollToBottom: () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        // We'll use the destructured setIsUserScrolledUp from wsState
      }
    },
    isNearBottom: () => {
      if (!scrollContainerRef.current) return false;
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      return scrollHeight - scrollTop - clientHeight < 50;
    },
    autoScrollToBottom
  });

  // Destructure WebSocket state for cleaner code
  const {
    chatMessages: legacyChatMessages,  // Still kept for backward compat
    setChatMessages: legacySetChatMessages,
    isLoading,
    setIsLoading,
    currentSessionId,
    setCurrentSessionId,
    canAbortSession,
    setCanAbortSession,
    claudeStatus,
    setClaudeStatus,
    isSystemSessionChange,
    setIsSystemSessionChange,
    tokenBudget,
    setTokenBudget,
    permissionMode,
    setPermissionMode,
    streamBufferRef,
    streamTimerRef
  } = wsState;

  // === NEW: Subscribe to messageStore (Global State) ===
  const chatMessages = useMessageStore(
    state => state.getDisplayMessages(currentSessionId || selectedSession?.id || '')
  );

  // Alias for backward compatibility
  const setChatMessages = legacySetChatMessages;

  // Messages Hook - handles session message loading and conversion
  const {
    sessionMessages,
    setSessionMessages,
    isLoadingSessionMessages,
    isLoadingMoreMessages,
    messagesOffset,
    setMessagesOffset,
    hasMoreMessages,
    setHasMoreMessages,
    totalMessages,
    setTotalMessages,
    loadSessionMessages,
    loadCursorSessionMessages,
    convertSessionMessages,
    convertedMessages,
    MESSAGES_PER_PAGE
  } = useMessages({
    selectedProject,
    decodeHtmlEntities,
    MESSAGES_PER_PAGE: 20
  });

  // Chat scrolling hook - handles all scroll-related logic and infinite scroll
  const {
    scrollContainerRef,
    isUserScrolledUp,
    setIsUserScrolledUp,
    scrollToBottom,
    isNearBottom
  } = useChatScrolling({
    chatMessages,
    autoScrollToBottom,
    hasMoreMessages,
    isLoadingMoreMessages,
    selectedSession,
    selectedProject,
    loadSessionMessages,
    setSessionMessages,
    isLoadingSessionRef
  });

  // When selecting a session from Sidebar, auto-switch provider to match session's origin
  useEffect(() => {
    if (selectedSession && selectedSession.__provider && selectedSession.__provider !== provider) {
      setProvider(selectedSession.__provider);
      localStorage.setItem('selected-provider', selectedSession.__provider);
    }
  }, [selectedSession]);

  // Note: Token budgets are not saved to JSONL files, only sent via WebSocket
  // So we don't try to extract them from loaded sessionMessages

  useEffect(() => {
    // Load session messages when session changes
    const loadMessages = async () => {
      if (selectedSession && selectedProject) {
        const provider = localStorage.getItem('selected-provider') || 'claude';

        // Mark that we're loading a session to prevent multiple scroll triggers
        isLoadingSessionRef.current = true;

        // Only reset state if the session ID actually changed (not initial load)
        const sessionChanged = currentSessionId !== null && currentSessionId !== selectedSession.id;

        if (sessionChanged) {
          // Reset pagination state when switching sessions
          setMessagesOffset(0);
          setHasMoreMessages(false);
          setTotalMessages(0);
          // Reset token budget when switching sessions
          // It will update when user sends a message and receives new budget from WebSocket
          setTokenBudget(null);
          // Reset loading state when switching sessions (unless the new session is processing)
          // The restore effect will set it back to true if needed
          setIsLoading(false);

          // Check if the session is currently processing on the backend
          if (ws && sendMessage) {
            sendMessage({
              type: 'check-session-status',
              sessionId: selectedSession.id,
              provider
            });
          }
        } else if (currentSessionId === null) {
          // Initial load - reset pagination but not token budget
          setMessagesOffset(0);
          setHasMoreMessages(false);
          setTotalMessages(0);

          // Check if the session is currently processing on the backend
          if (ws && sendMessage) {
            sendMessage({
              type: 'check-session-status',
              sessionId: selectedSession.id,
              provider
            });
          }
        }
        
        if (provider === 'cursor') {
          // For Cursor, set the session ID for resuming
          setCurrentSessionId(selectedSession.id);
          sessionStorage.setItem('cursorSessionId', selectedSession.id);
          
          // Only load messages from SQLite if this is NOT a system-initiated session change
          // For system-initiated changes, preserve existing messages
          if (!isSystemSessionChange) {
            // Load historical messages for Cursor session from SQLite
            const projectPath = selectedProject.fullPath || selectedProject.path;
            const converted = await loadCursorSessionMessages(projectPath, selectedSession.id);
            setSessionMessages([]);

            // === NEW: Write to messageStore ===
            useMessageStore.getState().setServerMessages(selectedSession.id, converted);
          } else {
            // Reset the flag after handling system session change
            setIsSystemSessionChange(false);
          }
        } else {
          // For Claude, load messages normally with pagination
          setCurrentSessionId(selectedSession.id);
          
          // Only load messages from API if this is a user-initiated session change
          // For system-initiated changes, preserve existing messages and rely on WebSocket
          if (!isSystemSessionChange) {
            const messages = await loadSessionMessages(selectedSession.id, false);
            setSessionMessages(messages);

            // === NEW: Convert and write to messageStore ===
            const converted = convertSessionMessages(messages);
            useMessageStore.getState().setServerMessages(selectedSession.id, converted);
            // Scroll will be handled by the main scroll useEffect after messages are rendered
          } else {
            // Reset the flag after handling system session change
            setIsSystemSessionChange(false);
          }
        }
      } else {
        // Only clear messages if this is NOT a system-initiated session change AND we're not loading
        // During system session changes or while loading, preserve the chat messages
        if (!isSystemSessionChange && !isLoading) {
          setChatMessages([]);
          setSessionMessages([]);
        }
        setCurrentSessionId(null);
        sessionStorage.removeItem('cursorSessionId');
        setMessagesOffset(0);
        setHasMoreMessages(false);
        setTotalMessages(0);
      }

      // Mark loading as complete after messages are set
      // Use setTimeout to ensure state updates and DOM rendering are complete
      setTimeout(() => {
        isLoadingSessionRef.current = false;
      }, 250);
    };

    loadMessages();
  }, [selectedSession, selectedProject, loadSessionMessages, loadCursorSessionMessages, setSessionMessages, setChatMessages, setCurrentSessionId, setMessagesOffset, setHasMoreMessages, setTotalMessages, setTokenBudget, setIsLoading, ws, sendMessage, scrollToBottom, isSystemSessionChange, currentSessionId, isLoading]);

  // External Message Update Handler: Reload messages when external CLI modifies current session
  // This triggers when App.jsx detects a JSONL file change for the currently-viewed session
  // Only reloads if the session is NOT active (respecting Session Protection System)
  useEffect(() => {
    if (externalMessageUpdate > 0 && selectedSession && selectedProject) {
      const reloadExternalMessages = async () => {
        try {
          const provider = localStorage.getItem('selected-provider') || 'claude';

          if (provider === 'cursor') {
            // Reload Cursor messages from SQLite
            const projectPath = selectedProject.fullPath || selectedProject.path;
            const converted = await loadCursorSessionMessages(projectPath, selectedSession.id);
            setSessionMessages([]);
            setChatMessages(converted);
          } else {
            // Reload Claude messages from API/JSONL
            const messages = await loadSessionMessages(selectedSession.id, false);
            setSessionMessages(messages);
            // convertedMessages will be automatically updated via useMemo

            // Smart scroll behavior: only auto-scroll if user is near bottom
            if (isNearBottom && autoScrollToBottom) {
              setTimeout(() => scrollToBottom(), 200);
            }
            // If user scrolled up, preserve their position (they're reading history)
          }
        } catch (error) {
          console.error('Error reloading messages from external update:', error);
        }
      };

      reloadExternalMessages();
    }
  }, [externalMessageUpdate, selectedSession, selectedProject, loadCursorSessionMessages, loadSessionMessages, setSessionMessages, setChatMessages, isNearBottom, autoScrollToBottom, scrollToBottom]);

  // Update chatMessages when convertedMessages changes
  useEffect(() => {
    if (sessionMessages.length > 0) {
      setChatMessages(convertedMessages);
    }
  }, [convertedMessages, sessionMessages]);

  // Notify parent when input focus changes
  useEffect(() => {
    if (onInputFocusChange) {
      onInputFocusChange(isInputFocused);
    }
  }, [isInputFocused, onInputFocusChange]);

  // Persist chat messages to localStorage
  useEffect(() => {
    if (selectedProject && chatMessages.length > 0) {
      safeLocalStorage.setItem(`chat_messages_${selectedProject.name}`, JSON.stringify(chatMessages));
    }
  }, [chatMessages, selectedProject]);

  // Track processing state: notify parent when isLoading becomes true
  // Note: onSessionNotProcessing is called directly in completion message handlers
  useEffect(() => {
    if (currentSessionId && isLoading && onSessionProcessing) {
      onSessionProcessing(currentSessionId);
    }
  }, [isLoading, currentSessionId, onSessionProcessing]);

  // Restore processing state when switching to a processing session
  useEffect(() => {
    if (currentSessionId && processingSessions) {
      const shouldBeProcessing = processingSessions.has(currentSessionId);
      if (shouldBeProcessing && !isLoading) {
        setIsLoading(true);
        setCanAbortSession(true); // Assume processing sessions can be aborted
      }
    }
  }, [currentSessionId, processingSessions]);

  // Show only recent messages for better performance
  const visibleMessages = useMemo(() => {
    if (chatMessages.length <= visibleMessageCount) {
      return chatMessages;
    }
    return chatMessages.slice(-visibleMessageCount);
  }, [chatMessages, visibleMessageCount]);

  // Load token usage when session changes (but don't poll to avoid conflicts with WebSocket)
  useEffect(() => {
    if (!selectedProject || !selectedSession?.id || selectedSession.id.startsWith('new-session-')) {
      // Reset for new/empty sessions
      setTokenBudget(null);
      return;
    }

    // Fetch token usage once when session loads
    const fetchInitialTokenUsage = async () => {
      try {
        const url = `/api/sessions/${selectedSession.id}/token-usage`;

        const response = await authenticatedFetch(url);

        if (response.ok) {
          const data = await response.json();
          setTokenBudget(data);
        } else {
          setTokenBudget(null);
        }
      } catch (error) {
        console.error('Failed to fetch initial token usage:', error);
      }
    };

    fetchInitialTokenUsage();
  }, [selectedSession?.id, selectedProject?.path]);


  // Load earlier messages by increasing the visible message count
  const loadEarlierMessages = useCallback(() => {
    setVisibleMessageCount(prevCount => prevCount + 100);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !selectedProject) return;

    // Upload images first if any
    let uploadedImages = [];
    if (attachedImages.length > 0) {
      const formData = new FormData();
      attachedImages.forEach(file => {
        formData.append('images', file);
      });
      
      try {
        const token = safeLocalStorage.getItem('auth-token');
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`/api/upload-images`, {
          method: 'POST',
          headers: headers,
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload images');
        }
        
        const result = await response.json();
        uploadedImages = result.images;
      } catch (error) {
        console.error('Image upload failed:', error);
        setChatMessages(prev => [...prev, {
          type: 'error',
          content: `Failed to upload images: ${error.message}`,
          timestamp: new Date()
        }]);
        return;
      }
    }

    const userMessage: import('../../types').ChatMessage = {
      type: 'user' as const,
      content: input,
      images: uploadedImages,
      timestamp: new Date()
    };

    // === NEW: Optimistic Update to messageStore ===
    const sessionId = currentSessionId || selectedSession?.id || sessionStorage.getItem('cursorSessionId') || '';
    if (sessionId) {
      useMessageStore.getState().addOptimisticMessage(sessionId, userMessage);
    }
    setIsLoading(true);
    setCanAbortSession(true);
    // Set a default status when starting
    setClaudeStatus({
      text: 'Processing',
      tokens: 0,
      can_interrupt: true
    });
    
    // Always scroll to bottom when user sends a message and reset scroll state
    setIsUserScrolledUp(false); // Reset scroll state so auto-scroll works for Claude's response
    setTimeout(() => scrollToBottom(), 100); // Longer delay to ensure message is rendered

    // Determine effective session id for replies to avoid race on state updates
    const effectiveSessionId = currentSessionId || selectedSession?.id || sessionStorage.getItem('cursorSessionId');

    // Session Protection: Mark session as active to prevent automatic project updates during conversation
    // Use existing session if available; otherwise a temporary placeholder until backend provides real ID
    const sessionToActivate = effectiveSessionId || `new-session-${Date.now()}`;
    if (onSessionActive) {
      onSessionActive(sessionToActivate);
    }

    // Get tools settings from localStorage based on provider
    const getToolsSettings = () => {
      try {
        const settingsKey = provider === 'cursor' ? 'cursor-tools-settings' : 'claude-settings';
        const savedSettings = safeLocalStorage.getItem(settingsKey);
        if (savedSettings) {
          return JSON.parse(savedSettings);
        }
      } catch (error) {
        console.error('Error loading tools settings:', error);
      }
      return {
        allowedTools: [],
        disallowedTools: [],
        skipPermissions: false
      };
    };

    const toolsSettings = getToolsSettings();

    // Send command based on provider
    if (provider === 'cursor') {
      // Send Cursor command (always use cursor-command; include resume/sessionId when replying)
      sendMessage({
        type: 'cursor-command',
        command: input,
        sessionId: effectiveSessionId,
        options: {
          // Prefer fullPath (actual cwd for project), fallback to path
          cwd: selectedProject.fullPath || selectedProject.path,
          projectPath: selectedProject.fullPath || selectedProject.path,
          sessionId: effectiveSessionId,
          resume: !!effectiveSessionId,
          model: cursorModel,
          skipPermissions: toolsSettings?.skipPermissions || false,
          toolsSettings: toolsSettings
        }
      });
    } else {
      // Send Claude command (existing code)
      sendMessage({
        type: 'claude-command',
        command: input,
        options: {
          projectPath: selectedProject.path,
          cwd: selectedProject.fullPath,
          sessionId: currentSessionId,
          resume: !!currentSessionId,
          toolsSettings: toolsSettings,
          permissionMode: permissionMode,
          images: uploadedImages // Pass images to backend
        }
      });
    }

    clearInput();
    setAttachedImages([]);
    setUploadingImages(new Map());
    setImageErrors(new Map());
  }, [input, isLoading, selectedProject, attachedImages, currentSessionId, selectedSession, provider, permissionMode, onSessionActive, cursorModel, sendMessage, setAttachedImages, setUploadingImages, setImageErrors, setChatMessages, setIsLoading, setCanAbortSession, setClaudeStatus, setIsUserScrolledUp, scrollToBottom, clearInput]);

  // Store handleSubmit in ref so handleCustomCommand can access it
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // Note: handleKeyDown is created inside render prop callbacks to access command and file handlers
  // This placeholder is kept for backwards compatibility if needed
  const createHandleKeyDown = (handleCommandKeyDown, handleFileKeyDown) => (e) => {
    // Handle command menu navigation
    if (handleCommandKeyDown && handleCommandKeyDown(e)) {
      return;
    }

    // Handle file dropdown navigation
    if (handleFileKeyDown && handleFileKeyDown(e)) {
      return;
    }

    // Handle Tab key for mode switching (only when dropdowns are not showing)
    // Note: showFileDropdown and showCommandMenu are accessed via closures in the render prop
    const modes = ['default', 'acceptEdits', 'bypassPermissions', 'plan'];
    if (e.key === 'Tab') {
      e.preventDefault();
      const currentIndex = modes.indexOf(permissionMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      const newMode = modes[nextIndex];
      setPermissionMode(newMode);

      // Save mode for this session
      if (selectedSession?.id) {
        localStorage.setItem(`permissionMode-${selectedSession.id}`, newMode);
      }
      return;
    }

    // Handle Enter key: Ctrl+Enter (Cmd+Enter on Mac) sends, Shift+Enter creates new line
    if (e.key === 'Enter') {
      // If we're in composition, don't send message
      if (e.nativeEvent.isComposing) {
        return; // Let IME handle the Enter key
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        // Ctrl+Enter or Cmd+Enter: Send message
        e.preventDefault();
        handleSubmit(e);
      } else if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
        // Plain Enter: Send message only if not in IME composition
        if (!sendByCtrlEnter) {
          e.preventDefault();
          handleSubmit(e);
        }
      }
      // Shift+Enter: Allow default behavior (new line)
    }
  };

  // Note: handleInputChange is created inside render prop callbacks to access detectSlashCommand
  const createHandleInputChange = (detectSlashCommand) => (e) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;

    // Auto-select Claude provider if no session exists and user starts typing
    if (!currentSessionId && newValue.trim() && provider === 'claude') {
      // Provider is already set to 'claude' by default, so no need to change it
      // The session will be created automatically when they submit
    }

    setInput(newValue);
    setCursorPosition(cursorPos);

    // Handle height reset when input becomes empty
    if (!newValue.trim()) {
      e.target.style.height = 'auto';
      setIsTextareaExpanded(false);
      return;
    }

    // Detect slash command at cursor position
    if (detectSlashCommand) {
      detectSlashCommand(newValue, cursorPos);
    }
  };

  const handleNewSession = () => {
    setChatMessages([]);
    setInput('');
    setIsLoading(false);
    setCanAbortSession(false);
  };
  
  const handleAbortSession = () => {
    if (currentSessionId && canAbortSession) {
      sendMessage({
        type: 'abort-session',
        sessionId: currentSessionId,
        provider: provider
      });
    }
  };

  const handleModeSwitch = () => {
    const modes = ['default', 'acceptEdits', 'bypassPermissions', 'plan'];
    const currentIndex = modes.indexOf(permissionMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const newMode = modes[nextIndex];
    setPermissionMode(newMode);

    // Save mode for this session
    if (selectedSession?.id) {
      localStorage.setItem(`permissionMode-${selectedSession.id}`, newMode);
    }
  };

  // Don't render if no project is selected
  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>Select a project to start chatting with Claude</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          details[open] .details-chevron {
            transform: rotate(180deg);
          }
        `}
      </style>

      <CommandPalette
        selectedProject={selectedProject}
        input={input}
        setInput={setInput}
        currentSessionId={currentSessionId}
        provider={provider}
        tokenBudget={tokenBudget}
        setChatMessages={setChatMessages}
        setSessionMessages={setSessionMessages}
        handleSubmitRef={handleSubmitRef}
        onFileOpen={onFileOpen}
        onShowSettings={onShowSettings}
      >
        {(commandProps) => (
          <FileAutocomplete
            input={input}
            cursorPosition={cursorPosition}
            selectedProject={selectedProject}
            textareaRef={textareaRef}
            setInput={setInput}
            setCursorPosition={setCursorPosition}
          >
            {(fileProps) => (
              <ClaudeStatusBar
                status={claudeStatus}
                onStatusChange={setClaudeStatus}
                isLoading={isLoading}
                onAbort={handleAbortSession}
                provider={provider}
                showThinking={showThinking}
              >
                {({ status: claudeStatusFromBar }) => (
                  <div className="h-full flex flex-col">
                    <MessagesArea
                      scrollContainerRef={scrollContainerRef}
                      messagesEndRef={messagesEndRef}
                      isLoadingSessionMessages={isLoadingSessionMessages}
                      chatMessages={chatMessages}
                      selectedSession={selectedSession}
                      currentSessionId={currentSessionId}
                      provider={provider}
                      isLoadingMoreMessages={isLoadingMoreMessages}
                      hasMoreMessages={hasMoreMessages}
                      totalMessages={totalMessages}
                      sessionMessages={sessionMessages}
                      visibleMessageCount={visibleMessageCount}
                      visibleMessages={visibleMessages}
                      isLoading={isLoading}
                      setProvider={setProvider}
                      textareaRef={textareaRef}
                      loadEarlierMessages={loadEarlierMessages}
                      createDiff={createDiff}
                      onFileOpen={onFileOpen}
                      onShowSettings={onShowSettings}
                      autoExpandTools={autoExpandTools}
                      showRawParameters={showRawParameters}
                      showThinking={showThinking}
                      selectedProject={selectedProject}
                    />

                    <InputArea
                      textareaRef={textareaRef}
                      inputContainerRef={inputContainerRef}
                      isInputFocused={isInputFocused}
                      input={input}
                      cursorPosition={cursorPosition}
                      isLoading={isLoading}
                      selectedProject={selectedProject}
                      attachedImages={attachedImages}
                      uploadingImages={uploadingImages}
                      imageErrors={imageErrors}
                      permissionMode={permissionMode}
                      selectedSession={selectedSession}
                      claudeStatus={claudeStatusFromBar}
                      provider={provider}
                      showThinking={showThinking}
                      tokenBudget={tokenBudget}
                      isTextareaExpanded={isTextareaExpanded}
                      isUserScrolledUp={isUserScrolledUp}
                      chatMessages={chatMessages}
                      showFileDropdown={fileProps.showFileDropdown}
                      filteredFiles={fileProps.filteredFiles}
                      selectedFileIndex={fileProps.selectedFileIndex}
                      showCommandMenu={commandProps.showCommandMenu}
                      filteredCommands={commandProps.filteredCommands}
                      selectedCommandIndex={commandProps.selectedCommandIndex}
                      slashCommands={commandProps.slashCommands}
                      commandQuery={commandProps.commandQuery}
                      frequentCommands={commandProps.frequentCommands}
                      sendByCtrlEnter={sendByCtrlEnter}
                      handleAbortSession={handleAbortSession}
                      handleModeSwitch={handleModeSwitch}
                      scrollToBottom={scrollToBottom}
                      setInput={setInput}
                      setIsTextareaExpanded={setIsTextareaExpanded}
                      handleSubmit={handleSubmit}
                      dropzoneProps={dropzoneProps}
                      setAttachedImages={setAttachedImages}
                      selectFile={fileProps.selectFile}
                      setShowCommandMenu={commandProps.setShowCommandMenu}
                      setSlashPosition={commandProps.setSlashPosition}
                      setCommandQuery={commandProps.setCommandQuery}
                      setSelectedCommandIndex={commandProps.setSelectedCommandIndex}
                      handleCommandSelect={commandProps.handleCommandSelect}
                      handleInputChange={createHandleInputChange(commandProps.detectSlashCommand)}
                      handleTextareaClick={handleTextareaClick}
                      handleKeyDown={createHandleKeyDown(commandProps.handleCommandKeyDown, fileProps.handleFileKeyDown)}
                      handlePaste={handlePaste}
                      setIsInputFocused={setIsInputFocused}
                      setCursorPosition={setCursorPosition}
                      setFilteredCommands={commandProps.setFilteredCommands}
                      handleTranscript={handleTranscript}
                    />
                  </div>
                )}
              </ClaudeStatusBar>
            )}
          </FileAutocomplete>
        )}
      </CommandPalette>
    </>
  );
}

export default React.memo(ChatInterface);
