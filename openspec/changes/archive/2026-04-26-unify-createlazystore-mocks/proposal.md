## Why

`createLazyStore` 的 mock 散落在 `setup/mocks.ts` 的三处 `vi.mock()` 中，每处手工构建了不同方法集的 stub 对象。同时，`helpers/mocks/storage.ts` 已提供完整的 `createMemoryStorageMock()` 工厂函数（含全部 8 个 StoreCompat 方法），却仅被集成测试使用，单元测试的全局 mock 绕过了它。

三处 mock 的具体问题：

1. **Mock A**（`@/store/storage/storeUtils`）：返回 7 方法的 stub，缺少 `close()` 和 `isSupported()`。同时还 mock 了 `createLazyStore` 的转发函数，而这个转发只是 `return createCompatStore(filename)` — 零逻辑。
2. **Mock B**（`@/utils/tauriCompat/store`）：返回 8 方法的 stub，缺少 `close()`。与 Mock A 方法集不一致（多了 `isSupported`、少了 `saveToStore/loadFromStore`）。
3. **Mock C**（`@/utils/tauriCompat` 桶模块）：`createLazyStore: vi.fn()` 裸桩，调用返回 `undefined`。虽然被 `importOriginal` + 展开覆盖，但在展开顺序中裸桩覆盖了来自 Mock B 的 `actual.createLazyStore`，形成定时炸弹。

此外，`storeUtils.ts` 中 `createLazyStore` 的转发函数制造了额外的 mock 需求——消费者完全可以直接从 `@/utils/tauriCompat` 导入。`modelRemote/index.ts` 已经绕过了 storeUtils，直接导入 `@/utils/tauriCompat/store`，说明转发层不是必需的。

## What Changes

- 将 `setup/mocks.ts` 中三处手工 `createLazyStore` stub 全部替换为 `globalThis.__createMemoryStorageMock()` 调用（已在 `setup/base.ts` 中注册）
- 删除 `storeUtils.ts` 中的 `createLazyStore` 转发函数，让消费者（`chatStorage.ts`、`modelStorage.ts`）直接从 `@/utils/tauriCompat` 导入
- 将 `modelRemote/index.ts` 的导入从 `@/utils/tauriCompat/store` 改为 `@/utils/tauriCompat`（与其他消费者统一）
- 删除 Mock C 中的 `createLazyStore: vi.fn()` 裸桩，让 `...actual` 展开自然提供来自 Mock B 的实现
- Mock A 仅保留 `saveToStore` 和 `loadFromStore` 的 mock，不再 mock `createLazyStore`

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `shared-mock-factories`: 扩展存储 mock 统一约束——全局 mock 中的 `createLazyStore` 必须使用 `createMemoryStorageMock()` 工厂函数，禁止手工构建 stub
- `store-mock-unification`: 新增约束——`createLazyStore` 的 mock 只定义一次（在 `@/utils/tauriCompat/store` 的 mock 中），转发层和桶模块的 mock 不再重复定义

## Impact

- **`src/store/storage/storeUtils.ts`**：删除 `createLazyStore` 转发函数和对应的 import
- **`src/store/storage/chatStorage.ts`**：导入路径从 `./storeUtils` 改为 `@/utils/tauriCompat`
- **`src/store/storage/modelStorage.ts`**：导入路径中移除 `createLazyStore`，保留 `saveToStore`/`loadFromStore`
- **`src/services/modelRemote/index.ts`**：导入路径从 `@/utils/tauriCompat/store` 改为 `@/utils/tauriCompat`
- **`src/__test__/setup/mocks.ts`**：三处 `createLazyStore` mock 统一使用 `createMemoryStorageMock()`
- **`src/__test__/store/slices/chatSlices.test.ts`**：`createLazyStore: vi.fn(() => ({}))` 改为使用工厂函数
- **`src/__test__/utils/resetAllData.test.ts`**：手工 `mockStoreMethods` 改为使用 `createMemoryStorageMock()`
- **现有测试**：行为不变，所有 1788 个单元测试 + 95 个集成测试仍通过
