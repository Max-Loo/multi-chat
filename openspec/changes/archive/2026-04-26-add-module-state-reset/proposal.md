## Why

生产代码中至少有 12 个模块持有模块级可变状态（单例实例、Map/Set 缓存、let 变量），其中 4 个完全没有重置能力，4 个仅有部分重置。这导致测试之间的状态泄漏，迫使集成测试采用 `isolate: true` + `maxForks: 1` + `maxConcurrency: 1` 的"核弹级隔离"——每个测试文件在独立进程中串行执行。

核心问题不是"缺少 `vi.resetModules()`"（那是创可贴），而是**生产代码的模块设计让测试无法安全地重用模块实例**。正确的方向是让每个有状态的模块提供显式的 `resetForTest()` 函数，使测试基础设施可以在 afterEach 中精确清理状态，而非依赖进程级隔离。

无重置/部分重置的模块清单：

| 模块 | 状态 | 重置能力 |
|------|------|---------|
| `chatStorage.ts` | `const chatsStore = createLazyStore(...)` 模块导入时立即创建 | 无 |
| `providerLoader.ts` | `ProviderSDKLoaderClass` 单例 + 4 个内部 Map + window 事件监听 | 无 |
| `i18n.ts` | `loadedLanguages` Set + `loadingPromises` Map + `languageResourcesCache` Map + `initI18nPromise` let | 仅重置 promise |
| `chatMiddleware.ts` | `generatingTitleChatIds` Set 锁 | 无 |
| `toastQueue.ts` | `ToastQueue` 单例 | 有 `reset()` 方法 |
| `highlightLanguageManager.ts` | 静态单例 + 3 个内部 Map/Set | 有 `_resetInstance()` |

## What Changes

### 生产代码改动

- 为每个有模块级状态且缺乏完整重置能力的模块添加 `resetForTest()` 导出函数
- `chatStorage.ts`：将 `const chatsStore` 改为延迟初始化模式，添加 `resetChatsStore()`
- `providerLoader.ts`：为 `ProviderSDKLoaderClass` 添加 `resetForTest()` 方法，清理内部 ResourceLoader 的 4 个 Map + 移除 window 事件监听器
- `i18n.ts`：扩展 `resetInitI18nForTest()` 同时清理 `loadedLanguages`、`loadingPromises`、`languageResourcesCache`（或新增 `resetI18nForTest()` 覆盖全部状态）
- `chatMiddleware.ts`：添加 `resetChatMiddleware()` 导出函数，清理 `generatingTitleChatIds`
- `resourceLoader.ts`：添加 `clearAll()` 方法供 providerLoader 调用

### 测试基础设施改动

- `setup/cleanup.ts` 的 `afterEach` 中调用所有 `resetForTest()` 函数
- 集成测试配置逐步放宽隔离限制（先验证 `resetForTest()` 的正确性，再考虑放宽 `maxConcurrency`）

## Capabilities

### New Capabilities

- `module-state-reset`: 新增约束——每个持有模块级可变状态的模块必须提供 `resetForTest()` 函数，该函数需清理全部内部可变状态（Map/Set/let 变量/外部资源连接），并在函数名中明确标注为测试用途

### Modified Capabilities

- `test-isolation`: 集成测试的隔离策略从"进程级隔离"演进为"状态级隔离"——依赖 `resetForTest()` 精确清理状态，而非每个测试文件启动独立进程
- `test-cleanup`: 扩展 cleanup 层职责，从仅清理 React DOM + mock 调用记录，扩展为同时清理生产代码的模块级状态

## Impact

- **`src/store/storage/chatStorage.ts`**：重构为延迟初始化 + 添加 `resetChatsStore()`
- **`src/services/chat/providerLoader.ts`**：添加 `resetForTest()` 方法
- **`src/utils/resourceLoader.ts`**：添加 `clearAll()` 方法
- **`src/services/i18n.ts`**：扩展 `resetInitI18nForTest()` 或新增完整重置函数
- **`src/store/middleware/chatMiddleware.ts`**：添加 `resetChatMiddleware()`
- **`src/__test__/setup/cleanup.ts`**：`afterEach` 中添加模块状态重置调用
- **`vitest.integration.config.ts`**：待验证后可考虑放宽 `maxConcurrency` 限制
- **现有测试**：行为不变，所有 1788 个单元测试 + 95 个集成测试仍通过
