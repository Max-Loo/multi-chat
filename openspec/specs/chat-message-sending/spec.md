# Chat Message Sending Capability Specification

## ADDED Requirements

### Requirement: 发送聊天消息

系统 MUST 在 Redux Thunk `sendMessage` 中使用 `ChatService.streamChatCompletion()` 发起流式聊天请求。前端 `sendMessage` 调用函数 SHALL 在调用点添加异步异常处理（`.catch(console.error)`）。并发守卫由调用点的 `isSending` 检查负责，SHALL NOT 使用 `abortSendEventRef.current` 作为发送锁。

系统 MUST 将 `model` 对象、`historyList` 和 `message` 作为参数传递给 `ChatService.streamChatCompletion()`。

系统 MUST 将 `signal`（AbortSignal）作为选项传递给 `ChatService.streamChatCompletion()`。

系统 MUST 使用 `for await...of` 循环迭代 `ChatService.streamChatCompletion()` 返回的异步生成器。

系统 MUST NOT 再使用 `getProviderFactory(model.providerKey).getModelProvider().fetchApi.fetch()` 发起聊天请求。

系统 MUST NOT 再通过 Provider 工厂获取 `fetchApi` 实例。

#### Scenario: 使用 ChatService 发送聊天消息
- **WHEN** 用户在聊天界面发送消息
- **AND** Redux Thunk `sendMessage` 被 dispatch
- **THEN** 系统调用 `ChatService.streamChatCompletion({ model, historyList, message }, { signal })`
- **AND** 系统通过 `for await (const msg of response)` 迭代流式响应
- **AND** 系统将每个响应消息 dispatch 到 Redux store
- **AND** 聊天界面实时显示流式响应

#### Scenario: 前端 sendMessage 异步异常捕获
- **WHEN** 前端 `sendMessage` 的 async 流程中抛出异常
- **THEN** 调用点 SHALL 通过 `.catch(console.error)` 捕获，避免 unhandled rejection

#### Scenario: 不再使用 Provider 工厂的 fetchApi
- **WHEN** Redux Thunk `sendMessage` 执行
- **THEN** 系统 MUST NOT 调用 `getProviderFactory(model.providerKey).getModelProvider()`
- **AND** 系统 MUST NOT 访问 `fetchApi.fetch()` 方法
- **AND** 系统 MUST NOT 通过 Provider 架构发起聊天请求
- **AND** 所有聊天请求逻辑由 `ChatService` 处理

---

### Requirement: 处理流式响应

系统 MUST 在 `for await...of` 循环中处理 `ChatService.streamChatCompletion()` 返回的 `StandardMessage` 对象。

系统 MUST 将每个 `StandardMessage` 对象转换为 Redux action 并 dispatch。

系统 MUST 在响应完成时（`finishReason` 不为 `null`）更新 Redux state 中的消息状态。

系统 MUST 在信号中断时（`signal.aborted === true`）停止处理流式响应。

系统 MUST 在最终响应消息中接收并处理包含 `raw` 字段的 `StandardMessage` 对象。

系统 MUST 确保 `raw` 字段包含结构化的原始响应数据（`StandardMessageRawResponse` 类型），而非空字符串。

#### Scenario: 处理流式响应消息（包含原始数据）
- **WHEN** `ChatService.streamChatCompletion()` 返回流式响应
- **AND** 第 1 个响应消息包含 `{ content: "Hello", finishReason: null, raw: null }`
- **AND** 第 2 个响应消息包含 `{ content: "Hello World", finishReason: null, raw: null }`
- **AND** 最终响应消息包含 `{ content: "Hello World!", finishReason: "stop", raw: { response: { id: "chatcmpl-123", modelId: "deepseek-chat", timestamp: "2024-01-01T00:00:00.000Z" }, request: { body: "..." }, usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 }, finishReason: { reason: "stop", rawReason: "stop" } } }`
- **THEN** Redux Thunk dispatch 3 个 actions，每个 action 包含对应的消息内容
- **AND** 聊天界面逐步显示 "Hello" → "Hello World" → "Hello World!"
- **AND** 最终消息的 `finishReason` 为 "stop"
- **AND** 最终消息的 `raw` 字段包含完整的原始响应数据
- **AND** `raw` 字段类型为 `StandardMessageRawResponse`（对象），而非字符串

#### Scenario: 信号中断时停止处理
- **WHEN** 用户在流式响应过程中点击"停止生成"按钮
- **AND** Redux Thunk 调用 `signal.abort()`
- **THEN** `ChatService.streamChatCompletion()` 检测到信号中断
- **AND** 流式响应生成器停止生成新消息
- **AND** `for await...of` 循环退出
- **AND** Redux state 中的消息状态更新为"已停止"
- **AND** 如果中断前已收到部分响应消息，`raw` 字段可能为 `null` 或包含不完整的元数据

#### Scenario: 向后兼容性（旧消息的 raw 字段）
- **WHEN** 从存储加载旧消息（`raw` 为空字符串或 `null`）
- **THEN** 系统必须正常显示消息内容
- **AND** 系统 MUST NOT 因为 `raw` 字段格式不同而抛出异常
- **AND** 系统 MUST 使用类型守卫 `isEnhancedRawResponse(raw)` 判断 `raw` 是否为新格式
- **AND** 如果 `raw` 为旧格式，显示"无原始数据"或默认提示

