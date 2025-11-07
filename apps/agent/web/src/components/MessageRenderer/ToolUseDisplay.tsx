import React from "react";
import TodoList from "~/components/TodoList";
import { api } from "~/utils/api";
import DiffDisplay from "./DiffDisplay";
import { Markdown } from "./index";

/**
 * ToolUseDisplay component - Displays tool usage information and results
 */
function ToolUseDisplay({
  message,
  autoExpandTools = false,
  showRawParameters = false,
  showThinking: _showThinking = false,
  onFileOpen,
  onShowSettings,
  selectedProject,
  createDiff,
}) {
  // Minimize Grep and Glob tools since they happen frequently
  const isSearchTool = ["Grep", "Glob"].includes(message.toolName);

  if (isSearchTool) {
    return (
      <div className="group relative bg-gray-50/50 dark:bg-gray-800/30 border-l-2 border-blue-400 dark:border-blue-500 pl-3 py-2 my-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 flex-1 min-w-0">
            <svg
              className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="font-medium flex-shrink-0">{message.toolName}</span>
            <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">•</span>
            {message.toolInput &&
              (() => {
                try {
                  const input = JSON.parse(message.toolInput);
                  return (
                    <span className="font-mono truncate flex-1 min-w-0">
                      {input.pattern && (
                        <span>
                          pattern:{" "}
                          <span className="text-blue-600 dark:text-blue-400">{input.pattern}</span>
                        </span>
                      )}
                      {input.path && <span className="ml-2">in: {input.path}</span>}
                    </span>
                  );
                } catch (_e) {
                  return null;
                }
              })()}
          </div>
          {message.toolResult && (
            <a
              href={`#tool-result-${message.toolId}`}
              className="flex-shrink-0 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors flex items-center gap-1"
            >
              <span>results</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </a>
          )}
        </div>
      </div>
    );
  }

  // Full display for other tools
  return (
    <div className="group relative bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100/30 dark:border-blue-800/30 rounded-lg p-3 mb-2">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 to-indigo-500/3 dark:from-blue-400/3 dark:to-indigo-400/3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="relative flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 dark:shadow-blue-400/20">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <div className="absolute inset-0 rounded-lg bg-blue-500 dark:bg-blue-400 animate-pulse opacity-20"></div>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">
              {message.toolName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {message.toolId}
            </span>
          </div>
        </div>
        {onShowSettings && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowSettings();
            }}
            className="p-2 rounded-lg hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-200 group/btn backdrop-blur-sm"
            title="Tool Settings"
          >
            <svg
              className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Tool Input Display */}
      {message.toolInput &&
        renderToolInput(
          message,
          autoExpandTools,
          showRawParameters,
          onFileOpen,
          selectedProject,
          createDiff
        )}

      {/* Tool Result Section */}
      {message.toolResult &&
        renderToolResult(message, autoExpandTools, onFileOpen, selectedProject, createDiff)}
    </div>
  );
}

