## Context

当前聊天详情页的滚动架构存在坐标系分裂：历史消息在 Virtualizer 内部，流式消息（RunningBubble）在外部。`scrollToBottom` 使用 `scrollToIndex` 只能操作 Virtualizer 内的元素，导致流式期间点击按钮无法到达真正的底部。`checkScrollStatus` 读取的 `scrollHeight` 包含 RunningBubble，但 `scrollToIndex` 的目标不包含它，形成感知与行为的不一致。

## Goals / Non-Goals

**Goals:**

- 统一滚动坐标系，`scrollToBottom` 在流式和非流式场景下都能精确到达内容底部
- 将 RunningBubble 的渲染逻辑纳入 Virtualizer，消除两区域分裂
- 流式结束到历史消息的过渡平滑无闪烁

**Non-Goals:**

- 不改变 Redux 数据流（`runningChat` 的 state 结构、thunk、reducer 保持不变）
- 不改变 `ChatBubble` 组件的接口
- 不引入新的外部依赖

## Decisions

### 决策 1：使用合并列表 `displayList` 将流式消息纳入 Virtualizer

构造 `displayList = [...historyList, runningMessage?]`，让 Virtualizer 统一管理所有可见内容。

**替代方案**：双模式滚动（流式时用 `scrollTop = scrollHeight`，非流式时用 `scrollToIndex`）。
**否决原因**：if/else 分支会在未来引入新消息类型时持续膨胀，两套坐标系不一致的问题会反复引发类似 bug。

### 决策 2：loading spinner 保留在 Virtualizer 外部

流式消息尚未有内容时（`isSending && !content && !reasoningContent`），展示 spinner。此时 spinner 尚未加入 `displayList`，保留在 Virtualizer 外部作为独立元素。

**理由**：spinner 高度固定且极小，不影响滚动计算。若纳入 Virtualizer 需要处理「消息出现即 spinner 消失」的列表项增删过渡，增加复杂度但无实际收益。

### 决策 3：`displayList` 的 key 稳定性

流式消息使用 `runningChatData.history.id` 作为 key。流式结束时，`sendMessage.fulfilled` 在单个 Immer transaction 中完成：追加到 `chatHistoryList` + 删除 `runningChat`。由于同一 `id` 的 key 在 Virtualizer 中不变，React 复用同一组件实例，过渡无闪烁。

### 决策 4：删除 RunningBubble.tsx

RunningBubble 的职责（精确 selector、loading 判断、memo 包裹）全部迁移到 Detail 组件内。精确 selector 已在 Detail 中作为 `runningChatData` 存在，loading spinner 条件判断直接在 JSX 中处理，`ChatBubble` 本身已是 memo 组件无需额外包裹。

## Risks / Trade-offs

- **[高频数组重建]** → `displayList` 每 ~50ms 因 `runningChatData.history` 变化而重建引用。但 ChatBubble 是 memo 组件，Virtualizer 只重渲染 props 变化的最后一项，历史项不受影响。实测预期无性能问题。

- **[Virtualizer 锚定跳动]** → 流式内容增长导致最后一项高度频繁变化，Virtualizer 可能重新计算锚点。若出现跳动，可配置 Virtualizer 的 `overscan` 或调整锚定策略。

- **[过渡瞬间的列表长度跳变]** → 流式结束时 `runningChat` 被删除、消息移入 `chatHistoryList`。由于 `id` 相同且 React 通过 key 复用组件，`displayList` 长度不变（从 `[history, running]` 变为 `[history]`，最后一项 key 相同），视觉无跳变。
