import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

const avatarVariants = cva("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", {
  variants: {
    variant: {
      primary: "bg-blue-600", // AI Assistant / computational
      secondary: "bg-amber-500", // User / generative
      success: "bg-green-600", // Success / completed
      warning: "bg-yellow-600", // Warning
      error: "bg-red-600", // Error / destructive
      info: "bg-blue-500", // System / tool / info
      neutral: "bg-slate-500", // Neutral / default
    },
    size: {
      sm: "w-6 h-6",
      md: "w-8 h-8",
      lg: "w-10 h-10",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export interface MessageAvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  /**
   * Label text to display next to avatar
   */
  label: string;
  /**
   * Icon to display in avatar (lucide-react icon component)
   */
  icon?: React.ReactNode;
  /**
   * Image URL for avatar (overrides icon)
   */
  src?: string;
  /**
   * Alt text for image
   */
  alt?: string;
}

/**
 * MessageAvatar - Display avatar with icon/image and label
 *
 * A flexible avatar component for message headers. Supports icons, images,
 * and multiple color variants for different message types or agents.
 *
 * Design System Colors:
 * - Primary (Blue): AI Assistant, computational tasks
 * - Secondary (Amber): User messages, generative tasks
 * - Info (Light Blue): System messages, tools
 * - Error (Red): Error messages
 * - Success (Green): Success messages
 * - Neutral (Gray): Default/unknown
 *
 * @example
 * ```tsx
 * // With icon
 * <MessageAvatar
 *   label="AI Assistant"
 *   variant="primary"
 *   icon={<Bot className="w-5 h-5 text-white" />}
 * />
 *
 * // With image
 * <MessageAvatar
 *   label="Agent Smith"
 *   variant="info"
 *   src="/avatars/agent-smith.png"
 *   alt="Agent Smith"
 * />
 *
 * // Simple text avatar
 * <MessageAvatar label="System" variant="neutral" />
 * ```
 */
export const MessageAvatar = React.forwardRef<HTMLDivElement, MessageAvatarProps>(
  ({ label, icon, src, alt, variant, size, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex items-center gap-3 mb-2", className)} {...props}>
        {/* Avatar */}
        <div className={cn(avatarVariants({ variant, size }))}>
          {src ? (
            <img src={src} alt={alt || label} className="w-full h-full rounded-full object-cover" />
          ) : icon ? (
            icon
          ) : (
            <span className="text-white font-medium text-sm">{label.charAt(0).toUpperCase()}</span>
          )}
        </div>

        {/* Label */}
        <div className="text-sm font-medium text-slate-900 dark:text-white">{label}</div>
      </div>
    );
  }
);

MessageAvatar.displayName = "MessageAvatar";

export { avatarVariants };
