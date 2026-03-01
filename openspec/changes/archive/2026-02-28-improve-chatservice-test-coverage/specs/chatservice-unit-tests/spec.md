## ADDED Requirements

### Requirement: getProvider 函数测试覆盖
系统必须为 `getProvider()` 函数提供完整的单元测试，验证供应商 provider 工厂的创建逻辑。

#### Scenario: 成功创建 DeepSeek provider
- **WHEN** 调用 `getProvider(ModelProviderKeyEnum.DEEPSEEK, 'sk-test', 'https://api.deepseek.com')`
- **THEN** 应返回一个函数
- **AND** 该函数类型应为 `(modelId: string) => LanguageModel`

#### Scenario: 成功创建 Moonshot provider
- **WHEN** 调用 `getProvider(ModelProviderKeyEnum.MOONSHOTAI, 'sk-test', 'https://api.moonshot.cn')`
- **THEN** 应返回一个函数
- **AND** 该函数类型应为 `(modelId: string) => LanguageModel`

#### Scenario: 成功创建 Zhipu provider
- **WHEN** 调用 `getProvider(ModelProviderKeyEnum.ZHIPUAI, 'sk-test', 'https://open.bigmodel.cn')`
- **THEN** 应返回一个函数
- **AND** 该函数类型应为 `(modelId: string) => LanguageModel`

#### Scenario: 不支持的供应商抛出错误
- **WHEN** 调用 `getProvider()` 并传入不支持的供应商标识符
- **THEN** 应抛出错误
- **AND** 错误消息包含 "Unsupported provider:"

---

### Requirement: buildMessages 函数测试覆盖
系统必须为 `buildMessages()` 函数提供完整的单元测试，验证消息格式转换逻辑。

#### Scenario: 转换 system 消息为 AI SDK 格式
- **WHEN** 历史消息包含 role 为 `system` 的消息
- **THEN** content 必须为字符串（string）
- **AND** 不应包含在 Part 数组中

#### Scenario: 转换 user 消息为 AI SDK 格式
- **WHEN** 历史消息包含 role 为 `user` 的消息
- **THEN** content 必须为 Part 数组
- **AND** 应包含 `{ type: 'text', text: <content> }` 格式的 Part

#### Scenario: 转换 assistant 消息（不含推理内容）
- **WHEN** 历史消息包含 role 为 `assistant` 的消息
- **AND** `includeReasoningContent` 参数为 `false`
- **THEN** content 必须为 Part 数组
- **AND** 应仅包含文本 Part `{ type: 'text', text: <content> }`

#### Scenario: 转换 assistant 消息（含推理内容）
- **WHEN** 历史消息包含 role 为 `assistant` 的消息
- **AND** `includeReasoningContent` 参数为 `true`
- **AND** 消息包含非空的 `reasoningContent` 字段
- **THEN** content 必须为 Part 数组
- **AND** 应包含文本 Part `{ type: 'text', text: <content> }`
- **AND** 应包含推理 Part `{ type: 'reasoning', text: <reasoningContent> }`

#### Scenario: 处理空推理内容
- **WHEN** `includeReasoningContent` 为 `true`
- **AND** `reasoningContent` 为空字符串或仅包含空白字符
- **THEN** 不应添加推理 Part

#### Scenario: 添加最新的 user 消息
- **WHEN** 调用 `buildMessages()` 并传入最新的 user 消息
- **THEN** 必须将最新消息添加到消息数组末尾
- **AND** 最新消息的 role 必须为 `user`
- **AND** 最新消息的 content 必须为 Part 数组

#### Scenario: 未知角色抛出错误
- **WHEN** 历史消息包含未知或不支持的 role
- **THEN** 应抛出错误
- **AND** 错误消息包含 "Unknown role:"

#### Scenario: 处理空历史记录
- **WHEN** 传入空的 `historyList` 数组
- **THEN** 应仅包含最新的 user 消息
- **AND** 不应抛出错误