#### Scenario: 新消息的 raw 字段包含完整元数据
- **WHEN** 用户发送新消息并接收完整响应
- **THEN** 系统 MUST 接收包含完整 `raw` 字段的 `StandardMessage`
- **AND** `raw` 字段必须包含以下字段：
  - `response.id`：供应商返回的响应 ID
  - `response.modelId`：实际使用的模型标识符
  - `response.timestamp`：供应商返回的响应时间戳（ISO 8601 格式）
  - `request.body`：发送给供应商的请求体（JSON 字符串，已过滤敏感信息）
  - `usage.inputTokens`：输入 token 数量
  - `usage.outputTokens`：输出 token 数量
  - `usage.totalTokens`：总 token 数量
  - `finishReason.reason`：标准化完成原因（'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other'）
- **AND** `raw` 字段应包含以下可选字段（如果供应商支持）：
  - `response.headers`：HTTP 响应头（用于调试、速率限制追踪）
  - `usage.inputTokenDetails`：输入 token 详细信息（缓存读写字节数等）
  - `usage.outputTokenDetails`：输出 token 详细信息（文本 tokens、推理 tokens 等）
  - `providerMetadata`：供应商特定元数据
  - `warnings`：警告信息数组
  - `streamStats`：流式事件统计（文本增量计数、推理增量计数、耗时）
  - `sources`：RAG 来源信息（web search RAG 模型的参考来源）

---

### Requirement: 基于编辑消息的重新生成

系统 SHALL 支持在编辑最新用户消息后，重新生成对应的最新 AI 回复。

#### Scenario: 编辑消息后重新生成
- **WHEN** 用户确认编辑最新一条用户消息
- **THEN** 系统 SHALL 使用编辑后的 content 更新该位置的消息（保留旧版本到数组）
- **AND** 对应位置的 AI 回复旧内容保留到数组，追加空字符串占位（等待重新生成填充）
- **AND** 对每个 ChatModel，使用裁剪后的对话历史（至编辑后的用户消息为止，不包含旧 AI 回复，每条消息取 content 数组最后一个元素）重新调用 `streamChatCompletion`
- **AND** 生成的回复填充到 AI 回复 content 数组的最后一个元素（替换占位空字符串）

#### Scenario: 编辑消息时 AI 回复不存在
- **WHEN** 用户确认编辑最新一条用户消息
- **AND** 该用户消息之后不存在 AI 回复（上一轮发送失败，AI 回复未生成）
- **THEN** 系统 SHALL 仅更新用户消息的 content 数组
- **AND** 对每个 ChatModel，使用编辑后的用户消息作为最新消息重新调用 `streamChatCompletion`

#### Scenario: 编辑消息时模型已被禁用
- **WHEN** 用户编辑消息后重新生成
- **AND** 某个模型已被用户禁用（`isEnable === false`）
- **THEN** 系统 SHALL 跳过该模型，不发送请求

#### Scenario: 编辑消息时模型已被删除
- **WHEN** 用户编辑消息后重新生成
- **AND** 某个模型已被删除（`isDeleted === true`）
- **THEN** 系统 SHALL 跳过该模型，不发送请求

#### Scenario: 重新生成失败时回滚
- **WHEN** 编辑后 AI 回复重新生成失败
- **THEN** 系统 SHALL 调用 `rollbackEdit` 回滚用户消息和 AI 回复的数组
- **AND** 恢复到编辑前的状态

---

### Requirement: 重新生成最后一条 AI 回复

系统 SHALL 支持重新生成最后一条 AI 回复，保留旧版本到历史数组。

#### Scenario: 重新生成最后 AI 回复
- **WHEN** 用户点击重新生成按钮
- **THEN** 系统 SHALL 通过位置索引，对所有 ChatModel 的 AI 回复消息，将旧 content 和 reasoningContent push 进数组，追加空字符串占位
- **AND** 对每个 ChatModel，使用该消息之前的完整对话历史重新调用 `streamChatCompletion`
- **AND** 生成的回复填充到 content 数组末尾（替换占位空字符串）

#### Scenario: 重新生成时的流式处理
- **WHEN** 系统执行重新生成
- **THEN** thunk SHALL 直接调用 `streamChatCompletion`（不经过 `sendMessage`）
- **AND** 对每个 ChatModel，使用裁剪后的对话历史（`chatHistoryList.slice(0, assistantMessageIndex)`，不包含旧 AI 回复）作为上下文
- **AND** 流式响应通过 `pushRunningChatHistory` 写入 `runningChat` 状态临时存储（复用现有机制）
- **AND** 每个模型流式完成后，dispatch `updateHistoryContent` 将 AI 回复 content 数组最后一个元素（占位空字符串）替换为实际生成结果
- **AND** 若生成结果包含 `reasoningContent`，一并更新 reasoningContent 数组最后一个元素

#### Scenario: 编辑后重新生成的流式处理
- **WHEN** 系统执行编辑后重新生成
- **THEN** thunk SHALL 直接调用 `streamChatCompletion`（不经过 `sendMessage`）
- **AND** 对每个 ChatModel，使用裁剪后的对话历史（`chatHistoryList.slice(0, userMessageIndex + 1)`，包含编辑后的用户消息，不包含旧 AI 回复）作为上下文
- **AND** 流式响应通过 `pushRunningChatHistory` 写入 `runningChat` 状态临时存储
- **AND** 每个模型流式完成后，dispatch `updateHistoryContent` 更新 AI 回复 content 数组

#### Scenario: 重新生成失败时回滚
- **WHEN** AI 回复重新生成失败
- **THEN** 系统 SHALL 调用 `rollbackRegenerate` 回滚 AI 回复的 content/reasoningContent 数组
- **AND** 弹出 `commitRegenerate` 添加的占位空字符串
- **AND** 恢复到重新生成前的状态
