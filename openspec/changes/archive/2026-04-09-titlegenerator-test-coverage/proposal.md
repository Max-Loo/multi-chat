## Why

`titleGenerator.ts` 的核心函数 `generateChatTitleService`（第 36-76 行）完全没有单元测试，覆盖率仅 14.28%。该函数负责在用户首次收到 AI 回复后自动生成聊天标题，是直接影响用户体验的核心流程。当前仅通过集成测试间接覆盖（且集成测试 mock 了该函数本身），无法捕获 prompt 构建错误、provider 初始化失败、结果验证缺陷等内部逻辑问题。

## What Changes

- 使用 `vi.mock` 拦截 `ai` 和 `providerFactory` 模块，替代依赖注入模式，使 `generateChatTitleService` 可独立单元测试且保持干净的函数签名
- 提取 `buildTitlePrompt` 纯函数，将 prompt 构建逻辑（第 41-58 行）独立为可测试的纯函数
- 补充 `generateChatTitleService` 的单元测试，覆盖：正常标题生成、prompt 构建、provider 错误处理、空结果验证、消息提取逻辑
- 补充 `buildTitlePrompt` 的单元测试，覆盖：单条消息、多条消息、空消息等边界场景

## Capabilities

### New Capabilities
- `title-generator-testing`: titleGenerator 核心函数的单元测试覆盖，包括依赖注入重构、纯函数提取、测试用例编写

### Modified Capabilities
- `chat-auto-naming`: `generateChatTitleService` 函数签名保持不变，`generateText` 和 `getProvider` 通过 `vi.mock` 在测试中替换

## Impact

- **代码变更**：`src/services/chat/titleGenerator.ts`（函数签名扩展 + 提取纯函数）
- **测试变更**：`src/__test__/services/chat/titleGenerator.test.ts`（新增约 15-20 个测试用例）
- **依赖影响**：无新增依赖；调用方（`chatMiddleware`）无需修改（dependencies 参数可选且有默认值）
- **覆盖率预期**：titleGenerator 从 14.28% 提升至 80%+
