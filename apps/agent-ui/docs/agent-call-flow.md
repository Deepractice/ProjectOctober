# Agent 对话调用流程分析

## 概览

系统使用 `@anthropic-ai/claude-agent-sdk` 实现与 Agent 的交互，通过 WebSocket 实现实时流式响应。

## 完整调用流程

### 1. 前端发送消息

**文件**: `apps/agent-ui/src/components/ChatInterface.jsx`

#### 1.1 用户触发 (Line 3670)
```javascript
const handleSubmit = useCallback(async (e) => {
  // 用户提交消息
  e.preventDefault();
  if (!input.trim() || isLoading || !selectedProject) return;
```

#### 1.2 构造消息对象 (Line 3783-3796)
```javascript
sendMessage({
  type: 'agent-command',
  command: input,  // 用户输入的文本
  options: {
    projectPath: selectedProject.path,
    cwd: selectedProject.fullPath,
    sessionId: currentSessionId,  // 续接会话ID或null
    resume: !!currentSessionId,
    toolsSettings: toolsSettings,  // 工具权限设置
    permissionMode: permissionMode, // 权限模式
    images: uploadedImages  // 上传的图片
  }
});
```

#### 1.3 WebSocket 发送 (Line 94-100)
**文件**: `apps/agent-ui/src/utils/websocket.js`

```javascript
const sendMessage = (message) => {
  if (ws && isConnected) {
    ws.send(JSON.stringify(message));  // JSON序列化后发送
  }
};
```

### 2. 后端 WebSocket 接收

**文件**: `apps/agent-ui/server/index.js`

#### 2.1 接收消息 (Line 608-618)
```javascript
ws.on('message', async (message) => {
  const data = JSON.parse(message);

  if (data.type === 'agent-command') {
    console.log('💬 User message:', data.command);
    console.log('📁 Project:', data.options?.projectPath);
    console.log('🔄 Session:', data.options?.sessionId ? 'Resume' : 'New');

    // 调用 Agent SDK
    await queryAgentSDK(data.command, data.options, ws);
  }
});
```

### 3. Agent SDK 执行

**文件**: `apps/agent-ui/server/agent-sdk.js`

#### 3.1 主函数入口 (Line 338)
```javascript
async function queryAgentSDK(command, options = {}, ws) {
  const { sessionId } = options;
  let capturedSessionId = sessionId;
```

#### 3.2 选项映射 (Line 28-88)
将前端选项转换为 SDK 格式：
```javascript
function mapCliOptionsToSDK(options = {}) {
  const sdkOptions = {};

  // 工作目录
  if (cwd) sdkOptions.cwd = cwd;

  // 权限模式
  if (permissionMode && permissionMode !== 'default') {
    sdkOptions.permissionMode = permissionMode;
  }

  // 工具权限
  if (settings.allowedTools.length > 0) {
    sdkOptions.allowedTools = allowedTools;
  }

  // 模型选择
  sdkOptions.model = options.model || 'sonnet';

  // 会话续接
  if (sessionId) {
    sdkOptions.resume = sessionId;
  }

  return sdkOptions;
}
```

#### 3.3 加载 MCP 配置 (Line 276-329)
从 `~/.claude.json` 加载 MCP 服务器配置：
```javascript
async function loadMcpConfig(cwd) {
  const claudeConfigPath = path.join(os.homedir(), '.claude.json');

  // 读取配置文件
  const configContent = await fs.readFile(claudeConfigPath, 'utf8');
  const claudeConfig = JSON.parse(configContent);

  // 合并全局和项目特定的 MCP 服务器
  let mcpServers = { ...claudeConfig.mcpServers };

  // 项目特定配置会覆盖全局配置
  if (claudeConfig.claudeProjects && cwd) {
    const projectConfig = claudeConfig.claudeProjects[cwd];
    if (projectConfig?.mcpServers) {
      mcpServers = { ...mcpServers, ...projectConfig.mcpServers };
    }
  }

  return mcpServers;
}
```

#### 3.4 处理图片 (Line 192-238)
将 base64 图片保存为临时文件：
```javascript
async function handleImages(command, images, cwd) {
  // 创建临时目录
  tempDir = path.join(workingDir, '.tmp', 'images', Date.now().toString());
  await fs.mkdir(tempDir, { recursive: true });

  // 保存每个图片
  for (const [index, image] of images.entries()) {
    // 解析 base64 数据
    const [, mimeType, base64Data] = image.data.match(/^data:([^;]+);base64,(.+)$/);

    // 写入文件
    const filepath = path.join(tempDir, `image_${index}.${extension}`);
    await fs.writeFile(filepath, Buffer.from(base64Data, 'base64'));
    tempImagePaths.push(filepath);
  }

  // 在提示词中添加图片路径
  const imageNote = `\n\n[Images provided at the following paths:]\n${tempImagePaths.join('\n')}`;
  modifiedCommand = command + imageNote;

  return { modifiedCommand, tempImagePaths, tempDir };
}
```

