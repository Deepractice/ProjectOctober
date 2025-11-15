import * as React from "react";
import { MarkdownText } from "../content/MarkdownText";
import { JSONRenderer } from "../content/JSONRenderer";
import { ThinkingSection } from "./ThinkingSection";
import { formatUsageLimitText } from "~/lib/utils";

export interface AssistantMessageProps {
  /**
   * Message content (text, markdown, or JSON)
   */
  content: string;
  /**
   * Message timestamp
   */
  timestamp: string;
  /**
   * Extended thinking/reasoning content
   */
  reasoning?: string;
  /**
   * Whether to show the thinking section
   */
  showThinking?: boolean;
  /**
   * Message type
   */
  messageType?: "assistant" | "error";
  /**
   * Whether this message is grouped with previous message
   */
  isGrouped?: boolean;
}

/**
 * AssistantMessage - Displays AI assistant responses
 *
 * Handles three types of content:
 * - Markdown text (default for assistant messages)
 * - JSON data (auto-detected and formatted)
 * - Plain text (for error messages)
 *
 * @example
 * ```tsx
 * <AssistantMessage
 *   content="Here's a **markdown** response"
 *   timestamp="2024-01-14T10:30:00Z"
 *   messageType="assistant"
 * />
 * ```
 */
export const AssistantMessage = ({
  content,
  timestamp,
  reasoning,
  showThinking = true,
  messageType = "assistant",
  isGrouped = false,
}: AssistantMessageProps) => {
  const formattedContent = formatUsageLimitText(String(content || ""));

  // Detect if content is pure JSON
  const trimmedContent = formattedContent.trim();
  const isJSON =
    (trimmedContent.startsWith("{") || trimmedContent.startsWith("[")) &&
    (trimmedContent.endsWith("}") || trimmedContent.endsWith("]"));

  return (
    <div className="text-sm text-gray-700 dark:text-gray-300">
      {/* Thinking accordion for reasoning */}
      {showThinking && reasoning && <ThinkingSection reasoning={reasoning} />}

      {/* Content rendering */}
      {isJSON ? (
        <JSONRenderer content={trimmedContent} />
      ) : messageType === "assistant" ? (
        <MarkdownText className="prose prose-sm max-w-none dark:prose-invert prose-gray">
          {formattedContent}
        </MarkdownText>
      ) : (
        <div className="whitespace-pre-wrap">{formattedContent}</div>
      )}

      {/* Timestamp */}
      <div
        className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${isGrouped ? "opacity-0 group-hover:opacity-100" : ""}`}
      >
        {new Date(timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};

AssistantMessage.displayName = "AssistantMessage";
