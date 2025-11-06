import { useState } from "react";

interface AgentStatusBarProps {
  // Initial state
  initialStatus?: string | null;

  // External control (optional)
  status?: string | null;
  onStatusChange?: (status: string | null) => void;

  // Display props
  isLoading?: boolean;
  onAbort?: () => void;
  provider?: string;
  showThinking?: boolean;

  // Children (render prop pattern for custom rendering)
  children?:
    | React.ReactNode
    | ((props: {
        status: string | null;
        setStatus: (status: string | null) => void;
      }) => React.ReactNode);
}

/**
 * AgentStatusBar - Encapsulates Agent status display and management
 *
 * Manages Agent status state and provides status display UI.
 * Can be used standalone or via render prop pattern.
 */
function AgentStatusBar({
  // Initial state
  initialStatus = null,

  // External control (optional)
  status: externalStatus,
  onStatusChange,

  // Other props
  isLoading,
  onAbort,
  provider,
  showThinking,

  // Children (render prop pattern for custom rendering)
  children,
}: AgentStatusBarProps) {
  // Internal state management (only used if no external control)
  const [internalStatus, setInternalStatus] = useState<string | null>(initialStatus);

  // Use external status if provided, otherwise use internal
  const claudeStatus = externalStatus !== undefined ? externalStatus : internalStatus;

  // Update handler
  const updateStatus = (newStatus: string | null) => {
    if (externalStatus === undefined) {
      setInternalStatus(newStatus);
    }
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  };

  // Provide status control via render prop if children is a function
  if (typeof children === "function") {
    return children({
      status: claudeStatus,
      setStatus: updateStatus,
    });
  }

  // Default rendering: simple status display
  return (
    <div className="flex-1">
      {claudeStatus && (
        <div className="text-sm text-gray-600 dark:text-gray-400">{claudeStatus}</div>
      )}
      {isLoading && showThinking && (
        <div className="text-sm text-gray-500 dark:text-gray-400">Thinking...</div>
      )}
    </div>
  );
}

export default AgentStatusBar;
