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
echo "🔧 设置运行时权限..."\n\
sudo chmod -R 777 /opt/claude-config 2>/dev/null || true\n\
sudo chown -R node:node /app 2>/dev/null || true\n\
\n\
# 检查项目目录权限（如果宿主机已设置正确UID:1000则跳过）\n\
if [ -d "/project" ]; then\n\
  PROJECT_UID=$(stat -c "%u" /project 2>/dev/null || stat -f "%u" /project 2>/dev/null)\n\
  if [ "$PROJECT_UID" != "1000" ]; then\n\
    echo "📂 设置 /project 目录权限 (当前UID: $PROJECT_UID)..."\n\
    sudo chown node:node /project 2>/dev/null || true\n\
  else\n\
    echo "✓ /project 目录权限已正确设置 (UID: 1000)"\n\
  fi\n\
fi\n\
\n\
echo "📁 创建必要的目录结构..."\n\
mkdir -p /opt/claude-config/.claude 2>/dev/null || true\n\
\n\
# 启动 Vite 开发服务器（如果项目存在）\n\
if [ -d "/project" ] && [ -f "/project/package.json" ]; then\n\
  echo "🚀 检测到项目，准备启动 Vite 开发服务器..."\n\
  cd /project\n\
  \n\
  # 检查并安装依赖\n\
  if [ ! -d "node_modules" ]; then\n\
    echo "📦 安装项目依赖（包括开发依赖）..."\n\
    # 检查是否需要设置权限\n\
    if [ "$PROJECT_UID" != "1000" ]; then\n\
      echo "⚙️  后台设置文件权限..."\n\
      (sudo chown -R node:node /project 2>/dev/null || true) &\n\
    fi\n\
    npm install --registry=https://registry.npmmirror.com/ 2>&1 | tail -20\n\
  else\n\
    echo "✓ node_modules 已存在，跳过安装"\n\
  fi\n\
  \n\
  # 后台启动 Vite\n\
  echo "✅ 启动 Vite 开发服务器 (端口 5173)..."\n\
  npx vite --host 0.0.0.0 --port 5173 > /tmp/vite.log 2>&1 &\n\
  VITE_PID=$!\n\
  echo "Vite 进程 ID: $VITE_PID"\n\
  \n\
  cd /app\n\
else\n\
  echo "⚠️  未检测到 /project 目录或 package.json，跳过 Vite 启动"\n\
fi\n\
\n\
echo "✅ 启动 Claude Code UI 服务器 (端口 3001, 用户: node)..."\n\
exec node server/index.js\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# 设置环境变量
ENV NODE_ENV=production \
    PORT=3001 \
    CLAUDE_CLI_PATH=/usr/local/bin/claude \
    HOME=/home/node

# 切换到 node 用户
USER node

# 暴露端口
EXPOSE 3001 5173

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/ || exit 1

# 启动应用
ENTRYPOINT ["/app/entrypoint.sh"]
