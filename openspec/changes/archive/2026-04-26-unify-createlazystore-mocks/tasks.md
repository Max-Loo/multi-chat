## 1. 生产代码：消除 storeUtils 的 createLazyStore 转发

- [x] 1.1 `storeUtils.ts`：删除 `import { createLazyStore as createCompatStore, type StoreCompat } from '@/utils/tauriCompat'` 和 `createLazyStore` 转发函数
- [x] 1.2 `chatStorage.ts`：将 `createLazyStore` 导入来源从 `./storeUtils` 改为 `@/utils/tauriCompat`，保留 `saveToStore`/`loadFromStore` 从 `./storeUtils` 导入
- [x] 1.3 `modelStorage.ts`：移除 import 中的 `createLazyStore`，仅保留 `saveToStore`/`loadFromStore`；将 `createLazyStore` 导入改为从 `@/utils/tauriCompat`
- [x] 1.4 `modelRemote/index.ts`：将 `createLazyStore` 导入路径从 `@/utils/tauriCompat/store` 改为 `@/utils/tauriCompat`
- [x] 1.5 运行 `pnpm tsc` 确认类型检查通过

## 2. 测试基础设施：统一 createLazyStore mock

- [x] 2.1 `setup/mocks.ts` Mock A（`@/store/storage/storeUtils`）：删除 `createLazyStore` 字段，仅保留 `saveToStore` 和 `loadFromStore`
- [x] 2.2 `setup/mocks.ts` Mock B（`@/utils/tauriCompat/store`）：将手工 stub 替换为 `createLazyStore: vi.fn(() => globalThis.__createMemoryStorageMock())`
- [x] 2.3 `setup/mocks.ts` Mock C（`@/utils/tauriCompat` 桶模块）：删除 `createLazyStore: vi.fn()` 裸桩行
- [x] 2.4 `store/slices/chatSlices.test.ts`：将 `createLazyStore: vi.fn(() => ({}))` 替换为 `createLazyStore: vi.fn(() => globalThis.__createMemoryStorageMock())`
- [x] 2.5 `utils/resetAllData.test.ts`：将手工 `mockStoreMethods` 替换为 `vi.hoisted(() => ({ mockStoreMethods: globalThis.__createMemoryStorageMock() }))`

## 3. 验证

- [x] 3.1 运行 `pnpm test:run` 确认全部单元测试通过
- [x] 3.2 运行 `pnpm test:integration:run` 确认全部集成测试通过
- [x] 3.3 确认 `setup/mocks.ts` 中 `createLazyStore` 仅在 Mock B 中定义一次
- [x] 3.4 确认 `storeUtils.ts` 不再包含 `createLazyStore` 相关代码
- [x] 3.5 确认所有 `createLazyStore` 消费者统一从 `@/utils/tauriCompat` 导入
