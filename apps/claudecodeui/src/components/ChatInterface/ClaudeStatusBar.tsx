import { useState } from 'react';
import ClaudeStatus from '../ClaudeStatus';

/**
 * ClaudeStatusBar - Encapsulates Claude status display and management
 *
 * Manages Claude status state and provides status display UI.
 * Can be used standalone or via render prop pattern.
 */
function ClaudeStatusBar({
  // Initial state
  initialStatus = null,

  // External control (optional)
  status: externalStatus,
  onStatusChange,

  // Other props for ClaudeStatus component
  isLoading,
  onAbort,
  provider,
  showThinking,

  // Children (render prop pattern for custom rendering)
  children
}) {
  // Internal state management (only used if no external control)
  const [internalStatus, setInternalStatus] = useState(initialStatus);

  // Use external status if provided, otherwise use internal
  const claudeStatus = externalStatus !== undefined ? externalStatus : internalStatus;

  // Update handler
  const updateStatus = (newStatus) => {
    if (externalStatus === undefined) {
      setInternalStatus(newStatus);
    }
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  };

  // Provide status control via render prop if children is a function
  if (typeof children === 'function') {
    return children({
      status: claudeStatus,
      setStatus: updateStatus
    });
  }

  // Default rendering: display ClaudeStatus component
  return (
    <div className="flex-1">
      <ClaudeStatus
        status={claudeStatus}
        isLoading={isLoading}
        onAbort={onAbort}
        provider={provider}
      />
    </div>
  );
}

export default ClaudeStatusBar;
