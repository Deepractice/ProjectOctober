# Agent SDK Sequence Diagrams

本文档通过序列图展示 Agent SDK 的核心流程。

---

## 1. Agent Initialization（Agent 初始化）

**场景**：应用启动时，创建 Agent 并加载历史 sessions

```mermaid
sequenceDiagram
    participant App as Application
    participant API as createAgent()
    participant Core as AgentCore
    participant SM as SessionManager
    participant DB as AgentPersister

    App->>API: createAgent(config)
    API->>Core: new AgentCore(config, adapter, persister, factory)
    Core->>SM: new SessionManager(...)
    API-->>App: agent

    Note over App: Agent 创建完成，但未初始化

    App->>Core: agent.initialize()
    Core->>SM: loadHistoricalSessions()
    SM->>DB: getAllSessions()
    DB-->>SM: SessionData[]

    loop For each SessionData
        SM->>DB: getMessages(sessionId)
        DB-->>SM: AnyMessage[]
        SM->>SM: sessionFactory.createSession(id, ..., messages)
        SM->>SM: sessions.set(sessionId, session)
    end

    SM-->>Core: ✅ Historical sessions loaded
    Core-->>App: ✅ Initialized

    Note over App,DB: 所有历史 sessions 已加载到内存
```

**关键点**：

1. `createAgent()` 只创建实例，不执行 I/O
2. `initialize()` 才加载历史数据
3. 每个 session 的 messages 都被加载并传入 SessionFactory
4. Session 对象重建后加入内存 Map

---

## 2. Create Empty Session（创建空 Session）

**场景**：用户点击 "New Session"，创建一个空的会话容器

```mermaid
sequenceDiagram
    participant User
    participant Core as AgentCore
    participant SM as SessionManager
    participant DB as AgentPersister
    participant Factory as SessionFactory
    participant Session

    User->>Core: createSession({ model: 'claude-sonnet-4' })
    Core->>SM: createSession(options)

    SM->>SM: sessionId = randomUUID()

    Note over SM: 1. 先保存到数据库
    SM->>DB: saveSession({ id, summary: "New Session", ... })
    DB-->>SM: ✅ Saved

    Note over SM: 2. 创建 Session 对象
    SM->>Factory: createSession(id, metadata, adapter, options, persister)
    Factory->>Session: new ClaudeSession(id, ..., persister)
    Session-->>Factory: session
    Factory-->>SM: session

    Note over SM: 3. 加入内存 Map
    SM->>SM: sessions.set(sessionId, session)

    SM-->>Core: session
    Core-->>User: session

    Note over User,DB: Session 已创建并持久化<br/>可以稍后发送消息
```

**关键点**：

1. 先保存 session metadata 到数据库（持久化优先）
2. 再创建内存对象
3. Session 没有消息，状态为 `created`
4. 用户可以稍后调用 `session.send()` 发送消息

---

## 3. Send Message（发送消息）

**场景**：向已存在的 session 发送消息并接收 AI 回复

```mermaid
sequenceDiagram
    participant User
    participant Session as Session (BaseSession)
    participant Adapter as AgentAdapter
    participant DB as AgentPersister
    participant AI as AI Provider

    User->>Session: send("Hello, Claude!")

    Note over Session: 1. 创建并持久化用户消息
    Session->>Session: userMsg = createUserMessage(content)
    Session->>Session: addMessage(userMsg)
    Session->>DB: saveMessage(sessionId, userMsg) [fire-and-forget]

    Note over Session: 2. 更新状态为 active
    Session->>Session: state = 'active'

    Note over Session: 3. 调用 adapter 流式获取回复
    Session->>Adapter: stream(content, options)
    Adapter->>AI: API call (streaming)

    loop For each chunk from AI
        AI-->>Adapter: AdapterMessage chunk
        Adapter-->>Session: yield AdapterMessage

        alt Has provider session ID
            Session->>Session: extractSessionId(msg)
            Session->>Session: onSessionIdExtracted(sessionId)
        end

        Note over Session: 4. 转换并持久化 AI 消息
        Session->>Session: agentMsg = transformMessage(msg)
        Session->>Session: addMessage(agentMsg)
        Session->>DB: saveMessage(sessionId, agentMsg) [fire-and-forget]

        alt Has token usage
            Session->>Session: updateTokenUsage(msg.usage)
        end
    end

    Note over Session: 5. 流式完成，更新状态
    Session->>Session: state = 'idle'

    Note over Session: 6. 保存 session metadata
    Session->>DB: saveSession({ id, summary, lastActivity: now })
    DB-->>Session: ✅ Saved

    Session-->>User: ✅ Message sent
```