#### 3.5 调用 SDK (Line 362-365)
```javascript
import { query } from '@anthropic-ai/claude-agent-sdk';

const queryInstance = query({
  prompt: finalCommand,
  options: {
    ...sdkOptions,
    mcpServers: mcpServers  // MCP 服务器配置
  }
});
```

#### 3.6 流式处理响应 (Line 374-417)
```javascript
// 异步迭代器处理流式响应
for await (const message of queryInstance) {
  // 捕获会话ID（首次消息）
  if (message.session_id && !capturedSessionId) {
    capturedSessionId = message.session_id;

    // 发送会话创建事件
    ws.send(JSON.stringify({
      type: 'session-created',
      sessionId: capturedSessionId
    }));
  }

  // 转发消息到前端
  ws.send(JSON.stringify({
    type: 'agent-response',
    data: message
  }));

  // 提取并发送 token 使用情况
  if (message.type === 'result') {
    const tokenBudget = extractTokenBudget(message);
    ws.send(JSON.stringify({
      type: 'token-budget',
      data: tokenBudget
    }));
  }
}
```

#### 3.7 清理资源 (Line 420-436)
```javascript
// 清理会话
if (capturedSessionId) {
  removeSession(capturedSessionId);
}

// 清理临时图片文件
await cleanupTempFiles(tempImagePaths, tempDir);

// 发送完成事件
ws.send(JSON.stringify({
  type: 'agent-complete',
  sessionId: capturedSessionId,
  exitCode: 0
}));
```

### 4. 前端接收响应

**文件**: `apps/agent-ui/src/utils/websocket.js` (Line 66-72)

```javascript
websocket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  setMessages(prev => [...prev, data]);  // 添加到消息队列
};
```

**文件**: `apps/agent-ui/src/components/ChatInterface.jsx`

监听 WebSocket 消息并更新 UI：
```javascript
useEffect(() => {
  if (messages.length > 0) {
    const latestMessage = messages[messages.length - 1];

    // 处理不同类型的消息
    switch (latestMessage.type) {
      case 'agent-response':
        // 更新聊天消息
        break;
      case 'session-created':
        // 保存会话ID
        setCurrentSessionId(latestMessage.sessionId);
        break;
      case 'token-budget':
        // 更新 token 使用显示
        break;
      case 'agent-complete':
        // 标记加载完成
        setIsLoading(false);
        break;
    }
  }
}, [messages]);
```

## 关键特性

### 会话管理
- **新会话**: `sessionId` 为 null，SDK 会创建新的会话
- **续接会话**: 提供 `sessionId`，SDK 会恢复之前的对话上下文

### 权限控制
支持 4 种权限模式：
1. `default`: 默认模式，工具需要确认
2. `acceptEdits`: 自动接受所有编辑操作
3. `bypassPermissions`: 绕过所有权限检查
4. `plan`: 计划模式，只允许读取和规划工具

### MCP 服务器支持
- 从 `~/.claude.json` 读取配置
- 支持全局和项目特定的 MCP 服务器
- 项目配置优先级高于全局配置

### 图片上传
- 前端将图片转为 base64
- 后端保存为临时文件
- 在提示词中附加文件路径
- 完成后自动清理

### Token 计费
- 实时统计输入、输出、缓存 token
- 支持设置 token 预算（环境变量 `CONTEXT_WINDOW`）
- 前端显示使用百分比

## 流程图

```
User Input
   ↓
ChatInterface.handleSubmit()
   ↓
WebSocket.sendMessage()
   ↓
Server WebSocket Handler
   ↓
queryAgentSDK()
   ↓
Agent Agent SDK
   ↓
Streaming Response
   ↓
WebSocket.onmessage()
   ↓
ChatInterface Update UI
```

## 环境变量

```env
# Agent API
ANTHROPIC_BASE_URL="https://relay.deepractice.ai/api"
ANTHROPIC_AUTH_TOKEN="cr_xxx..."

# Token Budget
CONTEXT_WINDOW=160000

# Server Port
PORT=3001
```

## 依赖包

```json
{
  "@anthropic-ai/claude-agent-sdk": "^0.1.29",
  "ws": "^8.14.2"
}
```

## 文件清单

### 前端
- `src/components/ChatInterface.jsx` - 聊天界面组件
- `src/utils/websocket.js` - WebSocket 连接管理
- `src/contexts/WebSocketContext.jsx` - WebSocket 上下文

### 后端
- `server/index.js` - Express + WebSocket 服务器
- `server/agent-sdk.js` - Agent SDK 集成
- `server/projects.js` - 项目管理
