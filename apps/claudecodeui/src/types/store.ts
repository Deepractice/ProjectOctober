/**
 * Zustand Store Types
 */

/**
 * UI Store State
 */
export interface UIState {
  // UI Preferences
  autoExpandTools: boolean;
  showRawParameters: boolean;
  showThinking: boolean;
  autoScrollToBottom: boolean;
  sendByCtrlEnter: boolean;
  sidebarVisible: boolean;

  // Toggle Actions
  toggleAutoExpandTools: () => void;
  toggleShowRawParameters: () => void;
  toggleShowThinking: () => void;
  toggleAutoScrollToBottom: () => void;
  toggleSendByCtrlEnter: () => void;
  toggleSidebar: () => void;

  // Setter Actions
  setAutoExpandTools: (value: boolean) => void;
  setShowRawParameters: (value: boolean) => void;
  setShowThinking: (value: boolean) => void;
  setAutoScrollToBottom: (value: boolean) => void;
  setSendByCtrlEnter: (value: boolean) => void;
  setSidebarVisible: (value: boolean) => void;

  // Reset
  resetPreferences: () => void;
}

/**
 * Connection Store State
 */
export interface ConnectionState {
  ws: WebSocket | null;
  isConnected: boolean;
  connectionError: string | null;
  reconnectAttempts: number;

  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: any) => void;
  setConnectionError: (error: string | null) => void;
}
