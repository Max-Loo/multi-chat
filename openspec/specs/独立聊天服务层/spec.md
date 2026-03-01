# 独立聊天服务层

## ADDED Requirements

### Requirement: 创建 OpenAI 客户端实例

系统 MUST 提供 `ChatService.createClient()` 静态方法，根据提供的配置创建 OpenAI 客户端实例。

系统 MUST 在开发环境（`import.meta.env.DEV === true`）下使用 Vite 代理地址（`${location.origin}/${providerKey}`）作为 `baseURL`。

系统 MUST 在生产环境下使用用户配置的 `baseURL`，并应用 URL 标准化规则（通过 `UrlNormalizer.normalize()`）。

系统 MUST 在创建客户端时注入兼容层的 `fetch` 函数（通过 `getFetchFunc()`），确保跨平台兼容性。

系统 MUST 设置 `dangerouslyAllowBrowser: true`（Tauri 桌面应用需要）。

系统 MUST 在配置中包含 `providerKey`，用于：
- 开发环境代理路径
- URL 标准化策略选择
- 响应解析时的格式适配

#### Scenario: 开发环境下创建客户端

- **WHEN** 应用运行在开发环境（`import.meta.env.DEV === true`）
- **AND** 调用 `ChatService.createClient({ apiKey, baseURL: 'https://api.moonshot.cn/v1', providerKey: 'KIMI' })`
- **THEN** 创建的 OpenAI 客户端使用 `${location.origin}/KIMI` 作为 `baseURL`
- **AND** 请求通过 Vite 代理转发到供应商 API
- **AND** DevTools Network 面板显示请求到本地代理地址

#### Scenario: 生产环境下创建客户端

- **WHEN** 应用运行在生产环境（`import.meta.env.DEV === false`）
- **AND** 调用 `ChatService.createClient({ apiKey, baseURL: 'https://api.moonshot.cn', providerKey: 'KIMI' })`
- **THEN** 创建的 OpenAI 客户端使用 `UrlNormalizer.normalize('https://api.moonshot.cn', 'KIMI')` 作为 `baseURL`
- **AND** URL 标准化为 `https://api.moonshot.cn/v1`
- **AND** 请求直接发送到供应商 API

#### Scenario: Tauri 环境下使用系统代理

- **WHEN** 应用运行在 Tauri 桌面环境（生产环境）
- **AND** 调用 `ChatService.createClient({ ... })`
- **THEN** 注入的 `fetch` 函数使用 `@tauri-apps/plugin-http` 的实现
- **AND** 请求支持系统代理和证书管理

#### Scenario: Web 环境下使用原生 Fetch API

- **WHEN** 应用运行在 Web 浏览器环境
- **AND** 调用 `ChatService.createClient({ ... })`
- **THEN** 注入的 `fetch` 函数使用原生 Web Fetch API
- **AND** 请求遵循浏览器的 CORS 策略

---

### Requirement: 发起流式聊天请求

系统 MUST 提供 `ChatService.streamChatCompletion()` 静态方法，发起流式聊天请求并返回异步生成器。

系统 MUST 使用 `createClient()` 创建 OpenAI 客户端实例。

系统 MUST 调用 `client.chat.completions.create()` 方法，设置 `stream: true`。

系统 MUST 在流式响应处理循环中检测 `signal.aborted`，如果为 `true` 则中断循环。

系统 MUST 使用 `mergeChunk()` 方法合并流式响应块，确保 `content` 和 `reasoning_content` 字段的内容正确累加。

系统 MUST 使用 `parseStreamResponse()` 方法解析每个合并后的响应块，返回标准化的 `StandardMessage` 对象。

系统 MUST 在每次迭代中 `yield` 解析后的消息对象，允许调用者逐步处理流式响应。

#### Scenario: 成功发起流式聊天请求

- **WHEN** 调用 `ChatService.streamChatCompletion({ model, historyList, message }, { signal })`
- **AND** 网络连接正常
- **AND** 供应商 API 返回流式响应
- **THEN** 返回异步生成器
- **AND** 调用者可以通过 `for await (const msg of response)` 迭代响应
- **AND** 每次迭代返回一个 `StandardMessage` 对象
- **AND** `content` 字段包含累加后的完整内容

#### Scenario: 流式响应内容正确累加

- **WHEN** 供应商 API 返回多个流式响应块
- **AND** 第 1 个块的 `delta.content` 为 "Hello"
- **AND** 第 2 个块的 `delta.content` 为 " World"
- **AND** 第 3 个块的 `delta.content` 为 "!"
- **THEN** 第 1 次迭代返回的消息 `content` 为 "Hello"
- **AND** 第 2 次迭代返回的消息 `content` 为 "Hello World"
- **AND** 第 3 次迭代返回的消息 `content` 为 "Hello World!"

#### Scenario: 信号中断时停止流式响应

