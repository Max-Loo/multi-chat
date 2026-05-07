## Why

`streaming-render-perf.test.tsx` 中有 3 个测试持续失败，导致 `pnpm test:mutation`（Stryker）无法执行。根因是组件重构引入了 `StreamingContent` 子组件和 ThinkingSection 折叠行为，但测试未跟进更新。

## What Changes

- 修复 ChatBubble 测试"相同 content 的 rerender 不触发额外调用"：承认 `isRunning` 从 true→false 时 `StreamingContent` 的 `fullHtml` useMemo 会因依赖变化而调用 `generateCleanHtml`，这是流式结束后的正确完整渲染行为
- 修复 ThinkingSection 两个测试：传入 `initiallyExpanded={true}` 确保内容区域展开，StreamingContent 才会被挂载并调用 `generateCleanHtml`

## Capabilities

### New Capabilities

无

### Modified Capabilities

- `streaming-render-perf-tests`: 更新 ChatBubble 场景"相同 content 的 rerender"的期望行为，补充 ThinkingSection 场景的前置条件（展开状态）

## Impact

- `src/__test__/performance/streaming-render-perf.test.tsx` — 3 个测试用例修改
- `openspec/specs/streaming-render-perf-tests/spec.md` — 2 个 scenario 的期望描述更新
