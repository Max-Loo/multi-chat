## Context

项目已使用 Stryker Mutator 进行变异测试，当前覆盖 8 个核心模块。服务层 3 个关键模块（i18n.ts、InitializationManager.ts、toastQueue.ts）虽有完善的单元测试（覆盖率接近 100%），但未经过变异测试验证——即无法确认测试是否真正覆盖了所有条件分支和边界值。

当前 `stryker.config.json` 的 `mutate` 数组包含 8 个文件，需新增 3 个。现有测试模式：
- i18n.test.ts：通过 `vi.mock` 隔离 i18next 全局实例和 `import.meta.glob`，测试覆盖 initI18n、changeAppLanguage、getLocalesResources
- InitializationManager.test.ts：通过 `createMockInitStep` fixture 构造 InitStep 数组，测试覆盖依赖验证、循环检测、拓扑排序、错误分级
- toastQueue.test.ts：通过 `vi.resetModules` + 动态导入实现单例隔离，测试覆盖队列机制、响应式位置、异步 Promise、错误处理

## Goals / Non-Goals

**Goals:**
- 将 3 个文件加入 Stryker 变异测试配置
- 运行基线测试，识别存活变异体
- 补充精确断言，目标杀死率 ≥ 90%
- 不修改任何源代码

**Non-Goals:**
- 不重构源代码或测试架构
- 不追求 100% 杀死率（等价变异体可接受）
- 不调整 Stryker 全局配置（thresholds、concurrency 等）
- 不涉及 components/ 或 pages/ 目录的测试

## Decisions

### 1. 基线先行 + 按模块分批运行变异测试

**决策**：先运行每个文件的变异测试基线，根据实际存活变异体修订后续任务，再逐模块补强

**理由**：
- 3 个模块的现有单元测试覆盖面较广（InitializationManager ~70% 场景已覆盖，toastQueue ~80% 已覆盖），部分测试可能已杀死目标变异体
- 不运行基线直接按推测补充测试，会导致大量冗余工作
- 分批运行便于精确定位存活变异体所属模块
- 与项目现有模式一致（参见已归档变更的约束）

**备选方案**：一次运行全部 3 个文件 → 否决，运行时间长且难以定位问题

### 2. i18n.ts 测试策略：mock 隔离 + 精确参数断言

**决策**：保持现有 mock 架构，通过 mock 函数调用参数验证来杀死变异体

**理由**：
- i18n.ts 深度依赖 i18next 全局实例和 Vite `import.meta.glob`，无法在真实环境下运行
- 现有 mock 架构已完善，补充断言只需新增 mock 参数验证
- `performLoad` 的指数退避重试需要通过 `vi.useFakeTimers` 控制时间

**关键变异热点与应对**：
- `loadLanguage` 的缓存/竞态检查 → 验证 `loadedLanguages.has()` 和 `loadingPromises.has()` 的调用时序
- `performLoad` 的 `Math.pow(2, attempt) * 1000` → mock `setTimeout` 验证延迟值
- `tSafely` 的多重降级 → 直接构造各降级场景（key 等于翻译值、翻译为空、包含错误标记）

### 3. InitializationManager.ts 测试策略：构造边界依赖图

**决策**：通过 `createMockInitStep` fixture 构造各种依赖图拓扑，验证执行顺序和错误传播

**理由**：
- InitializationManager 的核心是图算法（DFS 检测循环、BFS 拓扑排序），需要精确验证算法边界
- 现有测试已覆盖基本场景，需补充边界条件（如空步骤列表、单步骤、全并行、全串行）
- `ExecutionContext` 的 `setResult`/`getResult` 需要验证步骤间的数据传递

**关键变异热点与应对**：
- `step.critical && initError.severity === 'fatal'` → 构造 critical=false + severity='fatal' 和 critical=true + severity='warning' 的组合，验证不中断（注意：critical=true+fatal 已有测试覆盖）
- `ExecutionContext` 的 setResult/getResult → 验证步骤间数据传递和可选字段提取
- 注意：validateDependencies、detectCircularDependencies、topologicalSort、handleError switch/case、onProgress 已有完善测试覆盖，仅需确认变异测试杀死率

### 4. toastQueue.ts 测试策略：fake timer + 单例重置

**决策**：继续使用 `vi.resetModules` + 动态导入的模式，配合 `vi.useFakeTimers` 控制 flush 间隔

**理由**：
- toastQueue 是单例，必须通过模块重置实现测试隔离
- `flush` 的 500ms 间隔必须通过 fake timer 精确验证
- `enqueueOrShow` 的 Promise resolve 时机是核心变异热点

**关键变异热点与应对**：
- `setTimeout(resolve, 500)` 精确间隔 → 在 499ms 时断言第二条消息未显示，500ms 时已显示
- `reset` 状态清除 → 验证清空队列、toastReady=false、isMobile=undefined
- flush 期间新消息 → 验证 toastReady 已为 true 时新消息立即显示
- 注意：enqueueOrShow 条件分发、ensureResponsivePosition 三路分支、getIsMobile 空值合并、dismiss/promise 绕过队列 已有完善测试覆盖

## Risks / Trade-offs

- **[基线后任务修订]** 基线运行后可能发现存活变异体与预期不符，需要修订 §3-§5 的具体任务 → 接受，基线是阻塞任务，修订后再实施
- **[等价变异体]** i18n.ts 的 `performLoad` 末尾 `throw new Error(...)` 理论上不可达（for 循环保证至少一次迭代），属于等价变异体 → 接受存活
- **[Mock 过度耦合]** i18n.ts 的 mock 架构复杂，补充断言可能增加 mock 维护成本 → 仅在存活变异体明确需要时补充
- **[运行时间]** 每个文件运行 Stryker 需 2-5 分钟，3 个文件总计 6-15 分钟 → 分批运行，不阻塞开发
- **[单例测试隔离]** toastQueue 的 `vi.resetModules` 模式可能导致测试执行变慢 → 每个测试独立，互不影响
