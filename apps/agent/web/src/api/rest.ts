/**
 * REST API Client
 * Handles all HTTP requests to the backend
 */

// Utility function for authenticated API calls
export const authenticatedFetch = (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem("auth-token");

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    (defaultHeaders as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });
};

// API endpoints
export const api = {
  // Auth endpoints (no token required)
  auth: {
    status: (): Promise<Response> => fetch("/api/auth/status"),
    login: (username: string, password: string): Promise<Response> =>
      fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      }),
    register: (username: string, password: string): Promise<Response> =>
      fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      }),
    user: (): Promise<Response> => authenticatedFetch("/api/auth/user"),
    logout: (): Promise<Response> => authenticatedFetch("/api/auth/logout", { method: "POST" }),
  },

  // Protected endpoints
  config: (): Promise<Response> => authenticatedFetch("/api/config"),

  sessions: (limit: number = 5, offset: number = 0): Promise<Response> =>
    authenticatedFetch(`/api/sessions?limit=${limit}&offset=${offset}`),

  sessionMessages: (
    sessionId: string,
    limit: number | null = null,
    offset: number = 0
  ): Promise<Response> => {
    const params = new URLSearchParams();
    if (limit !== null) {
      params.append("limit", String(limit));
      params.append("offset", String(offset));
    }
    const queryString = params.toString();
    const url = `/api/sessions/${sessionId}/messages${queryString ? `?${queryString}` : ""}`;
    return authenticatedFetch(url);
  },

  deleteSession: (sessionId: string): Promise<Response> =>
    authenticatedFetch(`/api/sessions/${sessionId}`, {
      method: "DELETE",
    }),

  createSession: (): Promise<Response> =>
    authenticatedFetch("/api/sessions/create", {
      method: "POST",
    }),

  readFile: (filePath: string): Promise<Response> =>
    authenticatedFetch(`/api/file?filePath=${encodeURIComponent(filePath)}`),

  saveFile: (filePath: string, content: string): Promise<Response> =>
    authenticatedFetch(`/api/file`, {
      method: "PUT",
      body: JSON.stringify({ filePath, content }),
    }),

  getFiles: (): Promise<Response> => authenticatedFetch(`/api/files`),

  transcribe: (formData: FormData): Promise<Response> =>
    authenticatedFetch("/api/transcribe", {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    }),

  // Browse filesystem for project suggestions
  browseFilesystem: (dirPath: string | null = null): Promise<Response> => {
    const params = new URLSearchParams();
    if (dirPath) params.append("path", dirPath);
    return authenticatedFetch(`/api/browse-filesystem?${params}`);
  },

  // Generic GET method for any endpoint
  get: (endpoint: string): Promise<Response> => authenticatedFetch(`/api${endpoint}`),
};