- **WHEN** 调用 `ChatService.streamChatCompletion({ ... }, { signal })`
- **AND** 流式响应处理过程中，外部调用 `signal.abort()`
- **THEN** 下一次迭代检测到 `signal.aborted === true`
- **AND** 流式响应处理循环立即中断
- **AND** 生成器停止生成新的消息对象
- **AND** 网络请求被取消（如果支持）

#### Scenario: 处理供应商的特殊字段（reasoning_content）

- **WHEN** 供应商 API 返回的流式响应块包含 `reasoning_content` 字段
- **AND** 第 1 个块的 `delta.reasoning_content` 为 "Step 1: "
- **AND** 第 2 个块的 `delta.reasoning_content` 为 "analyze"
- **THEN** `mergeChunk()` 正确合并 `reasoning_content` 字段
- **AND** 第 1 次迭代返回的消息 `reasoningContent` 为 "Step 1: "
- **AND** 第 2 次迭代返回的消息 `reasoningContent` 为 "Step 1: analyze"

---

### Requirement: 解析流式响应块

系统 MUST 提供 `ChatService.parseStreamResponse()` 静态方法，将 OpenAI 流式响应块解析为 `StandardMessage` 格式。

系统 MUST 从 OpenAI 响应块中提取基础字段：`id`、`created`（映射到 `timestamp`）、`model`（映射到 `modelKey`）、`finish_reason`。

系统 MUST 从 `choices[0].delta` 中提取 `role`，并通过 `getStandardRole()` 标准化为 `StandardRole` 类型。

系统 MUST 提取 `delta.content` 字段，如果不存在则使用空字符串。

系统 MUST 初始化 `reasoningContent` 字段为空字符串。

系统 MUST 检查 `delta` 对象中是否存在 `reasoning_content` 字段（Deepseek/Kimi 特殊字段），如果存在则赋值给 `reasoningContent`。

系统 MUST 从 `choices[0].usage` 中提取 token 使用情况：
- `completion_tokens` → `tokensUsage.completion`
- `prompt_tokens` → `tokensUsage.prompt`

系统 MUST 处理不同供应商的 `cached_tokens` 字段结构：
- Deepseek/Kimi：`usage.cached_tokens`（直接字段）
- BigModel：`usage.prompt_tokens_details.cached_tokens`（嵌套字段）

系统 MUST 将完整的 OpenAI 响应块序列化为 JSON 字符串，存储在 `raw` 字段中。

#### Scenario: 解析标准 OpenAI 响应

- **WHEN** OpenAI 响应块包含 `id: "chatcmpl-123"`、`created: 1234567890`、`model: "gpt-4"`、`choices[0].finish_reason: "stop"`
- **AND** `choices[0].delta.role: "assistant"`、`choices[0].delta.content: "Hello"`
- **AND** `choices[0].usage` 包含 `completion_tokens: 10`、`prompt_tokens: 20`
- **THEN** 返回的 `StandardMessage` 对象包含：
  - `id: "chatcmpl-123"`
  - `timestamp: 1234567890`
  - `modelKey: "gpt-4"`
  - `finishReason: "stop"`
  - `role: "assistant"`
  - `content: "Hello"`
  - `reasoningContent: ""`
  - `tokensUsage: { completion: 10, prompt: 20 }`

#### Scenario: 解析 Deepseek/Kimi 的 reasoning_content 字段

- **WHEN** 供应商为 Deepseek 或 Kimi
- **AND** OpenAI 响应块的 `delta` 对象包含 `reasoning_content: "Let me think..."`
- **THEN** 返回的 `StandardMessage` 对象的 `reasoningContent` 字段为 "Let me think..."
- **AND** `content` 字段保持不变

#### Scenario: 解析 Deepseek/Kimi 的 cached_tokens 字段

- **WHEN** 供应商为 Deepseek 或 Kimi
- **AND** OpenAI 响应块的 `choices[0].usage` 对象包含 `cached_tokens: 5`
- **THEN** 返回的 `StandardMessage` 对象的 `tokensUsage` 字段包含：
  - `completion: <value>`
  - `prompt: <value>`
  - `cached: 5`

#### Scenario: 解析 BigModel 的嵌套 cached_tokens 字段

- **WHEN** 供应商为 BigModel
- **AND** OpenAI 响应块的 `choices[0].usage` 对象包含 `prompt_tokens_details: { cached_tokens: 5 }`
- **THEN** 返回的 `StandardMessage` 对象的 `tokensUsage` 字段包含：
  - `completion: <value>`
  - `prompt: <value>`
  - `cached: 5`

---

### Requirement: 构建消息列表

系统 MUST 提供 `ChatService.buildMessages()` 私有静态方法，构建 OpenAI 格式的消息列表。

系统 MUST 遍历 `historyList`，将每个 `StandardMessage` 转换为 `{ role, content }` 格式。

系统 MUST 在消息列表末尾添加用户的最新消息：`{ role: 'user', content: message }`。

