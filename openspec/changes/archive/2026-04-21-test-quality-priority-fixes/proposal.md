## Why

测试审查（simplify-review.md）识别出 13 个「中」优先级问题，其中 6 个具有较高的修复紧迫性：2 个涉及 mock 状态泄漏（影响测试正确性），4 个是低成本高收益的代码卫生修复。当前这 6 个问题分散在不同文件中，需要集中修复以消除正确性风险并减少后续维护负担。

## What Changes

- 恢复 `model-config.integration.test.ts` 的 `afterEach` 中被误删的 `vi.restoreAllMocks()` 调用，防止 mock 状态跨测试泄漏
- 为 `ToastQueue` 类添加测试专用 `reset()` 方法，解决单例状态在静态导入路径下的测试隔离问题
- 简化 `toast-system.integration.test.tsx` 中 sonner mock 的 6 个重复函数体，使用 `Object.assign` 消除冗余
- 删除 `model-config.integration.test.ts` 测试末尾多余的 `setupDefaultStreamMock()` 调用
- 修复 `Layout.test.tsx` 中 `layoutMode` 的 `as string` 类型断言，恢复 `LayoutMode` 联合类型约束
- 替换 `chat/index.integration.test.ts` 和 `auto-naming.integration.test.ts` 中的手写 `createTestModel` 为已有的 `createDeepSeekModel` fixture

## Capabilities

### New Capabilities

- `test-mock-isolation`: 测试 mock 状态隔离规范，确保 `restoreAllMocks` 和单例 `reset` 模式的一致使用
- `test-mock-simplification`: 测试 mock 代码简化，消除重复的 mock 定义和冗余调用

### Modified Capabilities

## Impact

- **测试文件**（5 个）：`model-config.integration.test.ts`、`toast-system.integration.test.tsx`、`Layout.test.tsx`、`chat/index.integration.test.ts`、`auto-naming.integration.test.ts`
- **生产代码**（1 个）：`src/services/toast/toastQueue.ts`（添加 `reset()` 方法）
- **无 API 变更、无破坏性变更**
