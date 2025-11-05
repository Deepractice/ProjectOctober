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
import { sendMessage } from "~/api/agent";
import type { ChatMessage } from "~/types";

export function ChatInterface() {
  const selectedSession = useSessionStore((state) => state.selectedSession);
  const { autoExpandTools, showRawParameters, showThinking } = useUIStore();
  const getMessages = useMessageStore((state) => state.getMessages);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // Local state
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Get messages from store for current session
  const chatMessages = selectedSession ? getMessages(selectedSession.id) : [];

  // Subscribe to message store changes to trigger re-render
  useEffect(() => {
    if (!selectedSession) return;

    const unsubscribe = useMessageStore.subscribe(() => {
      // Force re-render when messages change
    });

    return unsubscribe;
  }, [selectedSession?.id]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !selectedSession || isLoading) return;

    const messageContent = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      await sendMessage(selectedSession.id, messageContent);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
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
        provider="claude"
        isLoadingMoreMessages={false}
        hasMoreMessages={false}
        totalMessages={chatMessages.length}
        sessionMessages={chatMessages}
        visibleMessageCount={50}
        visibleMessages={chatMessages}
        isLoading={isLoading}
        setProvider={() => {}}
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
        uploadingImages={[]}
        imageErrors={{}}
        permissionMode="auto"
        selectedSession={selectedSession}
        claudeStatus={null}
        provider="claude"
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
        handleAbortSession={() => {}}
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
        handleKeyDown={() => {}}
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
