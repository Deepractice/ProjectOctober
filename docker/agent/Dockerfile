#
# Agent - Full Stack Application
# Frontend (React) + Backend (Node.js API + WebSocket)
#

# Use pre-built runtime as base
ARG RUNTIME_VERSION=latest
FROM deepracticexs/agent-runtime:${RUNTIME_VERSION} AS base

#
# Stage 1: Build Frontend
#
FROM base AS frontend-builder

# Switch to root for build operations
USER root

WORKDIR /build

# Copy workspace config and package.json files first (for better caching)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/agent-ui/package.json ./apps/agent-ui/

# Install dependencies (this layer will be cached if package.json doesn't change)
RUN pnpm install --frozen-lockfile --filter @deepractice-ai/agent-ui...

# Copy source code and build
COPY apps/agent-ui ./apps/agent-ui
RUN pnpm --filter @deepractice-ai/agent-ui build

#
# Stage 2: Backend Dependencies
#
FROM base AS backend-deps

# Switch to root for build operations
USER root

WORKDIR /build

# Copy workspace config and package.json files first (for better caching)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY services/agent-service/package.json ./services/agent-service/

# Install production dependencies (this layer will be cached)
RUN pnpm install --frozen-lockfile --filter @deepractice-ai/agent-service... --prod

# Copy source code
COPY services/agent-service ./services/agent-service

#
# Stage 3: Production Image
#
FROM base AS production

WORKDIR /app

# Copy node_modules from backend deps (pnpm workspace root)
COPY --from=backend-deps --chown=node:node /build/node_modules ./node_modules

# Copy backend source
COPY --from=backend-deps --chown=node:node /build/services/agent-service ./services/agent-service

# Copy frontend dist from builder
COPY --from=frontend-builder --chown=node:node /build/apps/agent-ui/dist ./services/agent-service/dist

# Environment variables
ENV NODE_ENV=production \
    PORT=5200 \
    PROJECT_PATH=/project \
    HOME=/home/node

# Runtime variables (must be provided):
# - ANTHROPIC_API_KEY (required)
# - ANTHROPIC_BASE_URL (optional)

# Switch to non-root user
USER node

# Expose port
EXPOSE 5200

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5200/health || exit 1

# Start application
WORKDIR /app/services/agent-service
CMD ["node", "src/index.js"]
