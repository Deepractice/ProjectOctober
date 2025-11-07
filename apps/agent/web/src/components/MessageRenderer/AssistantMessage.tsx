import { Markdown, formatUsageLimitText } from "./index";
import { ThinkingSection } from "./ThinkingSection";
import { JSONRenderer } from "./JSONRenderer";

interface AssistantMessageProps {
  content: string;
  timestamp: string;
  reasoning?: string;
  showThinking: boolean;
  messageType: "assistant" | "error";
  isGrouped: boolean;
}

export function AssistantMessage({
  content,
  timestamp,
  reasoning,
  showThinking,
  messageType,
  isGrouped,
}: AssistantMessageProps) {
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
        <Markdown className="prose prose-sm max-w-none dark:prose-invert prose-gray">
          {formattedContent}
        </Markdown>
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
}
