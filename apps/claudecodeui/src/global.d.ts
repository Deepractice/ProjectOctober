/**
 * Global type declarations
 */

// Extend Window interface
declare global {
  interface Window {
    refreshSessions?: () => void;
    openSettings?: () => void;
  }
}

export {};
