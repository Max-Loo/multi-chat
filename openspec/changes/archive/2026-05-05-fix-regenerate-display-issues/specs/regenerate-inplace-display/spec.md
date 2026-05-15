## ADDED Requirements

### Requirement: paired 模式下滚动不重置历史索引
系统 SHALL 在 ChatBubble 处于 paired 模式（historyIndexOverride 存在）时，Virtualizer 滚动导致的组件卸载/重挂载不触发 `onHistoryIndexChange`，保持父组件管理的 historyIndex 不变。

#### Scenario: 滚出再滚回不重置索引
- **WHEN** 用户将翻页器从 index=1 切换到 index=0，然后上下滚动使 ChatBubble 被 Virtualizer 卸载并重新挂载
- **THEN** 重新挂载后 historyIndex 仍为 0，不跳回最新版本

#### Scenario: content 变化时仍更新内部索引
- **WHEN** ChatBubble 的 content prop 发生变化（如编辑确认后数组增长）
- **THEN** internalHistoryIndex 更新到 content.length - 1，但在 paired 模式下不调用 onHistoryIndexChange

#### Scenario: 非 paired 模式行为不变
- **WHEN** ChatBubble 未处于 paired 模式（无 historyIndexOverride）
- **THEN** useEffect 照常调用 onHistoryIndexChange，行为与修改前一致

### Requirement: 重新生成时流式内容原地显示
系统 SHALL 在重新生成 AI 回复期间，将流式响应内容显示在被重新生成消息的原始位置，而非追加到消息列表末尾。

#### Scenario: 重新生成历史版本原地显示
- **WHEN** 用户在 index=0 点击重新生成，此时 content 数组长度 > 1
- **THEN** 流式内容在原始 AI 回复的位置原地显示，不出现额外的消息条目

#### Scenario: 重新生成最新版本原地显示
- **WHEN** 用户在最新版本（index = content.length - 1）点击重新生成
- **THEN** 流式内容在原始 AI 回复的位置原地显示，视觉表现与修改前一致

#### Scenario: 发送新消息追加到末尾（向后兼容）
- **WHEN** 用户发送一条新消息（非重新生成）
- **THEN** runningData 照常追加到 displayList 末尾，行为与修改前完全一致

### Requirement: 重新生成追踪状态自动清理
系统 SHALL 在重新生成完成后（无论成功、失败或取消）自动清理 regeneratingMessageId 追踪状态，避免影响后续消息的显示。

#### Scenario: 重新生成成功后清理
- **WHEN** 重新生成成功完成，updateHistoryContent 写入最终内容
- **THEN** regeneratingMessageId 被清除，displayList 恢复为正常的历史消息列表

#### Scenario: 重新生成失败后清理
- **WHEN** 重新生成失败，rollbackRegenerate 恢复原始内容
- **THEN** regeneratingMessageId 被清除，displayList 显示恢复后的原始消息

### Requirement: Virtualizer key 稳定性
系统 SHALL 在 displayList 替换显示内容时保持原始消息的 id 作为 Virtualizer key，避免虚拟化列表因 key 变化导致滚动位置跳动。

#### Scenario: 重新生成期间 key 不变
- **WHEN** displayList 中某条消息被替换为 runningData 显示
- **THEN** 该条目的 React key 保持为原始消息的 id，不使用 runningData 的 id
