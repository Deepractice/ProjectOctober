interface ReadToolIndicatorProps {
  toolInput: string;
  onFileOpen?: (filePath: string) => void;
}

export function ReadToolIndicator({ toolInput, onFileOpen }: ReadToolIndicatorProps) {
  try {
    const input = JSON.parse(toolInput);
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
    // Parsing failed, show simple indicator
  }

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
