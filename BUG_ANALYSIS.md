# Bug Analysis: Deleted Sessions Reappearing After Refresh

## Root Cause

**sessions.js:210-297** - The `deleteSession()` function had a critical flaw where it would **return after deleting from the first file** that contained the session.

### The Problem

```javascript
// OLD CODE - BUGGY
for (const file of jsonlFiles) {
  // ... check if file has session ...
  if (hasSession) {
    // ... delete logic ...
    return true;  // ❌ Returns immediately after first deletion
  }
}
```

**Why this caused the bug:**
1. Sessions can exist in **multiple JSONL files** (long conversations, cross-file references)
2. `deleteSession()` only deleted from the **first file** found
3. `getSessions()` collects sessions from **ALL files** (projects.js:88-104)
4. After refresh, `getSessions()` would find the session in other untouched files
5. Result: Deleted session reappears

### Evidence from Code

**projects.js:88-104** - Sessions are collected from all files:
```javascript
// Collect all sessions and entries from all files
for (const { file } of filesWithStats) {
  const jsonlFile = path.join(projectDir, file);
  const result = await parseJsonlSessions(jsonlFile);

  result.sessions.forEach(session => {
    if (!allSessions.has(session.id)) {
      allSessions.set(session.id, session);  // Merges from all files
    }
  });
}
```

## The Fix

Modified `deleteSession()` to:
1. Check **ALL JSONL files**, not just the first one
2. Delete session entries from **every file** that contains them
3. Track statistics (entries removed, files modified/deleted)
4. Invalidate cache for **all affected files**

### Key Changes

```javascript
// NEW CODE - FIXED
let deletedFromAnyFile = false;
let totalEntriesRemoved = 0;
let filesModified = 0;
let filesDeleted = 0;

// Check ALL JSONL files (not just the first one)
for (const file of jsonlFiles) {
  // ... check if file has session ...
  if (hasSession) {
    // ... delete logic ...
    sessionManager.invalidateCacheForFile(jsonlFile);
    deletedFromAnyFile = true;
    // ✅ Continue to next file instead of returning
  }
}

if (deletedFromAnyFile) {
  logger.info(`✅ Session ${sessionId} deleted completely`);
  logger.info(`   Total entries removed: ${totalEntriesRemoved}`);
  logger.info(`   Files modified: ${filesModified}`);
  logger.info(`   Files deleted: ${filesDeleted}`);
  return true;
}
```

## Why Previous Fixes Didn't Work

The bug report mentioned several attempted fixes that didn't resolve the issue:

1. ✅ **Cache invalidation** - Was correct, but not the root cause
2. ✅ **Empty file deletion** - Was correct, but not the root cause
3. ✅ **Logging improvements** - Helpful for debugging, but not the root cause
4. ✅ **Cleaning empty files** - Addressed symptoms, not the cause

**The real issue was:** Only deleting from the first file, leaving copies in other files.

## Secondary Issues (Now Also Fixed)

### Race Conditions
The file watcher has debounce (1000ms) to prevent race conditions:
- **watchers/sessions.js:64** - 1 second debounce prevents rapid updates
- **watchers/sessions.js:50-54** - Skips updates during active sessions
- **SessionManager cache invalidation** - Properly clears stale cache

### Empty File Handling
- **sessions.js:283-286** - Properly deletes empty files with `fs.unlink()`
- **parseJsonlSessions:129-132** - Returns empty arrays for files with no valid entries

## Testing the Fix

1. Create a session and let it span multiple files (long conversation)
2. Delete the session
3. Verify logs show deletion from multiple files:
   ```
   🗑️ Deleting from file1.jsonl: 5 entries removed
   🗑️ Deleting from file2.jsonl: 3 entries removed
   ✅ Session deleted completely
      Total entries removed: 8
      Files modified: 2
   ```
4. Refresh the page - session should NOT reappear

## Related Files

- `services/agent-service/src/sessions.js:210-316` - Delete logic (FIXED)
- `services/agent-service/src/projects.js:88-104` - Multi-file session collection
- `services/agent-service/src/watchers/sessions.js` - File watcher and broadcast
- `services/agent-service/src/core/SessionManager.js` - Cache management

## Conclusion

**Root Cause:** Early return after first file deletion
**Solution:** Loop through ALL files and delete from each one
**Impact:** Complete session deletion across all JSONL files
**Status:** Fixed ✅
