## Why

`modelProviderSlice.ts`（292 行）和 `highlightLanguageManager.ts`（276 行）分别是 Redux 状态管理和工具层的核心模块，合计 568 行代码。两者包含大量异步逻辑、并发控制和状态机转换。当前有完善单元测试但**未纳入 Stryker 变异测试**。

风险分析：
- `modelProviderSlice.ts` 的 3 个 AsyncThunk（initialize/silentRefresh/refresh）有缓存快速路径、远程请求、错误降级等多条分支，状态转换变异 = UI 状态不一致
- `highlightLanguageManager.ts` 的单例模式 + 并发锁 + 失败记录，别名解析和加载状态机变异 = 代码高亮失败

## What Changes

- 将 `src/store/slices/modelProviderSlice.ts` 和 `src/utils/highlightLanguageManager.ts` 添加到 `stryker.config.json` 的 `mutate` 数组
- 运行变异测试基线，统计存活变异体
- 针对存活变异体补充精确断言，目标杀死率 ≥ 90%

### 预期变异热点

**modelProviderSlice.ts（292 行）**：
- `initializeModelProvider` 的缓存快速路径：`!Array.isArray(cachedData) || cachedData.length === 0` 条件
- 缓存有效时 `lastUpdate: null` vs 远程请求成功时 `lastUpdate: new Date().toISOString()` 差异
- `silentRefreshModelProvider` 的静默失败：`rejectWithValue({})` 空 payload
- `refreshModelProvider` 的 `RemoteDataError` 类型检查：`error instanceof RemoteDataError`
- `triggerSilentRefreshIfNeeded` 的 `backgroundRefreshing` 守卫条件
- `extraReducers` 中 3 个 Thunk 的 pending/fulfilled/rejected 状态转换（共 9 个 case）
- `silentRefreshModelProvider.fulfilled` 的条件清除错误：`if (state.error !== null)`
- 缓存数据和 providers 的 payload 结构解构

**highlightLanguageManager.ts（276 行）**：
- `resolveAlias` 的大小写归一化 `lang.toLowerCase()` 和 Map 查找回退
- `isLoaded` 的别名解析后 Set 查找
- `loadLanguageAsync` 的三路检查：已加载 → 失败过 → 正在加载 → 首次加载
- 加载失败的 `failedLanguages.add(resolvedLang)` 防重试机制
- `loadingPromises` 的并发控制：`this.loadingPromises.has(resolvedLang)` → 复用 Promise
- `doLoadLanguage` 的 `hljs.registerLanguage` 调用
- `isSupportedLanguage` 的硬编码支持列表 `includes` 检查
- 单例模式：`HighlightLanguageManager.instance` 的创建和重置
- `markAsLoaded` 的 `@deprecated` 标记方法

## Capabilities

### New Capabilities

- `model-provider-slice-mutation-coverage`: modelProviderSlice.ts 变异测试覆盖，目标杀死率 ≥ 90%
- `highlight-language-manager-mutation-coverage`: highlightLanguageManager.ts 变异测试覆盖，目标杀死率 ≥ 90%

### Modified Capabilities

（无）

## Constraints

- 变异测试验证时使用针对具体文件的增量命令，不运行全量变异测试
- `modelProviderSlice.ts` 的 Redux AsyncThunk 测试需要通过 `createAsyncThunk` 的 lifecycle（pending/fulfilled/rejected）来模拟
- `highlightLanguageManager.ts` 的单例模式需要在每个测试前调用 `_resetInstance()` 重置
- `highlight.js` 的 `registerLanguage` 和 `highlight` 需要通过 mock 控制

## Impact

- **测试文件**: `src/__test__/store/slices/modelProviderSlice.test.ts`（+若干用例）、`src/__test__/utils/highlightLanguageManager.test.ts`（+若干用例）
- **源代码**: 无改动
- **构建时间**: 增加可忽略
- **CI/CD**: 无影响
