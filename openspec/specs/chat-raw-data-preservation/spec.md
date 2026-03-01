# Chat Raw Data Preservation Capability Specification

## Purpose

本 capability 定义了聊天服务层（ChatService）中原始响应数据收集和保留的规范。它确保从供应商 API 返回的完整元数据（响应、请求、Token 使用、完成原因、供应商特定元数据、警告、流式统计、RAG 来源等）被正确收集并结构化存储，以便于调试、监控和未来功能扩展。

## Requirements

### Requirement: 收集响应元数据

系统 MUST 在 `ChatService.streamChatCompletion()` 中收集供应商 API 返回的响应元数据。

系统 MUST 从 Vercel AI SDK 的 `result.response` 中提取以下字段：
- `id`：供应商返回的响应 ID
- `modelId`：实际使用的模型标识符
- `timestamp`：供应商返回的响应时间戳（Date 对象）
- `headers`：HTTP 响应头（可选，用于调试和速率限制追踪）

系统 MUST 将 `timestamp` 转换为 ISO 8601 格式的字符串（如 `2024-01-01T00:00:00.000Z`）。

系统 MUST 将 `headers` 转换为 `Record<string, string>` 格式（如果存在）。

#### Scenario: 收集基础响应元数据

- **WHEN** 调用 `ChatService.streamChatCompletion()` 发起聊天请求
- **AND** 供应商 API 返回响应 `{ id: "chatcmpl-123", model: "deepseek-chat", timestamp: Date("2024-01-01T00:00:00.000Z") }`
- **THEN** 系统 MUST 提取 `response.id` 为 `"chatcmpl-123"`
- **AND** 系统 MUST 提取 `response.modelId` 为 `"deepseek-chat"`
- **AND** 系统 MUST 将 `response.timestamp` 转换为 `"2024-01-01T00:00:00.000Z"`
- **AND** 系统 MUST 将响应元数据存储到 `raw.response` 字段

#### Scenario: 收集响应头（如果供应商支持）

- **WHEN** 供应商 API 返回包含 `headers` 的响应
- **AND** `headers` 包含 `{ "content-type": "application/json", "x-request-id": "req-123" }`
- **THEN** 系统 MUST 提取 `response.headers` 并存储到 `raw.response.headers` 字段
- **AND** 系统 MUST 过滤敏感信息（如 `Authorization` 头）

#### Scenario: 响应元数据为空时的处理

- **WHEN** 供应商 API 返回的响应不包含 `headers` 字段
- **THEN** 系统 MUST 将 `raw.response.headers` 设置为 `undefined`
- **AND** 系统 MUST NOT 因为缺少 `headers` 字段而抛出异常
- **AND** 系统 MUST 继续处理其他元数据字段

---

### Requirement: 收集请求元数据

系统 MUST 在 `ChatService.streamChatCompletion()` 中收集发送给供应商的请求元数据。

系统 MUST 从 Vercel AI SDK 的 `result.request` 中提取 `body` 字段（JSON 字符串）。

系统 MUST 过滤 `request.body` 中的敏感信息（如 API Key）。

系统 MUST 如果 `request.body` 大小超过 10KB，截断多余内容并添加截断标记。

#### Scenario: 收集请求体

- **WHEN** 调用 `ChatService.streamChatCompletion()` 发起聊天请求
- **AND** 请求体包含 `{ model: "deepseek-chat", messages: [...], apiKey: "sk-123" }`
- **THEN** 系统 MUST 提取 `request.body` 并序列化为 JSON 字符串
- **AND** 系统 MUST 移除或替换 `apiKey` 字段为 `"***REMOVED***"` 占位符
- **AND** 系统 MUST 将过滤后的请求体存储到 `raw.request.body` 字段

#### Scenario: 请求体过大时的截断处理

- **WHEN** `request.body` 序列化后大小超过 10KB
- **THEN** 系统 MUST 截断 `request.body` 为前 10KB 字符
- **AND** 系统 MUST 在截断的字符串末尾添加 `"... (truncated)"` 标记
- **AND** 系统 MUST 将截断后的请求体存储到 `raw.request.body` 字段

---

### Requirement: 收集 Token 使用详细信息

系统 MUST 在 `ChatService.streamChatCompletion()` 中收集 Token 使用详细信息。