**关键点**：

1. **Fire-and-forget**: 消息持久化不阻塞主流程
2. **流式处理**: 边接收边持久化，不等全部完成
3. **自动更新**: 对话完成后自动更新 session metadata
4. **Token 追踪**: 累积 token usage 统计

---

## 4. Load Historical Session（加载历史 Session）

**场景**：重启应用后，从数据库恢复 session

```mermaid
sequenceDiagram
    participant SM as SessionManager
    participant DB as AgentPersister
    participant Factory as SessionFactory
    participant Session as BaseSession

    SM->>DB: getAllSessions()
    DB-->>SM: [SessionData1, SessionData2, ...]

    loop For each SessionData
        Note over SM,Session: 重建每个 Session

        SM->>DB: getMessages(sessionData.id)
        DB-->>SM: [msg1, msg2, msg3, ...]

        SM->>Factory: createSession(id, metadata, adapter, ..., messages, tokenUsage)
        Factory->>Session: new ClaudeSession(id, ..., persister, messages, usage)

        Note over Session: Constructor 接收历史数据
        Session->>Session: this.messages = [...initialMessages]
        Session->>Session: this.tokenUsage = initialTokenUsage

        Note over Session: 加载已持久化的消息（如果构造时没传入）
        Session->>Session: loadPersistedMessages()
        Session->>DB: getMessages(sessionId)
        DB-->>Session: [msg1, msg2, ...]
        Session->>Session: this.messages = persistedMessages

        Session-->>Factory: session
        Factory-->>SM: session

        SM->>SM: sessions.set(sessionId, session)
    end

    Note over SM: 所有历史 session 恢复完成
```

**关键点**：

1. `getAllSessions()` 获取所有 session 元数据
2. 为每个 session 加载其完整的 messages
3. 通过 SessionFactory 重建 Session 对象
4. Session 对象包含所有历史消息和 token usage
5. 加入内存 Map，用户可以继续对话

---

## 5. Delete Session（删除 Session）

**场景**：用户删除一个 session

```mermaid
sequenceDiagram
    participant User
    participant Core as AgentCore
    participant SM as SessionManager
    participant Session
    participant DB as AgentPersister

    User->>Core: sessionManager.deleteSession(sessionId)
    Core->>SM: deleteSession(sessionId)

    SM->>SM: session = sessions.get(sessionId)

    alt Session exists
        SM->>Session: session.delete()
        Session->>Session: state = 'deleted'
        Session->>Session: messageSubject.complete()

        SM->>SM: sessions.delete(sessionId)

        Note over SM,DB: 数据库级联删除
        SM->>DB: deleteSession(sessionId)
        Note over DB: DELETE FROM sessions WHERE id = sessionId<br/>CASCADE deletes messages

        DB-->>SM: ✅ Deleted
        SM-->>Core: ✅ Session deleted
    else Session not found
        SM->>SM: log warning
    end

    Core-->>User: ✅ Done
```

**关键点**：

1. 先更新内存对象状态（`deleted`）
2. 从内存 Map 移除
3. 数据库级联删除（session + messages）
4. `ON DELETE CASCADE` 自动删除关联的 messages

---

## 6. Quick Chat（快速对话）

**场景**：一次性创建 session 并发送消息的便利方法

