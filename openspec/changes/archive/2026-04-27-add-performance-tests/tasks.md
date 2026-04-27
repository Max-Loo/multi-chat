## 1. 流式渲染性能测试

- [x] 1.1 创建 `src/__test__/performance/streaming-render-perf.test.tsx`，配置 mock（`@/utils/markdown`、`react-i18next`）和渲染追踪 wrapper
- [x] 1.2 实现 ChatBubble 流式更新 generateCleanHtml 调用次数测试：content 逐次增长、相同 content rerender、多个 ChatBubble 独立计算
- [x] 1.3 实现 ThinkingSection 推理内容更新调用次数测试：content 逐步增长、title/loading 变化不触发调用
- [x] 1.4 实现 RunningBubble 渲染隔离测试：当前面板流式更新时渲染、其他面板/模型更新时不渲染

## 2. 代码高亮性能行为测试

- [x] 2.1 创建 `src/__test__/performance/highlight-perf-behavior.test.ts`，配置 mock（`highlight.js/lib/core`、`@/utils/highlightLanguageIndex` 的 `loadLanguageModule`）和 beforeEach 重置单例，通过 `testInternals` 状态属性（`loadingPromises`、`loadedLanguages`、`failedLanguages`）进行断言
- [x] 2.2 实现并发加载 doLoadLanguage 调用次数测试：同一语言 3 次并发、先并发后串行、不同语言并发独立
- [x] 2.3 实现已加载语言快速路径测试：已加载语言重复调用不触发 doLoadLanguage
- [x] 2.4 实现失败语言防重试测试：失败后重试被阻止、失败语言不影响其他语言
- [x] 2.5 实现 codeBlockUpdater 并发重试计数测试：单次精确重试、不同代码块并发更新、重试中元素出现后成功更新

## 3. 验证

- [x] 3.1 运行全量测试确认所有新增用例通过且无回归
