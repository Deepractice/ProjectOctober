import React, { useState, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { UserMessage } from "./UserMessage";
import { AssistantMessage } from "./AssistantMessage";
import { MessageHeader } from "./MessageHeader";
import { ReadToolIndicator, TodoToolIndicator } from "./ToolIndicators";
import ToolUseDisplay from "./ToolUseDisplay";
import DiffDisplay from "./DiffDisplay";
import type { ProjectInfo } from "~/types";

/**
 * Utility function to decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  if (!text) return text;
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/**
 * Normalize markdown text where providers mistakenly wrap short inline code with single-line triple fences.
 */
function normalizeInlineCodeFences(text: string): string {
  if (!text || typeof text !== "string") return text;
  try {
    return text.replace(/```\s*([^\n\r]+?)\s*```/g, "`$1`");
  } catch {
    return text;
  }
}

/**
 * Format "Agent AI usage limit reached|<epoch>" into a local time string
 */
function formatUsageLimitText(text: string): string {
  try {
    if (typeof text !== "string") return text;
    return text.replace(/Agent AI usage limit reached\|(\d{10,13})/g, (match, ts) => {
      let timestampMs = parseInt(ts, 10);
      if (!Number.isFinite(timestampMs)) return match;
      if (timestampMs < 1e12) timestampMs *= 1000;
      const reset = new Date(timestampMs);

      const timeStr = new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(reset);

      const offsetMinutesLocal = -reset.getTimezoneOffset();
      const sign = offsetMinutesLocal >= 0 ? "+" : "-";
      const abs = Math.abs(offsetMinutesLocal);
      const offH = Math.floor(abs / 60);
      const offM = abs % 60;
      const gmt = `GMT${sign}${offH}${offM ? ":" + String(offM).padStart(2, "0") : ""}`;
      const tzId = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      const cityRaw = tzId.split("/").pop() || "";
      const city = cityRaw
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const tzHuman = city ? `${gmt} (${city})` : gmt;

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const dateReadable = `${reset.getDate()} ${months[reset.getMonth()]} ${reset.getFullYear()}`;

      return `Agent usage limit reached. Your limit will reset at **${timeStr} ${tzHuman}** - ${dateReadable}`;
    });
  } catch {
    return text;
  }
}

/**
 * Code component for markdown
 */
const CodeComponent = ({ node, inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const raw = Array.isArray(children) ? children.join("") : String(children ?? "");
  const looksMultiline = /[\r\n]/.test(raw);
  const inlineDetected = inline || (node && node.type === "inlineCode");
  const shouldInline = inlineDetected || !looksMultiline;

  if (shouldInline) {
    return (
      <code
        className={`font-mono text-[0.9em] px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-900 border border-gray-200 dark:bg-gray-800/60 dark:text-gray-100 dark:border-gray-700 whitespace-pre-wrap break-words ${className || ""}`}
        {...props}
      >
        {children}
      </code>
    );
  }

  const handleCopy = () => {
    const doSet = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard
          .writeText(raw)
          .then(doSet)
          .catch(() => fallbackCopy(raw, doSet));
      } else {
        fallbackCopy(raw, doSet);
      }
    } catch {
      // Fallback copy will be handled if clipboard API fails
    }
  };

  const fallbackCopy = (text: string, callback: () => void) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch {
      // execCommand may fail in some browsers
    }
    document.body.removeChild(ta);
    callback();
  };

  return (
    <div className="relative group my-2">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 rounded-md bg-gray-700/80 hover:bg-gray-700 text-white"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="bg-gray-900 border border-gray-700/40 rounded-lg p-3 overflow-x-auto">
        <code className={`text-gray-100 text-sm font-mono ${className || ""}`} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
};

/**
 * Common markdown components
 */
const markdownComponents = {
  code: CodeComponent,
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-2">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      className="text-blue-600 dark:text-blue-400 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  p: ({ children }: any) => <div className="mb-2 last:mb-0">{children}</div>,
};

/**
 * Markdown wrapper component
 */
const Markdown = ({ children, className }: { children: string; className?: string }) => {
  const content = normalizeInlineCodeFences(String(children ?? ""));
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

interface MessageRendererProps {
  message: any;
  index: number;
  prevMessage: any | null;
  createDiff: (
    oldCode: string,
    newCode: string
  ) => Array<{ type: string; content: string; lineNum: number }>;
  onFileOpen?: (filePath: string) => void;
  onShowSettings?: () => void;
  autoExpandTools: boolean;
  showRawParameters: boolean;
  showThinking: boolean;
  selectedProject: ProjectInfo;
}

/**
 * Main MessageRenderer component
 */
const MessageRenderer = memo(
  ({
    message,
    index: _index,
    prevMessage,
    createDiff,
    onFileOpen,
    onShowSettings,
    autoExpandTools,
    showRawParameters,
    showThinking,
    selectedProject,
  }: MessageRendererProps) => {
    const isGrouped =
      prevMessage &&
      prevMessage.type === message.type &&
      ["assistant", "user", "tool", "error"].includes(prevMessage.type);

    const messageRef = React.useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = React.useState(false);

    // Auto-expand tool use when it comes into view
    React.useEffect(() => {
      const currentElement = messageRef.current;
      if (!autoExpandTools || !currentElement || !message.isToolUse) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !isExpanded && messageRef.current) {
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

      observer.observe(currentElement);

      return () => {
        observer.unobserve(currentElement);
      };
    }, [autoExpandTools, isExpanded, message.isToolUse]);

    return (
      <div
        ref={messageRef}
        className={`chat-message ${message.type} ${isGrouped ? "grouped" : ""} ${message.type === "user" ? "flex justify-end px-3 sm:px-0" : "px-3 sm:px-0"}`}
      >
        {message.type === "user" ? (
          <UserMessage
            content={message.content}
            timestamp={message.timestamp}
            images={message.images}
            isGrouped={isGrouped}
          />
        ) : (
          <div className="w-full">
            {!isGrouped && <MessageHeader messageType={message.type} />}

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
                <ReadToolIndicator toolInput={message.toolInput} onFileOpen={onFileOpen} />
              ) : message.isToolUse &&
                (message.toolName === "TodoWrite" || message.toolName === "TodoRead") ? (
                <TodoToolIndicator toolInput={message.toolInput} toolName={message.toolName} />
              ) : (
                <AssistantMessage
                  content={message.content}
                  timestamp={message.timestamp}
                  reasoning={message.reasoning}
                  showThinking={showThinking}
                  messageType={message.type}
                  isGrouped={isGrouped}
                />
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

MessageRenderer.displayName = "MessageRenderer";

// Exports
export {
  ToolUseDisplay,
  DiffDisplay,
  Markdown,
  formatUsageLimitText,
  decodeHtmlEntities,
  normalizeInlineCodeFences,
  markdownComponents,
};

export default MessageRenderer;
