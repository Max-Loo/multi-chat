## Context

生产代码中有 12 个模块持有模块级可变状态，其中 4 个完全无重置能力，4 个仅有部分重置。这导致测试之间的状态泄漏，迫使集成测试采用进程级隔离（`isolate: true` + `maxForks: 1` + `maxConcurrency: 1`）。

当前状态：

| 模块 | 状态类型 | 重置能力 |
|------|---------|---------|
| `chatStorage.ts` | 导入时创建的 Store 单例 | **无** |
| `providerLoader.ts` | 单例 + 4 Map + window 监听 | **无** |
| `i18n.ts` | 3 Map/Set + promise let | **部分**（仅 promise） |
| `chatMiddleware.ts` | Set 锁 | **无** |
| `toastQueue.ts` | 单例实例 | 有 reset() |
| `highlightLanguageManager.ts` | 静态单例 + 3 Map/Set | 有 _resetInstance() |
| `keyring.ts` | 单例（DB + key + seed） | 有 resetState() |
| `modelStorage.ts` | let 单例 | 有 resetModelsStore() |
| `codeBlockUpdater.ts` | Map | 有 cleanupPendingUpdates() |

## Goals / Non-Goals

**Goals:**

- 为每个缺乏完整重置能力的模块添加 `resetForTest()` 函数
- 在 `setup/cleanup.ts` 的 `afterEach` 中统一调用所有 reset 函数
- 将 `chatStorage.ts` 从导入时初始化改为延迟初始化
- 为 `providerLoader.ts` 添加内部状态清理 + 事件监听器移除能力
- 验证 reset 后集成测试可以放宽隔离限制

**Non-Goals:**

- 不重构所有模块为依赖注入模式（工作量过大，收益不确定）
- 不修改 Redux store 的创建方式（测试中已通过 `createTestStore` 绕开）
- 不在本次变更中修改集成测试配置（先验证 reset 的正确性，再放宽限制）
- 不为 immutable 状态（如 `env.ts` 的 `_isTestEnv` 常量）添加 reset

## Decisions

### D1: chatStorage 改为延迟初始化 + resetChatsStore

**选择**：将 `const chatsStore = createLazyStore('chats.json')` 改为 `let chatsStore` + `getChatsStore()` 延迟初始化模式，并添加 `resetChatsStore()` 函数。

**理由**：导入时初始化在测试中无法控制"是否创建连接"，只能通过 mock 阻止。延迟初始化让集成测试可以选择使用真实实现。`modelStorage.ts` 已经采用了延迟初始化模式（`let modelsStore` + `getModelsStore()` + `resetModelsStore()`），chatStorage 应对齐。

**替代方案**：保留导入时初始化，仅添加 reset。被否决——reset 只能关闭连接但不能阻止首次创建，在测试首次导入时仍然会触发 IndexedDB 连接。

### D2: providerLoader 添加 resetForTest + AbortController

**选择**：为 `ProviderSDKLoaderClass` 添加 `resetForTest()` 方法，调用 `ResourceLoader.clearAll()` 清理 4 个内部 Map + LRU 数组。构造函数中 `window.addEventListener('online', ...)` 改为使用 `AbortController` 模式，`resetForTest()` 时调用 `controller.abort()` 移除监听器。

**理由**：`ProviderSDKLoaderClass` 在构造函数中注册了无法移除的 window 事件监听器。随着测试文件增多，这些监听器会在同一 worker 进程中累积。`AbortController` 是 DOM 标准中推荐的批量移除监听器的方式。

**替代方案**：在构造函数中保存 handler 引用，reset 时 `removeEventListener`。被否决——如果未来添加更多监听器，每个都需要单独移除，AbortController 是批量操作更安全。

### D3: i18n reset 函数扩展为清理全部 4 个状态

**选择**：将 `resetInitI18nForTest()` 扩展为同时清理 `loadedLanguages`、`loadingPromises`、`languageResourcesCache` 和 `initI18nPromise`。函数重命名为 `resetI18nForTest()` 以反映扩展后的职责。

**理由**：当前只重置 `initI18nPromise` 导致三个缓存 Map/Set 跨测试保留。例如 Test A 加载了中文资源，Test B 看到的 `loadedLanguages` 中仍然包含 'zh'，可能跳过加载逻辑。

**替代方案**：新增独立函数清理三个 Map/Set。被否决——调用者需要记住调用两个函数，容易遗漏。

### D4: chatMiddleware 添加 resetChatMiddleware

**选择**：添加导出函数 `resetChatMiddleware()`，调用 `generatingTitleChatIds.clear()`。

**理由**：如果测试 dispatch 了 `sendMessage/fulfilled` 但对应的 `generateChatName` 未完成，chat ID 会留在 Set 中，阻塞后续测试的标题生成。

### D5: ResourceLoader 添加 clearAll 方法

**选择**：在 `ResourceLoader` 类中添加 `clearAll()` 方法，一次性清理 `registry`、`cache`、`states`、`loadingPromises` 四个 Map 和 `lruList` 数组。

**理由**：`providerLoader` 需要重置 `ResourceLoader` 的全部内部状态。现有的 `reset(key)` 只能清理单个 key，没有批量操作能力。

### D6: cleanup.ts 统一调用 resetForTest，按依赖反序

**选择**：在 `cleanup.ts` 的 `afterEach` 中按依赖反序调用所有 `resetForTest()` 函数。消费者先 reset，依赖后 reset。

```typescript
afterEach(() => {
  cleanup();
  // 消费者层 reset
  resetChatMiddleware?.();
  resetChatsStore?.();
  resetModelsStore?.();
  // 服务层 reset
  resetI18nForTest?.();
  providerLoaderReset?.();
  // 基础设施层 reset
  keyring.resetState?.();
  toastQueue.reset?.();
  // mock 清理（最后执行）
  vi.clearAllMocks();
  vi.restoreAllMocks();
});
```

**理由**：统一调用避免个别测试遗漏。依赖反序确保消费者引用的依赖在消费者之后才被清理，避免 reset 过程中触发已清理依赖的重建。

**替代方案**：每个测试文件自行调用需要的 reset。被否决——容易遗漏，且增加测试文件的样板代码。

## Risks / Trade-offs

- **[风险] chatStorage 延迟初始化改变了模块的导入时行为** → **缓解**：生产环境中 `getChatsStore()` 的首次调用时机与原来的导入时创建几乎一致（在 app 启动流程中很快就会被调用）。测试中可以通过 mock 控制是否创建。
- **[风险] resetI18nForTest() 清理语言缓存后，后续测试可能需要重新加载语言资源** → **缓解**：这正是期望的行为——每个测试应该从干净状态开始。重新加载的开销在单元测试中可忽略（全局 mock 覆盖了 i18n），在集成测试中也是必要的。
- **[风险] cleanup.ts 中 import 所有 reset 函数会增加模块依赖图** → **缓解**：这些 import 都是 `type` 级别的副作用，不会触发模块初始化。可以使用动态 import 或条件导入进一步隔离。
- **[风险] AbortController 在 happy-dom 中的兼容性** → **缓解**：happy-dom 支持 `AbortController`（已验证 `ResizeObserver` 等 Web API 的 polyfill模式）。如不兼容，可降级为 `removeEventListener`。
