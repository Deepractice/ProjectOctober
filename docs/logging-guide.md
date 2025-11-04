# Logging Guide

## Overview

Agent project uses `@deepracticex/logger` for unified, high-performance logging across all services. This guide explains when to log, how to log, and best practices.

## Quick Start

### Import Logger

```javascript
import { logger } from "~/utils/logger.js";

// Or import specific methods
import { info, warn, error, debug } from "~/utils/logger.js";
```

### Basic Usage

```javascript
// Simple message
logger.info("Server started");

// With context data
logger.info({ port: 5201, env: "development" }, "Server started");

// Error logging
try {
  await riskyOperation();
} catch (err) {
  logger.error({ err, context: "riskyOperation" }, "Operation failed");
}
```

## Log Levels

Use appropriate log levels for different scenarios:

### `fatal` - Application Cannot Continue

System-level failures that require immediate restart or intervention.

```javascript
logger.fatal({ err, config }, "Failed to load required configuration");
process.exit(1);
```

**When to use:**

- Cannot connect to required external services
- Critical configuration missing
- Unrecoverable system errors

### `error` - Something Failed

Operations that failed but the application can continue.

```javascript
logger.error({ err, userId, sessionId }, "Failed to create session");
```

**When to use:**

- API call failures
- Database operation errors
- File I/O errors
- Request handling failures
- Validation errors with consequences

### `warn` - Potentially Problematic

Issues that should be investigated but don't block execution.

```javascript
logger.warn({ retryCount, maxRetries }, "Approaching retry limit");
logger.warn({ memoryUsage: process.memoryUsage() }, "High memory usage detected");
```

**When to use:**

- Deprecated API usage
- Resource usage approaching limits
- Fallback to default values
- Non-critical misconfigurations
- Performance degradation

### `info` - Important Events

Key application events and state changes.

```javascript
logger.info({ port, mode: process.env.NODE_ENV }, "Server started");
logger.info({ sessionId, userId }, "New session created");
logger.info({ projectPath }, "Project loaded");
```

**When to use:**

- Application lifecycle (start, stop, restart)
- User actions (login, create session, delete project)
- State transitions (connected, disconnected)
- Configuration changes
- Background job completion

### `debug` - Diagnostic Information

Detailed information for troubleshooting.

```javascript
logger.debug({ envPath, configInstance }, "Configuration loaded");
logger.debug({ messageId, tokens }, "Processing AI message");
```

**When to use:**

- Function entry/exit with parameters
- Intermediate calculation results
- Configuration details
- Data transformations
- Cache hits/misses

### `trace` - Very Verbose

Extremely detailed information, rarely needed.

```javascript
logger.trace({ request: req.body }, "Incoming request");
logger.trace({ step, data }, "Processing step completed");
```

**When to use:**

- Low-level debugging
- Performance profiling
- Data flow tracking
- Only when debug is not enough

## What to Log

### ✅ DO Log

**System Events:**

```javascript
logger.info({ port: config().port }, "Server started");
logger.info("Graceful shutdown initiated");
```

**User Actions:**

```javascript
logger.info({ sessionId, projectPath }, "User created new session");
logger.info({ sessionId }, "User deleted session");
```

**External Calls:**

```javascript
logger.debug({ url, method }, "Calling external API");
logger.error({ err, url }, "API call failed");
```

**State Changes:**

```javascript
logger.info({ from: "disconnected", to: "connected" }, "Connection state changed");
```

**Errors with Context:**

```javascript
logger.error(
  {
    err,
    sessionId,
    userId,
    operation: "createSession",
  },
  "Failed to create session"
);
```

**Configuration Issues:**

```javascript
logger.warn({ envPath, exists: false }, "Environment file not found, using defaults");
```

### ❌ DON'T Log

**Sensitive Data:**

```javascript
// ❌ NEVER log API keys, passwords, tokens
logger.debug({ apiKey: config().anthropicApiKey }, "Config loaded"); // WRONG

// ✅ Mask or omit sensitive data
logger.debug({ apiKey: "sk-***" }, "Config loaded"); // CORRECT
```