系统 MUST 确保返回的消息列表类型为 `OpenAI.Chat.Completions.ChatCompletionMessageParam[]`。

#### Scenario: 构建包含历史记录的消息列表

- **WHEN** `historyList` 包含两条历史记录：
  - `{ role: 'user', content: 'Hello' }`
  - `{ role: 'assistant', content: 'Hi there!' }`
- **AND** `message` 为 "How are you?"
- **THEN** 返回的消息列表为：
  ```typescript
  [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi there!' },
    { role: 'user', content: 'How are you?' }
  ]
  ```

#### Scenario: 构建空历史记录的消息列表

- **WHEN** `historyList` 为空数组
- **AND** `message` 为 "Hello"
- **THEN** 返回的消息列表为：
  ```typescript
  [{ role: 'user', content: 'Hello' }]
  ```

---

### Requirement: 合并流式响应块

系统 MUST 提供 `ChatService.mergeChunk()` 私有静态方法，合并流式响应块。

系统 MUST 在 `tempChunk` 为 `null` 时直接返回 `chunk`。

系统 MUST 使用 `mergeWith()` 函数合并 `tempChunk` 和 `chunk`。

系统 MUST 根据 `shouldMergeContent()` 方法的判断结果决定是否合并字段内容：
- 如果字段名为 `reasoning_content` 或 `content`，则执行字符串拼接
- 其他字段使用默认的合并策略

#### Scenario: 合并 content 字段

- **WHEN** `tempChunk.choices[0].delta.content` 为 "Hello"
- **AND** `chunk.choices[0].delta.content` 为 " World"
- **THEN** 合并后的 `choices[0].delta.content` 为 "Hello World"

#### Scenario: 合并 reasoning_content 字段

- **WHEN** `tempChunk.choices[0].delta.reasoning_content` 为 "Step 1: "
- **AND** `chunk.choices[0].delta.reasoning_content` 为 "analyze"
- **THEN** 合并后的 `choices[0].delta.reasoning_content` 为 "Step 1: analyze"

#### Scenario: tempChunk 为 null 时直接返回 chunk

- **WHEN** `tempChunk` 为 `null`
- **AND** `chunk` 为一个有效的流式响应块
- **THEN** 直接返回 `chunk`，不执行合并逻辑

---

### Requirement: 判断字段是否需要合并

系统 MUST 提供 `ChatService.shouldMergeContent()` 私有静态方法，判断字段是否需要内容合并。

系统 MUST 返回 `true` 如果字段名为 `reasoning_content` 或 `content`。

系统 MUST 返回 `false` 对于其他字段名。

#### Scenario: content 字段需要合并

- **WHEN** 调用 `shouldMergeContent('content')`
- **THEN** 返回 `true`

#### Scenario: reasoning_content 字段需要合并

- **WHEN** 调用 `shouldMergeContent('reasoning_content')`
- **THEN** 返回 `true`

#### Scenario: 其他字段不需要合并

- **WHEN** 调用 `shouldMergeContent('role')`
- **THEN** 返回 `false`

---

### Requirement: 提取 token 使用情况

系统 MUST 在 `parseStreamResponse()` 方法中提取 token 使用情况。

系统 MUST 检查 `choices[0].usage` 是否存在，如果不存在则不设置 `tokensUsage` 字段。

系统 MUST 处理 Deepseek/Kimi 的 `cached_tokens` 字段（直接字段）。

系统 MUST 处理 BigModel 的 `cached_tokens` 字段（嵌套在 `prompt_tokens_details` 中）。

系统 MUST 处理标准格式（无 `cached_tokens` 字段）。

#### Scenario: 提取 Deepseek/Kimi 的 token 使用情况

- **WHEN** `choices[0].usage` 包含 `{ completion_tokens: 10, prompt_tokens: 20, cached_tokens: 5 }`
- **THEN** `tokensUsage` 为 `{ completion: 10, prompt: 20, cached: 5 }`

#### Scenario: 提取 BigModel 的 token 使用情况

- **WHEN** `choices[0].usage` 包含：
  ```json
  {
    "completion_tokens": 10,
    "prompt_tokens": 20,
    "prompt_tokens_details": { "cached_tokens": 5 }
  }
  ```
- **THEN** `tokensUsage` 为 `{ completion: 10, prompt: 20, cached: 5 }`

#### Scenario: 提取标准格式的 token 使用情况

- **WHEN** `choices[0].usage` 包含 `{ completion_tokens: 10, prompt_tokens: 20 }`
- **AND** 不包含 `cached_tokens` 或 `prompt_tokens_details` 字段
- **THEN** `tokensUsage` 为 `{ completion: 10, prompt: 20 }`

#### Scenario: usage 不存在时不设置 tokensUsage

- **WHEN** `choices[0]` 不包含 `usage` 字段
- **THEN** `tokensUsage` 字段不存在（而不是 `undefined`）
