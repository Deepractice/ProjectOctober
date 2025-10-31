#
# Production Dockerfile for Claude Code UI
# Based on Ubuntu 22.04 for complete toolchain support
#

FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      # Node.js runtime
      curl ca-certificates gnupg \
      # Build tools for native modules
      build-essential python3 \
      # Runtime dependencies
      git openssh-client sqlite3 \
      # System utilities
      bash sudo && \
    # Install Node.js 20
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y nodejs && \
    # Cleanup
    rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

WORKDIR /app

# Copy pre-built frontend (from CI/CD) and server code
COPY apps/frontend-portal/dist/ ./dist/
COPY services/backend-service/src/ ./server/
COPY services/backend-service/package*.json ./

# Install production dependencies
# Native modules (bcrypt, better-sqlite3, node-pty) will compile using installed build tools
RUN npm install --omit=dev --production

# Configure node user (UID/GID=1000 for host compatibility)
RUN useradd -u 1000 -U -m -s /bin/bash node && \
    echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers && \
    mkdir -p /opt/claude-config && \
    chmod -R 777 /opt/claude-config && \
    ln -sf /opt/claude-config/.claude /home/node/.claude && \
    ln -sf /opt/claude-config/.claude.json /home/node/.claude.json

# Create startup script
RUN printf '#!/bin/bash\n\
set -e\n\
\n\
echo "🔧 Setting up runtime permissions..."\n\
sudo chmod -R 777 /opt/claude-config 2>/dev/null || true\n\
sudo chown -R node:node /app 2>/dev/null || true\n\
\n\
# Check project directory permissions\n\
if [ -d "/project" ]; then\n\
  PROJECT_UID=$(stat -c "%%u" /project 2>/dev/null || stat -f "%%u" /project 2>/dev/null)\n\
  if [ "$PROJECT_UID" != "1000" ]; then\n\
    echo "📂 Setting /project directory permissions (current UID: $PROJECT_UID)..."\n\
    sudo chown node:node /project 2>/dev/null || true\n\
  else\n\
    echo "✓ /project directory permissions already correct (UID: 1000)"\n\
  fi\n\
fi\n\
\n\
echo "📁 Creating necessary directory structure..."\n\
mkdir -p /opt/claude-config/.claude 2>/dev/null || true\n\
\n\
# Start Vite dev server if project exists\n\
if [ -d "/project" ] && [ -f "/project/package.json" ]; then\n\
  echo "🚀 Detected project, preparing Vite dev server..."\n\
  cd /project\n\
  \n\
  if [ ! -d "node_modules" ]; then\n\
    echo "📦 Installing project dependencies..."\n\
    if [ "$PROJECT_UID" != "1000" ]; then\n\
      echo "⚙️  Setting file permissions in background..."\n\
      (sudo chown -R node:node /project 2>/dev/null || true) &\n\
    fi\n\
    npm install 2>&1 | tail -20\n\
  else\n\
    echo "✓ node_modules exists, skipping installation"\n\
  fi\n\
  \n\
  echo "✅ Starting Vite dev server (port 5173)..."\n\
  npx vite --host 0.0.0.0 --port 5173 > /tmp/vite.log 2>&1 &\n\
  VITE_PID=$!\n\
  echo "Vite process ID: $VITE_PID"\n\
  \n\
  cd /app\n\
else\n\
  echo "⚠️  /project directory or package.json not found, skipping Vite startup"\n\
fi\n\
\n\
echo "✅ Starting Claude Code UI server (port 3001, user: node)..."\n\
exec node server/index.js\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Set environment variables
ENV NODE_ENV=production \
    PORT=3001 \
    CLAUDE_CLI_PATH=/usr/local/bin/claude \
    HOME=/home/node

# Switch to node user
USER node

# Expose ports
EXPOSE 3001 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/ || exit 1

# Start application
ENTRYPOINT ["/app/entrypoint.sh"]
