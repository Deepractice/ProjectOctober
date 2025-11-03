#
# Agent Runtime - Base execution environment for AI agents
# Ubuntu 22.04 + Node.js 20 + Development tools
#

FROM ubuntu:22.04

LABEL maintainer="Deepractice AI <hello@deepractice.ai>"
LABEL org.opencontainers.image.title="Agent Runtime"
LABEL org.opencontainers.image.description="Base runtime environment for AI agents with Ubuntu, Node.js, and essential tools"
LABEL org.opencontainers.image.version="1.0.0"

ENV DEBIAN_FRONTEND=noninteractive

# Install essential packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      # Network and certificates
      curl wget ca-certificates gnupg \
      # Process and system tools
      sudo procps vim nano less \
      # Version control
      git \
      # Build tools (for native Node.js modules)
      build-essential python3 python3-pip \
      # Additional utilities
      zip unzip jq htop tree && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js 20 LTS
RUN mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm@10.15.1

# Verify installations
RUN node --version && \
    npm --version && \
    pnpm --version && \
    git --version && \
    python3 --version

# Create node user (UID=1000 for host compatibility)
RUN useradd -u 1000 -U -m -s /bin/bash node && \
    echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Default work directory
WORKDIR /app

# Default user (can be overridden)
USER node

CMD ["/bin/bash"]