**High-Frequency Events:**

```javascript
// ❌ Don't log every iteration
for (let i = 0; i < 10000; i++) {
  logger.debug({ i }, "Processing item"); // WRONG - floods logs
}

// ✅ Log summary or milestones
logger.debug({ totalItems: 10000 }, "Starting batch processing");
logger.info({ processed: 10000 }, "Batch processing completed");
```

**Request/Response Bodies (in production):**

```javascript
// ❌ Don't log full bodies in info/warn/error
logger.info({ body: req.body }, "Request received"); // WRONG

// ✅ Use trace level for full data, or log only IDs
logger.trace({ body: req.body }, "Request received"); // OK for debugging
logger.info({ requestId: req.id }, "Request received"); // CORRECT
```

## Structured Logging

Always include relevant context as the first parameter:

```javascript
// ❌ String concatenation
logger.info(`User ${userId} created session ${sessionId}`); // WRONG

// ✅ Structured data + message
logger.info({ userId, sessionId }, "User created session"); // CORRECT
```

**Why structured logging?**

- Easy to search and filter logs
- Can be indexed by log aggregation tools
- Preserves data types
- Better for automated alerting

## Context Best Practices

### Required Context

**For errors:**

```javascript
{
  err,                    // The error object
  operation: "...",       // What was being attempted
  userId,                 // Who (if applicable)
  sessionId,              // Session context
  requestId,              // Request tracking
  // ... any other relevant IDs
}
```

**For operations:**

```javascript
{
  sessionId,
  userId,
  projectPath,
  // ... operation-specific data
}
```

### Good Context Examples

```javascript
// Configuration loading
logger.debug(
  {
    envPath: "/path/to/.env",
    anthropicApiKey: "sk-***", // Masked
    port: 5201,
  },
  "Configuration loaded"
);

// Session creation
logger.info(
  {
    sessionId: "abc123",
    userId: "user456",
    projectPath: "/projects/myapp",
    model: "claude-3-5-sonnet-20241022",
  },
  "Session created"
);

// Error handling
logger.error(
  {
    err,
    operation: "loadProject",
    projectPath: "/invalid/path",
    userId: "user456",
  },
  "Failed to load project"
);
```

## Error Logging

### Standard Error Pattern

```javascript
try {
  await someOperation();
} catch (err) {
  logger.error(
    {
      err, // Full error object
      operation: "someOperation", // What failed
      ...relevantContext, // Additional context
    },
    "Operation failed" // Human-readable message
  );

  // Then handle the error (throw, return, etc.)
  throw err; // or return error response
}
```

### Error Context Checklist

Include these when logging errors:

- `err` - The error object itself
- `operation` - What operation was being performed
- User/session identifiers (if applicable)
- Input parameters (sanitized)
- State information at time of error

### Example

```javascript
async function createSession(userId, projectPath) {
  try {
    const session = await sessionManager.create({ userId, projectPath });
    logger.info({ sessionId: session.id, userId, projectPath }, "Session created");
    return session;
  } catch (err) {
    logger.error(
      {
        err,
        operation: "createSession",
        userId,
        projectPath,
      },
      "Failed to create session"
    );
    throw err;
  }
}
```

## Performance Considerations

### Lazy Evaluation

For expensive computations, use lazy evaluation:

```javascript
// ❌ Always computes, even if debug disabled
logger.debug({ data: expensiveComputation() }, "Debug data");

// ✅ Only computes if debug enabled
if (logger.isLevelEnabled("debug")) {
  logger.debug({ data: expensiveComputation() }, "Debug data");
}
```

### Sampling High-Volume Logs

For very frequent events, use sampling:

```javascript
let requestCount = 0;

function handleRequest(req) {
  requestCount++;

  // Log every 100th request
  if (requestCount % 100 === 0) {
    logger.info({ totalRequests: requestCount }, "Request milestone");
  }
}
```

