# Chat Service Testing Specification

## ADDED Requirements

### Requirement: Provider 工厂函数测试
测试系统 SHALL 验证 `getProvider` 函数能为不同供应商创建正确的 provider 实例。

#### Scenario: 创建 DeepSeek provider
- **WHEN** 调用 `getProvider` 并传入 DEEPSEEK providerKey、apiKey 和 baseURL
- **THEN** 系统 SHALL 返回一个能创建 DeepSeek 语言模型的函数
- **THEN** 该函数 SHALL 使用传入的 apiKey 和 baseURL 初始化

#### Scenario: 创建 Moonshot AI provider
- **WHEN** 调用 `getProvider` 并传入 MOONSHOTAI providerKey、apiKey 和 baseURL
- **THEN** 系统 SHALL 返回一个能创建 Moonshot AI 语言模型的函数

#### Scenario: 创建 Zhipu AI provider
- **WHEN** 调用 `getProvider` 并传入 ZHIPUAI 或 ZHIPUAI_CODING_PLAN providerKey
- **THEN** 系统 SHALL 返回一个能创建 Zhipu AI 语言模型的函数

#### Scenario: 不支持的供应商
- **WHEN** 调用 `getProvider` 并传入不支持的 providerKey
- **THEN** 系统 SHALL 抛出错误，错误信息包含 "Unsupported provider"

#### Scenario: 使用兼容层 fetch
- **WHEN** 创建任何 provider
- **THEN** 系统 SHALL 使用 `getFetchFunc()` 获取的 fetch 函数
- **THEN** 该 fetch 函数 SHALL 能在 Tauri 和 Web 环境中正常工作

### Requirement: 消息格式转换测试
测试系统 SHALL 验证 `buildMessages` 函数能正确转换消息格式以适配 Vercel AI SDK。

#### Scenario: 转换 system 消息
- **WHEN** 历史记录中包含 role 为 system 的消息
- **THEN** 系统 SHALL 将其转换为 `{ role: 'system', content: string }` 格式
- **THEN** content SHALL 是字符串类型（SDK 限制）

#### Scenario: 转换 user 消息
- **WHEN** 历史记录中包含 role 为 user 的消息
- **THEN** 系统 SHALL 将其转换为 `{ role: 'user', content: [{ type: 'text', text: string }] }` 格式
- **THEN** content SHALL 是 Part 数组格式

#### Scenario: 转换 assistant 消息（不包含推理内容）
- **WHEN** 历史记录中包含 role 为 assistant 的消息且 includeReasoningContent 为 false
- **THEN** 系统 SHALL 将其转换为 `{ role: 'assistant', content: [{ type: 'text', text: string }] }` 格式

#### Scenario: 转换 assistant 消息（包含推理内容）
- **WHEN** 历史记录中包含 role 为 assistant 的消息且 includeReasoningContent 为 true
- **WHEN** 该消息包含非空的 reasoningContent
- **THEN** 系统 SHALL 将其转换为 `{ role: 'assistant', content: [{ type: 'text', text: string }, { type: 'reasoning', text: string }] }` 格式

#### Scenario: 添加最新的用户消息
- **WHEN** 调用 `buildMessages` 并传入最新的用户消息
- **THEN** 系统 SHALL 在消息列表末尾添加该用户消息
- **THEN** 该消息 SHALL 使用 Part 数组格式

#### Scenario: 未知角色类型
- **WHEN** 历史记录中包含未知的 role 类型
- **THEN** 系统 SHALL 抛出错误，错误信息包含 "Unknown role"

#### Scenario: 处理空推理内容
- **WHEN** `includeReasoningContent` 为 true
- **WHEN** `reasoningContent` 为空字符串或仅包含空白字符
- **THEN** 系统 SHALL 不添加 reasoning Part

#### Scenario: 处理空历史记录
- **WHEN** 传入空的 `historyList` 数组
- **THEN** 系统 SHALL 仅包含最新的 user 消息
- **THEN** 系统 SHALL 不抛出错误

### Requirement: 流式聊天请求测试
测试系统 SHALL 验证 `streamChatCompletion` 函数能正确处理流式聊天响应。

#### Scenario: 成功发起流式请求
- **WHEN** 调用 `streamChatCompletion` 并传入有效的模型、历史记录和消息
- **THEN** 系统 SHALL 返回一个异步生成器（AsyncGenerator）
- **THEN** 系统 SHALL 使用正确的 provider 和模型 ID 发起请求

#### Scenario: 流式响应迭代
- **WHEN** 遍历流式响应的每个元素
- **THEN** 每个 SHALL 包含消息 ID、时间戳、模型 ID 和角色信息
- **THEN** content SHALL 随着流式数据累积而更新
- **THEN** reasoningContent SHALL 包含推理过程（如果模型提供）

#### Scenario: 处理 text-delta 事件
- **WHEN** 流式响应包含 text-delta 事件
- **THEN** 系统 SHALL 将增量文本追加到 content 字段

#### Scenario: 处理 reasoning-delta 事件
- **WHEN** 流式响应包含 reasoning-delta 事件
- **THEN** 系统 SHALL 将增量推理文本追加到 reasoningContent 字段

#### Scenario: 最终消息包含元数据
- **WHEN** 流式响应完成
- **THEN** 最后一个消息 SHALL 包含 finishReason 字段
- **THEN** 最后一个消息 SHALL 包含 usage 字段（inputTokens 和 outputTokens）
- **THEN** finishReason SHALL 是字符串或 null

