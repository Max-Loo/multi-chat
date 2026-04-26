## 1. 基础设施：ResourceLoader 添加 clearAll

- [x] 1.1 `src/utils/resourceLoader.ts`：在 `ResourceLoader` 类中添加 `clearAll()` 方法，清理 `registry`、`cache`、`states`、`loadingPromises` 四个 Map 和 `lruList` 数组
- [x] 1.2 `src/__test__/utils/resourceLoader.test.ts`：添加 `clearAll()` 的测试用例（验证清理后所有 Map 为空、LRU 为空）

## 2. chatStorage 延迟初始化 + resetChatsStore

- [x] 2.1 `src/store/storage/chatStorage.ts`：将 `const chatsStore = createLazyStore('chats.json')` 改为 `let chatsStore: StoreCompat | null = null` + `getChatsStore()` 延迟初始化函数
- [x] 2.2 `src/store/storage/chatStorage.ts`：所有内部函数（`loadChatsFromJson`、`saveChatsToJson` 等）改为通过 `getChatsStore()` 获取 store 实例
- [x] 2.3 `src/store/storage/chatStorage.ts`：添加 `resetChatsStore()` 导出函数，调用 `chatsStore?.close()` 并置 `chatsStore = null`
- [x] 2.4 更新所有导入 `chatsStore` 的测试文件（如有直接引用）

## 3. providerLoader resetForTest + AbortController

- [x] 3.1 `src/services/chat/providerLoader.ts`：将构造函数中的 `window.addEventListener('online', ...)` 改为使用 `AbortController` 模式
- [x] 3.2 `src/services/chat/providerLoader.ts`：添加 `resetForTest()` 方法，调用内部 `ResourceLoader.clearAll()` + `controller.abort()`
- [x] 3.3 `src/__test__/services/chat/providerLoader.test.ts`：添加 `resetForTest()` 的测试用例

## 4. i18n reset 扩展

- [x] 4.1 `src/services/i18n.ts`：将 `resetInitI18nForTest()` 扩展为 `resetI18nForTest()`，同时清理 `loadedLanguages`（clear）、`loadingPromises`（clear）、`languageResourcesCache`（clear）和 `initI18nPromise`（置 null），并重新填充 `loadedLanguages` 的默认值 `["en"]`
- [x] 4.2 `src/services/i18n.ts`：保留旧的 `resetInitI18nForTest` 作为 `resetI18nForTest` 的别名（向后兼容），标记 `@deprecated`
- [x] 4.3 更新所有调用 `resetInitI18nForTest()` 的测试文件改为 `resetI18nForTest()`

## 5. chatMiddleware resetChatMiddleware

- [x] 5.1 `src/store/middleware/chatMiddleware.ts`：添加 `resetChatMiddleware()` 导出函数，清理 `generatingTitleChatIds` Set
- [x] 5.2 `src/__test__/store/middleware/chatMiddleware.test.ts`：添加 `resetChatMiddleware` 的测试用例（验证清理后 Set 为空）

## 6. cleanup.ts 统一集成

- [x] 6.1 `src/__test__/setup/cleanup.ts`：在 `afterEach` 中添加所有 `resetForTest()` 调用，按依赖反序排列（消费者 → 服务层 → 基础设施），置于 `vi.clearAllMocks()` 和 `vi.restoreAllMocks()` 之前
- [x] 6.2 使用动态 import 或条件导入避免在 cleanup 中触发模块初始化

## 7. 验证

- [x] 7.1 运行 `pnpm test:run` 确认全部单元测试通过（1788+）
- [x] 7.2 运行 `pnpm test:integration:run` 确认全部集成测试通过（95+）
- [x] 7.3 确认所有有状态模块都有对应的 `resetForTest()` 函数
- [x] 7.4 确认 `cleanup.ts` 的 `afterEach` 中调用了全部 reset 函数
- [x] 7.5 手动验证：在集成测试中临时将 `maxConcurrency` 改为 2，运行确认不出现状态泄漏（记录结果，不提交配置变更）
