## Context

当前项目使用 Stryker + Vitest 进行变异测试，已覆盖 18 个核心模块。Hooks 模块有 16 个 Hook，全部有单元测试但均未纳入变异测试。本次变更聚焦其中 6 个 P0 级 Hook，它们逻辑密度高、边界条件多：

| Hook | 行数 | 核心挑战 |
|------|------|----------|
| `useConfirm.tsx` | 121 | Context + 6 状态 + 回调机制 |
| `useBasicModelTable.tsx` | 91 | 4 字段模糊过滤 + TanStack Table 列定义 |
| `useResetDataDialog.tsx` | 75 | 异步错误恢复 + 并发防护 |
| `useAdaptiveScrollbar.ts` | 54 | 定时器竞态 + 防抖重置 |
| `useAutoResizeTextarea.ts` | 86 | DOM 操作 + min/max 边界 |
| `useMediaQuery.ts` | 42 | matchMedia + 150ms 节流 + SSR |

## Goals / Non-Goals

**Goals:**

- 将 6 个 P0 Hook 纳入 Stryker 变异测试范围
- 根据变异存活报告补充测试用例，使每个 Hook 的变异得分达到 80% 以上
- 保持现有测试的稳定性不变

**Non-Goals:**

- 不修改任何 Hook 源代码
- 不覆盖 P1/P2 级 Hook（`useCreateChat`、`useDebounce` 等留待后续提案）
- 不覆盖分散在 `components/` 和 `pages/` 目录下的非 `src/hooks/` 的 Hook

## Decisions

### 1. 按单个 Hook 逐步推进，而非一次性全量运行

**选择**: 每次将 1 个 Hook 加入 `mutate` 列表，运行变异测试，补充测试用例，确认通过后再添加下一个。

**理由**: 6 个 Hook 同时运行变异测试耗时长、报告难以定位。逐个推进可以精确控制每个 Hook 的变异得分，且每次变更范围小、易于回滚。

**替代方案**: 一次性加入所有 6 个 Hook 再统一补充测试 — 风险在于报告量大，难以追踪哪个 Hook 得分不达标。

### 2. 测试补充策略：先运行基线，再针对性补充

**选择**: 先运行 Stryker 获取当前变异存活报告，再根据报告中的存活变异类型补充测试。

**理由**: 避免盲目增加测试用例。存活报告会精确指出哪些变异存活（如条件边界、算术运算、逻辑运算符），针对性补充效率最高。

### 3. 复用现有测试基础设施

**选择**: 使用项目已有的 `renderHookWithProviders`、`createMockChat` 等测试辅助工具，不引入新的测试工具或 mock 库。

**理由**: 保持测试风格一致性，减少维护成本。

### 4. DOM 相关 Hook 的变异测试策略

**选择**: `useAutoResizeTextarea` 依赖 `scrollHeight` 等 DOM 属性，测试中通过 `Object.defineProperty` mock。变异测试中保持相同策略，但需确保 mock 覆盖所有分支路径。

**理由**: JSDOM 不计算真实布局，mock 是唯一可行方案。关键是要让 mock 覆盖 min/max 边界切换的所有路径。

## Risks / Trade-offs

- **[定时器相关 Hook 的假时间]** → `useAdaptiveScrollbar` 和 `useMediaQuery` 使用 `setTimeout`/`throttle`，变异测试中需确保 `vi.useFakeTimers()` 正确控制时间推进，否则定时器相关变异可能超时
- **[Context 依赖]** → `useConfirm` 依赖 `ConfirmProvider` Context，变异测试中需确保 Hook 在正确的 Provider 包裹下测试，否则 Context 外使用的变异可能误报
- **[变异测试运行时间]** → 每增加一个文件都会增加 Stryker 运行时间，6 个 Hook 预计增加约 2-5 分钟（取决于测试数量）