#### Scenario: 使用自定义 conversationId
- **WHEN** 调用 `streamChatCompletion` 并传入 conversationId 参数
- **THEN** 系统 SHALL 使用该 ID 作为所有流式消息的 ID
- **THEN** 所有流式响应 SHALL 共享同一个 ID

#### Scenario: 自动生成 conversationId
- **WHEN** 调用 `streamChatCompletion` 且不传入 conversationId
- **THEN** 系统 SHALL 使用 `generateId()` 自动生成唯一 ID
- **THEN** 所有流式响应 SHALL 共享该自动生成的 ID

#### Scenario: Token 使用统计
- **WHEN** 流式响应完成且包含 usage 信息
- **THEN** 系统 SHALL 解析 inputTokens 和 outputTokens
- **THEN** usage 对象 SHALL 包含正确的 token 计数
- **WHEN** usage 信息不存在
- **THEN** usage 字段 SHALL 为 undefined

### Requirement: 中断信号测试
测试系统 SHALL 验证流式请求能正确响应 AbortSignal。

#### Scenario: 正常中断流式请求
- **WHEN** 在流式响应过程中调用 abort()
- **THEN** 系统 SHALL 停止接收新的流式数据
- **THEN** 系统 SHALL 优雅地终止生成器迭代

#### Scenario: 传递 AbortSignal
- **WHEN** 调用 `streamChatCompletion` 并传入 signal 参数
- **THEN** 系统 SHALL 将该 signal 传递给底层的 streamText 函数

### Requirement: 错误处理测试
测试系统 SHALL 验证流式请求的错误处理机制。

#### Scenario: 网络错误处理
- **WHEN** 底层 fetch 请求失败
- **THEN** 系统 SHALL 将错误传播到调用方
- **THEN** 错误 SHALL 包含失败原因

#### Scenario: API 错误响应
- **WHEN** 供应商 API 返回错误状态码
- **THEN** 系统 SHALL 将错误信息传播到调用方

### Requirement: 推理内容传输测试
测试系统 SHALL 验证推理内容的传输逻辑。

#### Scenario: 不传输推理内容
- **WHEN** 调用 `streamChatCompletion` 且 includeReasoningContent 为 false
- **THEN** 系统 SHALL 在调用 buildMessages 时传入 false
- **THEN** 历史消息中的 reasoningContent SHALL 不被传输

#### Scenario: 传输推理内容
- **WHEN** 调用 `streamChatCompletion` 且 includeReasoningContent 为 true
- **THEN** 系统 SHALL 在调用 buildMessages 时传入 true
- **THEN** 历史消息中的 reasoningContent SHALL 被转换为 reasoning part 并传输

### Requirement: 时间戳生成测试
测试系统 SHALL 验证消息使用正确的时间戳。

#### Scenario: 使用当前时间戳
- **WHEN** 创建流式响应消息
- **THEN** 系统 SHALL 使用 `getCurrentTimestamp()` 生成时间戳
- **THEN** 所有流式响应消息 SHALL 共享同一个时间戳

### Requirement: 模型信息传递测试
测试系统 SHALL 验证模型信息正确传递到流式响应中。

#### Scenario: 传递模型 ID
- **WHEN** 调用 `streamChatCompletion` 并传入模型对象
- **THEN** 所有流式响应消息 SHALL 包含正确的 modelKey
- **THEN** modelKey SHALL 来自传入的模型对象

### Requirement: 测试覆盖率要求
单元测试必须达到指定的覆盖率指标，确保代码质量。

#### Scenario: 语句覆盖率达标
- **WHEN** 运行测试覆盖率报告
- **THEN** `chatService.ts` 的语句覆盖率必须 ≥ 90%

#### Scenario: 分支覆盖率达标
- **WHEN** 运行测试覆盖率报告
- **THEN** `chatService.ts` 的分支覆盖率必须 ≥ 80%

#### Scenario: 函数覆盖率达标
- **WHEN** 运行测试覆盖率报告
- **THEN** `chatService.ts` 的函数覆盖率必须 = 100%

### Requirement: Mock 策略要求
测试必须使用适当的 Mock 策略来隔离依赖，确保测试的独立性和速度。

#### Scenario: Mock Vercel AI SDK
- **WHEN** 测试 `streamChatCompletion()` 函数
- **THEN** 必须 Mock `ai` 包
- **THEN** 必须替换 `streamText` 和 `generateId` 函数
- **THEN** Mock 应返回可控的测试数据

#### Scenario: Mock provider 函数
- **WHEN** 测试 `getProvider()` 或 `streamChatCompletion()` 函数
- **THEN** 必须 Mock `createDeepSeek`、`createMoonshotAI`、`createZhipu` 等函数
- **THEN** Mock 应返回模拟的 LanguageModel 对象

#### Scenario: Mock tauriCompat 函数
- **WHEN** 测试任何使用 `getFetchFunc()` 的函数
- **THEN** 必须 Mock `@/utils/tauriCompat` 模块
- **THEN** `getFetchFunc` 应返回模拟的 fetch 函数

#### Scenario: 测试隔离
- **WHEN** 运行每个测试用例
- **THEN** 必须在 `beforeEach` 中清理所有 Mock
- **THEN** 测试之间不应共享状态
- **THEN** 每个测试应独立运行