```mermaid
sequenceDiagram
    participant User
    participant Core as AgentCore
    participant SM as SessionManager
    participant Session

    User->>Core: chat("What is TypeScript?")

    Note over Core: 1. 创建空 session
    Core->>SM: createSession({ model })
    SM-->>Core: session

    Note over Core: 2. 发送消息
    Core->>Session: send("What is TypeScript?")

    Note over Session: [参见 "Send Message" 流程]
    Session-->>Core: ✅ Message sent

    Core-->>User: session

    Note over User: 返回的 session 可以继续对话
```

**关键点**：

1. `chat()` 是 `createSession()` + `send()` 的语法糖
2. 本质上是两步操作，不是原子操作
3. 返回的 session 可以继续使用

---

## 7. Concurrent Session Creation（并发创建 Sessions）

**场景**：同时创建多个 session（测试、批处理等）

```mermaid
sequenceDiagram
    participant User
    participant Core as AgentCore
    participant SM as SessionManager
    participant DB as AgentPersister

    par Session 1
        User->>Core: createSession()
        Core->>SM: createSession()
        SM->>DB: saveSession(session1)
        SM-->>Core: session1
        Core-->>User: session1
    and Session 2
        User->>Core: createSession()
        Core->>SM: createSession()
        SM->>DB: saveSession(session2)
        SM-->>Core: session2
        Core-->>User: session2
    and Session 3
        User->>Core: createSession()
        Core->>SM: createSession()
        SM->>DB: saveSession(session3)
        SM-->>Core: session3
        Core-->>User: session3
    end

    Note over User,DB: 所有 sessions 并发创建<br/>数据库事务隔离确保一致性
```

**关键点**：

1. 每个 `createSession()` 独立执行
2. 数据库事务隔离保证数据一致性
3. 内存 Map 操作是线程安全的（JavaScript 单线程）

---

## 8. Session Resume（Session 恢复）

**场景**：使用 provider 的 session ID 恢复对话（如 Claude 的 resume 功能）

```mermaid
sequenceDiagram
    participant User
    participant Session as ClaudeSession
    participant Adapter as ClaudeAdapter
    participant Claude as Claude API

    Note over User,Claude: 第一次对话

    User->>Session: send("Hello")
    Session->>Adapter: stream(content, {})
    Adapter->>Claude: API call
    Claude-->>Adapter: response + session_id: "claude-abc123"
    Adapter-->>Session: AdapterMessage { sessionId: "claude-abc123" }

    Note over Session: 提取并保存 Claude session ID
    Session->>Session: extractSessionId(msg)
    Session->>Session: onSessionIdExtracted("claude-abc123")
    Session->>Session: options.resume = "claude-abc123"

    Note over User,Claude: 第二次对话（自动 resume）

    User->>Session: send("Continue our chat")
    Session->>Adapter: stream(content, { resume: "claude-abc123" })
    Note over Adapter: 使用 Claude session ID 恢复上下文
    Adapter->>Claude: API call with resume
    Claude-->>Adapter: response (with full context)
    Adapter-->>Session: AdapterMessage

    Session-->>User: ✅ Response with context
```

**关键点**：

1. **Provider Session ID**: Claude 等 provider 自己的 session ID
2. **自动提取**: `extractSessionId()` 从 AdapterMessage 提取
3. **自动注入**: 下次 `send()` 自动带上 resume 参数
4. **双层 ID**: 我们的 UUID + Provider 的 session ID

---

## 9. Error Handling（错误处理）

**场景**：发送消息时发生错误

