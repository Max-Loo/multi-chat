## Context

当前测试系统中，AI SDK 相关的 mock 辅助函数分散在两处：

1. **`setup/mocks.ts`（第 15-87 行）**：内联定义了 `createDefaultMockStream`、`createDefaultMockStreamResult`、`createMockAIProvider` 三个函数，仅在 `setup/mocks.ts` 内部的 `vi.mock('ai')` 和 `vi.mock('@ai-sdk/*')` 中使用，无法被其他测试文件导入。
2. **`helpers/mocks/aiSdk.ts`**：导出 `createMockStreamResult(streamItems?, options?)` 和 `AIError` 类型，可被任何测试文件导入。已有 `ai-mock-test.test.ts` 通过 `helpers/index` 使用。

两者在元数据结构（`finishReason`、`usage`、`response`、`request` 等字段）上完全重复，且参数设计不同：`createDefaultMockStreamResult` 无参数（固定空流），`createMockStreamResult` 支持传入流事件数组和错误选项。

## Goals / Non-Goals

**Goals:**

- 消除 `setup/mocks.ts` 和 `helpers/mocks/aiSdk.ts` 之间的重复代码
- 让 `createMockAIProvider` 可被其他测试文件复用（当前完全不可导入）
- 让 `createDefaultMockStreamResult` 复用 `createMockStreamResult`（统一入口）
- 保持所有现有测试行为不变

**Non-Goals:**

- 不修改 `helpers/mocks/aiSdk.ts` 中 `createMockStreamResult` 的现有签名和返回结构
- 不修改 `AIError` 类型
- 不涉及集成测试配置或 `globalThis` 模式的变更
- 不引入新的 `globalThis.__createXxxMock` 注册（`createMockAIProvider` 在 `vi.mock` 工厂外不需要）

## Decisions

### D1：`createMockAIProvider` 放入 `helpers/mocks/aiSdk.ts` 并导出

**选择**：将函数从 `setup/mocks.ts` 移动到 `helpers/mocks/aiSdk.ts`，作为命名导出。

**理由**：`helpers/mocks/aiSdk.ts` 已是 AI SDK mock 的统一归属地，且通过 `helpers/mocks/index.ts` 导出后，任何测试文件可直接 `import { createMockAIProvider } from '@/__test__/helpers'` 使用。

**替代方案**：新建独立的 `helpers/mocks/aiSdkProvider.ts`。被否决——provider mock 和 stream mock 同属 AI SDK，拆分增加导航成本。

### D2：`createDefaultMockStreamResult` 用 `createMockStreamResult()` 替代

**选择**：删除 `createDefaultMockStreamResult`，`setup/mocks.ts` 中的 `vi.mock('ai')` 直接调用 `createMockStreamResult()`（无参数时行为一致：空流 + 默认元数据）。

**理由**：对比两者的 thenable 回调返回值，字段名和值完全一致。`createMockStreamResult()` 的无参默认值等价于 `createDefaultMockStreamResult()`。

**替代方案**：保留 `createDefaultMockStreamResult` 作为 `createMockStreamResult` 的别名。被否决——别名增加间接层，无实际收益。

### D3：`createDefaultMockStream` 用空生成器替代

**选择**：删除 `createDefaultMockStream`，`createMockStreamResult` 内部已有等价的 `mockStream` 生成器（无参数时产生空流）。

**理由**：`createDefaultMockStream` 仅被 `createDefaultMockStreamResult` 引用，而 `createMockStreamResult()` 无参时自然产生空流，功能完全覆盖。

## Risks / Trade-offs

- **[风险] `createMockStreamResult()` 的 thenable 签名略有差异**：`createDefaultMockStreamResult` 的 `then` 回调类型是 `(value: unknown) => unknown`，而 `createMockStreamResult` 是 `(value: any) => any, errorCallback?: (reason: any) => any`。→ **缓解**：后者签名更完整（包含 errorCallback），`setup/mocks.ts` 不使用 errorCallback，不影响行为。
- **[风险] `createMockStreamResult()` 的流生成器会检查 `streamItems.length === 0 && options?.streamError`**：空流 + 无错误时不执行该分支，等价于 `createDefaultMockStream` 的空生成器。→ **缓解**：条件分支仅在 `streamError` 存在时触发，无参调用不受影响。
