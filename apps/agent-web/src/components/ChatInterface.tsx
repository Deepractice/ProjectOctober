/**
 * ChatInterface - Main chat interface component
 * Integrates MessagesArea and InputArea with EventBus
 */

import { useRef, useState, useEffect } from "react";
import MessagesArea from "~/components/MessagesArea";
import InputArea from "~/components/InputArea";
import { useSessionStore } from "~/stores/sessionStore";
import { useMessageStore } from "~/stores/messageStore";
import { useUIStore } from "~/stores/uiStore";
import type { ChatMessage } from "~/types";

export function ChatInterface() {
  const selectedSession = useSessionStore((state) => state.selectedSession);
  const isSessionProcessing = useSessionStore((state) => state.isSessionProcessing);
  const abortSessionById = useSessionStore((state) => state.abortSessionById);
  const sendMessage = useMessageStore((state) => state.sendMessage);
  const { autoExpandTools, showRawParameters, showThinking, agentStatus, provider } = useUIStore();

  // Get messages using a stable approach
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Subscribe to message store changes for current session
  useEffect(() => {
    if (!selectedSession) {
      setChatMessages([]);
      return;
    }

    const updateMessages = () => {
      const messages = useMessageStore.getState().getMessages(selectedSession.id);
      setChatMessages(messages);
    };

    // Initial load
    updateMessages();

    // Subscribe to changes
    const unsubscribe = useMessageStore.subscribe(updateMessages);

    return unsubscribe;
  }, [selectedSession?.id]);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // Local state
  const [input, setInput] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);

  // Check if current session is loading
  const isLoading = selectedSession ? isSessionProcessing(selectedSession.id) : false;

  // Note: Message loading is handled by sessionStore when session.selected event is emitted
  // No need for UI component to manage loading logic

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !selectedSession || isLoading) return;

    const messageContent = input.trim();
    setInput("");

    try {
      sendMessage(selectedSession.id, messageContent);
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

  if (!selectedSession) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <div className="text-center px-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Welcome to Agent
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Select a session or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <MessagesArea
        scrollContainerRef={scrollContainerRef}
        messagesEndRef={messagesEndRef}
        isLoadingSessionMessages={false}
        chatMessages={chatMessages}
        selectedSession={selectedSession}
        currentSessionId={selectedSession.id}
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
        createDiff={(old, newContent) => ""}
        onFileOpen={() => {}}
        onShowSettings={() => {}}
        autoExpandTools={autoExpandTools}
        showRawParameters={showRawParameters}
        showThinking={showThinking}
        selectedProject={{ path: "", name: "", fullPath: "" }}
      />

      <InputArea
        textareaRef={textareaRef}
        inputContainerRef={inputContainerRef}
        isInputFocused={false}
        input={input}
        cursorPosition={cursorPosition}
        isLoading={isLoading}
        selectedProject={{ path: "", name: "", fullPath: "" }}
        attachedImages={[]}
        uploadingImages={new Map()}
        imageErrors={new Map()}
        permissionMode="auto"
        selectedSession={selectedSession}
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
          getRootProps: () => ({}),
          getInputProps: () => ({}),
          isDragActive: false,
        }}
        setAttachedImages={() => {}}
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
