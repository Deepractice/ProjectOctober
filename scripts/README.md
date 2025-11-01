# Development Scripts

This directory contains utility scripts for development workflow optimization.

## Error Log Management

To avoid context overflow from verbose logs, we provide several development modes:

### Available Commands

```bash
# Default: Smart error summarization (Recommended)
pnpm dev

# Quiet mode: Only critical errors
pnpm dev:quiet

# Verbose mode: Full logs with filters
pnpm dev:verbose

# Original: No filtering (for debugging)
pnpm dev:original
```

## Scripts

### error-summarizer.js

Intelligent error aggregation script that:

- Filters out noise (HMR updates, watching messages, etc.)
- Groups similar errors together
- Shows error counts for repeated issues
- Provides concise summary after error bursts
- Displays only critical information

**Output Example:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 ERROR SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 ERRORS:

  1. Cannot find module 'xyz' (×3)
  2. EADDRINUSE: Port 3001 already in use

⚠️  WARNINGS (top 3):

  1. Deprecated API usage in package.json (×12)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### dev-quiet.sh

Shell script that filters all output except errors using grep patterns.

## Configuration Changes

### turbo.json

- Added `"ui": "stream"` for better output formatting
- Added `"outputLogs": "errors-only"` for dev task
- Reduces unnecessary build logs

### apps/claudecodeui/package.json

- Updated concurrently flags: `--raw --prefix none`
- Added `NODE_ENV=production` to reduce server logs
- Added `--logLevel error` to Vite for minimal output

## Testing

Test the error summarizer:

```bash
# This should show summarized errors
pnpm dev

# If you need full logs for debugging
pnpm dev:original
```

## Customization

Edit `error-summarizer.js` to customize:

- `quietPeriod`: Time to wait before showing summary (default: 3000ms)
- `isNoise()`: Patterns to filter out
- `categorizeLog()`: How to categorize different log types
