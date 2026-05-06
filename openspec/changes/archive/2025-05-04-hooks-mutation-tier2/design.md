## Context

继 hooks-mutation-tier1 覆盖 6 个 P0 级 Hook 后，本次变更覆盖 P1 级 3 个 Hook。这些 Hook 复杂度中等，但各有变异敏感点：

| Hook | 行数 | 核心挑战 |
|------|------|----------|
| `useCreateChat.ts` | 31 | 多步 dispatch 顺序保证 + useCallback 引用稳定性 |
| `useDebounce.ts` | 25 | 定时器清理 + value/delay 变化时的竞态 |
| `useScrollContainer.ts` | 22 | ref 绑定 + scroll 事件 passive 监听器的添加/移除 |

## Goals / Non-Goals

**Goals:**

- 将 3 个 P1 Hook 纳入 Stryker 变异测试范围
- 根据变异存活报告补充测试用例，使每个 Hook 的变异得分达到 80% 以上
- 保持现有测试的稳定性不变

**Non-Goals:**

- 不修改任何 Hook 源代码
- 不覆盖 P2 级 Hook（`useNavigateToPage`、`useResponsive` 等极低复杂度 Hook）
- 不调整 Stryker 全局配置（阈值、并发数等）

## Decisions

### 1. 复用 tier1 的逐个推进策略

**选择**: 与 tier1 相同，每次将 1 个 Hook 加入 `mutate` 列表，运行、补充、确认后再添加下一个。

**理由**: 已在 tier1 中验证此策略有效，保持一致性。

### 2. useDebounce 的定时器测试策略

**选择**: 使用 `vi.useFakeTimers()` + `vi.advanceTimersByTime()` 精确控制时间推进，验证 delay 参数变化时旧定时器被清除。

**理由**: `useDebounce` 的核心逻辑是 `setTimeout`/`clearTimeout`，必须精确控制时间才能验证边界行为。

### 3. useCreateChat 的 dispatch 顺序验证

**选择**: 通过真实 store + mock 外部依赖的方式，验证 `createChat` → `setSelectedChatId` → `navigateToChat` 的执行顺序。

**理由**: 顺序是这个 Hook 的核心不变量，变异测试需要确保交换任何两步都能被检测到。

## Risks / Trade-offs

- **[低复杂度可能难达 80%]** → 3 个 Hook 行数较少（22-31 行），少量变异就可能大幅影响得分比例。如果实在无法达到 80%，可考虑适当放宽目标
- **[与 tier1 的 mutate 列表合并运行]** → 如果 tier1 已完成，6+3=9 个 Hook 同时运行变异测试时间会增加，但仍在可接受范围内