// Helper function to render tool-specific input
function renderToolInput(
  message,
  autoExpandTools,
  showRawParameters,
  onFileOpen,
  selectedProject,
  createDiff
) {
  // Edit tool - show diff
  if (message.toolName === "Edit") {
    try {
      const input = JSON.parse(message.toolInput);
      if (input.file_path && input.old_string && input.new_string) {
        return (
          <details className="relative mt-3 group/details" open={autoExpandTools}>
            <summary className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 p-2.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50">
              <svg
                className="w-4 h-4 transition-transform duration-200 group-open/details:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              <span className="flex items-center gap-2">
                <span>View edit diff for</span>
              </span>
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!onFileOpen) return;

                  try {
                    const response = await api.readFile(input.file_path);
                    const data = await response.json();

                    if (!response.ok || data.error) {
                      onFileOpen(input.file_path);
                      return;
                    }

                    const currentContent = data.content || "";
                    const oldContent = currentContent.replace(input.new_string, input.old_string);

                    onFileOpen(input.file_path, {
                      old_string: oldContent,
                      new_string: currentContent,
                    });
                  } catch (_error) {
                    console.error("Error preparing diff:", _error);
                    onFileOpen(input.file_path);
                  }
                }}
                className="px-2.5 py-1 rounded-md bg-white/60 dark:bg-gray-800/60 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-mono text-xs font-medium transition-all duration-200 shadow-sm"
              >
                {input.file_path.split("/").pop()}
              </button>
            </summary>
            <DiffDisplay
              filePath={input.file_path}
              oldContent={input.old_string}
              newContent={input.new_string}
              createDiff={createDiff}
              onFileOpen={onFileOpen}
              label="Diff"
              showRawParameters={showRawParameters}
              rawInput={message.toolInput}
              autoExpandTools={autoExpandTools}
            />
          </details>
        );
      }
    } catch (_e) {
      // Fall through to default display
    }
  }

  // Write tool - show new file diff
  if (message.toolName === "Write") {
    try {
      const input =
        typeof message.toolInput === "string" ? JSON.parse(message.toolInput) : message.toolInput;

      if (input.file_path && input.content !== undefined) {
        return (
          <details className="relative mt-3 group/details" open={autoExpandTools}>
            <summary className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 p-2.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50">
              <svg
                className="w-4 h-4 transition-transform duration-200 group-open/details:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              <span className="flex items-center gap-2">
                <span className="text-lg leading-none">📄</span>
                <span>Creating new file:</span>
              </span>
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!onFileOpen) return;

                  try {
                    const response = await api.readFile(input.file_path);
                    const data = await response.json();
                    const newContent =
                      response.ok && !data.error ? data.content || "" : input.content || "";

                    onFileOpen(input.file_path, {
                      old_string: "",
                      new_string: newContent,
                    });
                  } catch (_error) {
                    onFileOpen(input.file_path, {
                      old_string: "",
                      new_string: input.content || "",
                    });
                  }
                }}
                className="px-2.5 py-1 rounded-md bg-white/60 dark:bg-gray-800/60 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-mono text-xs font-medium transition-all duration-200 shadow-sm"
              >
                {input.file_path.split("/").pop()}
              </button>
            </summary>
            <DiffDisplay
              filePath={input.file_path}
              oldContent=""
              newContent={input.content}
              createDiff={createDiff}
              onFileOpen={onFileOpen}
              label="New File"
              showRawParameters={showRawParameters}
              rawInput={message.toolInput}
              autoExpandTools={autoExpandTools}
            />
          </details>
        );
      }
    } catch (_e) {
      // Fall through
    }
  }

  // TodoWrite tool - show todo list
  if (message.toolName === "TodoWrite") {
    try {
      const input = JSON.parse(message.toolInput);
      if (input.todos && Array.isArray(input.todos)) {
        return (
          <details className="relative mt-3 group/todo" open={autoExpandTools}>
            <summary className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 p-2.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50">
              <svg
                className="w-4 h-4 transition-transform duration-200 group-open/todo:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              <span className="flex items-center gap-2">
                <span className="text-lg leading-none">✓</span>
                <span>Updating Todo List</span>
              </span>
            </summary>
            <div className="mt-3">
              <TodoList todos={input.todos} />
              {showRawParameters && (
                <details className="relative mt-3 group/raw" open={autoExpandTools}>
                  <summary className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50">
                    <svg
                      className="w-3 h-3 transition-transform duration-200 group-open/raw:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                    View raw parameters
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 p-3 rounded-lg overflow-x-auto text-gray-700 dark:text-gray-300 font-mono">
                    {message.toolInput}
                  </pre>
                </details>
              )}
            </div>
          </details>
        );
      }
    } catch (_e) {
      // Fall through
    }
  }

  // Bash tool - show command
  if (message.toolName === "Bash") {
    try {
      const input = JSON.parse(message.toolInput);
      return (
        <div className="my-2">
          <div className="bg-gray-900 dark:bg-gray-950 rounded-md px-3 py-2 font-mono text-sm">
            <span className="text-green-400">$</span>
            <span className="text-gray-100 ml-2">{input.command}</span>
          </div>
          {input.description && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic ml-1">
              {input.description}
            </div>
          )}
        </div>
      );
    } catch (_e) {
      // Fall through
    }
  }

  // Read tool - show filename
  if (message.toolName === "Read") {
    try {
      const input = JSON.parse(message.toolInput);
      if (input.file_path) {
        const filename = input.file_path.split("/").pop();
        return (
          <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
            Read{" "}
            <button
              onClick={() => onFileOpen && onFileOpen(input.file_path)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline font-mono"
            >
              {filename}
            </button>
          </div>
        );
      }
    } catch (_e) {
      // Fall through
    }
  }

  // exit_plan_mode tool - show plan
  if (message.toolName === "exit_plan_mode") {
    try {
      const input = JSON.parse(message.toolInput);
      if (input.plan) {
        const planContent = input.plan.replace(/\\n/g, "\n");
        return (
          <details className="mt-2" open={autoExpandTools}>
            <summary className="text-sm text-blue-700 dark:text-blue-300 cursor-pointer hover:text-blue-800 dark:hover:text-blue-200 flex items-center gap-2">
              <svg
                className="w-4 h-4 transition-transform details-chevron"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              📋 View implementation plan
            </summary>
            <Markdown className="mt-3 prose prose-sm max-w-none dark:prose-invert">
              {planContent}
            </Markdown>
          </details>
        );
      }
    } catch (_e) {
      // Fall through
    }
  }

  // Default: show raw input parameters
  return (
    <details className="relative mt-3 group/params" open={autoExpandTools}>
      <summary className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 p-2.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50">
        <svg
          className="w-4 h-4 transition-transform duration-200 group-open/params:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        View input parameters
      </summary>
      <pre className="mt-3 text-xs bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 p-3 rounded-lg whitespace-pre-wrap break-words overflow-hidden text-gray-700 dark:text-gray-300 font-mono">
        {message.toolInput}
      </pre>
    </details>
  );
}

