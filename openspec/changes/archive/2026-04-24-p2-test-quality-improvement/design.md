## Context

`drawer-state.integration.test.tsx` 产生 React `act()` 警告，根因是 Radix UI 内部组件（FocusScope、DismissableLayer）使用 `setTimeout(fn, 0)`，而 `store.dispatch()` + `rerender()` 模式导致这些回调在 `act()` 作用域外执行。

6 个 skip 用例中，3 个中优先级用例涉及 IndexedDB 降级路径和密钥读取错误处理。

## Goals / Non-Goals

**Goals:**

- 修复 `drawer-state.integration.test.tsx` 的 `act()` 警告
- 推进 3 个中优先级 skip 用例

**Non-Goals:**

- 不修改源代码逻辑
- 不处理低优先级 skip 用例（keyring 日志、ChatPanelSender 推理开关）
- 不重构集成测试架构

## Decisions

### D1: 使用 `vi.useFakeTimers()` 控制 Radix UI 内部异步回调

**根因分析**：act() 警告来自 Radix UI 内部组件的异步操作，而非断言方式问题（当前代码已全部使用 `waitFor`）：

1. `@radix-ui/react-focus-scope` 在 unmount 时使用 `setTimeout(fn, 0)` 恢复焦点 — **主要原因**
2. `@radix-ui/react-dismissable-layer` 在 mount 时使用 `setTimeout(fn, 0)` 注册 pointerdown 监听器
3. `@radix-ui/react-presence` 通过 `useLayoutEffect` 管理动画状态机

当前测试使用 `store.dispatch()` + `rerender()` 模式，绕过了 React 事件系统，导致 Radix 内部的 `setTimeout(0)` 回调在 `act()` 作用域之外执行。

**修复策略**：

1. 在 `beforeEach` 中启用 `vi.useFakeTimers()`
2. 在每次 `rerender()` 后，使用 `act(() => { vi.runAllTimers() })` 刷新 Radix 的定时器回调
3. 在 `afterEach` 中恢复 `vi.useRealTimers()`（在 `cleanup()` 之前）
4. `waitFor` 在 Vitest fake timers 下自动适配，无需额外调整

### D2: skip 用例根据 Unblock condition 评估可行性

每个 skip 用例都有明确的 Unblock condition 注释，需逐个评估当前环境是否满足条件。

## Risks / Trade-offs

- **[风险]** `vi.useFakeTimers()` 可能影响其他依赖真实定时器的测试 → 只在 drawer-state 测试文件中使用，afterEach 恢复真实定时器
- **[风险]** 部分 skip 用例的 Unblock condition 可能仍不满足 → 保持 skip 并更新注释
