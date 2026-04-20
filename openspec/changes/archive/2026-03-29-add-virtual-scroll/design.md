## Context

当前聊天页面的两个列表使用 `.map()` 全量渲染：

1. **消息列表**（`Detail/index.tsx`）：渲染 `historyList` 中的 `ChatBubble`，每条消息通过 `generateCleanHtml()` 执行 markdown 渲染 + DOMPurify 清洗 + highlight.js 代码高亮。单条长代码消息可产生 2000+ DOM 节点。
2. **对话列表**（`Sidebar/index.tsx`）：渲染 `filteredChatList` 中的 `ChatButton`，组件已做 memo 优化。

多面板模式下，消息列表的 DOM 压力是 N 倍关系（N = 面板数）。流式生成时，每 50ms 更新一次 `runningChatData`，触发 Detail 重渲染，级联影响所有 ChatBubble。

现有滚动逻辑：
- `useAdaptiveScrollbar`：控制滚动条显隐（滚动时显示，停止后 500ms 隐藏）
- `scrollContainerRef` + `ResizeObserver`：检测 `isAtBottom` 和 `needsScrollbar`
- `scrollToBottom()`：按钮触发或自动跟随到底部

## Goals / Non-Goals

**Goals:**
- 消息列表只渲染可视区域内的 ChatBubble，减少 DOM 节点数量
- 对话列表虚拟化，支持大量对话时的流畅滚动
- 保持现有的自动滚到底部、滚动条自适应、"回到底部"按钮等交互行为
- 配套优化 ChatBubble 的 memo 策略和 RunningBubble 的 selector 粒度（RunningBubble 已有 memo，无需重复添加）
- virtua 库（~3kB gzip）归入通用 vendor chunk

**Non-Goals:**
- 不做消息分页加载（保持打开对话即全量加载的现有行为）
- 不做 markdown 渲染结果持久化（即不在保存消息时预渲染 HTML）
- 不对 ModelSelect 的表格列表做虚拟化（已有 TanStack Table 优化且数据量有限）
- 不引入 SSR 相关的虚拟化配置

## Decisions

### Decision 1: 选择 virtua 而非 react-virtuoso 或 @tanstack/react-virtual

**选择**：virtua

**备选方案**：
- **react-virtuoso**（~13KB）：有内置 `followOutput` 专为聊天设计，但包体积大 4 倍，且项目已有自定义的 `scrollToBottom` + `isAtBottom` 逻辑，virtuoso 的 followOutput 会和现有逻辑冲突
- **@tanstack/react-virtual**（~3KB）：headless hook，需要手动实现动态高度测量、反向滚动、自动跟随底部，开发成本高

**理由**：
- ~3kB gzip，与 tanstack/virtual 同等轻量
- 零配置支持动态高度和反向滚动
- `VList` 组件 API 接近原生 DOM（接受 children + ref），与现有 `scrollContainerRef` 模式契合度高
- `VList` 的 `onScroll` 回调可直接对接 `useAdaptiveScrollbar`

### Decision 2: 消息列表使用 Virtualizer 替代 .map()

**选择**：用 `Virtualizer` 包裹 `ChatBubble` 列表，配合外部滚动容器

**理由**：
- virtua 官方 Chat/Chatbot 示例均使用 `Virtualizer` 而非 `VList`
- `VList` 自动创建滚动容器，所有 children 被虚拟化——Title 头部会被滚出视口时回收
- `Virtualizer` 使用父容器的滚动，通过 `startMargin` 处理外部固定元素，更适合聊天 UI 结构
- Title 作为非列表元素放在 Virtualizer 外部，不被虚拟化引擎测量或回收
- RunningBubble 和 Alert 放在 Virtualizer 外部，避免 key 管理和条件渲染导致的缓存不一致

**实现策略**：
```
当前：
<div ref={scrollContainerRef} className="overflow-y-auto ...">
  <Title />
  {historyList.map(msg => <ChatBubble />)}
  <RunningBubble />
  {error && <Alert />}
  {scrollToBottomButton}
</div>

改为：
<div ref={scrollContainerRef} className="overflow-y-auto ..."
     onScroll={handleScroll}>
  <Title /> {/* 固定头部，不参与虚拟化 */}
  <Virtualizer ref={virtualizerRef} startMargin={titleHeight}>
    {historyList.map(msg => <ChatBubble />)}
  </Virtualizer>
  <RunningBubble /> {/* 放在 Virtualizer 外部 */}
  {error && <Alert />} {/* 放在 Virtualizer 外部 */}
  {scrollToBottomButton}
</div>
```