// Helper function to render tool result (to be continued in next file due to size)
function renderToolResult(message, autoExpandTools, onFileOpen, selectedProject, createDiff) {
  // Hide tool results for Edit/Write/Bash unless there's an error
  const shouldHideResult =
    !message.toolResult.isError &&
    (message.toolName === "Edit" ||
      message.toolName === "Write" ||
      message.toolName === "ApplyPatch" ||
      message.toolName === "Bash");

  if (shouldHideResult) {
    return null;
  }

  return (
    <div
      id={`tool-result-${message.toolId}`}
      className={`relative mt-4 p-4 rounded-lg border backdrop-blur-sm scroll-mt-4 ${
        message.toolResult.isError
          ? "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200/60 dark:border-red-800/60"
          : "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/60 dark:border-green-800/60"
      }`}
    >
      {/* Decorative gradient overlay */}
      <div
        className={`absolute inset-0 rounded-lg opacity-50 ${
          message.toolResult.isError
            ? "bg-gradient-to-br from-red-500/5 to-rose-500/5 dark:from-red-400/5 dark:to-rose-400/5"
            : "bg-gradient-to-br from-green-500/5 to-emerald-500/5 dark:from-green-400/5 dark:to-emerald-400/5"
        }`}
      ></div>

      <div className="relative flex items-center gap-2.5 mb-3">
        <div
          className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-md ${
            message.toolResult.isError
              ? "bg-gradient-to-br from-red-500 to-rose-600 dark:from-red-400 dark:to-rose-500 shadow-red-500/20"
              : "bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-400 dark:to-emerald-500 shadow-green-500/20"
          }`}
        >
          <svg
            className="w-3.5 h-3.5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {message.toolResult.isError ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            )}
          </svg>
        </div>
        <span
          className={`text-sm font-semibold ${
            message.toolResult.isError
              ? "text-red-800 dark:text-red-200"
              : "text-green-800 dark:text-green-200"
          }`}
        >
          {message.toolResult.isError ? "Tool Error" : "Tool Result"}
        </span>
      </div>

      <div
        className={`relative text-sm ${
          message.toolResult.isError
            ? "text-red-900 dark:text-red-100"
            : "text-green-900 dark:text-green-100"
        }`}
      >
        {renderToolResultContent(message, autoExpandTools, onFileOpen, selectedProject, createDiff)}
      </div>
    </div>
  );
}

// Render tool result content with special handling
function renderToolResultContent(
  message,
  autoExpandTools,
  onFileOpen,
  _selectedProject,
  _createDiff
) {
  const content = String(message.toolResult.content || "");

  // TodoWrite/TodoRead results
  if (
    (message.toolName === "TodoWrite" || message.toolName === "TodoRead") &&
    (content.includes("Todos have been modified successfully") ||
      content.includes("Todo list") ||
      (content.startsWith("[") && content.includes('"content"') && content.includes('"status"')))
  ) {
    try {
      let todos = null;
      if (content.startsWith("[")) {
        todos = JSON.parse(content);
      } else if (content.includes("Todos have been modified successfully")) {
        return (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">Todo list has been updated successfully</span>
            </div>
          </div>
        );
      }

      if (todos && Array.isArray(todos)) {
        return (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-medium">Current Todo List</span>
            </div>
            <TodoList todos={todos} isResult={true} />
          </div>
        );
      }
    } catch (_e) {
      // Fall through
    }
  }

  // Grep/Glob results with filenames
  if (
    (message.toolName === "Grep" || message.toolName === "Glob") &&
    message.toolResult?.toolUseResult
  ) {
    const toolData = message.toolResult.toolUseResult;

    if (toolData.filenames && Array.isArray(toolData.filenames) && toolData.filenames.length > 0) {
      return (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-medium">
              Found {toolData.numFiles || toolData.filenames.length}{" "}
              {toolData.numFiles === 1 || toolData.filenames.length === 1 ? "file" : "files"}
            </span>
          </div>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {toolData.filenames.map((filePath, index) => {
              const fileName = filePath.split("/").pop();
              const dirPath = filePath.substring(0, filePath.lastIndexOf("/"));

              return (
                <div
                  key={index}
                  onClick={() => onFileOpen && onFileOpen(filePath)}
                  className="group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-green-100/50 dark:hover:bg-green-800/20 cursor-pointer transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-medium text-green-800 dark:text-green-200 truncate group-hover:text-green-900 dark:group-hover:text-green-100">
                      {fileName}
                    </div>
                    <div className="font-mono text-xs text-green-600/70 dark:text-green-400/70 truncate">
                      {dirPath}
                    </div>
                  </div>
                  <svg
                    className="w-4 h-4 text-green-600 dark:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  }

  // Write tool success message
  if (message.toolName === "Write" && !message.toolResult.isError) {
    return (
      <div className="text-green-700 dark:text-green-300">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-medium">File written successfully</span>
        </div>
        <p className="text-xs mt-1 text-green-600 dark:text-green-400">
          The file content is displayed in the diff view above
        </p>
      </div>
    );
  }

  // Long content - collapse it
  if (content.length > 300) {
    return (
      <details open={autoExpandTools}>
        <summary className="text-sm text-green-700 dark:text-green-300 cursor-pointer hover:text-green-800 dark:hover:text-green-200 mb-2 flex items-center gap-2">
          <svg
            className="w-4 h-4 transition-transform details-chevron"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          View full output ({content.length} chars)
        </summary>
        <Markdown className="mt-2 prose prose-sm max-w-none prose-green dark:prose-invert">
          {content}
        </Markdown>
      </details>
    );
  }

  // Default: render as markdown
  return (
    <Markdown className="prose prose-sm max-w-none prose-green dark:prose-invert">
      {content}
    </Markdown>
  );
}

export default ToolUseDisplay;
