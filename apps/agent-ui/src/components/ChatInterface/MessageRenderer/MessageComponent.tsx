import React, { useState, useEffect, memo } from "react";
import AgentLogo from "../../AgentLogo.jsx";
import TodoList from "../../TodoList";
import ToolUseDisplay from "./ToolUseDisplay";
import { Markdown, formatUsageLimitText } from "./index";
import type { ChatMessage, ProjectInfo } from "~/types";

interface MessageComponentProps {
  message: any; // TODO: Use ChatMessage type after fixing message structure
  index: number;
  prevMessage: any | null;
  createDiff: (oldCode: string, newCode: string) => any;
  onFileOpen?: (filePath: string) => void;
  onShowSettings?: () => void;
  autoExpandTools: boolean;
  showRawParameters: boolean;
  showThinking: boolean;
  selectedProject: ProjectInfo;
}

// Memoized message component to prevent unnecessary re-renders
const MessageComponent = memo(
  ({
    message,
    index,
    prevMessage,
    createDiff,
    onFileOpen,
    onShowSettings,
    autoExpandTools,
    showRawParameters,
    showThinking,
    selectedProject,
  }: MessageComponentProps) => {
    const isGrouped =
      prevMessage &&
      prevMessage.type === message.type &&
      (prevMessage.type === "assistant" ||
        prevMessage.type === "user" ||
        prevMessage.type === "tool" ||
        prevMessage.type === "error");
    const messageRef = React.useRef(null);
    const [isExpanded, setIsExpanded] = React.useState(false);

    // Auto-expand tool use when it comes into view
    React.useEffect(() => {
      if (!autoExpandTools || !messageRef.current || !message.isToolUse) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !isExpanded) {
              setIsExpanded(true);
              const details = messageRef.current.querySelectorAll("details");
              details.forEach((detail) => {
                detail.open = true;
              });
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(messageRef.current);

      return () => {
        if (messageRef.current) {
          observer.unobserve(messageRef.current);
        }
      };
    }, [autoExpandTools, isExpanded, message.isToolUse]);

    return (
      <div
        ref={messageRef}
        className={`chat-message ${message.type} ${isGrouped ? "grouped" : ""} ${message.type === "user" ? "flex justify-end px-3 sm:px-0" : "px-3 sm:px-0"}`}
      >
        {message.type === "user" ? (
          /* User message bubble on the right */
          <div className="flex items-end space-x-0 sm:space-x-3 w-full sm:w-auto sm:max-w-[85%] md:max-w-md lg:max-w-lg xl:max-w-xl">
            <div className="bg-blue-600 text-white rounded-2xl rounded-br-md px-3 sm:px-4 py-2 shadow-sm flex-1 sm:flex-initial">
              <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
              {message.images && message.images.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {message.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img.data}
                      alt={img.name}
                      className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(img.data, "_blank")}
                    />
                  ))}
                </div>
              )}
              <div className="text-xs text-blue-100 mt-1 text-right">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
            {!isGrouped && (
              <div className="hidden sm:flex w-8 h-8 bg-blue-600 rounded-full items-center justify-center text-white text-sm flex-shrink-0">
                U
              </div>
            )}
          </div>
        ) : (
          /* Agent/Error/Tool messages on the left */
          <div className="w-full">
            {!isGrouped && (
              <div className="flex items-center space-x-3 mb-2">
                {message.type === "error" ? (
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
                    !
                  </div>
                ) : message.type === "tool" ? (
                  <div className="w-8 h-8 bg-gray-600 dark:bg-gray-700 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
                    🔧
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 p-1">
                    <AgentLogo className="w-full h-full" />
                  </div>
                )}
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {message.type === "error" ? "Error" : message.type === "tool" ? "Tool" : "Agent"}
                </div>
              </div>
            )}

            <div className="w-full">
              {/* Tool Use Display */}
              {message.isToolUse &&
              !["Read", "TodoWrite", "TodoRead"].includes(message.toolName) ? (
                <ToolUseDisplay
                  message={message}
                  autoExpandTools={autoExpandTools}
                  showRawParameters={showRawParameters}
                  showThinking={showThinking}
                  onFileOpen={onFileOpen}
                  onShowSettings={onShowSettings}
                  selectedProject={selectedProject}
                  createDiff={createDiff}
                />
              ) : message.isToolUse && message.toolName === "Read" ? (
                // Simple Read tool indicator
                (() => {
                  try {
                    const input = JSON.parse(message.toolInput);
                    if (input.file_path) {
                      const filename = input.file_path.split("/").pop();
                      return (
                        <div className="bg-gray-50/50 dark:bg-gray-800/30 border-l-2 border-gray-400 dark:border-gray-500 pl-3 py-2 my-2">
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <svg
                              className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                              />
                            </svg>
                            <span className="font-medium">Read</span>
                            <button
                              onClick={() => onFileOpen && onFileOpen(input.file_path)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-mono transition-colors"
                            >
                              {filename}
                            </button>
                          </div>
                        </div>
                      );
                    }
                  } catch (e) {
                    return (
                      <div className="bg-gray-50/50 dark:bg-gray-800/30 border-l-2 border-gray-400 dark:border-gray-500 pl-3 py-2 my-2">
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <svg
                            className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                          <span className="font-medium">Read file</span>
                        </div>
                      </div>
                    );
                  }
                })()
              ) : message.isToolUse && message.toolName === "TodoWrite" ? (
                // Simple TodoWrite tool indicator with tasks
                (() => {
                  try {
                    const input = JSON.parse(message.toolInput);
                    if (input.todos && Array.isArray(input.todos)) {
                      return (
                        <div className="bg-gray-50/50 dark:bg-gray-800/30 border-l-2 border-gray-400 dark:border-gray-500 pl-3 py-2 my-2">
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                            <svg
                              className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                              />
                            </svg>
                            <span className="font-medium">Update todo list</span>
                          </div>
                          <TodoList todos={input.todos} />
                        </div>
                      );
                    }
                  } catch (e) {
                    return (
                      <div className="bg-gray-50/50 dark:bg-gray-800/30 border-l-2 border-gray-400 dark:border-gray-500 pl-3 py-2 my-2">
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <svg
                            className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                            />
                          </svg>
                          <span className="font-medium">Update todo list</span>
                        </div>
                      </div>
                    );
                  }
                })()
              ) : message.isToolUse && message.toolName === "TodoRead" ? (
                // Simple TodoRead tool indicator
                <div className="bg-gray-50/50 dark:bg-gray-800/30 border-l-2 border-gray-400 dark:border-gray-500 pl-3 py-2 my-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <svg
                      className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <span className="font-medium">Read todo list</span>
                  </div>
                </div>
              ) : (
                /* Regular assistant/error message content */
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {/* Thinking accordion for reasoning */}
                  {showThinking && message.reasoning && (
                    <details className="mb-3">
                      <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium">
                        💭 Thinking...
                      </summary>
                      <div className="mt-2 pl-4 border-l-2 border-gray-300 dark:border-gray-600 italic text-gray-600 dark:text-gray-400 text-sm">
                        <div className="whitespace-pre-wrap">{message.reasoning}</div>
                      </div>
                    </details>
                  )}

                  {(() => {
                    const content = formatUsageLimitText(String(message.content || ""));

                    // Detect if content is pure JSON
                    const trimmedContent = content.trim();
                    if (
                      (trimmedContent.startsWith("{") || trimmedContent.startsWith("[")) &&
                      (trimmedContent.endsWith("}") || trimmedContent.endsWith("]"))
                    ) {
                      try {
                        const parsed = JSON.parse(trimmedContent);
                        const formatted = JSON.stringify(parsed, null, 2);

                        return (
                          <div className="my-2">
                            <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                              </svg>
                              <span className="font-medium">JSON Response</span>
                            </div>
                            <div className="bg-gray-800 dark:bg-gray-900 border border-gray-600/30 dark:border-gray-700 rounded-lg overflow-hidden">
                              <pre className="p-4 overflow-x-auto">
                                <code className="text-gray-100 dark:text-gray-200 text-sm font-mono block whitespace-pre">
                                  {formatted}
                                </code>
                              </pre>
                            </div>
                          </div>
                        );
                      } catch (e) {
                        // Not valid JSON, fall through
                      }
                    }

                    // Normal rendering for non-JSON content
                    return message.type === "assistant" ? (
                      <Markdown className="prose prose-sm max-w-none dark:prose-invert prose-gray">
                        {content}
                      </Markdown>
                    ) : (
                      <div className="whitespace-pre-wrap">{content}</div>
                    );
                  })()}
                </div>
              )}

              <div
                className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${isGrouped ? "opacity-0 group-hover:opacity-100" : ""}`}
              >
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default MessageComponent;
