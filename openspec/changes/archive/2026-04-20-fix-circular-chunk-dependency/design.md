## Context

`vite.config.ts` 的 `manualChunks` 将初始化模块分为两个 chunk：
- `chunk-initsteps`：仅包含 `config/initSteps`
- `chunk-init`：包含 `FatalErrorScreen`、`InitializationController` 等 UI 组件

两者之间存在双向依赖：
1. `FatalErrorScreen` → `STEP_NAMES`（来自 initSteps）
2. `FatalErrorScreen` → `useResetDataDialog` → `resetAllData` → `SEED_STORAGE_KEY`（通过 store 链进入 initsteps）
3. `initSteps` → `chatSlices` → `ChatRoleEnum` 等 → rollup 将其放入 chunk-init

此外，`lib/initialization` 匹配规则已失效（当前代码库中 `InitializationManager` 位于 `src/services/initialization/`）。

## Goals / Non-Goals

**Goals:**
- 消除 `chunk-init` 与 `chunk-initsteps` 之间的循环依赖
- 修复运行时 TDZ 错误和构建时循环 chunk 报错

**Non-Goals:**
- 重新设计整体 chunk 分割策略
- 优化 chunk 体积

## Decisions

**决策：合并两个 chunk 为 `chunk-init`**

将 `config/initSteps` 纳入 `chunk-init` 的匹配规则，移除 `chunk-initsteps`。

理由：
- `initSteps` 体积很小（~10KB gzip），合并后对 chunk-init 影响有限
- `FatalErrorScreen` 和 `initSteps` 的依赖关系本质上是耦合的，强行拆分没有收益
- 方案简单，只改一处配置

备选方案（未采用）：
- 将 `FatalErrorScreen` 移入 `chunk-initsteps`：需要同时移动其依赖链，维护成本更高
- 提取共享模块到独立 chunk：引入第三个 chunk 增加复杂度，收益不明显

**决策：移除失效的 `lib/initialization` 规则**

当前代码库中不存在 `lib/initialization` 路径，该规则永远不会匹配。

## Risks / Trade-offs

- [Risk] `chunk-init` 体积略微增加（~10KB gzip） → 可接受，仍在合理范围内
- [Risk] 未来如果 initSteps 体积增长可能需要重新拆分 → 届时再评估，当前不需要过度设计
