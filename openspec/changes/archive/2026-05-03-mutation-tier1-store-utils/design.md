## Context

项目已使用 Stryker Mutator 覆盖 8 个核心模块的变异测试。Redux 状态管理层（modelProviderSlice.ts，292 行）和工具层（highlightLanguageManager.ts，276 行）合计 568 行代码，包含大量异步逻辑、并发控制和状态机转换，但未纳入变异测试。

现有测试模式：
- modelProviderSlice.test.ts：通过 `vi.mock` 模拟服务层依赖（fetchRemoteData、loadCachedProviderData、saveCachedProviderData），使用 `configureStore` 创建真实 Redux store 进行集成测试，覆盖了 3 个 AsyncThunk 的 pending/fulfilled/rejected 状态转换
- highlightLanguageManager.test.ts：通过 mock highlight.js 和 loadLanguageModule 控制外部依赖，每个测试前调用 `_resetInstance()` 重置单例，通过公共 API（isLoaded、hasFailedToLoad）验证状态

## Goals / Non-Goals

**Goals:**
- 将 2 个文件加入 Stryker 变异测试配置
- 运行基线测试，识别存活变异体
- 补充精确断言，目标杀死率 ≥ 90%
- 不修改任何源代码

**Non-Goals:**
- 不重构源代码或测试架构
- 不追求 100% 杀死率（等价变异体可接受）
- 不调整 Stryker 全局配置
- 不涉及 components/ 或 pages/ 目录

## Decisions

### 1. modelProviderSlice.ts：Redux store 集成测试策略

**决策**：保持现有 `configureStore` 模式，通过 dispatch Thunk 的 lifecycle actions（pending/fulfilled/rejected）触发 reducer 逻辑

**理由**：
- `createAsyncThunk` 的 extraReducers 是变异热点，需要通过真实 store dispatch 来覆盖
- 现有测试已覆盖主要路径，需补充的是条件边界：`!Array.isArray(cachedData)` vs `cachedData.length === 0` 的分路、`RemoteDataError` 类型检查、`silentRefresh` 的条件清除错误

**关键变异热点与应对**：
- `initializeModelProvider` 的 `!Array.isArray(cachedData) || cachedData.length === 0` → 分别测试非数组输入（抛异常）和空数组（降级到远程）
- `silentRefreshModelProvider.fulfilled` 的 `if (state.error !== null)` → 分别测试有错误和无错误时 fulfilled 的行为差异
- `refreshModelProvider` 的 `error instanceof RemoteDataError` → 测试非 RemoteDataError 类型走默认消息路径
- `triggerSilentRefreshIfNeeded` 的 `backgroundRefreshing` 守卫 → 通过 mock store 的 getState 控制初始状态

### 2. highlightLanguageManager.ts：单例模式 + 外部 mock 策略

**决策**：保持现有 mock 策略，通过 `_resetInstance()` 实现测试隔离，通过 `testInternals` 访问私有状态

**理由**：
- 单例模式要求每个测试前重置，现有模式已成熟
- `testInternals` 暴露了 `loadedLanguages`、`loadingPromises`、`failedLanguages` 等内部状态，可直接验证
- 外部依赖（hljs、loadLanguageModule）已通过 mock 隔离

**关键变异热点与应对**：
- `resolveAlias` 的 `lang.toLowerCase()` → 测试大写输入 'JS' 解析为 'javascript'
- `loadLanguageAsync` 的三路检查 → 分别测试已加载、失败过、正在加载、首次加载四个分支
- `failedLanguages.add(resolvedLang)` 防重试 → 验证失败后再次调用不触发 loadLanguageModule
- `isSupportedLanguage` 的硬编码列表 → 测试支持和不支持的语言
- `highlightSync` 的 `loadedLanguages.has(resolvedLang)` 守卫 → 测试未加载时抛出错误
- 单例构造函数守卫 → 验证 `new HighlightLanguageManager()` 抛出错误

### 3. 分批运行变异测试

**决策**：每个文件独立运行 Stryker

**理由**：
- 2 个文件合计 568 行，但 modelProviderSlice 涉及 Redux store 集成测试，运行时间可能较长
- 独立运行便于精确定位存活变异体

## Risks / Trade-offs

- **[等价变异体]** modelProviderSlice 的 `void cacheError` 和 `void error` 语句属于等价变异体，无法通过测试杀死 → 接受存活
- **[Redux 内部实现]** extraReducers 的 Immer 代理逻辑可能产生等价变异体 → 接受存活，不深入 Immer 内部
- **[testInternals 暴露]** highlightLanguageManager 的 `testInternals` 是为测试设计的公共接口，变异测试可能产生关于其返回值结构的变异体 → 通过验证返回值属性存在来杀死
- **[运行时间]** 预计每个文件 2-5 分钟，总计 4-10 分钟 → 可接受
