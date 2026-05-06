## Why

项目已有 162 个测试文件、1822 个用例，但性能测试仅有 1 个文件（`chat-button-render-count.test.tsx`），仅覆盖 ChatButton 选择器优化场景。流式 Markdown 渲染（ChatBubble 每次内容变化触发 `generateCleanHtml`）和代码高亮并发加载（HighlightLanguageManager 的 Promise 共享与防重试）是两个最关键的性能敏感路径，目前缺少以「渲染计数 + 行为断言」策略验证的性能测试。

## What Changes

- 新增流式渲染性能测试文件：验证 ChatBubble、ThinkingSection 在内容逐次更新时的 `generateCleanHtml` 调用次数与 memo 重渲染行为
- 新增 RunningBubble 渲染隔离测试：验证 Redux state 持续更新时仅相关面板重渲染
- 新增代码高亮并发行为测试：验证 HighlightLanguageManager 并发 Promise 共享、已加载语言快速路径、失败语言防重试
- 新增 codeBlockUpdater 重试计数行为测试：验证元素不存在时精确重试 N 次后停止、并发更新同一语言不重复计数

## Capabilities

### New Capabilities
- `streaming-render-perf-tests`: 流式 Markdown 渲染场景下的渲染计数与 generateCleanHtml 调用次数断言测试
- `highlight-perf-behavior-tests`: 代码高亮管理器的并发控制、快速路径、防重试等行为断言测试

### Modified Capabilities
（无现有 spec 需要修改）

## Impact

- 新增测试文件位于 `src/__test__/performance/` 目录
- 依赖现有测试基础设施：`helpers/render/redux.tsx`、`helpers/mocks/testState.ts`、`helpers/mocks/panelLayout.tsx`
- 不影响任何生产代码
