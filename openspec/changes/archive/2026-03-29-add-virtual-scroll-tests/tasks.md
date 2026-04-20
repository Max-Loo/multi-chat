## 1. 高级 virtua mock 实现

- [x] 1.1 创建 `src/__test__/helpers/mocks/virtua.ts`，实现 `createVirtuaMock(config)` 工厂函数，返回 `{ MockVirtualizer, MockVList, scrollTo, getRenderedRange }`
- [x] 1.2 实现 MockVirtualizer 组件：根据 viewportHeight/itemHeight/overscan 计算可见范围，只渲染范围内子元素
- [x] 1.3 实现 MockVList 组件：包装 MockVirtualizer，接受 className/style/onScroll props
- [x] 1.4 实现滚动模拟：工厂返回的 `scrollTo(index)` 方法更新闭包内可见范围状态，并通过 `onScroll` 回调通知组件（注意：`scrollTo` 不修改容器 DOM 属性，仅触发回调）
- [x] 1.5 工厂返回的 `getRenderedRange()` 返回当前 `{ startIndex, endIndex }`
- [x] 1.6 MockVirtualizer 通过 ref 转发暴露 `scrollToIndex` 空方法（`vi.fn()`），保持与 `VirtualizerHandle` 接口兼容

## 2. 滚动指标 mock

- [x] 2.1 创建 `src/__test__/helpers/mocks/scrollMetrics.ts`，实现 `mockContainerMetrics(container, metrics)` 辅助函数
- [x] 2.2 通过 `Object.defineProperty` 模拟 DOM 容器的 `scrollHeight`、`clientHeight`、`scrollTop` 属性，所有属性必须设置 `writable: true` + `configurable: true`（`writable: true` 是关键，否则 `scrollToBottom` 执行 `container.scrollTop = container.scrollHeight` 时赋值会静默失败）

## 3. ChatModel fixture 工厂确认

- [x] 3.1 确认 `src/__test__/helpers/mocks/panelLayout.tsx` 中已有的 `createMockPanelChatModel(id, overrides?)` 支持通过 `overrides` 参数覆盖 `chatHistoryList`。Detail 测试中通过传入自定义消息列表覆盖默认空数组，无需修改此文件

## 4. Detail 组件测试

- [x] 4.1 创建 `src/__test__/pages/Chat/Detail.test.tsx`，搭建测试基础设施：
  - 复用 `renderWithProviders`（`helpers/render/redux.tsx`，含 chat/chatPage/models/appConfig/modelProvider 五个 reducer）
  - vi.mock：`virtua`（通过 `createVirtuaMock()` 工厂）、`useAdaptiveScrollbar`（返回 `{ onScrollEvent: vi.fn(), scrollbarClassname: 'custom-scrollbar', isScrolling: false }`）、`useTranslation`（参考 `ChatSidebar.test.tsx`）、`ResizeObserver`
  - `vi.useFakeTimers()` 控制 rAF 和 setTimeout
  - `preloadedState` 构造：`chat.chatList` 中包含一条完整的 Chat 对象（需含 `chatModelList` 数组，内含匹配 `ChatModel.modelId` 的条目，否则 `useSelectedChat` 无法正确查找）、`chat.selectedChatId` 匹配该聊天 ID、`chat.runningChat[chatId][modelId]` 嵌套数据（用于流式/错误场景）