系统 MUST 从 Vercel AI SDK 的 `result.usage` 中提取以下字段：
- `inputTokens`：输入 token 数量
- `outputTokens`：输出 token 数量
- `totalTokens`：总 token 数量
- `inputTokenDetails`：输入 token 详细信息（可选，包含 `cacheReadTokens`、`cacheWriteTokens`、`noCacheTokens`）
- `outputTokenDetails`：输出 token 详细信息（可选，包含 `textTokens`、`reasoningTokens`）
- `raw`：供应商原始的 usage 数据（可选，未标准化字段）

系统 MUST 如果某个字段不存在，使用默认值 `0` 或 `undefined`。

#### Scenario: 收集基础 Token 使用数据

- **WHEN** 供应商 API 返回 usage `{ inputTokens: 100, outputTokens: 50, totalTokens: 150 }`
- **THEN** 系统 MUST 提取 `usage.inputTokens` 为 `100`
- **AND** 系统 MUST 提取 `usage.outputTokens` 为 `50`
- **AND** 系统 MUST 提取 `usage.totalTokens` 为 `150`
- **AND** 系统 MUST 将 Token 使用数据存储到 `raw.usage` 字段

#### Scenario: 收集 Token 详细信息（如果供应商支持）

- **WHEN** 供应商 API 返回包含 `inputTokenDetails` 和 `outputTokenDetails` 的 usage
- **AND** `inputTokenDetails` 包含 `{ cacheReadTokens: 20, cacheWriteTokens: 0, noCacheTokens: 80 }`
- **AND** `outputTokenDetails` 包含 `{ textTokens: 40, reasoningTokens: 10 }`
- **THEN** 系统 MUST 提取 `usage.inputTokenDetails` 并存储到 `raw.usage.inputTokenDetails`
- **AND** 系统 MUST 提取 `usage.outputTokenDetails` 并存储到 `raw.usage.outputTokenDetails`

#### Scenario: Token 详细信息为空时的处理

- **WHEN** 供应商 API 返回的 usage 不包含 `inputTokenDetails` 或 `outputTokenDetails`
- **THEN** 系统 MUST 将 `raw.usage.inputTokenDetails` 设置为 `undefined`
- **AND** 系统 MUST 将 `raw.usage.outputTokenDetails` 设置为 `undefined`
- **AND** 系统 MUST 继续处理其他 usage 字段

---

### Requirement: 收集完成原因

系统 MUST 在 `ChatService.streamChatCompletion()` 中收集消息完成原因。

系统 MUST 从 Vercel AI SDK 的 `result.finishReason` 中提取标准化的完成原因。

系统 MUST 从 Vercel AI SDK 的 `result.rawFinishReason` 中提取供应商原始的完成原因（如果存在）。

系统 MUST 将 `finishReason` 标准化为以下枚举值之一：`'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other'`。

#### Scenario: 收集完成原因

- **WHEN** 供应商 API 返回 `finishReason: "stop"`
- **AND** `rawFinishReason: "stop"`
- **THEN** 系统 MUST 提取 `finishReason` 为 `"stop"`
- **AND** 系统 MUST 提取 `rawFinishReason` 为 `"stop"`
- **AND** 系统 MUST 将完成原因存储到 `raw.finishReason` 字段

#### Scenario: 完成原因不存在时的处理

- **WHEN** 供应商 API 返回的 `finishReason` 为 `null` 或 `undefined`
- **THEN** 系统 MUST 将 `raw.finishReason.reason` 设置为 `"other"`
- **AND** 系统 MUST 将 `raw.finishReason.rawReason` 设置为供应商原始值或 `undefined`

---

### Requirement: 收集供应商特定元数据

系统 MUST 在 `ChatService.streamChatCompletion()` 中收集供应商特定元数据。

系统 MUST 从 Vercel AI SDK 的 `result.providerMetadata` 中提取供应商特定字段。

系统 MUST 将 `providerMetadata` 存储为 `{ [providerName: string]: Record<string, unknown> }` 格式。

系统 MUST 支持的供应商名称包括：`'deepseek'`、`'moonshotai'`、`'zhipu'`。

#### Scenario: 收集 DeepSeek 供应商元数据

