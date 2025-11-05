/**
 * Chat Area Component
 * Uses assistant-ui primitives for chat interface
 */

import { ThreadPrimitive, ComposerPrimitive, MessagePrimitive } from "@assistant-ui/react";
import { useSessionStore } from "~/stores/sessionStore";

export function ChatArea() {
  const selectedSession = useSessionStore((s) => s.selectedSession);

  if (!selectedSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">Select a session to start chatting</p>
          <p className="text-sm mt-2">or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <ThreadPrimitive.Root className="flex h-full flex-col bg-background">
      {/* Messages Area */}
      <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto px-4 py-6">
        {/* Empty State */}
        <ThreadPrimitive.Empty>
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-2xl font-semibold mb-2">Start a conversation</h2>
            <p className="text-muted-foreground">
              Type a message below to begin chatting with the AI agent
            </p>
          </div>
        </ThreadPrimitive.Empty>

        {/* Message List */}
        <ThreadPrimitive.Messages
          components={{
            UserMessage: UserMessage,
            AssistantMessage: AssistantMessage,
          }}
        />
      </ThreadPrimitive.Viewport>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <Composer />
      </div>
    </ThreadPrimitive.Root>
  );
}

/**
 * User Message Component
 */
function UserMessage() {
  return (
    <MessagePrimitive.Root className="mb-4 flex justify-end">
      <div className="max-w-[80%] rounded-lg bg-primary text-primary-foreground px-4 py-2">
        <MessagePrimitive.Parts />
      </div>
    </MessagePrimitive.Root>
  );
}

/**
 * Assistant Message Component
 */
function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="mb-4 flex justify-start">
      <div className="max-w-[80%] rounded-lg bg-muted text-foreground px-4 py-2">
        <MessagePrimitive.Parts />
      </div>
    </MessagePrimitive.Root>
  );
}

/**
 * Composer (Input) Component
 */
function Composer() {
  return (
    <ComposerPrimitive.Root className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
      <ComposerPrimitive.Input
        placeholder="Type a message..."
        className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
      />
      <ThreadPrimitive.If running={false}>
        <ComposerPrimitive.Send asChild>
          <button className="px-4 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm">
            Send
          </button>
        </ComposerPrimitive.Send>
      </ThreadPrimitive.If>
      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel asChild>
          <button className="px-4 py-1 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors text-sm">
            Stop
          </button>
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </ComposerPrimitive.Root>
  );
}