- [x] 4.2 测试：应该只渲染可见范围内的消息 当历史记录很多
- [x] 4.3 测试：应该渲染所有消息 当消息数量在可视范围内
- [x] 4.4 测试：应该始终渲染 Title 当消息列表变化
- [x] 4.5 测试：应该渲染 RunningBubble 在 Virtualizer 外部 当有流式数据
- [x] 4.6 测试：应该不显示 RunningBubble 当没有流式数据
- [x] 4.7 测试：应该显示错误 Alert 当存在错误消息
- [x] 4.8 测试：应该不显示错误 Alert 当没有错误消息
- [x] 4.9 测试：应该显示回到底部按钮 当内容超出视口且不在底部（步骤：1) 渲染后通过 `container.firstElementChild` 获取滚动容器 DOM（Detail 最外层为 Fragment，第一个子元素即 scrollContainerRef 挂载的 div）；2) mockContainerMetrics(container, { scrollHeight:2000, clientHeight:600, scrollTop:0 }) 设置容器属性状态；3) 通过 mock.scrollTo(0) 触发 onScroll 回调，让组件执行 handleVirtualizerScroll → checkScrollStatus 读取容器属性；4) act + advanceTimersByTime(150) 等待 rAF + setTimeout 完成；5) 断言回到底部按钮存在）
- [x] 4.10 测试：应该隐藏回到底部按钮 当在底部（步骤：类似 4.9，但 mockContainerMetrics 设置 scrollTop=1380 模拟在底部；mock.scrollTo 触发回调；断言按钮不存在）
- [x] 4.11 测试：应该隐藏回到底部按钮 当内容不需要滚动（步骤：类似 4.9，但 mockContainerMetrics 设置 scrollHeight=600/clientHeight=600/scrollTop=0 模拟不需滚动；断言按钮不存在）
- [x] 4.12 测试：应该自动滚到底部 当流式更新且用户在底部（步骤：1) 获取滚动容器 DOM；2) mockContainerMetrics 设置 scrollHeight=2000/clientHeight=600/scrollTop=1380 模拟在底部；3) mock.scrollTo 触发 handleVirtualizerScroll，组件读取容器属性后设置 shouldStickToBottom.current=true；4) advanceTimersByTime(150) 等待 checkScrollStatus 完成；5) 通过 store.dispatch 更新 runningChatData 触发流式跟随 effect；6) 验证 scrollToBottom 效果 — 检查 container.scrollTop 是否变为 scrollHeight 值（2000），前提是 mockContainerMetrics 设置了 scrollTop 的 writable:true）
- [x] 4.13 测试：应该不自动滚动 当流式更新但用户已向上滚动（步骤：1) 获取滚动容器 DOM；2) mockContainerMetrics 设置 scrollHeight=2000/clientHeight=600/scrollTop=0 模拟不在底部；3) mock.scrollTo 触发 handleVirtualizerScroll，此时 shouldStickToBottom.current=false；4) advanceTimersByTime(150)；5) 通过 store.dispatch 更新 runningChatData；6) 验证 scrollToBottom 未执行 — 检查 container.scrollTop 保持不变（仍为 0））

## 5. RunningBubble 组件测试

- [x] 5.1 创建 `src/__test__/pages/Chat/RunningBubble.test.tsx`，搭建测试基础设施（Redux preloadedState 构造：`chatList` 含对应聊天（需含 `chatModelList`）、`selectedChatId` 设置正确、`runningChat[chatId][modelId]` 嵌套数据）
- [x] 5.2 测试：应该返回 null 当没有运行数据
- [x] 5.3 测试：应该返回 null 当 isSending 为 false
- [x] 5.4 测试：应该显示 Spinner 当流式刚开始且无内容
- [x] 5.5 测试：应该显示 ChatBubble 当有流式内容

## 6. ChatBubble memo 重渲染行为测试

- [x] 6.1 创建 `src/__test__/components/chat/ChatBubble.memo.test.tsx`，搭建测试基础设施：
  - mock `generateCleanHtml` 并 spy 追踪调用次数（`generateCleanHtml` 被 `useMemo([content])` 包裹，仅 content 变化会触发其重新调用）
  - mock `react-i18next`（参考 `ChatSidebar.test.tsx` 的 selector-based mock 模式，需支持 `t($ => $.chat.thinking)` 和 `t($ => $.chat.thinkingComplete)` 返回不同值）
  - 创建渲染次数追踪 wrapper：`const renderTracker = vi.fn()`，用 wrapper 组件包裹 ChatBubble 以追踪实际渲染次数，对所有 props 变化场景统一验证 memo 是否生效
- [x] 6.2 测试：应该不重渲染 当四个关键 props（role/content/reasoningContent/isRunning）都相同（renderTracker 调用次数仅首次渲染时为 1，rerender 后不变）
- [x] 6.3 测试：应该重渲染 当 content 不同（`generateCleanHtml` 被重新调用）
- [x] 6.4 测试：应该重渲染 当 role 不同（断言 DOM 变化：className 从 `justify-end` 变为 `justify-start`）
- [x] 6.5 测试：应该重渲染 当 reasoningContent 不同（断言 ThinkingSection 出现；需 role=ASSISTANT）
- [x] 6.6 测试：应该重渲染 当 isRunning 不同（断言 ThinkingSection 标题文本变化；需 role=ASSISTANT + content="" + reasoningContent 非空，因 thinkingLoading = isRunning && !content）
