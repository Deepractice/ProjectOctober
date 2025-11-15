import * as React from "react";
import { User } from "lucide-react";
import { cn } from "~/lib/utils";

export interface UserMessageProps {
  /**
   * Message text content
   */
  content: string;
  /**
   * Message timestamp (ISO string or Date)
   */
  timestamp: string;
  /**
   * Optional image attachments
   */
  images?: Array<{ data: string; name: string }>;
  /**
   * Whether this message is grouped (hides avatar)
   */
  isGrouped?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * UserMessage - Display user's message bubble
 *
 * Single Responsibility: Render user message with text, images, and timestamp
 *
 * Design: Right-aligned, amber background (generative/user input color)
 *
 * @example
 * ```tsx
 * <UserMessage
 *   content="Hello, can you help me?"
 *   timestamp="2024-01-14T10:30:00Z"
 * />
 *
 * <UserMessage
 *   content="Check these screenshots"
 *   timestamp="2024-01-14T10:31:00Z"
 *   images={[{ data: "data:image/png;base64,...", name: "screenshot.png" }]}
 * />
 * ```
 */
export function UserMessage({
  content,
  timestamp,
  images,
  isGrouped = false,
  className,
}: UserMessageProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-end w-full sm:w-auto sm:max-w-[85%] md:max-w-md lg:max-w-lg xl:max-w-xl",
        className
      )}
    >
      <div className="flex items-end gap-2">
        {/* Message bubble */}
        <div className="bg-amber-500 text-white rounded-2xl rounded-br-md px-3 sm:px-4 py-2 shadow-sm max-w-full overflow-hidden">
          {/* Text content */}
          <div className="text-sm whitespace-pre-wrap break-words max-w-full overflow-hidden">
            {content}
          </div>

          {/* Image attachments */}
          {images && images.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img.data}
                  alt={img.name}
                  className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(img.data, "_blank")}
                  title={img.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Avatar (hidden when grouped) */}
        {!isGrouped && (
          <div className="hidden sm:flex w-8 h-8 rounded-full bg-amber-500 items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 mr-10">
        {new Date(timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
