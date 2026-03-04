## ADDED Requirements

### Requirement: buildMessages 函数测试
buildMessages 函数 SHALL 正确将历史消息转换为 Vercel AI SDK 格式。

#### Scenario: System 消息转换
- **WHEN** buildMessages 接收到包含 system 角色的历史消息
- **THEN** 返回的消息列表中 system 消息的 content 为字符串类型

#### Scenario: User 消息转换
- **WHEN** buildMessages 接收到包含 user 角色的历史消息
- **THEN** 返回的消息列表中 user 消息的 content 为 Part 数组格式

#### Scenario: Assistant 消息转换（无推理内容）
- **WHEN** buildMessages 接收到 assistant 消息且 includeReasoningContent 为 false
- **THEN** 返回的消息只包含文本内容，不包含 reasoning part

#### Scenario: Assistant 消息转换（含推理内容）
- **WHEN** buildMessages 接收到包含 reasoningContent 的 assistant 消息且 includeReasoningContent 为 true
- **THEN** 返回的消息 content 数组包含文本和 reasoning 两个 part

#### Scenario: 空历史记录处理
- **WHEN** buildMessages 接收到空历史记录
- **THEN** 返回只包含当前用户消息的单元素数组

#### Scenario: 未知角色错误处理
- **WHEN** buildMessages 接收到未知角色的消息
- **THEN** 抛出错误信息包含 "Unknown role"

### Requirement: getProvider 函数测试
getProvider 函数 SHALL 根据供应商标识符返回正确的 provider 工厂函数。

#### Scenario: DeepSeek Provider 创建
- **WHEN** 使用 ModelProviderKeyEnum.DEEPSEEK 调用 getProvider
- **THEN** 返回的 provider 函数可以创建 DeepSeek 语言模型实例

#### Scenario: MoonshotAI Provider 创建
- **WHEN** 使用 ModelProviderKeyEnum.MOONSHOTAI 调用 getProvider
- **THEN** 返回的 provider 函数可以创建 MoonshotAI 语言模型实例

#### Scenario: Zhipu Provider 创建
- **WHEN** 使用 ModelProviderKeyEnum.ZHIPUAI 调用 getProvider
- **THEN** 返回的 provider 函数可以创建 Zhipu 语言模型实例

#### Scenario: Zhipu Coding Plan Provider 创建
- **WHEN** 使用 ModelProviderKeyEnum.ZHIPUAI_CODING_PLAN 调用 getProvider
- **THEN** 返回 Zhipu provider（与 ZHIPUAI 使用相同的 provider）

#### Scenario: 不支持的供应商错误
- **WHEN** 使用未知的 providerKey 调用 getProvider
- **THEN** 抛出错误信息包含 "Unsupported provider"

### Requirement: streamChatCompletion 函数测试
streamChatCompletion 函数 SHALL 正确处理流式聊天请求并返回异步生成器。

#### Scenario: 成功发起流式请求
- **WHEN** 使用有效参数调用 streamChatCompletion
- **THEN** 返回的异步生成器可以 yield 包含角色、内容、时间戳的消息对象

#### Scenario: 消息构建参数传递
- **WHEN** streamChatCompletion 接收到历史消息
- **THEN** 内部调用 buildMessages 并将结果传递给 streamText

#### Scenario: includeReasoningContent 参数传递
- **WHEN** streamChatCompletion 接收到 includeReasoningContent 为 true
- **THEN** 历史消息中的 reasoningContent 被包含在消息列表中

#### Scenario: 自定义 conversationId
- **WHEN** 传入 conversationId 参数
- **THEN** 所有 yield 的消息使用传入的 conversationId 作为 id

#### Scenario: 自动生成 conversationId
- **WHEN** 未传入 conversationId 参数
- **THEN** 调用 generateId() 生成新的消息 id

#### Scenario: AbortSignal 传递
- **WHEN** 传入包含 signal 的 options 参数
- **THEN** signal 被传递给 streamText 的 abortSignal 选项

#### Scenario: fetch 函数配置
- **WHEN** streamChatCompletion 被调用
- **THEN** 使用 getFetchFunc() 获取的 fetch 函数配置 provider

#### Scenario: 网络错误传播
- **WHEN** streamText 抛出网络错误
- **THEN** 错误被正确传播到调用方

#### Scenario: 流式响应包含 reasoning-delta
- **WHEN** 流中包含 reasoning-delta 类型的事件
- **THEN** 消息对象的 reasoningContent 正确累积 reasoning 文本

#### Scenario: 最终消息包含 finishReason
- **WHEN** 流式响应完成
- **THEN** 最后 yield 的消息包含 finishReason 字段

#### Scenario: 最终消息包含 usage
- **WHEN** 流式响应完成
- **THEN** 最后 yield 的消息包含 usage 字段（inputTokens/outputTokens）

### Requirement: 敏感信息过滤测试
streamChatCompletion SHALL 从原始响应中过滤敏感信息。

#### Scenario: 请求体中的 API Key 移除
- **WHEN** 收集请求元数据
- **THEN** raw.request.body 中不包含 apiKey、api_key、authorization、Authorization 字段

#### Scenario: 响应头中的敏感信息移除
- **WHEN** 收集响应元数据
- **THEN** raw.response.headers 中不包含 authorization、x-api-key 等敏感头

#### Scenario: 请求体大小限制
- **WHEN** 请求体超过 10KB
- **THEN** raw.request.body 被截断并添加 "... (truncated)" 后缀

### Requirement: 错误处理测试
streamChatCompletion SHALL 在元数据收集失败时继续返回消息内容。

#### Scenario: providerMetadata 收集失败
- **WHEN** providerMetadata Promise 被拒绝
- **THEN** 消息内容仍然被 yield，错误被记录在 raw.errors 中

#### Scenario: warnings 收集失败
- **WHEN** warnings Promise 被拒绝
- **THEN** 不影响其他元数据收集，错误被记录在 raw.errors 中

#### Scenario: sources 收集失败
- **WHEN** sources Promise 被拒绝
- **THEN** 消息正常返回，错误被记录在 raw.errors 中

### Requirement: 原始数据收集测试
streamChatCompletion SHALL 收集完整的原始响应数据。

#### Scenario: 基础元数据收集
- **WHEN** 流式响应完成
- **THEN** raw 对象包含 response、request、usage、finishReason 字段

#### Scenario: 流式事件统计
- **WHEN** 处理包含多个 text-delta 和 reasoning-delta 的流
- **THEN** raw.streamStats 正确统计 textDeltaCount、reasoningDeltaCount 和 duration

#### Scenario: DeepSeek 供应商元数据
- **WHEN** 使用 DeepSeek provider 完成请求
- **THEN** raw.providerMetadata 包含 deepseek 特定字段

#### Scenario: MoonshotAI 供应商元数据
- **WHEN** 使用 MoonshotAI provider 完成请求
- **THEN** raw.providerMetadata 包含 moonshotai 特定字段

#### Scenario: Zhipu 供应商元数据
- **WHEN** 使用 Zhipu provider 完成请求
- **THEN** raw.providerMetadata 包含 zhipu 特定字段

#### Scenario: RAG Sources 收集
- **WHEN** 响应包含 sources（如 web search 模型）
- **THEN** raw.sources 包含格式化的 source 列表

#### Scenario: 空 sources 处理
- **WHEN** 响应 sources 为空数组
- **THEN** raw.sources 为 undefined（而非空数组）
