## Why

项目中存在 92 个被跳过的单元测试（chatService.test.ts 38 个、masterKey.test.ts 54 个），导致核心业务逻辑（聊天服务、密钥管理）的测试覆盖率为 0%。这些测试被跳过的原因是：1）chatService 测试中 vi.mock() 仅在测试文件内定义，导致被测试模块加载时真实 SDK 已缓存，Mock 未生效；2）masterKey 测试环境配置问题（Tauri/加密环境初始化失败）。当前高覆盖率数据掩盖了关键模块无测试保护的风险，亟需修复以确保核心业务可靠性。

## What Changes

- **修复 chatService 测试套件**：保持使用 vi.mock()（符合项目测试准则），修复 Mock 实现以适配 Vercel AI SDK 的实际 API：
  - 修复 streamText 的 Mock 返回值结构（正确模拟异步生成器和元数据 Promise）
  - 修复供应商 SDK Mock（createDeepSeek、createMoonshotAI、createZhipu）
  - 确保流式响应的异步迭代器正确工作
- **重构 masterKey 测试套件**：修复测试环境配置，确保密钥管理模块测试可正常执行
- **更新测试策略文档**：在测试 README 中补充"何时使用 MSW 替代 vi.mock"的指导原则
- **补充缺失的边界条件测试**：为 chatService 添加流式响应中断、网络超时、API 错误码处理等场景的测试用例
- **更新覆盖率阈值配置**：考虑将核心业务模块的覆盖率阈值单独配置，确保关键路径必须达到 80% 以上

## Capabilities

### New Capabilities
- `chat-service-test`: 使用 vi.mock() 进行 chatService 的 SDK Mock 测试，包括流式响应、错误处理、元数据收集等场景
- `master-key-test`: 密钥管理模块的完整测试覆盖，包括初始化、加密解密、密钥轮换等场景
- `test-environment-setup`: 测试环境配置管理，包括 Tauri 环境检测、加密 API Mock、IndexedDB 隔离

### Modified Capabilities
- *无现有规范需要修改，此为测试基础设施改进，不涉及业务需求变更*

## Impact

**受影响文件**：
- `src/__test__/services/chatService.test.ts` - 修复 Mock 实现，38 个测试用例启用
- `src/__test__/store/keyring/masterKey.test.ts` - 修复测试环境配置，54 个测试用例启用
- `src/__test__/README.md` - 补充 SDK Mock 最佳实践文档

**影响范围**：
- 仅涉及测试代码，不修改生产代码逻辑
- 保持现有测试执行时间（继续使用 vi.mock()）
- 开发人员需要了解 Vercel AI SDK 的 Mock 方法

**风险与缓解**：
- **风险**：Vercel AI SDK 版本升级可能导致 Mock 失效
  - **缓解**：在 README 中记录当前测试使用的 SDK 版本，升级时同步更新 Mock
- **风险**：修复过程可能发现新的测试问题
  - **缓解**：分阶段实施，先修复 chatService 再修复 masterKey，逐步验证

**成功标准**：
- chatService 和 masterKey 模块测试覆盖率从 0% 提升到 80% 以上
- 所有 92 个被跳过的测试用例全部启用并正常通过
- 建立 SDK Mock 最佳实践文档，确保后续类似测试可维护
