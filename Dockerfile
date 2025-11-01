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

# 安装 sudo 并配置 node 用户（UID/GID=1000，便于宿主机预设权限）
RUN apt-get update && \
    apt-get install -y --no-install-recommends sudo && \
    rm -rf /var/lib/apt/lists/* && \
    echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers && \
    mkdir -p /opt/claude-config && \
    chmod -R 777 /opt/claude-config && \
    ln -sf /opt/claude-config/.claude /home/node/.claude && \
    ln -sf /opt/claude-config/.claude.json /home/node/.claude.json

# 创建启动脚本（需要在切换用户前创建）
RUN printf '#!/bin/bash\n\
set -e\n\
\n\
# 定义带时间戳的日志函数\n\
log_with_time() {\n\
  echo "[$(date "+%%Y-%%m-%%d %%H:%%M:%%S")] $1"\n\
}\n\
log_with_time "✅ 启动 Claude Code UI 服务器 (端口 3001, 用户: node)..."\n\
exec node server/index.js\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# 设置环境变量
ENV PORT=3001 \
    CLAUDE_CLI_PATH=claude \
    HOME=/home/node

# 切换到 node 用户
USER node

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/ || exit 1

# 启动应用
ENTRYPOINT ["/app/entrypoint.sh"]
