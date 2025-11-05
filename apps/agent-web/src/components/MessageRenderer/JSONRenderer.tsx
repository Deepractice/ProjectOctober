interface JSONRendererProps {
  content: string;
}

export function JSONRenderer({ content }: JSONRendererProps) {
  try {
    const parsed = JSON.parse(content);
    const formatted = JSON.stringify(parsed, null, 2);

    return (
      <div className="my-2">
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    // Not valid JSON, return null and let parent handle
    return null;
  }
}