```mermaid
sequenceDiagram
    participant User
    participant Session
    participant Adapter
    participant AI as AI Provider
    participant DB as AgentPersister

    User->>Session: send("Hello")
    Session->>DB: saveMessage(userMsg) [async]
    Session->>Adapter: stream(content)
    Adapter->>AI: API call

    alt Network Error
        AI-->>Adapter: ❌ Connection failed
        Adapter-->>Session: throw Error
        Session->>Session: state = 'error'
        Session->>Session: messageSubject.error(err)
        Session-->>User: ❌ throw Error

        Note over User: Session 状态为 error<br/>用户消息已保存，可以重试
    else Rate Limit
        AI-->>Adapter: ❌ 429 Too Many Requests
        Adapter-->>Session: throw Error
        Session->>Session: state = 'error'
        Session-->>User: ❌ throw Error
    else Invalid Input
        AI-->>Adapter: ❌ 400 Bad Request
        Adapter-->>Session: throw Error
        Session->>Session: state = 'error'
        Session-->>User: ❌ throw Error
    end

    Note over User,DB: 错误状态的 session 可以重试<br/>已保存的消息不会丢失
```

**关键点**：

1. **用户消息已保存**: 即使失败，用户消息也已持久化
2. **状态标记**: Session 状态变为 `error`
3. **可重试**: 用户可以重新调用 `send()`
4. **不丢数据**: 数据库中的数据保持一致

---

## 10. Multi-Provider Scenario（多 Provider 场景）

**场景**：同时使用 Claude 和 OpenAI（假设）

```mermaid
sequenceDiagram
    participant User
    participant ClaudeAgent as Agent (Claude)
    participant ClaudeAdapter
    participant ClaudeAPI as Claude API

    participant OpenAIAgent as Agent (OpenAI)
    participant OpenAIAdapter
    participant OpenAIAPI as OpenAI API

    Note over User,OpenAIAPI: 创建两个 Agent 实例

    User->>ClaudeAgent: createAgent(config, { adapter: ClaudeAdapter })
    User->>OpenAIAgent: createAgent(config, { adapter: OpenAIAdapter })

    par Claude Session
        User->>ClaudeAgent: createSession()
        ClaudeAgent-->>User: claudeSession
        User->>ClaudeAgent: send("Hello from Claude")
        ClaudeAgent->>ClaudeAdapter: stream(...)
        ClaudeAdapter->>ClaudeAPI: API call
        ClaudeAPI-->>ClaudeAdapter: response
        ClaudeAdapter-->>ClaudeAgent: AdapterMessage
        ClaudeAgent-->>User: ✅
    and OpenAI Session
        User->>OpenAIAgent: createSession()
        OpenAIAgent-->>User: openaiSession
        User->>OpenAIAgent: send("Hello from OpenAI")
        OpenAIAgent->>OpenAIAdapter: stream(...)
        OpenAIAdapter->>OpenAIAPI: API call
        OpenAIAPI-->>OpenAIAdapter: response
        OpenAIAdapter-->>OpenAIAgent: AdapterMessage
        OpenAIAgent-->>User: ✅
    end

    Note over User,OpenAIAPI: 同时使用两个 provider<br/>核心逻辑完全相同
```

**关键点**：

1. **接口统一**: 所有 provider 都实现 `AgentAdapter`
2. **逻辑复用**: AgentCore, SessionManager, BaseSession 完全复用
3. **依赖注入**: 通过 `createAgent()` 的 deps 参数切换 provider
4. **并行运行**: 可以同时使用多个 provider

---

## Summary

### 核心流程总结

1. **初始化**: `createAgent()` → `initialize()` → 加载历史 sessions
2. **创建会话**: `createSession()` → 保存到 DB → 创建内存对象
3. **发送消息**: `send()` → 持久化用户消息 → 流式接收 → 持久化 AI 消息 → 更新 metadata
4. **恢复会话**: 从 DB 加载 sessions + messages → 重建 Session 对象
5. **删除会话**: 更新状态 → 从内存删除 → 级联删除数据库

### 设计亮点

✅ **持久化优先**: 先保存数据库，再创建内存对象
✅ **异步持久化**: 消息保存不阻塞主流程（fire-and-forget）
✅ **自动更新**: 每次对话后自动更新 session metadata
✅ **状态恢复**: 重启后完整恢复所有 sessions
✅ **错误容错**: 错误发生时数据不丢失，可重试
✅ **Provider 无关**: 所有流程与具体 AI provider 解耦
