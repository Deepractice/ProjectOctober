#
# Agent Runtime - Base execution environment for AI agents
# Debian 12 + Node.js 20 + Google Chrome + FFmpeg + Development tools
#

FROM debian:12

LABEL maintainer="Deepractice AI <hello@deepractice.ai>"
LABEL org.opencontainers.image.title="Agent Runtime"
LABEL org.opencontainers.image.description="Base runtime environment for AI agents with Debian, Node.js, Chrome, FFmpeg and essential tools"
LABEL org.opencontainers.image.version="1.1.0"

ENV DEBIAN_FRONTEND=noninteractive

# Install essential packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends -o Acquire::Retries=3 \
      # Network and certificates
      curl wget ca-certificates gnupg \
      # Process and system tools
      sudo procps vim nano less \
      # Version control
      git \
      # Build tools (for native Node.js modules)
      build-essential python3 python3-pip \
      # Additional utilities
      zip unzip jq htop tree \
      # Chrome dependencies
      fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
      libatspi2.0-0 libcups2 libdbus-1-3 libdrm2 libgbm1 \
      libgtk-3-0 libnspr4 libnss3 libwayland-client0 \
      libxcomposite1 libxdamage1 libxfixes3 libxkbcommon0 \
      libxrandr2 xdg-utils \
      # FFmpeg
      ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Install Chromium (Debian provides real deb package, not snap)
RUN apt-get update && \
    apt-get install -y -o Acquire::Retries=3 chromium chromium-driver && \
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
    python3 --version && \
    chromium --version && \
    ffmpeg -version

# Create node user (UID=1000 for host compatibility)
RUN useradd -u 1000 -U -m -s /bin/bash node && \
    echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Default work directory
WORKDIR /app

# Default user (can be overridden)
USER node

CMD ["/bin/bash"]
