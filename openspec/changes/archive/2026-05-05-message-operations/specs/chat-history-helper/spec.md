## ADDED Requirements

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

系统 SHALL 提供一个 `commitRegenerate(state, chatId, assistantMessageId)` 辅助函数，用于在重新生成时将旧 AI 回复内容 push 进数组。

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

---

### Requirement: rollbackRegenerate 辅助函数

系统 SHALL 提供一个 `rollbackRegenerate(state, chatId, assistantMessageId)` 辅助函数，用于在重新生成失败时回滚 AI 回复的数组。

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

系统 SHALL 提供一个 `updateHistoryContent(state, chatId, modelId, messageIndex, content, reasoningContent?)` 辅助函数，用于在流式完成后更新 AI 回复的 content/reasoningContent 数组最后一个元素，替换占位空字符串。

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
