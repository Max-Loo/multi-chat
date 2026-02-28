# 核心业务逻辑测试实施任务

## 1. Chat Slices 测试实施

- [x] 1.1 创建测试文件 `src/__test__/store/slices/chatSlices.test.ts`
- [x] 1.2 设置测试基础结构（import、describe 块、beforeEach/afterEach 钩子）
- [x] 1.3 Mock `loadChatsFromJson` 存储函数
- [x] 1.4 Mock `streamChatCompletion` 聊天服务函数
- [x] 1.5 测试 `initializeChatList` async thunk（pending、fulfilled、rejected 状态）
- [x] 1.6 测试聊天管理 reducers（createChat、editChat、editChatName、deleteChat）
- [x] 1.7 测试选中聊天管理（setSelectedChatId、clearSelectChatId）
- [x] 1.8 测试 `sendMessage` async thunk（pending、fulfilled、rejected 状态）
- [x] 1.9 测试 `pushRunningChatHistory` 和 `pushChatHistory` reducers
- [x] 1.10 测试 `startSendChatMessage` async thunk（多模型并发发送）
- [x] 1.11 测试软删除逻辑（isDeleted 标记，不从数组移除）
- [x] 1.12 测试选中聊天为被删除聊天时的行为（selectedChatId 置 null）
- [x] 1.13 测试错误状态清理（clearError、clearInitializationError）
- [x] 1.14 运行测试并验证通过
- [x] 1.15 检查覆盖率报告（目标 90%+）

## 2. Chat Service 测试实施

- [x] 2.1 创建测试文件 `src/__test__/services/chatService.test.ts`
- [x] 2.2 设置测试基础结构（import、describe 块）
- [x] 2.3 Mock Vercel AI SDK（`streamText`、`generateId`）
- [x] 2.4 Mock 供应商 SDK（`createDeepSeek`、`createMoonshotAI`、`createZhipu`）
- [x] 2.5 Mock `getFetchFunc` fetch 函数
- [x] 2.6 测试 `getProvider` 函数（DeepSeek、Moonshot AI、Zhipu AI）
- [x] 2.7 测试 `getProvider` 不支持的供应商抛出错误
- [x] 2.8 测试 `buildMessages` 函数（system、user、assistant 消息转换）
- [x] 2.9 测试 `buildMessages` 包含推理内容的 assistant 消息（includeReasoningContent=true）
- [x] 2.10 测试 `buildMessages` 不包含推理内容（includeReasoningContent=false）
- [x] 2.11 测试 `buildMessages` 未知角色类型抛出错误
- [x] 2.12 测试 `streamChatCompletion` 流式响应迭代
- [x] 2.13 测试 text-delta 和 reasoning-delta 事件处理
- [x] 2.14 测试最终消息包含 finishReason 和 usage 元数据
- [x] 2.15 测试自定义 conversationId 参数
- [x] 2.16 测试自动生成 conversationId（使用 generateId）
- [x] 2.17 测试 AbortSignal 中断流式请求
- [x] 2.18 测试网络错误和 API 错误响应处理
- [x] 2.19 测试 Token 使用统计解析（inputTokens、outputTokens）
- [x] 2.20 测试 includeReasoningContent 参数传递
- [x] 2.21 测试时间戳生成（使用 getCurrentTimestamp）
- [x] 2.22 测试模型信息传递（modelKey）
- [x] 2.23 运行测试并验证通过
- [x] 2.24 检查覆盖率报告（目标 90%+）

## 3. Model Slice 测试实施

- [x] 3.1 创建测试文件 `src/__test__/store/slices/modelSlice.test.ts`
- [x] 3.2 设置测试基础结构（import、describe 块、beforeEach/afterEach 钩子）
- [x] 3.3 Mock `loadModelsFromJson` 存储函数
- [x] 3.4 测试 `initializeModels` async thunk（pending、fulfilled、rejected 状态）
- [x] 3.5 测试模型管理 reducers（createModel、editModel、deleteModel）
- [x] 3.6 测试软删除逻辑（isDeleted 标记，不从数组移除）
- [x] 3.7 测试错误状态清理（clearError、clearInitializationError）
- [x] 3.8 测试初始状态验证（空数组、loading=false、errors=null）
- [x] 3.9 测试通过 ID 查找模型（存在、不存在、已删除）
- [x] 3.10 测试模型列表过滤（仅返回未删除的模型）
- [x] 3.11 测试状态转换序列（pending → fulfilled）
- [x] 3.12 测试存储加载失败的错误处理
- [x] 3.13 运行测试并验证通过
- [x] 3.14 检查覆盖率报告（目标 90%+）

## 4. App Config Slices 测试实施

- [x] 4.1 创建测试文件 `src/__test__/store/slices/appConfigSlices.test.ts`
- [x] 4.2 设置测试基础结构（import、describe 块、beforeEach/afterEach 钩子）
- [x] 4.3 Mock `getDefaultAppLanguage` 函数
- [x] 4.4 Mock `localStorage` API（getItem、setItem）
- [x] 4.5 Mock `changeAppLanguage` i18n 函数
- [x] 4.6 测试 `initializeAppLanguage` async thunk（fulfilled、rejected 状态）
- [x] 4.7 测试 `initializeIncludeReasoningContent` async thunk（true、false、null）
- [x] 4.8 测试应用配置 reducers（setAppLanguage、setIncludeReasoningContent）
- [x] 4.9 测试 `selectIncludeReasoningContent` 选择器
- [x] 4.10 测试 localStorage 持久化（语言、推理内容开关）
- [x] 4.11 测试中间件监听 language action 并调用 changeAppLanguage
- [x] 4.12 测试中间件监听 includeReasoningContent action 并保存到 localStorage
- [x] 4.13 测试初始状态验证（language=''、includeReasoningContent=false）
- [x] 4.14 测试 localStorage 读取失败的错误处理
- [x] 4.15 测试布尔值序列化（true/false ↔ 'true'/'false'）
- [x] 4.16 测试配置状态全局同步（Redux selector 更新）
- [x] 4.17 运行测试并验证通过
- [x] 4.18 检查覆盖率报告（目标 90%+）

## 5. 集成验证和文档更新

- [x] 5.1 运行全部测试套件（`pnpm test`）
- [x] 5.2 生成完整覆盖率报告（`pnpm test:coverage`）
- [x] 5.3 验证整体测试覆盖率提升至 70%+
- [x] 5.4 验证核心业务逻辑测试覆盖率达到 90%+
- [x] 5.5 检查所有测试文件通过（无失败、无超时）
- [x] 5.6 修复发现的测试问题（如有）
- [x] 5.7 更新 AGENTS.md 中的测试覆盖率数据
- [x] 5.8 代码审查所有测试文件
- [x] 5.9 确认测试遵循项目测试模式和最佳实践
- [x] 5.10 提交测试文件到版本控制

## 6. 清理和优化（可选）

- [ ] 6.1 移除未使用的 Mock 和测试辅助代码
- [ ] 6.2 优化慢速测试（如有）
- [ ] 6.3 统一测试命名规范
- [ ] 6.4 添加测试注释说明复杂场景
- [ ] 6.5 验证测试在 CI/CD 环境中稳定运行
