#
# 生产环境 Dockerfile for Claude Code UI
# 基于上游开源主线，无任何核心代码修改
#

FROM node:20-slim AS builder

ENV DEBIAN_FRONTEND=noninteractive

# 安装构建依赖
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      python3 \
      make \
      g++ \
      git \
      ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 使用淘宝镜像加速（可选，中国大陆用户）
RUN rm -f .npmrc package-lock.json && \
    npm config set registry https://registry.npmmirror.com/ && \
    npm cache clean --force

# 安装依赖
ENV SHARP_BINARY_HOST="https://npmmirror.com/mirrors/sharp" \
    SHARP_LIBVIPS_BINARY_HOST="https://npmmirror.com/mirrors/sharp-libvips" \
    SQLITE3_BINARY_HOST_MIRROR="https://npmmirror.com/mirrors/sqlite3" \
    BETTER_SQLITE3_BINARY_HOST="https://npmmirror.com/mirrors/better-sqlite3"

RUN npm install --no-audit --fetch-timeout=600000

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 生产镜像
FROM node:20-slim

ENV DEBIAN_FRONTEND=noninteractive

# 安装运行时依赖
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      bash \
      git \
      openssh-client \
      curl \
      python3 \
      ca-certificates \
      sqlite3 && \
    rm -rf /var/lib/apt/lists/*

# 安装 Claude Code CLI
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm install -g @anthropic-ai/claude-code

WORKDIR /app

# 从构建阶段复制文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/package*.json ./

# 安装生产依赖（临时安装编译工具后删除）
RUN apt-get update && \
    apt-get install -y --no-install-recommends make g++ && \
    npm config set registry https://registry.npmmirror.com/ && \
    npm install --omit=dev --production --fetch-timeout=600000 && \
    apt-get purge -y --auto-remove make g++ && \
    rm -rf /var/lib/apt/lists/*

# 创建非 root 用户
RUN useradd -m -s /bin/bash claudeuser && \
    mkdir -p /opt/claude-config && \
    chown -R claudeuser:claudeuser /app /home/claudeuser /opt/claude-config && \
    chmod -R 777 /opt/claude-config && \
    ln -sf /opt/claude-config/.claude /home/claudeuser/.claude && \
    ln -sf /opt/claude-config/.claude.json /home/claudeuser/.claude.json

# 设置环境变量
ENV NODE_ENV=production \
    PORT=3001 \
    CLAUDE_CLI_PATH=claude \
    HOME=/home/claudeuser

# 切换到非 root 用户
USER claudeuser

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/ || exit 1

# 启动应用
CMD ["node", "server/index.js"]
