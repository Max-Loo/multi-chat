## Why

`setup/mocks.ts` 内联定义了 `createDefaultMockStreamResult()` 和 `createMockAIProvider()` 两个 AI SDK mock 辅助函数（第 15-87 行），而 `helpers/mocks/aiSdk.ts` 已提供功能近似的 `createMockStreamResult()`。两者元数据结构重复、维护需同步两处，且 `setup/mocks.ts` 中的内联函数无法被测试文件直接导入复用。

## What Changes

- 将 `setup/mocks.ts` 中的 `createDefaultMockStreamResult()` 和 `createMockAIProvider()` 提取到 `helpers/mocks/aiSdk.ts`
- `helpers/mocks/aiSdk.ts` 中新增 `createMockAIProvider()` 导出函数，供 `setup/mocks.ts` 的 `vi.mock()` 调用引用
- `createDefaultMockStreamResult()` 合并为 `createMockStreamResult()` 的无参调用（`createMockStreamResult()` 默认参数即为空流 + 默认元数据）
- `setup/mocks.ts` 中的 `vi.mock('ai')` 和 `vi.mock('@ai-sdk/*')` 改为从 `helpers/mocks/aiSdk.ts` 导入工厂函数

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `shared-mock-factories`: 扩展 AI SDK provider mock 工厂函数的要求，增加 `createMockAIProvider` 必须从 `helpers/mocks/aiSdk.ts` 导出的约束，以及 `createDefaultMockStreamResult` 必须复用 `createMockStreamResult` 的约束

## Impact

- **`src/__test__/helpers/mocks/aiSdk.ts`**：新增 `createMockAIProvider()` 和 `createDefaultMockStream()` 导出
- **`src/__test__/setup/mocks.ts`**：删除内联的 `createDefaultMockStream`、`createDefaultMockStreamResult`、`createMockAIProvider` 三个函数，改为从 `helpers/mocks/aiSdk.ts` 导入
- **`src/__test__/helpers/mocks/index.ts`**：新增 `createMockAIProvider` 导出
- **现有测试**：行为不变，所有 1788 个单元测试 + 95 个集成测试仍通过