**关键点**：
- 保留外部 `div` 作为滚动容器，替代原有结构中的 `scrollContainerRef`
- `Virtualizer` 只虚拟化 `historyList` 中的 ChatBubble
- Title 在 Virtualizer 外部，始终渲染（用 `startMargin` 告知 Virtualizer 头部占位）
- RunningBubble 和 Alert 在 Virtualizer 外部，不受虚拟化影响
- `scrollToBottom` 使用外部 div 的 `scrollTop = scrollHeight` 或 Virtualizer ref 的 API
- `isAtBottom` 检测从 `onScroll` 回调中计算（`scrollHeight - scrollTop - clientHeight <= threshold`）

**流式自动跟随实现模式**：
使用 `shouldStickToBottom` ref 跟踪用户是否在底部，流式更新时据此决定是否自动滚动：
```
const shouldStickToBottom = useRef(true)

onScroll: 判断是否在底部 → 更新 shouldStickToBottom
流式更新: if (shouldStickToBottom.current) scrollToBottom()
```

### Decision 3: 对话列表使用 VList 替代 .map()

**选择**：用 `VList` 包裹 `ChatButton` 列表

**实现策略**：
```
当前：
<div className="overflow-y-auto ...">
  {filteredChatList.map(chat => <ChatButton />)}
</div>

改为：
<VList style={{ height: '100%' }} onScroll={onScrollEvent}>
  {filteredChatList.map(chat => <ChatButton />)}
</VList>
```

对话列表相对简单，ChatButton 已有 memo 优化，主要收益是减少大量对话时的 DOM 节点。

### Decision 4: ChatBubble 添加 React.memo

**选择**：将 `ChatBubble` 包裹 `React.memo`，自定义比较函数比较 `role`、`content`、`reasoningContent`、`isRunning` 四个 props

**理由**：
- Detail 重渲染时（流式更新 runningChatData），historyList 中的 ChatBubble 不应重新渲染
- ChatBubble 内部已有 `useMemo` 缓存 markdown 计算，但缺少 memo 导致每次都走 React render → reconcile 流程
- 自定义比较函数避免 content 字符串引用变化时的无谓重渲染
- 注意：RunningBubble 已有 `memo` 包裹，无需重复添加，只需收窄 selector

### Decision 5: RunningBubble 收窄 selector

**选择**：从 `state.chat.runningChat` 改为精确选择 `state.chat.runningChat[chatId]?.[modelId]`

**理由**：
- 当前 RunningBubble 订阅了整个 `runningChat` 对象
- 多面板场景下，面板 A 的流式更新会触发面板 B、C 的 RunningBubble 重渲染
- 收窄到 `chatId + modelId` 后，各面板只响应自己的数据变化

### Decision 6: Vite vendor chunk 分组

**选择**：将 virtua 放入 `vendor` chunk（和其他未特殊分组的 node_modules 依赖一起）

**理由**：
- virtua 仅 ~3kB gzip，不值得单独一个 chunk
- 不属于任何现有 vendor chunk 的分类（不是 React/Redux/UI/AI 等）

## Risks / Trade-offs

**[Risk] 流式生成时高度频繁变化导致虚拟化抖动** → AI 生成消息时 RunningBubble 高度持续增长（每 50ms 更新一次），但由于 RunningBubble 放在 Virtualizer 外部，不参与虚拟化测量，此风险已规避。ChatBubble 的虚拟化测量只在首次进入视口或高度变化时触发，历史消息高度稳定。**缓解**：如果未来需要虚拟化 RunningBubble，可通过 `bufferSize` 调整缓冲区大小来平衡性能。

**[Risk] startMargin 值的维护** → `Virtualizer` 的 `startMargin` 需要与 Title 组件的实际高度保持同步。如果 Title 高度因响应式布局变化（如不同断点），startMargin 可能不准确。**缓解**：使用 ResizeObserver 监听 Title 高度变化，动态更新 startMargin；或为 Title 设置固定高度。

**[Risk] 外部滚动容器与 useAdaptiveScrollbar 的兼容性** → 现有 `useAdaptiveScrollbar` 通过 `addEventListener('scroll')` 监听 DOM 容器。改用 Virtualizer 后，滚动容器仍然是外部的 `div`（保留 `scrollContainerRef`），scroll 事件监听方式不变，只是需要将 Virtualizer 的 `onScroll` 也能触发 `useAdaptiveScrollbar`。**缓解**：保留外部 div 的 scroll 事件监听用于 `useAdaptiveScrollbar`，Virtualizer 的 `onScroll` 用于 `isAtBottom` 检测，两者并行。

**[Trade-off] 增加了渲染层面的复杂度** → 引入虚拟化后，调试渲染问题时需要理解 virtua 的测量和回收机制。对于大多数 ≤50 条消息的对话，虚拟化不会带来明显感知差异，但也不会有性能损失（virtua 的 overhead 很小）。
