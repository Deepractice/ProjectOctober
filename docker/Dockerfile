#
# Claude Code UI - Ubuntu-based Production Image
# Minimal and fast
#

FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install only essential packages (minimal set for faster build)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      curl ca-certificates gnupg sudo \
      git \
      build-essential python3 \
      procps && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js 20 LTS
RUN mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Set working directory
WORKDIR /app

# Copy package files first (for better layer caching)
COPY apps/claudecodeui/package*.json ./

# Install production dependencies (this layer will be cached if package.json doesn't change)
RUN npm install --omit=dev --production

# Copy application files
COPY apps/claudecodeui/dist/ ./dist/
COPY apps/claudecodeui/server/ ./server/

# Copy entrypoint script
COPY docker/entrypoint.js ./entrypoint.js
RUN chmod +x ./entrypoint.js

# Create node user (UID=1000 for host compatibility)
RUN useradd -u 1000 -U -m -s /bin/bash node && \
    echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers && \
    # Create Claude config directory with proper permissions
    mkdir -p /opt/claude-config/.claude && \
    chmod -R 777 /opt/claude-config && \
    # Create symlinks to user home directory
    ln -sf /opt/claude-config/.claude /home/node/.claude && \
    ln -sf /opt/claude-config/.claude.json /home/node/.claude.json

# Environment variables (fixed, no need to configure)
ENV NODE_ENV=production \
    PORT=3001 \
    VITE_PORT=3000 \
    PROJECT_PATH=/project \
    HOME=/home/node

# These 2 variables must be provided at runtime via docker run or docker-compose:
# - ANTHROPIC_API_KEY (required)
# - ANTHROPIC_BASE_URL (optional, defaults to https://api.anthropic.com)

# Switch to non-root user
USER node

# Expose ports
# 3000: Frontend (Vite dev server proxies to backend internally)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3001}/ || exit 1

# Start application
ENTRYPOINT ["node", "/app/entrypoint.js"]