---

### Requirement: streamChatCompletion 函数测试覆盖
系统必须为 `streamChatCompletion()` 函数提供完整的单元测试，验证流式聊天请求处理逻辑。

#### Scenario: 成功发起流式请求
- **WHEN** 调用 `streamChatCompletion()` 并传入有效参数
- **THEN** 应调用 Vercel AI SDK 的 `streamText` 函数
- **AND** 应返回 AsyncGenerator
- **AND** 应正确传递 model、apiKey、baseURL、fetch 等参数

#### Scenario: 正确构建消息并传递给 SDK
- **WHEN** 调用 `streamChatCompletion()`
- **THEN** 应调用 `buildMessages()` 构建消息
- **AND** 应将构建的消息传递给 `streamText()`
- **AND** 应使用 `historyList` 和 `message` 参数

#### Scenario: 处理推理内容参数
- **WHEN** 传入 `includeReasoningContent: true`
- **THEN** 应将此参数传递给 `buildMessages()`
- **AND** 应在构建消息时包含推理内容

#### Scenario: 传递 conversationId
- **WHEN** 传入 `conversationId` 参数
- **THEN** 应使用该 ID 而非生成新 ID
- **AND** 应将该 ID 传递给 `streamText()` 的 `generateId` 参数

#### Scenario: 未传入 conversationId 时生成新 ID
- **WHEN** 不传入 `conversationId` 参数
- **THEN** 应使用 `generateId()` 生成新 ID
- **AND** 应将生成的 ID 传递给 `streamText()`

#### Scenario: 传递 dangerouslyAllowBrowser 参数
- **WHEN** 传入 `dangerouslyAllowBrowser: true`
- **THEN** 应将此参数传递给 `streamText()`
- **AND** 应允许在浏览器环境运行

#### Scenario: 正确处理 AbortSignal
- **WHEN** 传入 `AbortSignal` 对象
- **THEN** 应将 signal 传递给 `streamText()`
- **AND** 应支持中断流式请求

#### Scenario: 网络错误处理
- **WHEN** `streamText()` 抛出网络错误
- **THEN** 应正确传播错误
- **AND** 不应吞没错误

#### Scenario: API 错误处理
- **WHEN** API 返回错误响应（如 401、429、500）
- **THEN** 应正确传播错误
- **AND** 应包含错误信息

#### Scenario: 正确使用 fetch 函数
- **WHEN** 调用 `streamChatCompletion()`
- **THEN** 应使用 `getFetchFunc()` 获取 fetch 函数
- **AND** 应将 fetch 函数传递给 provider

---

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

---

### Requirement: Mock 策略要求
测试必须使用适当的 Mock 策略来隔离依赖，确保测试的独立性和速度。

#### Scenario: Mock Vercel AI SDK
- **WHEN** 测试 `streamChatCompletion()` 函数
- **THEN** 必须使用 `vi.mock()` Mock `ai` 包
- **AND** 必须替换 `streamText` 和 `generateId` 函数
- **AND** Mock 应返回可控的测试数据

#### Scenario: Mock provider 函数
- **WHEN** 测试 `getProvider()` 或 `streamChatCompletion()` 函数
- **THEN** 必须 Mock `createDeepSeek`、`createMoonshotAI`、`createZhipu` 等函数
- **AND** Mock 应返回模拟的 LanguageModel 对象

#### Scenario: Mock tauriCompat 函数
- **WHEN** 测试任何使用 `getFetchFunc()` 的函数
- **THEN** 必须 Mock `@/utils/tauriCompat` 模块
- **AND** `getFetchFunc` 应返回模拟的 fetch 函数

#### Scenario: 测试隔离
- **WHEN** 运行每个测试用例
- **THEN** 必须在 `beforeEach` 中清理所有 Mock
- **AND** 测试之间不应共享状态
- **AND** 每个测试应独立运行
