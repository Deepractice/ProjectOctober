---
"claudecodeui": patch
---

Complete server architecture refactoring with single responsibility principle

## Major Architecture Refactoring

This refactoring completely reorganizes the server codebase following the single responsibility principle. The main `index.js` has been reduced from **1210 lines to 88 lines** - a **93% reduction**.

### New Module Structure

```
server/
├── index.js              # Entry point - only server startup (88 lines, was 1210)
├── app.js                # Express app configuration
├── config/
│   └── env.js           # Environment variable loading
├── websocket/
│   ├── chat.js          # Chat WebSocket handler
│   └── shell.js         # Shell WebSocket handler
├── watchers/
│   └── sessions.js      # Sessions file watcher
├── routes/              # API routes (all previously created)
│   ├── sessions.js      # Session CRUD operations
│   ├── project.js       # Project and file operations
│   ├── system.js        # System configuration
│   ├── media.js         # Media upload/transcription
│   ├── mcp.js           # MCP integration
│   └── commands.js      # Slash commands
└── sessions.js          # Session data operations
```

### Module Responsibilities

**`index.js`** (Entry point - 88 lines)
- Load environment configuration
- Create HTTP and WebSocket servers
- Route WebSocket connections
- Start the server

**`app.js`** (Express configuration)
- Middleware setup
- Route registration
- Static file serving
- Catch-all routing

**`config/env.js`** (Environment management)
- Load .env file
- Parse environment variables

**`websocket/chat.js`** (Chat WebSocket)
- Handle Claude AI chat connections
- Process chat messages
- Session management commands

**`websocket/shell.js`** (Shell WebSocket)
- Handle terminal connections
- PTY process management
- Terminal I/O

**`watchers/sessions.js`** (File monitoring)
- Watch session folder changes
- Notify connected clients
- Debounced updates

**`routes/sessions.js`** (Session API)
- Session listing with pagination
- Session message retrieval
- Session deletion
- Token usage tracking

**`routes/project.js`** (Project API)
- Project information
- File tree listing
- File read/write operations
- Binary file serving

**`routes/system.js`** (System API)
- Server configuration
- System updates

**`routes/media.js`** (Media API)
- Audio transcription (Whisper)
- Image uploads
- GPT enhancement modes

**`sessions.js`** (Session data operations)
- Parse JSONL session files
- Extract session messages
- Filter system messages
- Session deletion logic

## Benefits of This Refactoring

### Code Organization
- **Single Responsibility**: Each module has one clear purpose
- **Easier Testing**: Individual modules can be tested in isolation
- **Better Maintainability**: Changes to one feature don't affect others
- **Clearer Dependencies**: Module imports show relationships clearly

### Developer Experience
- **Faster Onboarding**: New developers can understand code structure quickly
- **Easier Debugging**: Problems are localized to specific modules
- **Reduced Conflicts**: Team members can work on different modules without conflicts
- **Better Code Review**: Smaller, focused modules are easier to review

### Performance
- **Lazy Loading**: Modules are only loaded when needed
- **Clearer Boundaries**: Easier to optimize specific features
- **Better Caching**: Node.js can cache modules efficiently

## System Message Filtering

All system message filtering logic is now centralized in `sessions.js`:

**Filtered user messages**:
- `<command-name>`, `<command-message>`, `<command-args>`, `<local-command-stdout>`
- `<system-reminder>`, `Caveat:`
- `Warmup` (session initialization)
- Task Master JSON prompts

**Filtered assistant messages**:
- API error messages (flagged with `isApiErrorMessage`)
- Task Master JSON responses

**Benefits**:
- Frontend doesn't need to know about "Warmup" or other technical details
- `messageCount` accurately reflects real messages only
- `summary` is generated from actual user messages
- Message lists returned to frontend are clean
