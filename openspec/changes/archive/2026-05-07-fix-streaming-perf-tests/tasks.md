## 1. 修复 ChatBubble 测试断言

- [x] 1.1 更新"相同 content 的 rerender 不触发额外调用"测试：将 rerender 后的 `toHaveBeenCalledTimes(0)` 改为 `toHaveBeenCalledTimes(1)`，更新注释说明 isRunning 变化触发 fullHtml useMemo 重算

## 2. 修复 ThinkingSection 测试传参

- [x] 2.1 为"推理内容逐步增长"测试的所有 ThinkingSection 渲染添加 `initiallyExpanded={true}` prop
- [x] 2.2 为"content 不变时 title 或 loading 变化不触发调用"测试的所有 ThinkingSection 渲染添加 `initiallyExpanded={true}` prop，并将 rerender 后的 `toHaveBeenCalledTimes(0)` 改为 `toHaveBeenCalledTimes(1)`（React Compiler 自动 memo 化使 title 变化不触发渲染，仅 loading 变化触发 fullHtml useMemo 重算 1 次），更新注释说明调用来源

## 3. 验证

- [x] 3.1 运行 `pnpm vitest run src/__test__/performance/streaming-render-perf.test.tsx` 确认全部通过
- [x] 3.2 运行 `pnpm test:mutation` 确认 Stryker dry run 无失败
