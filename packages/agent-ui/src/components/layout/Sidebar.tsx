import * as React from "react";
import { cn } from "~/lib/utils";

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Initial width in pixels
   * @default 256
   */
  width?: number;
  /**
   * Minimum width in pixels
   * @default 200
   */
  minWidth?: number;
  /**
   * Maximum width in pixels
   * @default 600
   */
  maxWidth?: number;
  /**
   * Position of the sidebar
   * @default 'left'
   */
  position?: "left" | "right";
  /**
   * Sidebar content
   */
  children: React.ReactNode;
}

/**
 * Sidebar - Resizable sidebar container
 *
 * A container for sidebar content with consistent styling.
 * Should be used with Allotment for resizing functionality.
 *
 * @example
 * ```tsx
 * <Allotment>
 *   <Allotment.Pane minSize={200} maxSize={600} preferredSize={256}>
 *     <Sidebar>
 *       <SessionList sessions={sessions} />
 *     </Sidebar>
 *   </Allotment.Pane>
 *   <Allotment.Pane>
 *     <MainContent />
 *   </Allotment.Pane>
 * </Allotment>
 * ```
 */
export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      width = 256,
      minWidth = 200,
      maxWidth = 600,
      position = "left",
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "h-full flex flex-col",
          "bg-muted/30 border-border",
          position === "left" ? "border-r" : "border-l",
          className
        )}
        style={{
          width: `${width}px`,
          minWidth: `${minWidth}px`,
          maxWidth: `${maxWidth}px`,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Sidebar.displayName = "Sidebar";