## Configuration

### Environment Variables

```bash
# Set log level
LOG_LEVEL=debug pnpm dev

# Available levels: trace, debug, info, warn, error, fatal
```

### Logger Configuration

See `services/agent-service/src/utils/logger.js`:

```javascript
export const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  name: "@deepractice-ai/agent-service",
  console: true,
  file: {
    dirname: logDir, // services/agent-service/logs
  },
  colors: true,
});
```

### Log Files

Logs are written to:

```
services/agent-service/logs/
├── deepractice-2025-11-04.log         # All logs
└── deepractice-error-2025-11-04.log   # Error logs only
```

Files rotate daily automatically.

## Common Patterns

### Application Startup

```javascript
async function startServer() {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, "Starting server");

  try {
    await initConfig();
    logger.debug({ config: config() }, "Configuration initialized");

    await connectDatabase();
    logger.info("Database connected");

    server.listen(PORT);
    logger.info({ port: PORT }, "Server started successfully");
  } catch (err) {
    logger.fatal({ err }, "Failed to start server");
    process.exit(1);
  }
}
```

### HTTP Request Logging

```javascript
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration,
        ip: req.ip,
      },
      "Request completed"
    );
  });

  next();
});
```

### Background Jobs

```javascript
async function syncSessions() {
  logger.info("Starting session sync");

  try {
    const sessions = await fetchSessions();
    logger.debug({ count: sessions.length }, "Sessions fetched");

    for (const session of sessions) {
      await processSession(session);
    }

    logger.info({ processed: sessions.length }, "Session sync completed");
  } catch (err) {
    logger.error({ err, operation: "syncSessions" }, "Session sync failed");
  }
}
```

### Retry Logic

```javascript
async function retryableOperation(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug({ attempt, maxRetries }, "Attempting operation");

      const result = await riskyOperation();

      logger.info({ attempt }, "Operation succeeded");
      return result;
    } catch (err) {
      if (attempt === maxRetries) {
        logger.error({ err, attempts: maxRetries }, "Operation failed after all retries");
        throw err;
      }

      logger.warn({ err, attempt, maxRetries }, "Operation failed, retrying");
      await sleep(1000 * attempt);
    }
  }
}
```

## Debugging Tips

### Enable Debug Logs

```bash
# Run with debug level
LOG_LEVEL=debug pnpm dev

# Or set in .env
LOG_LEVEL=debug
```

### Find Logs

```bash
# View all logs
tail -f services/agent-service/logs/deepractice-$(date +%Y-%m-%d).log

# View only errors
tail -f services/agent-service/logs/deepractice-error-$(date +%Y-%m-%d).log

# Search logs
grep "session" services/agent-service/logs/deepractice-*.log
```

### Common Issues

**Logs not appearing:**

- Check `LOG_LEVEL` environment variable
- Ensure logger is imported correctly
- Verify log directory permissions

**Too many logs:**

- Increase log level to `warn` or `error`
- Use sampling for high-frequency events
- Review and remove unnecessary debug logs

**Can't find specific event:**

- Add structured context to logs
- Use unique identifiers (sessionId, requestId)
- Enable debug level temporarily

## Best Practices Summary

### ✅ DO

- Use structured logging with context objects
- Log all errors with full context
- Use appropriate log levels
- Include timestamps (automatic)
- Mask sensitive data
- Log state transitions
- Log external API calls
- Use descriptive messages

### ❌ DON'T

- Log sensitive data (API keys, passwords, tokens)
- Log in tight loops
- Use string concatenation
- Log full request/response bodies in production
- Log without context
- Use wrong log levels
- Log excessively at high levels (info/warn/error)

## See Also

- [@deepracticex/logger README](../node_modules/.pnpm/@deepracticex+logger@1.1.1/node_modules/@deepracticex/logger/README.md)
- [Logger Implementation](../services/agent-service/src/utils/logger.js)
- [Configuration Guide](./configuration.md)
