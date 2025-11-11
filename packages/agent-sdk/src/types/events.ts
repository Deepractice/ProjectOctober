export interface PerformanceMetrics {
  avgResponseTime: number;
  totalSessions: number;
  cacheHitRate: number;
}

export interface AgentStatus {
  ready: boolean;
  warmupPoolSize: number;
  activeSessions: number;
  metrics: PerformanceMetrics;
}

export type SessionEvent =
  | { type: "created"; sessionId: string }
  | { type: "updated"; sessionId: string }
  | { type: "deleted"; sessionId: string }
  | { type: "streaming"; sessionId: string; streamEvent: any };
