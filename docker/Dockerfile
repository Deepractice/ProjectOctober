#
# Deepractice Agent - NPM-based Lightweight Dockerfile
# Uses published @deepractice-ai/agent-cli from npm
#

FROM node:20-alpine

# Install dependencies for health check
RUN apk add --no-cache curl

# Install agent-cli globally from npm
RUN npm install -g @deepractice-ai/agent-cli

# Environment variables
ENV NODE_ENV=production \
    PORT=5200 \
    PROJECT_PATH=/project

# Runtime variables (must be provided via docker run -e or docker-compose):
# - ANTHROPIC_API_KEY (required)
# - ANTHROPIC_BASE_URL (optional, default: https://api.anthropic.com)

# Create project directory
RUN mkdir -p /project

# Set working directory
WORKDIR /project

# Expose port
EXPOSE 5200

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5200/api/health || exit 1

# Start application using agentx CLI
CMD ["agentx", "http", "--host", "0.0.0.0"]
