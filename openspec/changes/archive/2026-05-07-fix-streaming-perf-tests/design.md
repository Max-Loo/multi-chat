## Context

`StreamingContent` 组件在流式结束后执行完整渲染，其 `fullHtml` useMemo 依赖 `[content, isRunning]`。ThinkingSection 组件默认折叠（`expanded=false`），内部 StreamingContent 仅在展开时挂载。当前测试未考虑这两点，导致 3 个测试断言失败。

## Goals / Non-Goals

**Goals:**

- 修复 3 个失败测试，使测试断言与组件实际行为一致
- 更新 spec 中对应的场景描述以反映正确行为

**Non-Goals:**

- 不修改 StreamingContent、ChatBubble 或 ThinkingSection 组件逻辑
- 不新增测试用例
- 不改动 RunningBubble 相关测试

## Decisions

### 1. ChatBubble 测试：承认 isRunning 变化触发的调用

`StreamingContent.fullHtml` 的 useMemo 依赖包含 `isRunning`。当 `isRunning` 从 `true→false` 时，useMemo 重算并调用 `generateCleanHtml`，这是流式结束后的正确完整渲染。

**方案**：在 rerender 后的断言中，将期望调用次数从 0 改为 1，并更新注释说明原因。

**替代方案**：将 `isRunning` 从 useMemo 依赖中移除 → 不合理，因为流式结束需要做完整渲染。

### 2. ThinkingSection 测试：传入 initiallyExpanded={true} 并修正调用期望

ThinkingSection 的 `expanded` 默认为 `false`，StreamingContent 在 `{expanded && ...}` 条件渲染中。折叠状态下 `generateCleanHtml` 永远不会被调用。

**方案 A（"逐步增长"测试）**：传入 `initiallyExpanded={true}`，确保内容区域展开。`findSafeSplitPoint` 对所有测试输入返回 0，每轮仅 line 97 触发 1 次，3 轮 = 3 次，期望值无需调整。

**方案 B（"content 不变时"测试）**：除传入 `initiallyExpanded={true}` 外，还需调整 rerender 后的期望调用次数。根因分析：

- React Compiler 自动 memo 化 StreamingContent：当仅 title 变化时，StreamingContent 的 props（content、isRunning）未变，Compiler 跳过子组件渲染，不触发额外调用
- loading 从 true→false 触发 `fullHtml` useMemo 依赖 `[content, isRunning]` 变化，重算时调用 `generateCleanHtml`

因此 title 变化不产生额外调用（React Compiler 跳过渲染），loading 变化产生 1 次额外调用（fullHtml useMemo 重算），合计 rerender 后期望 1 次调用（而非原先的 0 次）。

### 3. Spec 更新：同步场景描述

更新 `streaming-render-perf-tests` spec 中两个场景的 THEN 部分，与实际行为对齐。

## Risks / Trade-offs

- [测试可能再次过时] → 变更范围小，仅修断言和传参，风险可控
