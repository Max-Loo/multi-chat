## 1. 共享 mock 工具提取

- [x] 1.1 在 `src/__test__/helpers/mocks/storage.ts` 中添加通过 `globalThis` 注册的内存存储 mock 工具（`__createMemoryStorageMock`），基于 Map 实现完整存储接口
- [x] 1.2 将 `model-config.integration.test.ts` 中的内联存储 mock（第 29-59 行）替换为 `globalThis.__createMemoryStorageMock()`
- [x] 1.3 将 `modelStorage.test.ts` 中的内联存储 mock（第 12-34 行）替换为 `globalThis.__createMemoryStorageMock()`
- [x] 1.4 将 `settings-change.integration.test.ts` 中的内联存储 mock（第 27-39 行）替换为 `globalThis.__createMemoryStorageMock()`

## 2. 模型工厂函数统一

- [x] 2.1 移除 `model-config.integration.test.ts` 中的 `createTestModel` 函数（第 137-152 行）
- [x] 2.2 将所有 `createTestModel` 调用替换为 `createMockModel` 或 `createDeepSeekModel`，通过 `overrides` 参数调整字段

## 3. sonner mock 精简

- [x] 3.1 在 `toast-system.integration.test.tsx` 中提取 `renderToastToDom` 辅助函数
- [x] 3.2 将 `toast`/`success`/`error`/`warning`/`info`/`loading` 6 个方法统一引用辅助函数，删除约 50 行重复代码

## 4. 测试状态管理修复

- [x] 4.1 在 `model-config.integration.test.ts` 的 `beforeEach` 中移除 `resetModelsStore()` 和 `memoryStore.clear()` 调用，仅保留 `afterEach` 中的清理

## 5. 冗余注释清理

- [x] 5.1 删除 `ChatPanel.test.tsx` 中约 8 处仅复述代码行为的冗余注释（第 20、56、60、64、129、158-159、197 行等），保留解释设计意图和边界条件的注释

## 6. 验证

- [x] 6.1 运行 `pnpm test` 确认所有测试通过，无回归
