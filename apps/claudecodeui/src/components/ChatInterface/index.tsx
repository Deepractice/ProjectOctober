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
import { shallow } from 'zustand/shallow';

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

  // Debug: Track component mount/unmount
  useEffect(() => {
    console.log('🔷 ChatInterface MOUNTED - sessionId:', selectedSession?.id);
    return () => {
      console.log('🔶 ChatInterface UNMOUNTING - sessionId:', selectedSession?.id);
    };
  }, []);

  // Debug: Track selectedSession prop changes
  const prevSelectedSessionRef = React.useRef(selectedSession);
  useEffect(() => {
    const refChanged = prevSelectedSessionRef.current !== selectedSession;
    const idChanged = prevSelectedSessionRef.current?.id !== selectedSession?.id;
    if (refChanged || idChanged) {
      console.log('🔄 [ChatInterface] selectedSession prop changed - Ref changed:', refChanged, 'ID changed:', idChanged, 'New ID:', selectedSession?.id);
    }
    prevSelectedSessionRef.current = selectedSession;
  }, [selectedSession]);

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

  // === Subscribe to messageStore (Global State) ===
  // Subscribe to sessionMessages Map (single source of truth)
  const sessionMessagesMap = useMessageStore((state) => state.sessionMessages);

  // Compute active session ID with intelligent fallback
  // This ensures messages are visible immediately, even during state transitions
  const activeSessionId = useMemo(() => {
    // Priority 1: Use explicit currentSessionId if available
    if (currentSessionId) return currentSessionId;

    // Priority 2: Use selectedSession?.id if available
    if (selectedSession?.id) return selectedSession.id;

    // Priority 3: Find any session with messages in store
    // This handles edge cases like:
    // - User sends first message (temporary session exists)
    // - After migration but before selectedSession updates (real session exists)
    const allSessionIds = Array.from(sessionMessagesMap.keys()).filter(id => {
      const messages = sessionMessagesMap.get(id);
      return messages && messages.length > 0;
    });

    if (allSessionIds.length === 0) return '';

    // Prefer real sessions over temporary ones
    const realSession = allSessionIds.find(id => !id.startsWith('new-session-'));
    if (realSession) return realSession;

    // Fallback to temporary session
    return allSessionIds[0];
  }, [currentSessionId, selectedSession?.id, sessionMessagesMap]);

  // Extract messages for current session in component (memoized)
  const chatMessages = useMemo(() => {
    return sessionMessagesMap.get(activeSessionId) || [];
  }, [sessionMessagesMap, activeSessionId]);

  // No-op setter for backward compatibility (all writes go to store now)
  const setChatMessages = useCallback(() => {
    console.warn('setChatMessages called but ignored - use messageStore actions instead');
  }, []);

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

  // === REFACTORED: Split giant useEffect into 5 focused effects ===

  // 1. Reset state when session ID changes
  useEffect(() => {
    const sessionId = selectedSession?.id;
    const prevSessionId = currentSessionId;

    if (sessionId && sessionId !== prevSessionId && prevSessionId !== null) {
      // Session switched - reset pagination and UI state
      setMessagesOffset(0);
      setHasMoreMessages(false);
      setTotalMessages(0);
      setTokenBudget(null);
      setIsLoading(false);
    }
  }, [selectedSession?.id, currentSessionId, setMessagesOffset, setHasMoreMessages, setTotalMessages, setTokenBudget, setIsLoading]);

  // 2. Load Claude messages when session/project changes
  useEffect(() => {
    const sessionId = selectedSession?.id;
    const projectPath = selectedProject?.path;

    if (!sessionId || !projectPath || isSystemSessionChange) return;

    const provider = localStorage.getItem('selected-provider') || 'claude';
    if (provider !== 'claude') return;

    const loadClaudeMessages = async () => {
      isLoadingSessionRef.current = true;
      setCurrentSessionId(sessionId);

      const messages = await loadSessionMessages(sessionId, false);
      setSessionMessages(messages);

      const converted = convertSessionMessages(messages);
      useMessageStore.getState().setServerMessages(sessionId, converted);

      setTimeout(() => { isLoadingSessionRef.current = false; }, 250);
    };

    loadClaudeMessages();
  }, [selectedSession?.id, selectedProject?.path, isSystemSessionChange, loadSessionMessages, setSessionMessages, convertSessionMessages, setCurrentSessionId]);

  // 3. Load Cursor messages when session/project changes
  useEffect(() => {
    const sessionId = selectedSession?.id;
    const projectPath = selectedProject?.fullPath || selectedProject?.path;

    if (!sessionId || !projectPath || isSystemSessionChange) return;

    const provider = localStorage.getItem('selected-provider') || 'claude';
    if (provider !== 'cursor') return;

    const loadCursorMsgs = async () => {
      isLoadingSessionRef.current = true;
      setCurrentSessionId(sessionId);
      sessionStorage.setItem('cursorSessionId', sessionId);

      const converted = await loadCursorSessionMessages(projectPath, sessionId);
      setSessionMessages([]);
      useMessageStore.getState().setServerMessages(sessionId, converted);

      setTimeout(() => { isLoadingSessionRef.current = false; }, 250);
    };

    loadCursorMsgs();
  }, [selectedSession?.id, selectedProject?.fullPath, selectedProject?.path, isSystemSessionChange, loadCursorSessionMessages, setSessionMessages, setCurrentSessionId]);

  // 4. Check session status via WebSocket when session changes
  useEffect(() => {
    const sessionId = selectedSession?.id;

    if (!sessionId || !ws || !sendMessage || isSystemSessionChange) return;

    const provider = localStorage.getItem('selected-provider') || 'claude';
    sendMessage({
      type: 'check-session-status',
      sessionId: sessionId,
      provider
    });
  }, [selectedSession?.id, ws, sendMessage, isSystemSessionChange]);

  // 5. Clear messages and state when no session selected
  useEffect(() => {
    if (!selectedSession && !isSystemSessionChange && !isLoading) {
      if (currentSessionId) {
        useMessageStore.getState().clearSessionMessages(currentSessionId);
      }
      setSessionMessages([]);
      setCurrentSessionId(null);
      sessionStorage.removeItem('cursorSessionId');
      setMessagesOffset(0);
      setHasMoreMessages(false);
      setTotalMessages(0);
    }
  }, [selectedSession, isSystemSessionChange, isLoading, currentSessionId, setSessionMessages, setCurrentSessionId, setMessagesOffset, setHasMoreMessages, setTotalMessages]);

  // Reset isSystemSessionChange flag after handling
  useEffect(() => {
    if (isSystemSessionChange) {
      setIsSystemSessionChange(false);
    }
  }, [isSystemSessionChange, setIsSystemSessionChange]);

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
            // Write to store instead of local state
            useMessageStore.getState().setServerMessages(selectedSession.id, converted);
          } else {
            // Reload Claude messages from API/JSONL
            const messages = await loadSessionMessages(selectedSession.id, false);
            setSessionMessages(messages);

            // Write to store
            const converted = convertSessionMessages(messages);
            useMessageStore.getState().setServerMessages(selectedSession.id, converted);

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
  }, [externalMessageUpdate, selectedSession, selectedProject, loadCursorSessionMessages, loadSessionMessages, setSessionMessages, isNearBottom, autoScrollToBottom, scrollToBottom]);

  // REMOVED: Redundant sync - messages already written to store at lines 260, 277

  // Notify parent when input focus changes
  useEffect(() => {
    if (onInputFocusChange) {
      onInputFocusChange(isInputFocused);
    }
  }, [isInputFocused, onInputFocusChange]);

  // Persist chat messages to localStorage (debounced)
  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    if (selectedProject && chatMessages.length > 0) {
      // Only save when message count changes significantly (every 5 messages) or on completion
      if (Math.abs(chatMessages.length - prevMessageCountRef.current) >= 5 || !isLoading) {
        safeLocalStorage.setItem(`chat_messages_${selectedProject.name}`, JSON.stringify(chatMessages));
        prevMessageCountRef.current = chatMessages.length;
      }
    }
  }, [chatMessages, selectedProject, isLoading]);

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
        // Write error to store using unified API
        const errorSessionId = currentSessionId || selectedSession?.id || '';
        if (errorSessionId) {
          useMessageStore.getState().addErrorMessage(errorSessionId, error.message);
        }
        return;
      }
    }

    // === Determine unified session ID for this submission ===
    // Use existing session if available; otherwise create temporary ID until backend provides real ID
    const effectiveSessionId = currentSessionId || selectedSession?.id || sessionStorage.getItem('cursorSessionId');
    const sessionIdToUse = effectiveSessionId || `new-session-${Date.now()}`;

    // === Add user message using unified API ===
    useMessageStore.getState().addUserMessage(sessionIdToUse, input, uploadedImages);
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

    // Session Protection: Mark session as active to prevent automatic project updates during conversation
    if (onSessionActive) {
      onSessionActive(sessionIdToUse);  // Use unified sessionId
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
  }, [input, isLoading, selectedProject, attachedImages, currentSessionId, selectedSession, provider, permissionMode, onSessionActive, cursorModel, sendMessage, setAttachedImages, setUploadingImages, setImageErrors, setIsLoading, setCanAbortSession, setClaudeStatus, setIsUserScrolledUp, scrollToBottom, clearInput]);

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

    // Permission mode is locked to bypassPermissions - no Tab key switching allowed

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
    // Clear current session from store
    if (currentSessionId) {
      useMessageStore.getState().clearSessionMessages(currentSessionId);
    }
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
