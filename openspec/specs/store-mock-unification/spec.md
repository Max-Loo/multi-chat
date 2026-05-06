# Store Mock 统一规范

## 概述

`createLazyStore` 的 mock 必须使用 `helpers/mocks/storage.ts` 中的 `createMemoryStorageMock()` 工厂函数，禁止手工构建 stub 对象。mock 只在模块源头定义一次，转发层和桶模块不得重复定义。

## 约束

### S1: createLazyStore mock 唯一定义点

`createLazyStore` 的 mock 只允许在 `vi.mock('@/utils/tauriCompat/store', ...)` 中定义。其他 mock 点（`@/store/storage/storeUtils`、`@/utils/tauriCompat` 桶模块）不得包含 `createLazyStore` 字段。

**理由**：多个 mock 点各自为战导致接口不一致，增加维护成本和出错概率。

### S2: 全局 mock 必须使用工厂函数

全局 setup（`setup/mocks.ts`）中的 `createLazyStore` mock 必须调用 `globalThis.__createMemoryStorageMock()`，返回完整的 StoreCompat 接口 mock（8 个方法）。禁止手工列举 `vi.fn().mockResolvedValue(...)` 的 stub 列表。

**理由**：`createMemoryStorageMock()` 提供语义正确的 set/get 行为（数据存储在 Map 中），而纯 stub 会掩盖存储相关 bug。工厂函数是单一来源（single source of truth），接口变更只需修改一处。

### S3: storeUtils 转发层不再转发 createLazyStore

`storeUtils.ts` 中 `createLazyStore` 的转发函数（`return createCompatStore(filename)`）应删除。消费者直接从 `@/utils/tauriCompat` 导入。`storeUtils.ts` 仅保留 `saveToStore()` 和 `loadFromStore()` 两个有实际封装逻辑的函数。

**理由**：零逻辑的转发函数制造了额外的 mock 需求和导入路径，没有任何封装价值。

### S4: 导入路径统一

所有 `createLazyStore` 的消费者统一从 `@/utils/tauriCompat`（桶模块）导入，不从子模块 `@/utils/tauriCompat/store` 直接导入。

**理由**：统一的导入路径减少 mock 点数量，让桶模块的 mock 自然覆盖所有消费者。

### S5: 桶模块 mock 不覆盖 createLazyStore

`vi.mock('@/utils/tauriCompat', ...)` 中使用 `importOriginal` + 展开模式时，不再显式覆盖 `createLazyStore` 字段。`...actual` 展开中的 `createLazyStore` 来自已被 Mock B 拦截的 `tauriCompat/store` 子模块，无需重复定义。

**理由**：显式的 `createLazyStore: vi.fn()` 裸桩会覆盖 `...actual` 中来自底层 mock 的正确实现，形成定时炸弹。
