// Utility function for authenticated API calls
export const authenticatedFetch = (url, options = {}) => {
  const token = localStorage.getItem('auth-token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
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
    status: () => fetch('/api/auth/status'),
    login: (username, password) => fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),
    register: (username, password) => fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),
    user: () => authenticatedFetch('/api/auth/user'),
    logout: () => authenticatedFetch('/api/auth/logout', { method: 'POST' }),
  },
  
  // Protected endpoints
  config: () => authenticatedFetch('/api/config'),
  sessions: (limit = 5, offset = 0) =>
    authenticatedFetch(`/api/sessions?limit=${limit}&offset=${offset}`),
  sessionMessages: (sessionId, limit = null, offset = 0) => {
    const params = new URLSearchParams();
    if (limit !== null) {
      params.append('limit', limit);
      params.append('offset', offset);
    }
    const queryString = params.toString();
    const url = `/api/sessions/${sessionId}/messages${queryString ? `?${queryString}` : ''}`;
    return authenticatedFetch(url);
  },
  deleteSession: (sessionId) =>
    authenticatedFetch(`/api/sessions/${sessionId}`, {
      method: 'DELETE',
    }),
  readFile: (filePath) =>
    authenticatedFetch(`/api/file?filePath=${encodeURIComponent(filePath)}`),
  saveFile: (filePath, content) =>
    authenticatedFetch(`/api/file`, {
      method: 'PUT',
      body: JSON.stringify({ filePath, content }),
    }),
  getFiles: () =>
    authenticatedFetch(`/api/files`),
  transcribe: (formData) =>
    authenticatedFetch('/api/transcribe', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    }),

  // Browse filesystem for project suggestions
  browseFilesystem: (dirPath = null) => {
    const params = new URLSearchParams();
    if (dirPath) params.append('path', dirPath);
    
    return authenticatedFetch(`/api/browse-filesystem?${params}`);
  },

  // Generic GET method for any endpoint
  get: (endpoint) => authenticatedFetch(`/api${endpoint}`),
};