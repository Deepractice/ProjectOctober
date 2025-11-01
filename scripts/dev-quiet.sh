#!/bin/bash
# Quiet development mode - only shows errors and critical messages

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Set environment variables for minimal logging
export NODE_ENV=production
export LOG_LEVEL=error
export TURBO_LOG_ORDER=grouped

echo "Starting development in quiet mode (errors-only)..."
echo "Use 'pnpm dev:verbose' for full logs"
echo "---"

# Run turbo dev and filter output
pnpm turbo dev 2>&1 | grep -iE "(error|fail|fatal|exception|cannot|unable|not found)" || {
  if [ $? -eq 141 ]; then
    # SIGPIPE is expected when grep finds no matches
    echo -e "${YELLOW}No errors detected. Services are running...${NC}"
    echo "Press Ctrl+C to stop"
    # Keep the process alive
    wait
  fi
}
