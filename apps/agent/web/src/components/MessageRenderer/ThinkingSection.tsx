interface ThinkingSectionProps {
  reasoning: string;
}

export function ThinkingSection({ reasoning }: ThinkingSectionProps) {
  return (
    <details className="mb-3">
      <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium">
        💭 Thinking...
      </summary>
      <div className="mt-2 pl-4 border-l-2 border-gray-300 dark:border-gray-600 italic text-gray-600 dark:text-gray-400 text-sm">
        <div className="whitespace-pre-wrap">{reasoning}</div>
      </div>
    </details>
  );
}
