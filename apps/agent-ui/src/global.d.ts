/**
 * Global type declarations
 */

// Extend Window interface
declare global {
  interface Window {
    refreshSessions?: () => void;
    openSettings?: () => void;
  }

  // Extend Navigator for PWA detection
  interface Navigator {
    standalone?: boolean;
  }
}

export {};
