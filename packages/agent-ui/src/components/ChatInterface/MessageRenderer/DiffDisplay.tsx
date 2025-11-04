import React from "react";

/**
 * DiffDisplay component - Displays file diffs for Edit and Write operations
 * @param {Object} props
 * @param {string} props.filePath - Path to the file being modified
 * @param {string} props.oldContent - Original file content
 * @param {string} props.newContent - New file content
 * @param {Function} props.createDiff - Function to generate diff lines
 * @param {Function} props.onFileOpen - Callback when file is clicked
 * @param {string} props.label - Label for the diff (e.g., "Diff", "New File")
 * @param {boolean} props.showRawParameters - Whether to show raw parameters
 * @param {string} props.rawInput - Raw tool input JSON
 * @param {boolean} props.autoExpandTools - Whether to auto-expand details
 */
function DiffDisplay({
  filePath,
  oldContent,
  newContent,
  createDiff,
  onFileOpen,
  label = "Diff",
  showRawParameters = false,
  rawInput = "",
  autoExpandTools = false,
}) {
  const fileName = filePath?.split("/").pop() || "";
  const isNewFile = label === "New File";

  return (
    <div className="mt-3 pl-6">
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-700/60 rounded-lg overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/80 dark:to-gray-800/40 border-b border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm">
          <button
            onClick={() =>
              onFileOpen &&
              onFileOpen(filePath, {
                old_string: oldContent,
                new_string: newContent,
              })
            }
            className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 truncate cursor-pointer font-medium transition-colors"
          >
            {filePath}
          </button>
          <span
            className={`text-xs text-gray-500 dark:text-gray-400 font-medium px-2 py-0.5 rounded ${
              isNewFile
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-gray-100 dark:bg-gray-700/50"
            }`}
          >
            {label}
          </span>
        </div>
        <div className="text-xs font-mono">
          {createDiff(oldContent, newContent).map((diffLine, i) => (
            <div key={i} className="flex">
              <span
                className={`w-8 text-center border-r ${
                  diffLine.type === "removed"
                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                    : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
                }`}
              >
                {diffLine.type === "removed" ? "-" : "+"}
              </span>
              <span
                className={`px-2 py-0.5 flex-1 whitespace-pre-wrap ${
                  diffLine.type === "removed"
                    ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
                    : "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                }`}
              >
                {diffLine.content}
              </span>
            </div>
          ))}
        </div>
      </div>
      {showRawParameters && rawInput && (
        <details className="relative mt-3 pl-6 group/raw" open={autoExpandTools}>
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
          <pre className="mt-2 text-xs bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 p-3 rounded-lg whitespace-pre-wrap break-words overflow-hidden text-gray-700 dark:text-gray-300 font-mono">
            {rawInput}
          </pre>
        </details>
      )}
    </div>
  );
}

export default DiffDisplay;
