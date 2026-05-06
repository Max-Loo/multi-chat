## Why

`i18n.ts`（393 行）、`InitializationManager.ts`（280 行）、`toastQueue.ts`（233 行）是项目服务层的核心模块，合计 906 行代码。三者包含大量异步逻辑、状态管理和条件分支。当前有完善单元测试但**未纳入 Stryker 变异测试**。

风险分析：
- `i18n.ts` 的语言加载/缓存/降级逻辑有 5+ 条异步路径，缓存一致性变异 = 语言切换失败
- `InitializationManager.ts` 是应用启动引擎，包含拓扑排序、循环依赖检测和并行执行，任何边界条件漏覆盖 = 启动崩溃
- `toastQueue.ts` 的异步队列 + Promise resolve 时机，flush 间隔变异 = UI 状态异常

## What Changes

- 将 `src/services/i18n.ts`、`src/services/initialization/InitializationManager.ts`、`src/services/toast/toastQueue.ts` 添加到 `stryker.config.json` 的 `mutate` 数组
- 运行变异测试基线，统计存活变异体
- 针对存活变异体补充精确断言，目标杀死率 ≥ 90%

### 预期变异热点

**i18n.ts（393 行）**：
- `loadLanguage` 的缓存检查 `loadedLanguages.has(lang)` 和竞态防护 `loadingPromises.has(lang)`
- `performLoad` 的指数退避重试逻辑：`Math.pow(2, attempt) * 1000`、`isNetworkError` 条件
- `initI18n` 的单例模式 `if (initI18nPromise) return`
- 语言加载失败降级：`actualLang` 保持 "en" 的条件路径
- `tSafely` 的多重降级条件：`translated === safeKey`、`!translated`、`includes('returned an object')`
- `languageResourcesCache` 的 Set/Map 操作一致性

**InitializationManager.ts（280 行）**：
- `validateDependencies` 的依赖存在性检查
- `detectCircularDependencies` 的 DFS 递归：`recursionStack.has(node)` 和 `visited.has(node)` 条件
- `topologicalSort` 的入度计算和 BFS 排序
- `runInitialization` 的错误分级：`step.critical && initError.severity === 'fatal'` 条件
- `handleError` 的 switch/case 分发
- 并行执行的 `Promise.all` 中单个步骤失败时的错误传播
- `modelProviderStatus`、`masterKeyRegenerated`、`decryptionFailureCount` 的可选字段提取

**toastQueue.ts（233 行）**：
- `enqueueOrShow` 的 `this.toastReady` 条件分发
- `flush` 的队列清空和 500ms 间隔 `setTimeout(resolve, 500)`
- `ensureResponsivePosition` 的移动端/桌面端条件分支
- `getIsMobile` 的 `this.isMobile ?? false` 空值合并
- `dismiss` 和 `promise` 的非队列路径（直接调用 `toast.dismiss` / `toast.promise`）

## Capabilities

### New Capabilities

- `i18n-mutation-coverage`: i18n.ts 变异测试覆盖，目标杀死率 ≥ 90%
- `initialization-manager-mutation-coverage`: InitializationManager.ts 变异测试覆盖，目标杀死率 ≥ 90%
- `toast-queue-mutation-coverage`: toastQueue.ts 变异测试覆盖，目标杀死率 ≥ 90%

### Modified Capabilities

（无）

## Constraints

- 变异测试验证时使用针对具体文件的增量命令，不运行全量变异测试
- `i18n.ts` 的 `import.meta.glob` 和 `i18n` 全局实例需要通过模块 mock 隔离
- `InitializationManager.ts` 的测试需要构造 `InitStep` 数组来模拟不同依赖图拓扑
- `toastQueue.ts` 的 `flush` 异步间隔需要使用 `vi.useFakeTimers()` 控制

## Impact

- **测试文件**: `src/__test__/services/lib/i18n.test.ts`（+若干用例）、`src/__test__/services/lib/initialization/InitializationManager.test.ts`（+若干用例）、`src/__test__/services/lib/toast/toastQueue.test.ts`（+若干用例）
- **源代码**: 无改动
- **构建时间**: 增加可忽略
- **CI/CD**: 无影响
