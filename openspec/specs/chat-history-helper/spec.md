## ADDED Requirements

### Requirement: appendHistoryToModel 辅助函数
系统 SHALL 提供一个 `appendHistoryToModel(state, chatId, modelId, message)` 辅助函数，用于在 chatList 中定位指定聊天和模型，并将消息追加到其历史记录中。

#### Scenario: 正常追加消息
- **WHEN** 调用 `appendHistoryToModel` 且 chatId 和 modelId 均能找到匹配项
- **THEN** 消息 SHALL 被追加到对应模型的 `chatHistoryList` 数组末尾，函数返回 `true`

#### Scenario: 聊天不存在
- **WHEN** 调用 `appendHistoryToModel` 且 chatId 在 chatList 中找不到
- **THEN** 函数 SHALL 不修改任何状态并返回 `false`

#### Scenario: 模型不存在
- **WHEN** 调用 `appendHistoryToModel` 且 chatId 能找到但 modelId 在 chatModelList 中找不到
- **THEN** 函数 SHALL 不修改任何状态并返回 `false`

#### Scenario: chatModelList 不存在
- **WHEN** 调用 `appendHistoryToModel` 且 chatId 能找到但 chatModelList 不是数组
- **THEN** 函数 SHALL 不修改任何状态并返回 `false`

#### Scenario: chatHistoryList 未初始化
- **WHEN** 调用 `appendHistoryToModel` 且目标模型的 `chatHistoryList` 不存在或不是数组
- **THEN** 函数 SHALL 将 `chatHistoryList` 初始化为空数组，然后追加消息，返回 `true`

#### Scenario: 消息为 null
- **WHEN** 调用 `appendHistoryToModel` 且 message 为 null 或 undefined
- **THEN** 函数 SHALL 不修改任何状态并返回 `false`

### Requirement: 替换 pushChatHistory 中的内联逻辑
系统 SHALL 用 `appendHistoryToModel` 替换 `pushChatHistory` reducer 中的内联导航逻辑。

#### Scenario: pushChatHistory 使用辅助函数
- **WHEN** `pushChatHistory` action 被触发
- **THEN** SHALL 调用 `appendHistoryToModel(state, chat.id, model.id, message)` 完成消息追加

### Requirement: 替换 sendMessage.fulfilled 中的内联逻辑
系统 SHALL 用 `appendHistoryToModel` 替换 `sendMessage.fulfilled` 处理器中的内联导航逻辑。

#### Scenario: sendMessage.fulfilled 使用辅助函数
- **WHEN** `sendMessage` 异步 action 成功完成
- **THEN** SHALL 调用 `appendHistoryToModel(state, chat.id, model.id, currentChatModel.history)` 完成消息回写

### Requirement: 替换 startSendChatMessage.rejected 中的内联逻辑
系统 SHALL 用 `appendHistoryToModel` 替换 `startSendChatMessage.rejected` 处理器中的内联导航逻辑。

#### Scenario: startSendChatMessage.rejected 使用辅助函数
- **WHEN** `startSendChatMessage` 异步 action 被拒绝（取消或错误）
- **THEN** SHALL 在遍历 runningChat 时为每个模型调用 `appendHistoryToModel(state, chat.id, modelId, historyItem.history)` 完成部分数据回写

---

### Requirement: commitEdit 辅助函数

系统 SHALL 提供一个 `commitEdit(state, chatId, userMessageId, newContent)` 辅助函数，用于原子性地更新用户消息和对应 AI 回复的 content/reasoningContent 数组。

> **定位策略**：由于多模型并发时每个 ChatModel 的用户消息 ID 各不相同（由 `sendMessage` 分别生成），`commitEdit` 采用**位置索引定位**：
> 1. 在所有 ChatModel 的 chatHistoryList 中找到包含该 `userMessageId` 的模型
> 2. 获取该消息在 chatHistoryList 中的位置索引（index）
> 3. 使用相同索引更新所有 ChatModel 的 chatHistoryList

#### Scenario: 正常提交编辑
- **WHEN** 调用 `commitEdit` 且 chatId 和 userMessageId 均能找到匹配项
- **THEN** 系统按以下步骤执行：
  1. 在所有 ChatModel 的 chatHistoryList 中，找到包含 `userMessageId` 的 chatHistoryList，获取该消息的位置索引
  2. 对所有 ChatModel 的 chatHistoryList 中**该索引位置**的用户消息：
     - 若 content 为 `string`，转为 `[oldContent, newContent]`
     - 若 content 为 `string[]`，push newContent 到数组末尾
  3. 对所有 ChatModel 的 chatHistoryList 中**该索引 + 1 位置**的消息（AI 回复），若存在且 `role === 'assistant'`：
     - 若 content 为 `string`，转为 `[oldContent, ""]`（占位，等待重新生成填充）
     - 若 content 为 `string[]`，push 空字符串到数组末尾（占位）
     - reasoningContent 同理处理
