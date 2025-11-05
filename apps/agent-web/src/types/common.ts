/**
 * Common Types
 */

/**
 * API Response Types
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SessionsResponse {
  sessions: import("./session").Session[];
}

/**
 * Component Props
 */
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Event Handlers
 */
export type VoidFunction = () => void;
export type AsyncVoidFunction = () => Promise<void>;

/**
 * Utility Types
 */
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;
