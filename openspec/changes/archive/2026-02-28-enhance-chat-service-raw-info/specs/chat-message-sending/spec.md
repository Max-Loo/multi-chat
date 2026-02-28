# Chat Message Sending Capability Specification (Delta)

## MODIFIED Requirements

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
