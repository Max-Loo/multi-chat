## Why

`regenerate-history-inplace` 变更完成了数据层的 historyIndex 全链路传递，但实际验证发现两个问题：（1）Virtualizer 滚动卸载/重挂载 ChatBubble 时，内部 useEffect 无条件调用 `onHistoryIndexChange` 重置父组件索引，导致翻页器浏览历史版本时滚动会触发索引跳回最新；（2）`displayList` 构建时将 runningData 追加到列表末尾而非替换到被重新生成消息的原位置，导致重新生成历史版本时出现一条"新消息"而非原地流式更新。

## What Changes

- ChatBubble 的 `useEffect([content])` 在 paired 模式下（`historyIndexOverride` 存在时）跳过 `onHistoryIndexChange` 调用，避免覆盖父组件管理的索引
- Detail 组件新增 `regeneratingMessageId` 状态追踪当前正在重新生成的消息
- `displayList` 构建逻辑增加分支：重新生成时将 runningData 替换到被重新生成消息的原位置（保持原始 key 稳定），而非追加到末尾；发送新消息时保持当前追加行为

## Capabilities

### New Capabilities

- `regenerate-inplace-display`: 重新生成期间的原地流式显示，包括 displayList 替换逻辑和滚动索引保护

### Modified Capabilities

（无——修复的是 `regenerate-history-inplace` 变更中已实现功能的显示层缺陷，不改变需求规格）

## Impact

- **组件层**：`ChatBubble.tsx`（useEffect 条件跳过）、`Detail/index.tsx`（regeneratingMessageId 状态 + displayList 替换逻辑 + 渲染 key 稳定性）
- **无数据层变更**：Redux slice、chatHistoryHelper、thunk 均不受影响
- **无破坏性变更**：发送新消息和编辑重发的显示行为完全不变