- **WHEN** 使用 DeepSeek 模型发起聊天请求
- **AND** 供应商返回 `providerMetadata: { deepseek: { version: "2024-01-01", reasoningTokens: 10 } }`
- **THEN** 系统 MUST 提取 `providerMetadata.deepseek` 并存储到 `raw.providerMetadata.deepseek`
- **AND** 系统 MUST 保留供应商特定字段（如 `version`、`reasoningTokens`）

#### Scenario: 收集 MoonshotAI 供应商元数据

- **WHEN** 使用 MoonshotAI 模型发起聊天请求
- **AND** 供应商返回 `providerMetadata: { moonshotai: { apiVersion: "v2" } }`
- **THEN** 系统 MUST 提取 `providerMetadata.moonshotai` 并存储到 `raw.providerMetadata.moonshotai`

#### Scenario: 供应商元数据为空时的处理

- **WHEN** 供应商 API 不返回 `providerMetadata` 字段
- **THEN** 系统 MUST 将 `raw.providerMetadata` 设置为 `undefined`
- **AND** 系统 MUST 继续处理其他元数据字段

---

### Requirement: 收集警告信息

系统 MUST 在 `ChatService.streamChatCompletion()` 中收集警告信息。

系统 MUST 从 Vercel AI SDK 的 `result.warnings` 中提取警告数组。

系统 MUST 将警告信息存储为 `Array<{ code?: string; message: string }>` 格式。

#### Scenario: 收集警告信息

- **WHEN** 供应商 API 返回 `warnings: [{ code: "deprecated", message: "This model is deprecated" }]`
- **THEN** 系统 MUST 提取 `warnings` 并存储到 `raw.warnings` 字段
- **AND** 系统 MUST 保留警告的 `code` 和 `message` 字段

#### Scenario: 警告信息为空时的处理

- **WHEN** 供应商 API 不返回 `warnings` 字段或返回空数组
- **THEN** 系统 MUST 将 `raw.warnings` 设置为 `undefined` 或空数组
- **AND** 系统 MUST 继续处理其他元数据字段

---

### Requirement: 统计流式事件

系统 MUST 在 `ChatService.streamChatCompletion()` 的流式处理循环中统计流式事件。

系统 MUST 统计 `text-delta` 事件数量并记录为 `textDeltaCount`。

系统 MUST 统计 `reasoning-delta` 事件数量并记录为 `reasoningDeltaCount`。

系统 MUST 记录流式处理的开始时间和结束时间，计算耗时（毫秒）。

系统 MUST 在流结束后将流式事件统计存储到 `raw.streamStats` 字段。

#### Scenario: 统计流式事件

- **WHEN** 调用 `ChatService.streamChatCompletion()` 发起聊天请求
- **AND** 流式处理过程中接收到 50 个 `text-delta` 事件
- **AND** 流式处理过程中接收到 10 个 `reasoning-delta` 事件
- **AND** 流式处理耗时 1500 毫秒
- **THEN** 系统 MUST 将 `textDeltaCount` 设置为 `50`
- **AND** 系统 MUST 将 `reasoningDeltaCount` 设置为 `10`
- **AND** 系统 MUST 将 `duration` 设置为 `1500`
- **AND** 系统 MUST 将流式事件统计存储到 `raw.streamStats` 字段

#### Scenario: 流式处理无推理增量事件

- **WHEN** 使用的模型不支持推理内容（如普通聊天模型）
- **AND** 流式处理过程中接收到 50 个 `text-delta` 事件
- **AND** 流式处理过程中未接收到 `reasoning-delta` 事件
- **THEN** 系统 MUST 将 `textDeltaCount` 设置为 `50`
- **AND** 系统 MUST 将 `reasoningDeltaCount` 设置为 `0`
- **AND** 系统 MUST 将流式事件统计存储到 `raw.streamStats` 字段

---

### Requirement: 收集 RAG 来源信息

系统 MUST 在 `ChatService.streamChatCompletion()` 中收集 RAG 来源信息（如果供应商支持）。

系统 MUST 从 Vercel AI SDK 的 `result.sources` 中提取来源数组。

系统 MUST 将来源信息存储为 `Array<{ sourceType: 'url'; id: string; url: string; title?: string; providerMetadata?: Record<string, unknown> }>` 格式。