- **AND** 函数返回 `true`

#### Scenario: AI 回复不存在
- **WHEN** 调用 `commitEdit` 且用户消息之后的消息不是 `role === 'assistant'`（如上一轮发送失败，AI 回复未生成）
- **THEN** 仅更新用户消息的 content 数组
- **AND** 跳过 AI 回复的更新
- **AND** 函数返回 `true`

#### Scenario: 聊天不存在
- **WHEN** 调用 `commitEdit` 且 chatId 在 activeChatData 中找不到
- **THEN** 函数 SHALL 不修改任何状态并返回 `false`

#### Scenario: 消息不存在
- **WHEN** 调用 `commitEdit` 且 userMessageId 在所有 ChatModel 的 chatHistoryList 中均找不到
- **THEN** 函数 SHALL 不修改任何状态并返回 `false`

---

### Requirement: rollbackEdit 辅助函数

系统 SHALL 提供一个 `rollbackEdit(state, chatId, userMessageId)` 辅助函数，用于在重新生成失败时回滚用户消息和 AI 回复的数组。

> **定位策略**：与 `commitEdit` 相同，通过 `userMessageId` 找到位置索引，再用索引跨模型定位。

#### Scenario: 正常回滚编辑
- **WHEN** 调用 `rollbackEdit` 且 chatId 和 userMessageId 均能找到匹配项
- **THEN** 系统通过位置索引定位消息，对所有 ChatModel 的 chatHistoryList 中：
  - 用户消息（索引位置）：弹出 content 数组最后一个元素；若数组仅剩一个元素，恢复为 `string`
  - AI 回复（索引 + 1 位置），若存在且 content 为 `string[]`：弹出 content 和 reasoningContent 数组最后一个元素；若数组仅剩一个元素，恢复为 `string` / `undefined`
- **AND** 函数返回 `true`

#### Scenario: 聊天不存在
- **WHEN** 调用 `rollbackEdit` 且 chatId 在 activeChatData 中找不到
- **THEN** 函数 SHALL 不修改任何状态并返回 `false`

---

### Requirement: commitRegenerate 辅助函数

系统 SHALL 提供一个 `commitRegenerate(state, chatId, assistantMessageId)` 辅助函数，用于在重新生成时将旧 AI 回复内容 push 进数组。`commitRegenerate` SHALL 使用共享的 `resolveTargetIndex` 辅助函数消除重复的索引 clamp 逻辑。数组元素替换 SHALL 直接使用 Immer draft 索引赋值（`arr[idx] = value`），而非创建新数组拷贝。

> **定位策略**：由于不同模型的 AI 回复消息 ID 不同，`commitRegenerate` 采用**位置索引定位**：
> 1. 在所有 ChatModel 的 chatHistoryList 中找到包含该 `assistantMessageId` 的模型
> 2. 获取该消息的位置索引
> 3. 使用相同索引更新所有 ChatModel 的 chatHistoryList

#### Scenario: 正常提交重新生成
- **WHEN** 调用 `commitRegenerate` 且 chatId 和 assistantMessageId 均能找到匹配项
- **THEN** 系统通过位置索引定位消息，对所有 ChatModel 的 chatHistoryList 中该索引位置的消息：
  - 若 content 为 `string`，转为 `[oldContent, ""]`（占位，等待重新生成填充新值）
  - 若 content 为 `string[]`，push 空字符串到数组末尾（占位）
  - reasoningContent 同理处理
- **AND** 函数返回 `true`

#### Scenario: 聊天不存在
- **WHEN** 调用 `commitRegenerate` 且 chatId 在 activeChatData 中找不到
- **THEN** 函数 SHALL 不修改任何状态并返回 `false`

#### Scenario: resolveTargetIndex 正确计算 clamp 索引
- **WHEN** historyIndex 为 5 但 content 数组只有 3 个元素
- **THEN** resolveTargetIndex 返回 2（Math.min(5, 3-1)）

#### Scenario: resolveTargetIndex 对非数组内容返回 undefined
- **WHEN** content 为 string 类型（非数组）
- **THEN** resolveTargetIndex 返回 undefined

