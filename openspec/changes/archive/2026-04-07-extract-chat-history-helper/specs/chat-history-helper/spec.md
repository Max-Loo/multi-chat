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
