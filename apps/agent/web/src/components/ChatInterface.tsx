/**
 * ChatInterface - Main chat interface component
 * Integrates MessagesArea and InputArea with EventBus
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import MessagesArea from "~/components/MessagesArea";
import InputArea from "~/components/InputArea";
import { useSessionStore } from "~/stores/sessionStore";
import { useMessageStore } from "~/stores/messageStore";
import { useUIStore } from "~/stores/uiStore";
import { useDiffCalculation } from "~/hooks/useDiffCalculation";
import type { ChatMessage } from "~/types";

export function ChatInterface() {
  const selectedSession = useSessionStore((state) => state.selectedSession);
  const isSessionProcessing = useSessionStore((state) => state.isSessionProcessing);
  const abortSessionById = useSessionStore((state) => state.abortSessionById);
  const sendMessage = useMessageStore((state) => state.sendMessage);
  const pendingSessionId = useMessageStore((state) => state.pendingSessionId);
  const { autoExpandTools, showRawParameters, showThinking, agentStatus, provider } = useUIStore();

  // Initialize diff calculation hook
  const createDiff = useDiffCalculation();

  // Determine effective session ID (pending or real)
  const effectiveSessionId = pendingSessionId || selectedSession?.id;

  // Get messages using a stable approach
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Subscribe to message store changes for current session (including pending)
  useEffect(() => {
    if (!effectiveSessionId) {
      setChatMessages([]);
      return;
    }

    const updateMessages = () => {
      const messages = useMessageStore.getState().getMessages(effectiveSessionId);
      setChatMessages(messages);
    };

    // Initial load
    updateMessages();

    // Subscribe to changes
    const unsubscribe = useMessageStore.subscribe(updateMessages);

    return unsubscribe;
  }, [effectiveSessionId]);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // Local state
  const [input, setInput] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [attachedImages, setAttachedImages] = useState<File[]>([]);
  const [uploadingImages, _setUploadingImages] = useState<Map<string, number>>(new Map());
  const [imageErrors, setImageErrors] = useState<Map<string, string>>(new Map());

  // Check if current session is loading (or pending session is being created)
  const isLoading = effectiveSessionId
    ? selectedSession
      ? isSessionProcessing(selectedSession.id)
      : true // pending sessions are always "loading"
    : false;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && chatMessages.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [chatMessages.length]);

  // Note: Message loading is handled by sessionStore when session.selected event is emitted
  // No need for UI component to manage loading logic

  // Image upload handlers
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const imageFiles = acceptedFiles.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length < acceptedFiles.length) {
      setImageErrors((prev) => {
        const newErrors = new Map(prev);
        newErrors.set("general", "Only image files are supported");
        return newErrors;
      });
    }

    setAttachedImages((prev) => [...prev, ...imageFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    noClick: true,
    noKeyboard: true,
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageContent = input.trim();
    const imagesToSend = attachedImages;

    setInput("");
    setAttachedImages([]);

    try {
      // Pass undefined sessionId if no session selected (lazy creation)
      sendMessage(selectedSession?.id, messageContent, imagesToSend);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to submit (unless Shift+Enter for new line)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Messages Area - show welcome or messages (including pending sessions) */}
      {!effectiveSessionId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Welcome to Deepractice Agent
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Type a message below to start a new conversation
            </p>
          </div>
        </div>
      ) : (
        <MessagesArea
          scrollContainerRef={scrollContainerRef}
          messagesEndRef={messagesEndRef}
          isLoadingSessionMessages={false}
          chatMessages={chatMessages}
          selectedSession={
            selectedSession || {
              id: effectiveSessionId,
              summary: "New conversation...",
              messageCount: chatMessages.length,
              lastActivity: new Date().toISOString(),
              cwd: ".",
            }
          }
          currentSessionId={effectiveSessionId}
          isLoadingMoreMessages={false}
          hasMoreMessages={false}
          totalMessages={chatMessages.length}
          sessionMessages={chatMessages}
          visibleMessageCount={50}
          visibleMessages={chatMessages}
          isLoading={isLoading}
          setProvider={() => {}}
          provider={provider}
          textareaRef={textareaRef}
          loadEarlierMessages={() => {}}
          createDiff={createDiff}
          onFileOpen={() => {}}
          onShowSettings={() => {}}
          autoExpandTools={autoExpandTools}
          showRawParameters={showRawParameters}
          showThinking={showThinking}
          selectedProject={{ path: "", name: "", fullPath: "" }}
        />
      )}

      {/* Input Area - always show */}
      <InputArea
        textareaRef={textareaRef}
        inputContainerRef={inputContainerRef}
        isInputFocused={false}
        input={input}
        cursorPosition={cursorPosition}
        isLoading={isLoading}
        selectedProject={{ path: "", name: "", fullPath: "" }}
        attachedImages={attachedImages}
        uploadingImages={uploadingImages}
        imageErrors={imageErrors}
        permissionMode="auto"
        selectedSession={
          selectedSession ||
          (effectiveSessionId
            ? {
                id: effectiveSessionId,
                summary: "New conversation...",
                messageCount: chatMessages.length,
                lastActivity: new Date().toISOString(),
                cwd: ".",
              }
            : null)
        }
        claudeStatus={agentStatus?.text || null}
        provider={provider || "claude"}
        showThinking={showThinking}
        tokenBudget={null}
        isTextareaExpanded={false}
        isUserScrolledUp={false}
        chatMessages={chatMessages}
        showFileDropdown={false}
        filteredFiles={[]}
        selectedFileIndex={-1}
        showCommandMenu={false}
        filteredCommands={[]}
        selectedCommandIndex={-1}
        slashCommands={[]}
        commandQuery=""
        frequentCommands={[]}
        sendByCtrlEnter={false}
        handleAbortSession={() => selectedSession && abortSessionById(selectedSession.id)}
        handleModeSwitch={() => {}}
        scrollToBottom={() => {}}
        setInput={setInput}
        setIsTextareaExpanded={() => {}}
        handleSubmit={handleSubmit}
        dropzoneProps={{
          getRootProps,
          getInputProps,
          isDragActive,
          open: open || (() => {}),
        }}
        setAttachedImages={setAttachedImages}
        selectFile={() => {}}
        setShowCommandMenu={() => {}}
        setSlashPosition={() => {}}
        setCommandQuery={() => {}}
        setSelectedCommandIndex={() => {}}
        handleCommandSelect={() => {}}
        handleInputChange={(e: any) => setInput(e.target.value)}
        handleTextareaClick={() => {}}
        handleKeyDown={handleKeyDown}
        handlePaste={() => {}}
        setIsInputFocused={() => {}}
        setCursorPosition={setCursorPosition}
        setFilteredCommands={() => {}}
        handleTranscript={(text: string) => setInput(text)}
      />
    </div>
  );
}

export default ChatInterface;
