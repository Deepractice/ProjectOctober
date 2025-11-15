import * as React from "react";
import { Brain } from "lucide-react";
import { cn } from "~/lib/utils";

export interface ThinkingSectionProps {
  /**
   * The reasoning/thinking content to display
   */
  reasoning: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ThinkingSection - Display AI's extended thinking process in a collapsible panel
 *
 * Single Responsibility: Render expandable thinking/reasoning content
 *
 * Used to show Claude's internal reasoning when Extended Thinking is enabled
 *
 * @example
 * ```tsx
 * <ThinkingSection reasoning="First, I need to analyze..." />
 * ```
 */
export function ThinkingSection({ reasoning, className }: ThinkingSectionProps) {
  return (
    <details className={cn("mb-3", className)}>
      <summary className="cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium flex items-center gap-2 select-none">
        <Brain className="w-4 h-4" />
        <span>Thinking...</span>
      </summary>
      <div className="mt-2 pl-4 border-l-2 border-slate-300 dark:border-slate-600 italic text-slate-600 dark:text-slate-400 text-sm">
        <div className="whitespace-pre-wrap">{reasoning}</div>
      </div>
    </details>
  );
}
