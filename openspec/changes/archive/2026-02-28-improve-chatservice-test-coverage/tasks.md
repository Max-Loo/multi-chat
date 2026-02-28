## 1. 准备工作

- [x] 1.1 备份现有测试文件到 `chatService.test.ts.bak`
- [x] 1.2 清空现有测试文件内容，保留导入语句
- [x] 1.3 设置测试文件的基本结构（describe 分组）

## 2. Mock 配置

- [x] 2.1 Mock Vercel AI SDK (`ai` 包) - `streamText` 和 `generateId`
- [x] 2.2 Mock 供应商 SDK - `createDeepSeek`、`createMoonshotAI`、`createZhipu`
- [x] 2.3 Mock `@/utils/tauriCompat` 的 `getFetchFunc` 函数
- [x] 2.4 配置 `beforeEach` 清理逻辑，确保测试隔离

## 3. buildMessages() 函数测试

- [x] 3.1 实现：转换 system 消息为 AI SDK 格式（content 为字符串）
- [x] 3.2 实现：转换 user 消息为 AI SDK 格式（content 为 Part 数组）
- [x] 3.3 实现：转换 assistant 消息（不含推理内容）
- [x] 3.4 实现：转换 assistant 消息（含推理内容，`includeReasoningContent=true`）
- [x] 3.5 实现：处理空/空白推理内容（不添加 reasoning Part）
- [x] 3.6 实现：添加最新的 user 消息到数组末尾
- [x] 3.7 实现：未知角色抛出错误
- [x] 3.8 实现：处理空历史记录（edge case）
- [x] 3.9 运行测试并验证 `buildMessages()` 覆盖率 ≥ 95%

## 4. getProvider() 函数测试

- [x] 4.1 实现：使用 `describe.each` 参数化测试三个供应商
- [x] 4.2 实现：验证 DeepSeek provider 创建
- [x] 4.3 实现：验证 Moonshot provider 创建
- [x] 4.4 实现：验证 Zhipu provider 创建
- [x] 4.5 实现：测试不支持的供应商抛出错误
- [x] 4.6 实现：验证返回值类型（函数）
- [x] 4.7 运行测试并验证 `getProvider()` 覆盖率 = 100%

## 5. streamChatCompletion() 函数测试

- [x] 5.1 实现：成功发起流式请求（Mock `streamText` 返回 AsyncGenerator）
- [x] 5.2 实现：验证调用 `buildMessages()` 并传递结果
- [x] 5.3 实现：验证 `includeReasoningContent` 参数传递
- [x] 5.4 实现：验证 `conversationId` 参数使用（传入时不生成新 ID）
- [x] 5.5 实现：验证未传入 `conversationId` 时调用 `generateId()`
- [x] 5.6 实现：验证 `dangerouslyAllowBrowser` 参数传递
- [x] 5.7 实现：验证 AbortSignal 正确传递给 `streamText()`
- [x] 5.8 实现：验证使用 `getFetchFunc()` 获取 fetch 并传递给 provider
- [x] 5.9 实现：网络错误处理（`streamText` 抛出错误时正确传播）
- [x] 5.10 实现：API 错误处理（401、429、500 等响应）
- [x] 5.11 运行测试并验证 `streamChatCompletion()` 覆盖率 ≥ 85%

## 6. 覆盖率验证

- [x] 6.1 运行完整测试套件：`pnpm test:coverage -- src/__test__/services/chatService.test.ts`
- [x] 6.2 验证语句覆盖率 ≥ 90% (实际: 97.72%)
- [x] 6.3 验证分支覆盖率 ≥ 80% (实际: 87.09%)
- [x] 6.4 验证函数覆盖率 = 100% (实际: 100%)
- [x] 6.5 如果任一指标不达标，补充缺失的测试用例

## 7. 集成验证

- [x] 7.1 运行完整测试套件：`pnpm test`（确保没有破坏其他测试）
- [x] 7.2 运行类型检查：`pnpm tsc`（确保没有类型错误）
- [x] 7.3 运行代码检查：`pnpm lint`（确保符合代码规范）
- [x] 7.4 手动审查测试代码，检查 Mock 策略是否合理
- [x] 7.5 确认测试执行时间 < 2 秒（实际 15ms）

## 8. 文档和清理

- [x] 8.1 删除备份文件 `chatService.test.ts.bak`
- [x] 8.2 添加测试文件注释，说明测试策略和 Mock 方法
- [x] 8.3 如果 AGENTS.md 中提到测试覆盖率，更新相关统计数据
- [x] 8.4 提交代码：`git add src/__test__/services/chatService.test.ts && git commit -m "test: add comprehensive unit tests for chatService"`

## 9. 可选优化（如需要）

- [ ] 9.1 如果测试重复代码多，提取共享的 fixture 函数
- [ ] 9.2 如果 Mock 设置复杂，考虑抽取到 `src/__mocks__/` 目录
- [ ] 9.3 如果测试执行缓慢，优化 Mock 策略
- [ ] 9.4 如果测试脆性高，重新评估是否过度依赖实现细节