系统 MUST 如果模型不支持 RAG 功能或供应商未返回 `sources`，将 `raw.sources` 设置为 `undefined`。

#### Scenario: 收集 RAG 来源信息

- **WHEN** 使用 web search RAG 模型发起聊天请求
- **AND** 供应商返回 `sources: [{ sourceType: "url", id: "src-1", url: "https://example.com/article1", title: "Example Article 1", providerMetadata: { score: 0.95 } }]`
- **THEN** 系统 MUST 提取 `sources` 并存储到 `raw.sources` 字段
- **AND** 系统 MUST 保留来源的 `sourceType`、`id`、`url`、`title` 和 `providerMetadata` 字段

#### Scenario: 无 RAG 来源时的处理

- **WHEN** 使用普通聊天模型（不支持 RAG 功能）
- **AND** 供应商 API 不返回 `sources` 字段
- **THEN** 系统 MUST 将 `raw.sources` 设置为 `undefined`
- **AND** 系统 MUST 继续处理其他元数据字段

---

### Requirement: 构建结构化的原始响应对象

系统 MUST 在 `ChatService.streamChatCompletion()` 的流式处理结束后构建结构化的原始响应对象。

系统 MUST 将所有收集的元数据组装成 `StandardMessageRawResponse` 类型的对象。

系统 MUST 确保所有字段都是可选的（使用 `?` 标记），以适应供应商差异。

系统 MUST 在最终 yield 的消息中将 `raw` 字段设置为构建的原始响应对象。

#### Scenario: 构建完整的原始响应对象

- **WHEN** 流式处理结束
- **AND** 所有元数据字段都已成功收集
- **THEN** 系统 MUST 构建 `StandardMessageRawResponse` 对象
- **AND** 对象必须包含以下字段：
  - `response`：响应元数据（`{ id, modelId, timestamp, headers? }`）
  - `request`：请求元数据（`{ body }`）
  - `usage`：Token 使用详细信息（`{ inputTokens, outputTokens, totalTokens, inputTokenDetails?, outputTokenDetails?, raw? }`）
  - `finishReason`：完成原因（`{ reason, rawReason? }`）
  - `providerMetadata?`：供应商特定元数据
  - `warnings?`：警告信息数组
  - `streamStats`：流式事件统计（`{ textDeltaCount, reasoningDeltaCount, duration }`）
  - `sources?`：RAG 来源信息数组
- **AND** 系统 MUST 将构建的对象设置为最终消息的 `raw` 字段

#### Scenario: 部分元数据收集失败时的处理

- **WHEN** 流式处理结束
- **AND** `response.headers` 收集失败（网络错误）
- **THEN** 系统 MUST 将 `raw.response.headers` 设置为 `undefined`
- **AND** 系统 MUST 继续构建原始响应对象
- **AND** 系统 MUST 在 `raw` 对象中添加 `errors` 字段记录收集过程中的错误
- **AND** 系统 MUST 不中断消息流，确保用户收到响应内容

---

### Requirement: 类型守卫和格式化函数

系统 MUST 提供 `isEnhancedRawResponse(raw)` 类型守卫函数，用于判断 `raw` 是否为新的结构化格式。

系统 MUST 提供 `formatRawResponse(raw)` 格式化函数，用于将原始响应数据转换为人类可读的格式。

#### Scenario: 使用类型守卫判断 raw 格式

- **WHEN** 调用 `isEnhancedRawResponse(raw)` 函数
- **AND** `raw` 为 `{ response: { id: "..." } }`（结构化对象）
- **THEN** 函数 MUST 返回 `true`
- **AND** TypeScript 类型系统将 `raw` 推断为 `StandardMessageRawResponse`

#### Scenario: 判断旧格式 raw

- **WHEN** 调用 `isEnhancedRawResponse(raw)` 函数
- **AND** `raw` 为 `""` 或 `null`（旧格式）
- **THEN** 函数 MUST 返回 `false`

#### Scenario: 使用格式化函数显示 raw 数据

- **WHEN** 调用 `formatRawResponse(raw)` 函数
- **AND** `raw` 为结构化对象
- **THEN** 函数 MUST 返回格式化后的 JSON 字符串（缩进 2 个空格）
- **AND** 如果 `raw` 为 `null` 或 `undefined`，函数 MUST 返回 `"无原始数据"`
