## Why

`src/services/chatService.ts` 当前测试覆盖率为 0%，现有测试文件仅验证函数能否导入，不测试任何实际逻辑。chatService 是应用的核心模块，负责所有 AI 聊天请求的处理，包括供应商选择、消息格式转换、流式响应等关键功能。缺乏测试保护使得代码重构和功能迭代变得高风险，且无法快速验证 bug 修复。为了提升代码质量、降低维护成本、确保重构安全性，现在必须为该模块添加完整的单元测试。

## What Changes

- **为 `getProvider()` 函数添加单元测试**
  - 测试 DeepSeek、Moonshot、Zhipu 三种供应商的 provider 创建逻辑
  - 测试不支持的供应商抛出错误的场景
  - 验证返回的函数类型正确性

- **为 `buildMessages()` 函数添加单元测试**
  - 测试 system 消息格式转换（content 必须为 string）
  - 测试 user 消息格式转换（content 为 Part 数组）
  - 测试 assistant 消息格式转换（含/不含推理内容）
  - 测试推理内容传输功能（`includeReasoningContent` 参数）
  - 测试边界情况（空历史、特殊字符、未知角色抛错）

- **为 `streamChatCompletion()` 函数添加单元测试**
  - Mock Vercel AI SDK 的 `streamText` 函数
  - 测试参数验证和传递
  - 测试流式响应处理（AsyncGenerator）
  - 测试 AbortSignal 中断功能
  - 测试错误处理（网络错误、API 错误）

- **测试覆盖率目标**
  - 语句覆盖率：从 0% 提升到 90%+
  - 分支覆盖率：从 0% 提升到 80%+
  - 函数覆盖率：从 0% 提升到 100%

## Capabilities

### New Capabilities

- `chatservice-unit-tests`: 为 chatService 模块提供完整的单元测试覆盖，包括 getProvider、buildMessages、streamChatCompletion 三个核心函数的测试用例

### Modified Capabilities

（无现有功能的需求变更，仅添加测试）

## Impact

**受影响的代码**：
- `src/services/chatService.ts` - 被测试的源代码（需确保函数可测试性，可能需要轻微重构）
- `src/__test__/services/chatService.test.ts` - 将被完全重写

**新增依赖**：
- Vitest Mock 功能（`vi.mock()`、`vi.fn()`）
- 可能需要安装 `@vitest/coverage-v8`（已配置）

**不影响的系统**：
- 不改变 chatService 的公共 API
- 不改变现有业务逻辑
- 不影响其他模块

**测试执行影响**：
- 测试套件运行时间增加约 1-2 秒
- 测试数量从 2 个增加到 25-30 个
