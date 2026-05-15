## Context

`regenerate-history-inplace` 变更已完成数据层 historyIndex 全链路传递（helper → store → component），但验证发现两个显示层问题：

1. **滚动重置索引**：ChatBubble 的 `useEffect([content])` 在 Virtualizer 重挂载时无条件调用 `onHistoryIndexChange(content.length - 1)`，覆盖父组件 Detail 管理的 `pairHistoryIndices`
2. **重新生成出现新消息**：`displayList` 将 `runningChatData.history` 追加到列表末尾而非替换到被重新生成消息的原位置

当前数据流：
```
commitRegenerate → content[historyIndex] = ''
                  → runningChatData.history 持续更新

displayList = [...historyList, runningChatData.history]
                                  ↑ 始终追加到末尾
```

## Goals / Non-Goals

**Goals:**

- 修复滚动时 historyIndex 被意外重置的问题
- 重新生成任何历史版本时，流式内容在原消息位置原地显示
- 保持发送新消息、编辑重发的显示行为不变

**Non-Goals:**

- 不改变 Redux 数据流（commitRegenerate / rollbackRegenerate / updateHistoryContent 的行为不变）
- 不改变 streaming service 的实现
- 不引入新的全局状态

## Decisions

### D1: ChatBubble useEffect 在 paired 模式下跳过 onHistoryIndexChange

当 `historyIndexOverride !== undefined` 时（即父组件在管理索引），`useEffect([content])` 只更新 `internalHistoryIndex`，不调用 `onHistoryIndexChange`。父组件 Detail 的 reset effect 负责在需要时（content 数组长度增长）重置索引。

**理由**：paired 模式下索引的权威来源是 Detail 的 `pairHistoryIndices`，ChatBubble 不应覆盖它。

**替代方案**：用 ref 跳过首次挂载——不够精准，content 变化时仍需更新内部索引。

### D2: 使用 useState 追踪 regeneratingMessageId，dispatch.finally() 清理

在 Detail 组件中新增 `regeneratingMessageId` state：
- `handleRegenerate` 中设置 `regeneratingMessageId = messageId`
- `dispatch(regenerateMessage(...)).finally(() => setRegeneratingMessageId(null))` 清理

**理由**：state 变化触发 displayList useMemo 重算；`.finally()` 确保无论成功/失败/取消都清理。dispatch thunk 返回的 Promise 支持 `.finally()`。

**替代方案**：从 runningChat 的 rollbackContent 推导——无法获取具体 messageId，且语义不清晰。

### D3: displayList 扩展为带 displayMessage 的条目，重新生成时替换显示内容

displayList 条目类型扩展：
```typescript
type DisplayEntry = {
  message: StandardMessage    // 原始消息（用于 key、meta 查找）
  displayMessage: StandardMessage // 实际显示的内容（可能是 runningData）
  isRunning: boolean
}
```

构建逻辑：
```
runningData 存在？
├─ regeneratingMessageId 存在（重新生成模式）
│   → 找到 list 中 id === regeneratingMessageId 的条目
│   → 替换其 displayMessage 为 runningData.history，isRunning = true
│   → 不追加到末尾
│
└─ regeneratingMessageId 不存在（发送新消息模式）
    → 追加到末尾（当前行为）
```

**理由**：保持原始 message.id 作为 Virtualizer key，避免 key 变化导致虚拟化列表跳动。

**替代方案**：直接替换 message 对象——key 变化导致 Virtualizer 不稳定。

### D4: 渲染层使用 displayMessage 而非 message

ChatBubble 的 `content` / `reasoningContent` / `isRunning` 从 `displayEntry.displayMessage` 和 `displayEntry.isRunning` 取值，而 `key`、`messageId`、`role`、操作属性等从 `displayEntry.message` 取值。

**理由**：分离身份（key/id）和内容（展示数据），确保 Virtualizer 稳定性和操作回调指向正确的原始消息。

## Risks / Trade-offs

- **[组件卸载时 finally 更新 state]** → Detail 组件卸载时 `.finally()` 中的 `setRegeneratingMessageId(null)` 会在已卸载组件上调用。由于 React 18+ 不再 warn 此场景，且实际项目中 Detail 不会在重新生成过程中被卸载（sendingChatIds 阻止清理），风险极低。
- **[regeneratingMessageId 与 Redux 状态不同步]** → 如果外部逻辑（如 Redux devtools）dispatch 了 rollbackRegenerate 但没有经过 handleRegenerate，regeneratingMessageId 不会被清理。由于当前架构中 rollbackRegenerate 只在 regenerateMessage.rejected handler 中被调用，而该 handler 触发时 thunk 的 Promise 会 reject，`.finally()` 会执行清理，因此不会出现不同步。
- **[displayList 类型变更影响现有渲染]** → 需要同步修改 displayList 消费方的所有引用点（messageMeta、messagePairs、ChatBubble props），确保从正确的字段取值。
