## Context

项目已有 162 个测试文件、1822 个用例，但性能测试仅有 `chat-button-render-count.test.tsx`（1 个文件）。该项目使用 `vitest` + `happy-dom` + `@testing-library/react` 测试栈，已有的性能测试采用「渲染计数追踪」模式（`createRenderTracker`），通过 spy 记录组件渲染次数来验证优化效果。

流式 Markdown 渲染和代码高亮是两个最高优先级的性能敏感路径：
- **流式渲染**：ChatBubble 内 `useMemo(() => generateCleanHtml(content), [content])` 在 SSE 流式消息时，content 每个 chunk 变化都会触发 markdown-it + DOMPurify 重计算
- **代码高亮**：HighlightLanguageManager 使用单例 + `loadingPromises` Map 实现并发 Promise 共享，需验证该机制的正确性

现有相关测试文件：
- `ChatBubble.memo.test.tsx` — 已验证 memo 的 props 比较行为，但未覆盖流式场景下的 generateCleanHtml 调用次数
- `highlightLanguageManager.test.ts` — 已有 26 个用例，但并发场景仅验证 `registerLanguage` 调用次数，未覆盖 `doLoadLanguage` 直接计数
- `codeBlockUpdater.test.ts` — 已有重试机制测试，但未验证并发更新同一语言的计数行为

## Goals / Non-Goals

**Goals:**
- 用「渲染计数 + 行为断言」策略补充 P0 流式渲染和 P1 代码高亮的性能测试
- 验证 `generateCleanHtml` 在 ChatBubble / ThinkingSection 中的调用次数符合预期（仅在 content 变化时调用）
- 验证 RunningBubble 在 Redux state 持续更新时的渲染隔离性
- 验证 HighlightLanguageManager 并发 Promise 共享机制（`loadingPromises` 状态 + `loadLanguageModule` 调用计数）
- 验证 codeBlockUpdater 重试计数在并发场景下的精确性

**Non-Goals:**
- 不引入基于时间的基准断言（`performance.now()` 断言），避免 CI 环境不稳定
- 不测试 UI 组件库（shadcn）的性能
- 不测试虚拟化列表的滚动性能（需要真实 DOM 测量）
- 不修改任何生产代码

## Decisions

### 1. 使用 mock generateCleanHtml + spy 追踪调用次数

**选择**：mock `@/utils/markdown` 模块，用 `vi.fn()` spy 追踪 `generateCleanHtml` 的调用次数和参数。

**替代方案**：使用真实的 markdown-it + DOMPurify，通过渲染追踪器间接验证。

**理由**：直接 spy `generateCleanHtml` 可以精确断言调用次数，不受 DOM 渲染副作用干扰。这延续了 `ChatBubble.memo.test.tsx` 中已验证可行的模式。

### 2. RunningBubble 测试通过 Redux dispatch 模拟流式更新

**选择**：通过 `store.dispatch` 逐步更新 `runningChat` 状态，配合渲染追踪 wrapper 验证仅相关面板重渲染。

**理由**：RunningBubble 通过 `useAppSelector` 精确选择当前面板的 runningChat 数据，dispatch 是最直接的驱动方式。这与现有 `RunningChatBubble.test.tsx` 的测试模式一致。

### 3. HighlightLanguageManager 测试使用 `testInternals` 状态检查 + `loadLanguageModule` mock 调用计数

**选择**：使用 `testInternals` 的 `loadingPromises`、`loadedLanguages`、`failedLanguages` 进行状态断言，配合 mock `@/utils/highlightLanguageIndex` 的 `loadLanguageModule` 追踪底层加载调用次数。不使用 `testInternals.doLoadLanguage` 进行 spy。

**理由**：`testInternals` 的状态属性（`loadingPromises` 等）是对内部集合的直接引用，可正确读取运行时状态。`testInternals.doLoadLanguage` 是 `this.doLoadLanguage.bind(this)` 的绑定副本，`loadLanguageAsync` 内部通过原型链调用 `this.doLoadLanguage()` 不会经过绑定副本，因此 `vi.spyOn(testInternals, 'doLoadLanguage')` 无法拦截内部调用。`loadLanguageModule` 是 `doLoadLanguage` 唯一调用的外部依赖，其调用次数与 `doLoadLanguage` 调用次数一一对应，mock 它既能验证去重行为又不依赖原型链 spy。替代方案 `vi.spyOn(HighlightLanguageManager.prototype as any, 'doLoadLanguage')` 虽然可行但需要 `as any`，违背 `testInternals` 的类型安全初衷。

### 4. 测试文件放置在 `src/__test__/performance/` 目录

**选择**：新建 `streaming-render-perf.test.tsx` 和 `highlight-perf-behavior.test.ts` 放在现有 `performance/` 目录下。

**理由**：与已有的 `chat-button-render-count.test.tsx` 保持一致的组织结构。

## Risks / Trade-offs

- [mock 导致测试与实现耦合] → mock `generateCleanHtml` 意味着如果实现改用其他函数名，测试需要同步更新。但性能测试的目标是验证「调用次数」这一行为契约，而非函数名，因此耦合度可控。
- [RunningBubble 测试依赖 Redux slice 结构] → slice 结构变更可能导致测试失效。通过 `createTypeSafeTestStore` + `createChatSliceState` 工厂函数降低耦合。
- [单例模式需要 beforeEach 重置] → `HighlightLanguageManager._resetInstance()` 已有，但需确保每个测试正确调用。
