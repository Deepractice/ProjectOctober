---
'@deepracticex/agent-ui': minor
---

**BREAKING: Refactor to Warmup Session Architecture**

Eliminates temporary session ID mechanism in favor of pre-created sessions via warmup API.

## Key Changes

### Backend
- Added `warmupSession()` function to create sessions with "Warmup" message
- Added `POST /api/sessions/create` endpoint for session pre-creation
- Session created via warmup has real ID immediately

### Frontend
- **New Session flow**: Click "New Session" → Call `/api/sessions/create` → Navigate to session
- **No temporary IDs**: Removed `new-session-${Date.now()}` pattern entirely
- **No state migration**: Deleted `migrateSession`, `replaceTemporarySession`, `pendingNavigation`
- **Simplified handleSubmit**: Requires session to exist before sending messages

## Architecture Before

```
User clicks send → Create temp ID → Display message → Backend creates session →
Migrate temp → real ID → Navigate
```

Problems:
- 500+ lines of migration code
- 3-4 race conditions (pendingNavigation, sessions_updated timing)
- ChatInterface unmount/remount causing UI flicker

## Architecture After

```
User clicks "New Session" → Backend warmup (50-100ms) → Real session ID →
User sends message → Direct use of real ID
```

Benefits:
- 400+ lines of code deleted
- Zero race conditions
- No ChatInterface unmount/remount
- Clean linear flow

## Architecture Principles

**Backend Responsibility (projects.js)**:
- Filter system messages (Warmup, etc) from session data
- Calculate `messageCount` excluding system messages
- Generate `summary` based on real user messages only
- Return clean message lists in `getSessionMessages`

**Frontend Responsibility**:
- Display what backend provides
- No knowledge of technical implementation details (Warmup)
- Trust backend-calculated metrics (messageCount, summary)

## Migration Guide

If you have custom code relying on temporary sessions:
- Remove any `new-session-*` ID handling
- Ensure sessions are created before messages are sent
- Use `handleNewSession` to pre-create sessions
- Remove frontend filtering logic - backend handles it now
