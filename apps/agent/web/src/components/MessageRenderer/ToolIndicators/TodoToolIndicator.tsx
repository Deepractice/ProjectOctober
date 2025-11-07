import TodoList from "~/components/TodoList";

interface TodoToolIndicatorProps {
  toolInput: string;
  toolName: "TodoWrite" | "TodoRead";
}

export function TodoToolIndicator({ toolInput, toolName }: TodoToolIndicatorProps) {
  const icon = (
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
        d={
          toolName === "TodoWrite"
            ? "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            : "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        }
      />
    </svg>
  );

  if (toolName === "TodoWrite") {
    try {
      const input = JSON.parse(toolInput);
      if (input.todos && Array.isArray(input.todos)) {
        return (
          <div className="bg-gray-50/50 dark:bg-gray-800/30 border-l-2 border-gray-400 dark:border-gray-500 pl-3 py-2 my-2">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
              {icon}
              <span className="font-medium">Update todo list</span>
            </div>
            <TodoList todos={input.todos} />
          </div>
        );
      }
    } catch (_e) {
      // Parsing failed, show simple indicator
    }
  }

  // TodoRead or failed parsing
  return (
    <div className="bg-gray-50/50 dark:bg-gray-800/30 border-l-2 border-gray-400 dark:border-gray-500 pl-3 py-2 my-2">
      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
        {icon}
        <span className="font-medium">
          {toolName === "TodoWrite" ? "Update todo list" : "Read todo list"}
        </span>
      </div>
    </div>
  );
}
