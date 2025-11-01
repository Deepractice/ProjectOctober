# Claude Code UI - Backend API Documentation

## Overview

This document provides comprehensive documentation for all backend API endpoints in Claude Code UI. The backend is built with Express.js and provides RESTful APIs for managing projects, sessions, git operations, MCP servers, and more.

**Base URL**: `http://localhost:3001` (default)

---

## Authentication

All API endpoints (except `/api/auth/*`) require JWT token authentication.

### Headers
```
Authorization: Bearer <JWT_TOKEN>
```

### WebSocket Authentication
```
ws://localhost:3001/ws?token=<JWT_TOKEN>
ws://localhost:3001/shell?token=<JWT_TOKEN>
```

---

## API Endpoints

### 1. Authentication APIs (`/api/auth`)

#### 1.1 Check Auth Status
```http
GET /api/auth/status
```

**Response**:
```json
{
  "needsSetup": false,
  "isAuthenticated": false
}
```

#### 1.2 Register User (Setup)
```http
POST /api/auth/register
```

**Request Body**:
```json
{
  "username": "string (min 3 chars)",
  "password": "string (min 6 chars)"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Notes**:
- Only allowed if no users exist (single-user system)
- Uses bcrypt with 12 salt rounds
- JWT token never expires

#### 1.3 Login
```http
POST /api/auth/login
```

**Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 1.4 Get Current User
```http
GET /api/auth/user
Authorization: Bearer <token>
```

**Response**:
```json
{
  "user": {
    "id": 1,
    "username": "admin"
  }
}
```

#### 1.5 Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 2. Project APIs (`/api/projects`)

#### 2.1 Get All Projects
```http
GET /api/projects
Authorization: Bearer <token>
```

**Response**:
```json
[
  {
    "name": "project-name",
    "displayName": "Project Name",
    "fullPath": "/path/to/project",
    "sessionMeta": {
      "total": 5,
      "hasMore": false
    },
    "sessions": [...],
    "cursorSessions": [...]
  }
]
```

**Notes**:
- Automatically discovers projects from `~/.claude/projects/`
- Includes both Claude and Cursor sessions

#### 2.2 Get Project Sessions
```http
GET /api/projects/:projectName/sessions?limit=5&offset=0
Authorization: Bearer <token>
```

**Query Parameters**:
- `limit` (optional): Number of sessions to return (default: 5)
- `offset` (optional): Offset for pagination (default: 0)

**Response**:
```json
{
  "sessions": [...],
  "total": 10,
  "limit": 5,
  "offset": 0,
  "hasMore": true
}
```

#### 2.3 Get Session Messages
```http
GET /api/projects/:projectName/sessions/:sessionId/messages?limit=100&offset=0
Authorization: Bearer <token>
```

**Query Parameters**:
- `limit` (optional): Number of messages to return
- `offset` (optional): Offset for pagination (default: 0)

**Response**:
```json
{
  "messages": [
    {
      "type": "user",
      "content": "Hello",
      "timestamp": "2025-01-01T00:00:00Z"
    },
    {
      "type": "assistant",
      "content": "Hi there!",
      "timestamp": "2025-01-01T00:00:01Z"
    }
  ],
  "total": 50,
  "hasMore": false
}
```

#### 2.4 Get Token Usage for Session
```http
GET /api/projects/:projectName/sessions/:sessionId/token-usage
Authorization: Bearer <token>
```

**Response**:
```json
{
  "used": 15000,
  "total": 160000,
  "breakdown": {
    "input": 10000,
    "cacheCreation": 3000,
    "cacheRead": 2000
  }
}
```

#### 2.5 Rename Project
```http
PUT /api/projects/:projectName/rename
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "displayName": "New Project Name"
}
```

**Response**:
```json
{
  "success": true
}
```

#### 2.6 Delete Session
```http
DELETE /api/projects/:projectName/sessions/:sessionId
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true
}
```

#### 2.7 Delete Project
```http
DELETE /api/projects/:projectName
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true
}
```

**Notes**:
- Only deletes if project has no sessions

#### 2.8 Create Project
```http
POST /api/projects/create
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "path": "/absolute/path/to/project"
}
```

**Response**:
```json
{
  "success": true,
  "project": {
    "name": "project-name",
    "fullPath": "/absolute/path/to/project"
  }
}
```

---

### 3. File APIs

#### 3.1 Get File Tree
```http
GET /api/projects/:projectName/files
Authorization: Bearer <token>
```

**Response**:
```json
[
  {
    "name": "src",
    "path": "/project/src",
    "type": "directory",
    "size": 0,
    "modified": "2025-01-01T00:00:00Z",
    "permissions": "755",
    "permissionsRwx": "rwxr-xr-x",
    "children": [...]
  }
]
```

**Notes**:
- Excludes `node_modules`, `dist`, `build` directories
- Max depth: 10 levels
- Returns permissions in both octal and rwx format

#### 3.2 Read File
```http
GET /api/projects/:projectName/file?filePath=/path/to/file
Authorization: Bearer <token>
```

**Query Parameters**:
- `filePath` (required): Relative or absolute file path

**Response**:
```json
{
  "content": "file contents here",
  "path": "/absolute/path/to/file"
}
```

#### 3.3 Save File
```http
PUT /api/projects/:projectName/file
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "filePath": "/path/to/file",
  "content": "new file content"
}
```

**Response**:
```json
{
  "success": true,
  "path": "/absolute/path/to/file",
  "message": "File saved successfully"
}
```

#### 3.4 Serve Binary File (Images)
```http
GET /api/projects/:projectName/files/content?path=/path/to/image.png
Authorization: Bearer <token>
```

**Response**: Binary file stream with appropriate `Content-Type` header

---

### 4. Git APIs (`/api/git`)

#### 4.1 Get Git Status
```http
GET /api/git/status?project=project-name
Authorization: Bearer <token>
```

**Response**:
```json
{
  "branch": "main",
  "modified": ["file1.js", "file2.js"],
  "added": ["newfile.js"],
  "deleted": ["oldfile.js"],
  "untracked": ["temp.txt"]
}
```

**Error Response**:
```json
{
  "error": "Not a git repository. Initialize with: git init",
  "details": "..."
}
```

#### 4.2 Get File Diff
```http
GET /api/git/diff?project=project-name&file=path/to/file
Authorization: Bearer <token>
```

**Response**:
```json
{
  "diff": "@@ -1,5 +1,6 @@\n-old line\n+new line"
}
```

**Notes**:
- For untracked files: shows entire file as additions
- For deleted files: shows entire file from HEAD as deletions
- Strips git diff headers for cleaner output

#### 4.3 Get File with Diff (for CodeEditor)
```http
GET /api/git/file-with-diff?project=project-name&file=path/to/file
Authorization: Bearer <token>
```

**Response**:
```json
{
  "currentContent": "current file content",
  "oldContent": "content from HEAD",
  "isDeleted": false,
  "isUntracked": false
}
```

#### 4.4 Commit Changes
```http
POST /api/git/commit
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "project": "project-name",
  "message": "feat: add new feature",
  "files": ["file1.js", "file2.js"]
}
```

**Response**:
```json
{
  "success": true,
  "output": "git commit output"
}
```

#### 4.5 Get Branches
```http
GET /api/git/branches?project=project-name
Authorization: Bearer <token>
```

**Response**:
```json
{
  "branches": ["main", "develop", "feature/new-feature"]
}
```

#### 4.6 Checkout Branch
```http
POST /api/git/checkout
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "project": "project-name",
  "branch": "develop"
}
```

**Response**:
```json
{
  "success": true,
  "output": "Switched to branch 'develop'"
}
```

#### 4.7 Create Branch
```http
POST /api/git/create-branch
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "project": "project-name",
  "branch": "feature/new-feature"
}
```

**Response**:
```json
{
  "success": true,
  "output": "Switched to a new branch 'feature/new-feature'"
}
```

#### 4.8 Get Commits
```http
GET /api/git/commits?project=project-name&limit=10
Authorization: Bearer <token>
```

**Query Parameters**:
- `limit` (optional): Number of commits (default: 10)

**Response**:
```json
{
  "commits": [
    {
      "hash": "abc123...",
      "author": "John Doe",
      "email": "john@example.com",
      "date": "2 hours ago",
      "message": "feat: add new feature",
      "stats": "2 files changed, 10 insertions(+), 5 deletions(-)"
    }
  ]
}
```

#### 4.9 Get Commit Diff
```http
GET /api/git/commit-diff?project=project-name&commit=abc123
Authorization: Bearer <token>
```

**Response**:
```json
{
  "diff": "full commit diff output"
}
```

#### 4.10 Generate Commit Message (AI)
```http
POST /api/git/generate-commit-message
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "project": "project-name",
  "files": ["file1.js", "file2.js"],
  "provider": "claude"
}
```

**Response**:
```json
{
  "message": "feat(auth): add JWT authentication\n\nImplemented JWT token-based authentication with bcrypt password hashing."
}
```

**Notes**:
- Uses Claude SDK or Cursor CLI to generate conventional commit messages
- Analyzes git diffs to understand changes
- Format: `type(scope): subject\n\nbody`

#### 4.11 Get Remote Status
```http
GET /api/git/remote-status?project=project-name
Authorization: Bearer <token>
```

**Response**:
```json
{
  "hasRemote": true,
  "hasUpstream": true,
  "branch": "main",
  "remoteBranch": "origin/main",
  "remoteName": "origin",
  "ahead": 2,
  "behind": 0,
  "isUpToDate": false
}
```

#### 4.12 Fetch from Remote
```http
POST /api/git/fetch
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "project": "project-name"
}
```

**Response**:
```json
{
  "success": true,
  "output": "Fetch completed successfully",
  "remoteName": "origin"
}
```

#### 4.13 Pull from Remote
```http
POST /api/git/pull
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "project": "project-name"
}
```

**Response**:
```json
{
  "success": true,
  "output": "Already up to date.",
  "remoteName": "origin",
  "remoteBranch": "main"
}
```

**Error Responses**:
- Merge conflicts: `{ "error": "Merge conflicts detected", "details": "..." }`
- Uncommitted changes: `{ "error": "Uncommitted changes detected", "details": "..." }`

#### 4.14 Push to Remote
```http
POST /api/git/push
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "project": "project-name"
}
```

**Response**:
```json
{
  "success": true,
  "output": "Everything up-to-date",
  "remoteName": "origin",
  "remoteBranch": "main"
}
```

#### 4.15 Publish Branch
```http
POST /api/git/publish
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "project": "project-name",
  "branch": "feature/new-feature"
}
```

**Response**:
```json
{
  "success": true,
  "output": "Branch published successfully",
  "remoteName": "origin",
  "branch": "feature/new-feature"
}
```

**Notes**:
- Sets upstream and pushes: `git push --set-upstream origin <branch>`

#### 4.16 Discard Changes
```http
POST /api/git/discard
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "project": "project-name",
  "file": "path/to/file"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Changes discarded for path/to/file"
}
```

**Notes**:
- Untracked files: deletes the file
- Modified/Deleted files: restores from HEAD
- Added files: unstages the file

#### 4.17 Delete Untracked File
```http
POST /api/git/delete-untracked
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "project": "project-name",
  "file": "path/to/untracked/file"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Untracked file deleted successfully"
}
```

---

### 5. MCP (Model Context Protocol) APIs (`/api/mcp`)

#### 5.1 List MCP Servers (via CLI)
```http
GET /api/mcp/cli/list
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "output": "cli output",
  "servers": [
    {
      "name": "test-server",
      "type": "stdio",
      "status": "connected",
      "description": "Test MCP server"
    }
  ]
}
```

#### 5.2 Add MCP Server (via CLI)
```http
POST /api/mcp/cli/add
Authorization: Bearer <token>
```

**Request Body (stdio)**:
```json
{
  "name": "my-server",
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "server-package"],
  "env": {
    "API_KEY": "secret"
  },
  "scope": "user",
  "projectPath": "/path/to/project"
}
```

**Request Body (http/sse)**:
```json
{
  "name": "my-server",
  "type": "http",
  "url": "http://localhost:8000",
  "headers": {
    "Authorization": "Bearer token"
  },
  "scope": "user"
}
```

**Response**:
```json
{
  "success": true,
  "output": "cli output",
  "message": "MCP server added successfully"
}
```

**Notes**:
- `scope`: "user" (global) or "local" (project-specific)
- Local scope requires `projectPath`

#### 5.3 Add MCP Server (JSON format)
```http
POST /api/mcp/cli/add-json
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "name": "my-server",
  "jsonConfig": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "server-package"],
    "env": {
      "API_KEY": "secret"
    }
  },
  "scope": "user",
  "projectPath": "/path/to/project"
}
```

**Response**:
```json
{
  "success": true,
  "output": "cli output",
  "message": "MCP server added successfully via JSON"
}
```

#### 5.4 Remove MCP Server
```http
DELETE /api/mcp/cli/remove/:name?scope=user
Authorization: Bearer <token>
```

**Query Parameters**:
- `scope` (optional): "user" or "local"

**Response**:
```json
{
  "success": true,
  "output": "cli output",
  "message": "MCP server removed successfully"
}
```

**Notes**:
- Supports name format: `local:server-name` or `user:server-name`

#### 5.5 Get MCP Server Details
```http
GET /api/mcp/cli/get/:name
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "output": "cli output",
  "server": {
    "name": "my-server",
    "type": "stdio",
    "command": "npx",
    ...
  }
}
```

#### 5.6 Read MCP Config (Direct)
```http
GET /api/mcp/config/read
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "configPath": "/Users/user/.claude.json",
  "servers": [
    {
      "id": "my-server",
      "name": "my-server",
      "type": "stdio",
      "scope": "user",
      "config": {
        "command": "npx",
        "args": ["-y", "package"],
        "env": {}
      },
      "raw": {...}
    }
  ]
}
```

**Notes**:
- Reads directly from `~/.claude.json` or `~/.claude/settings.json`
- Returns both user-scoped and local-scoped servers

---

### 6. Cursor APIs (`/api/cursor`)

#### 6.1 Get Cursor Config
```http
GET /api/cursor/config
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "config": {
    "version": 1,
    "model": {
      "modelId": "gpt-5",
      "displayName": "GPT-5"
    },
    "permissions": {
      "allow": [],
      "deny": []
    }
  },
  "path": "/Users/user/.cursor/cli-config.json"
}
```

#### 6.2 Update Cursor Config
```http
POST /api/cursor/config
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "permissions": {
    "allow": ["read", "write"],
    "deny": []
  },
  "model": {
    "modelId": "gpt-5",
    "displayName": "GPT-5"
  }
}
```

**Response**:
```json
{
  "success": true,
  "config": {...},
  "message": "Cursor configuration updated successfully"
}
```

#### 6.3 Get Cursor MCP Servers
```http
GET /api/cursor/mcp
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "servers": [
    {
      "id": "my-server",
      "name": "my-server",
      "type": "stdio",
      "scope": "cursor",
      "config": {...},
      "raw": {...}
    }
  ],
  "path": "/Users/user/.cursor/mcp.json"
}
```

#### 6.4 Add MCP Server to Cursor
```http
POST /api/cursor/mcp/add
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "name": "my-server",
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "package"],
  "env": {}
}
```

**Response**:
```json
{
  "success": true,
  "message": "MCP server added to Cursor configuration",
  "config": {...}
}
```

#### 6.5 Remove MCP Server from Cursor
```http
DELETE /api/cursor/mcp/:name
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "MCP server removed from Cursor configuration",
  "config": {...}
}
```

#### 6.6 Add MCP Server to Cursor (JSON)
```http
POST /api/cursor/mcp/add-json
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "name": "my-server",
  "jsonConfig": {
    "command": "npx",
    "args": ["-y", "package"]
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "MCP server added via JSON",
  "config": {...}
}
```

#### 6.7 Get Cursor Sessions
```http
GET /api/cursor/sessions?projectPath=/path/to/project
Authorization: Bearer <token>
```

**Query Parameters**:
- `projectPath` (required): Project directory path

**Response**:
```json
{
  "success": true,
  "sessions": [
    {
      "id": "session-id",
      "name": "Session Name",
      "createdAt": "2025-01-01T00:00:00Z",
      "mode": "chat",
      "projectPath": "/path/to/project",
      "lastMessage": "Preview of last message...",
      "messageCount": 15
    }
  ],
  "cwdId": "md5-hash",
  "path": "/Users/user/.cursor/chats/md5-hash"
}
```

**Notes**:
- Uses MD5 hash of project path as cwdId
- Reads from SQLite database in `~/.cursor/chats/<cwdId>/<sessionId>/store.db`

#### 6.8 Get Cursor Session Details
```http
GET /api/cursor/sessions/:sessionId?projectPath=/path/to/project
Authorization: Bearer <token>
```

**Query Parameters**:
- `projectPath` (required): Project directory path

**Response**:
```json
{
  "success": true,
  "session": {
    "id": "session-id",
    "projectPath": "/path/to/project",
    "messages": [
      {
        "id": "blob-hash",
        "sequence": 1,
        "rowid": 1,
        "content": {
          "role": "user",
          "content": "Hello"
        }
      }
    ],
    "metadata": {...},
    "cwdId": "md5-hash"
  }
}
```

**Notes**:
- Parses SQLite database with protobuf DAG structure
- Performs topological sort for chronological message order
- Filters out system messages

---

### 7. Command APIs (`/api/commands`)

#### 7.1 List Commands
```http
POST /api/commands/list
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "projectPath": "/path/to/project"
}
```

**Response**:
```json
{
  "builtIn": [
    {
      "name": "/help",
      "description": "Show help documentation",
      "namespace": "builtin"
    },
    {
      "name": "/clear",
      "description": "Clear conversation history",
      "namespace": "builtin"
    }
  ],
  "custom": [
    {
      "name": "/my-command",
      "path": "/path/to/.claude/commands/my-command.md",
      "relativePath": "my-command.md",
      "description": "Custom command",
      "namespace": "project",
      "metadata": {...}
    }
  ],
  "count": 10
}
```

**Built-in Commands**:
- `/help` - Show help documentation
- `/clear` - Clear conversation history
- `/model` - Switch or view current model
- `/cost` - Display token usage and cost
- `/memory` - Open CLAUDE.md memory file
- `/config` - Open settings
- `/status` - Show system status
- `/rewind [N]` - Rewind conversation by N steps

#### 7.2 Load Command
```http
POST /api/commands/load
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "commandPath": "/path/to/.claude/commands/my-command.md"
}
```

**Response**:
```json
{
  "path": "/path/to/.claude/commands/my-command.md",
  "metadata": {
    "description": "My custom command"
  },
  "content": "Command content with $ARGUMENTS and $1, $2 placeholders"
}
```

#### 7.3 Execute Command
```http
POST /api/commands/execute
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "commandName": "/help",
  "commandPath": null,
  "args": [],
  "context": {
    "provider": "claude",
    "model": "claude-sonnet-4.5",
    "projectPath": "/path/to/project",
    "sessionId": "session-id"
  }
}
```

**Response (Built-in)**:
```json
{
  "type": "builtin",
  "action": "help",
  "command": "/help",
  "data": {
    "content": "# Help content...",
    "format": "markdown"
  }
}
```

**Response (Custom)**:
```json
{
  "type": "custom",
  "command": "/my-command",
  "content": "Processed command content with args replaced",
  "metadata": {...},
  "hasFileIncludes": false,
  "hasBashCommands": false
}
```

**Notes**:
- Replaces `$ARGUMENTS` with all args joined
- Replaces `$1`, `$2`, etc. with positional arguments
- Custom commands must be in `.claude/commands/` directory

---

### 8. Settings APIs (`/api/settings`)

#### 8.1 Get API Keys
```http
GET /api/settings/api-keys
Authorization: Bearer <token>
```

**Response**:
```json
{
  "apiKeys": [
    {
      "id": 1,
      "user_id": 1,
      "key_name": "Production Key",
      "api_key": "sk-abcd12...  (truncated)",
      "is_active": true,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

**Notes**:
- API keys are truncated for security (first 10 chars + "...")

#### 8.2 Create API Key
```http
POST /api/settings/api-keys
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "keyName": "My API Key"
}
```

**Response**:
```json
{
  "success": true,
  "apiKey": {
    "id": 2,
    "key_name": "My API Key",
    "api_key": "sk-full-key-here",
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

**Notes**:
- Full API key is only returned on creation
- API key format: `ccui_<random_64_chars>`

#### 8.3 Delete API Key
```http
DELETE /api/settings/api-keys/:keyId
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true
}
```

#### 8.4 Toggle API Key Status
```http
PATCH /api/settings/api-keys/:keyId/toggle
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "isActive": false
}
```

**Response**:
```json
{
  "success": true
}
```

#### 8.5 Get Credentials
```http
GET /api/settings/credentials?type=github
Authorization: Bearer <token>
```

**Query Parameters**:
- `type` (optional): Filter by credential type

**Response**:
```json
{
  "credentials": [
    {
      "id": 1,
      "user_id": 1,
      "credential_name": "GitHub Token",
      "credential_type": "github",
      "description": "Personal access token",
      "is_active": true,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

**Notes**:
- Credential values are NOT returned for security

#### 8.6 Create Credential
```http
POST /api/settings/credentials
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "credentialName": "GitHub Token",
  "credentialType": "github",
  "credentialValue": "ghp_secret_token",
  "description": "Personal access token"
}
```

**Response**:
```json
{
  "success": true,
  "credential": {
    "id": 1,
    "credential_name": "GitHub Token",
    "credential_type": "github",
    "description": "Personal access token",
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

**Notes**:
- Credential value is encrypted in database

#### 8.7 Delete Credential
```http
DELETE /api/settings/credentials/:credentialId
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true
}
```

#### 8.8 Toggle Credential Status
```http
PATCH /api/settings/credentials/:credentialId/toggle
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "isActive": false
}
```

**Response**:
```json
{
  "success": true
}
```

---

### 9. System APIs

#### 9.1 Get Server Config
```http
GET /api/config
Authorization: Bearer <token>
```

**Response**:
```json
{
  "serverPort": 3001,
  "wsUrl": "ws://localhost:3001"
}
```

#### 9.2 System Update
```http
POST /api/system/update
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "output": "Update output...",
  "message": "Update completed. Please restart the server."
}
```

**Notes**:
- Runs: `git checkout main && git pull && npm install`
- Server restart required after update

#### 9.3 Browse Filesystem
```http
GET /api/browse-filesystem?path=/Users/user/Projects
Authorization: Bearer <token>
```

**Query Parameters**:
- `path` (optional): Directory path (defaults to home directory)

**Response**:
```json
{
  "path": "/Users/user/Projects",
  "suggestions": [
    {
      "path": "/Users/user/Projects/project1",
      "name": "project1",
      "type": "directory"
    }
  ]
}
```

**Notes**:
- Returns only directories (max 20)
- Prioritizes common directories (Desktop, Documents, Projects, etc.)

#### 9.4 Upload Images
```http
POST /api/projects/:projectName/upload-images
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data**:
- `images`: File[] (max 5 files, 5MB each)

**Response**:
```json
{
  "images": [
    {
      "name": "screenshot.png",
      "data": "data:image/png;base64,iVBORw0KG...",
      "size": 12345,
      "mimeType": "image/png"
    }
  ]
}
```

**Notes**:
- Allowed types: JPEG, PNG, GIF, WebP, SVG
- Returns base64-encoded images
- Temporary files are cleaned up after processing

#### 9.5 Audio Transcription
```http
POST /api/transcribe
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data**:
- `audio`: File (audio file)
- `mode` (optional): "default" | "prompt" | "vibe" | "instructions" | "architect"

**Response**:
```json
{
  "text": "Transcribed text here"
}
```

**Notes**:
- Uses OpenAI Whisper API
- `mode="prompt"`: Enhances text as an AI prompt
- `mode="instructions"`: Formats as clear instructions
- Requires `OPENAI_API_KEY` environment variable

---

### 10. WebSocket APIs

#### 10.1 Chat WebSocket (`/ws`)

**Connection**:
```javascript
const ws = new WebSocket('ws://localhost:3001/ws?token=<JWT_TOKEN>');
```

**Client → Server Messages**:

1. **Claude Command**:
```json
{
  "type": "claude-command",
  "command": "Help me write a function",
  "options": {
    "projectPath": "/path/to/project",
    "sessionId": "session-id",
    "resume": false,
    "model": "sonnet"
  }
}
```

2. **Cursor Command**:
```json
{
  "type": "cursor-command",
  "command": "Refactor this code",
  "options": {
    "cwd": "/path/to/project",
    "sessionId": "session-id",
    "resume": false,
    "model": "gpt-5"
  }
}
```

3. **Abort Session**:
```json
{
  "type": "abort-session",
  "sessionId": "session-id",
  "provider": "claude"
}
```

4. **Check Session Status**:
```json
{
  "type": "check-session-status",
  "sessionId": "session-id",
  "provider": "claude"
}
```

5. **Get Active Sessions**:
```json
{
  "type": "get-active-sessions"
}
```

**Server → Client Messages**:

1. **Claude Response**:
```json
{
  "type": "claude-response",
  "data": {
    "message": {
      "content": [
        {
          "type": "text",
          "text": "Here's the function..."
        }
      ]
    }
  }
}
```

2. **Session Started**:
```json
{
  "type": "session-started",
  "sessionId": "new-session-id",
  "provider": "claude"
}
```

3. **Session Aborted**:
```json
{
  "type": "session-aborted",
  "sessionId": "session-id",
  "provider": "claude",
  "success": true
}
```

4. **Session Status**:
```json
{
  "type": "session-status",
  "sessionId": "session-id",
  "provider": "claude",
  "isProcessing": true
}
```

5. **Active Sessions**:
```json
{
  "type": "active-sessions",
  "sessions": {
    "claude": ["session-1", "session-2"],
    "cursor": ["session-3"]
  }
}
```

6. **Projects Updated** (from file watcher):
```json
{
  "type": "projects_updated",
  "projects": [...],
  "timestamp": "2025-01-01T00:00:00Z",
  "changeType": "change",
  "changedFile": "project-name/session-id.jsonl"
}
```

7. **Error**:
```json
{
  "type": "error",
  "error": "Error message"
}
```

#### 10.2 Shell WebSocket (`/shell`)

**Connection**:
```javascript
const ws = new WebSocket('ws://localhost:3001/shell?token=<JWT_TOKEN>');
```

**Client → Server Messages**:

1. **Initialize Shell**:
```json
{
  "type": "init",
  "projectPath": "/path/to/project",
  "sessionId": "session-id",
  "hasSession": true,
  "provider": "claude",
  "initialCommand": "claude",
  "isPlainShell": false
}
```

2. **Send Input**:
```json
{
  "type": "input",
  "data": "ls -la\n"
}
```

3. **Resize Terminal**:
```json
{
  "type": "resize",
  "cols": 80,
  "rows": 24
}
```

**Server → Client Messages**:

1. **Output**:
```json
{
  "type": "output",
  "data": "Terminal output with ANSI codes"
}
```

2. **URL Open** (detected from terminal):
```json
{
  "type": "url_open",
  "url": "https://github.com/user/repo"
}
```

**Notes**:
- Uses `node-pty` for real PTY
- Supports ANSI color codes and terminal control sequences
- Auto-detects URLs for browser opening

---

## Error Handling

### Standard Error Response Format
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

### Common HTTP Status Codes
- `200 OK` - Success
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate username)
- `500 Internal Server Error` - Server error

---

## Environment Variables

### Required
- `PORT` - Server port (default: 3001)
- `VITE_PORT` - Frontend dev server port (default: 5173)

### Optional
- `JWT_SECRET` - JWT signing secret (default: "claude-ui-dev-secret-change-in-production")
- `API_KEY` - Optional API key for additional security
- `DATABASE_PATH` - Path to SQLite database (default: server/database/auth.db)
- `CLAUDE_CLI_PATH` - Custom Claude CLI path (default: "claude")
- `CONTEXT_WINDOW` - Token context window (default: 160000)
- `VITE_CONTEXT_WINDOW` - Frontend context window (default: 160000)
- `OPENAI_API_KEY` - Required for audio transcription feature

---

## File System Security

### Path Traversal Protection
All file operations validate that paths are within:
- Project root directories
- `~/.claude/` directory
- `/tmp/` directory (for uploads)

### Git Repository Validation
Git operations validate:
- Directory is a git repository
- Git root matches project path
- No parent repository operations

### Command File Access
Slash commands must be in:
- `~/.claude/commands/` (user-level)
- `<project>/.claude/commands/` (project-level)

---

## WebSocket Connection Lifecycle

### Chat WebSocket
1. Client connects with JWT token in query parameter
2. Server validates token and stores user info
3. Client sends commands, server streams responses
4. Server broadcasts project updates from file watcher
5. Connection closes on disconnect or auth failure

### Shell WebSocket
1. Client connects with JWT token
2. Client sends init message with project path
3. Server spawns PTY process with appropriate shell
4. Bidirectional streaming of input/output
5. Process killed on disconnect

---

## Rate Limiting & Performance

### File Watcher Debouncing
- Project updates debounced by 300ms
- Prevents excessive notifications during bulk file operations

### Session Protection
- Active sessions protected from automatic updates
- Prevents message list clearing during conversations

### Token Context Management
- Default context window: 160,000 tokens
- Token usage tracked per session
- Cache hit/miss tracking for optimization

---

## Development Notes

### Testing APIs
Use tools like:
- **Postman** - REST API testing
- **wscat** - WebSocket testing: `wscat -c "ws://localhost:3001/ws?token=<TOKEN>"`
- **curl** - Command-line testing

### Example curl Commands

**Login**:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

**Get Projects**:
```bash
curl http://localhost:3001/api/projects \
  -H "Authorization: Bearer <TOKEN>"
```

**Git Status**:
```bash
curl "http://localhost:3001/api/git/status?project=my-project" \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Version

**Current Version**: 1.10.4

**API Version**: v1 (no version prefix in URLs currently)

---

## Support & Contributing

For issues, feature requests, or contributions:
- GitHub: https://github.com/siteboon/claudecodeui
- Documentation: https://claudecodeui.siteboon.ai

---

**Last Updated**: 2025-01-01
