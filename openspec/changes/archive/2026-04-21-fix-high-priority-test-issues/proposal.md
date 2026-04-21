## Why

审查报告 `simplify-review.md` 识别出测试代码中 6 个高优先级问题：工厂函数重复、mock 实现冗余、状态泄漏风险和冗余注释。这些问题导致维护成本高、测试意图不清晰，且存在跨测试状态泄漏隐患。应在合并前修复，避免技术债积累。

## What Changes

- **移除 `createTestModel`**：`model-config.integration.test.ts` 中自建了与已有 `createMockModel` 功能完全相同的工厂函数，且使用不稳定随机 ID。改用已有的 `createMockModel`/`createDeepSeekModel`。
- **提取内存存储 mock 为共享工具**：`model-config.integration.test.ts`、`modelStorage.test.ts`、`settings-change.integration.test.ts` 三处各自手写了几乎相同的 Map 存储实现，提取为 `globalThis` 注册的共享工具。
- **精简 sonner mock 重复代码**：`toast-system.integration.test.tsx` 中 6 个 toast 方法的函数体完全相同（约 50 行重复），提取为内部辅助函数。
- **清理冗余注释**：删除 `ChatPanel.test.tsx` 中约 8 处仅复述代码行为的注释，保留解释设计意图和边界条件的注释。
- **消除 `beforeEach`/`afterEach` 双重重置**：`model-config.integration.test.ts` 中同一重置操作在两个钩子中重复调用，保留 `afterEach`（防御性策略），移除 `beforeEach` 中的重复。
- ~~修复 `toastQueue` 单例状态泄漏~~：经二次校验，`toast-system.integration.test.tsx` 已通过 `vi.resetModules()` + `await import(...)` 动态导入确保每个测试获取全新实例，无需额外重置。原审查报告的泄漏风险仅在静态导入路径下存在，当前测试不涉及此场景，移除此项。

## Capabilities

### New Capabilities

- `test-mock-consolidation`: 统一测试 mock 工具——提取内存存储 mock 和 sonner toast mock 为共享工具，消除跨文件重复

### Modified Capabilities

## Impact

- **影响文件**：
  - `src/__test__/integration/model-config.integration.test.ts`（移除 createTestModel、消除双重重置、改用共享存储 mock）
  - `src/__test__/integration/toast-system.integration.test.tsx`（精简 sonner mock）
  - `src/__test__/components/ChatPanel.test.tsx`（清理冗余注释）
  - `src/__test__/utils/modelStorage.test.ts`（改用共享存储 mock）
  - `src/__test__/integration/settings-change.integration.test.ts`（改用共享存储 mock）
- **可能新增**：共享 mock 工具文件（取决于提取方案）
- **无破坏性变更**：所有修改仅涉及测试代码，不影响生产代码
- **无 API/依赖变更**