#### Scenario: Immer draft 中直接替换数组元素
- **WHEN** aiMessage.content 为 ["a", "b", "c"]（在 WritableDraft 上下文中），需要将索引 1 的元素替换为 "x"
- **THEN** 直接使用 `aiMessage.content[1] = "x"`，Immer 自动处理不可变性

#### Scenario: Immer draft 中非数组内容直接赋值
- **WHEN** aiMessage.content 为 "old"（非数组，在 WritableDraft 上下文中）
- **THEN** 直接使用 `aiMessage.content = "new"`，无需数组操作

---

### Requirement: rollbackRegenerate 辅助函数

系统 SHALL 提供一个 `rollbackRegenerate(state, chatId, assistantMessageId)` 辅助函数，用于在重新生成失败时回滚 AI 回复的数组。`rollbackRegenerate` SHALL 使用共享的 `resolveTargetIndex` 辅助函数消除重复的索引 clamp 逻辑。数组元素替换 SHALL 直接使用 Immer draft 索引赋值。

> **定位策略**：与 `commitRegenerate` 相同，通过位置索引跨模型定位。

#### Scenario: 正常回滚重新生成
- **WHEN** 调用 `rollbackRegenerate` 且 chatId 和 assistantMessageId 均能找到匹配项
- **THEN** 系统通过位置索引定位消息，对所有 ChatModel 的 chatHistoryList 中该索引位置的 AI 回复消息：
  - 弹出 content 和 reasoningContent 数组最后一个元素（即 `commitRegenerate` 添加的占位空字符串）
  - 若数组仅剩一个元素，恢复为 `string` / `undefined`
- **AND** 函数返回 `true`

#### Scenario: 聊天不存在
- **WHEN** 调用 `rollbackRegenerate` 且 chatId 在 activeChatData 中找不到
- **THEN** 函数 SHALL 不修改任何状态并返回 `false`

---

### Requirement: updateHistoryContent 辅助函数

系统 SHALL 提供一个 `updateHistoryContent(state, chatId, modelId, messageIndex, content, reasoningContent?)` 辅助函数，用于在流式完成后更新 AI 回复的 content/reasoningContent 数组最后一个元素，替换占位空字符串。`updateHistoryContent` SHALL 使用共享的 `resolveTargetIndex` 辅助函数消除重复的索引 clamp 逻辑。数组元素替换 SHALL 直接使用 Immer draft 索引赋值。

> **定位策略**：直接通过 `chatId` → `modelId` → `messageIndex` 三级定位，无需跨模型搜索。

#### Scenario: 正常更新 AI 回复内容
- **WHEN** 调用 `updateHistoryContent` 且能定位到有效的 AI 回复消息
- **THEN** 系统将 content 数组最后一个元素（占位空字符串）替换为传入的 content
- **AND** 若传入的 reasoningContent 有值，将其设为 reasoningContent 数组最后一个元素
- **AND** 若传入的 reasoningContent 为空/undefined，且当前 reasoningContent 为 `string[]`，将最后一个元素设为空字符串
- **AND** 清理对应的 `runningChat[chatId][modelId]` 条目
- **AND** 更新 `activeChatData` 的 `updatedAt` 时间戳
- **AND** 函数返回 `true`

#### Scenario: 聊天或模型不存在
- **WHEN** 调用 `updateHistoryContent` 且 chatId 在 activeChatData 中找不到，或 modelId 在 chatModelList 中找不到
- **THEN** 函数 SHALL 不修改任何状态并返回 `false`

---

### Requirement: findMessageIndex 保持遍历所有模型
findMessageIndex SHALL 保持遍历所有 chatModel 的 chatHistoryList 查找消息索引。每个模型的 chatHistoryList 使用独立的消息 ID（`generateUserMessageId()` 每次调用生成唯一 ID），"只查第一个模型"会导致非首选模型的重新生成功能失效。

#### Scenario: 消息存在于某个模型中
- **WHEN** 目标 messageId 在某个 chatModel 的 chatHistoryList 中
- **THEN** 遍历所有模型直到找到，返回该消息的索引位置

#### Scenario: 消息不存在
- **WHEN** 目标 messageId 不在任何 chatModel 的 chatHistoryList 中
- **THEN** 返回 -1

---

### Requirement: commitEdit 使用 Immer draft push 追加
在 `commitEdit` 中对 Immer draft 的 content 数组追加元素 SHALL 使用 `.push()` 方法，而非 `pushContent` 创建新数组。

#### Scenario: commitEdit 使用 push 追加
- **WHEN** 用户消息 content 为 ["v1", "v2"]（在 Immer draft 上下文中）
- **THEN** 使用 `content.push("v3")` 追加新版本，Immer 自动处理不可变性
