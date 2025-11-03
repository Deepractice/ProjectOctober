/**
 * Session Types
 */

export interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  __provider?: 'claude' | 'cursor';
}

export type SessionId = string;

export interface SessionState {
  // State
  sessions: Session[];
  selectedSession: Session | null;
  isLoading: boolean;
  error: string | null;

  // Session Protection System
  activeSessions: Set<SessionId>;
  processingSessions: Set<SessionId>;

  // Navigation
  pendingNavigation: SessionId | null;

  // Tracking
  lastFetchTime: number;
  pendingOperations: Set<string>;

  // CRUD Operations
  setSessions: (sessions: Session[]) => void;
  setSelectedSession: (session: Session | null) => void;
  addSession: (session: Session) => void;
  updateSession: (sessionId: SessionId, updates: Partial<Session>) => void;
  removeSession: (sessionId: SessionId) => void;

  // Session Protection System
  markSessionActive: (sessionId: SessionId) => void;
  markSessionInactive: (sessionId: SessionId) => void;
  isSessionActive: (sessionId: SessionId) => boolean;
  markSessionProcessing: (sessionId: SessionId) => void;
  markSessionNotProcessing: (sessionId: SessionId) => void;
  isSessionProcessing: (sessionId: SessionId) => boolean;
  replaceTemporarySession: (realSessionId: SessionId) => void;

  // Navigation management
  setPendingNavigation: (sessionId: SessionId | null) => void;
  clearPendingNavigation: () => void;

  // API Operations
  refreshSessions: (force?: boolean) => Promise<void>;
  deleteSession: (sessionId: SessionId) => Promise<void>;

  // Helper
  isUpdateAdditive: (updatedSessions: Session[], selectedSession: Session | null) => boolean;

  // WebSocket Message Handlers
  handleSessionCreated: (sessionId: SessionId, tempData?: Partial<Session> | null) => void;
  handleSessionsUpdated: (updatedSessions: Session[]) => void;
  handleAgentComplete: (sessionId: SessionId) => void;
  handleSessionAborted: (sessionId: SessionId) => void;
  handleSessionStatus: (sessionId: SessionId, isProcessing: boolean) => void;
}
