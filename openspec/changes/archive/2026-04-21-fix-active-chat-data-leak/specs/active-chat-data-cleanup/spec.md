## ADDED Requirements

### Requirement: 发送结束后回收后台聊天的 activeChatData
当聊天的所有模型发送完成（`startSendChatMessage.fulfilled` 或 `rejected`），且持久化写入完成后，如果该聊天不是当前选中的聊天，系统 SHALL 从 `activeChatData` 中移除该聊天的完整数据。

#### Scenario: 后台聊天发送成功后回收
- **WHEN** 聊天 A 处于发送状态时用户切换到聊天 B，随后聊天 A 发送成功（`startSendChatMessage.fulfilled`），且 middleware 完成持久化
- **THEN** 系统 SHALL 从 `activeChatData` 中移除聊天 A 的数据

#### Scenario: 后台聊天发送失败后回收
- **WHEN** 聊天 A 处于发送状态时用户切换到聊天 B，随后聊天 A 发送失败（`startSendChatMessage.rejected`），且 middleware 完成持久化
- **THEN** 系统 SHALL 从 `activeChatData` 中移除聊天 A 的数据

#### Scenario: 当前选中的聊天发送结束后不回收
- **WHEN** 聊天 A 处于发送状态且仍为当前选中聊天，随后发送结束
- **THEN** 系统 SHALL 保留聊天 A 的 `activeChatData`

#### Scenario: 发送结束后用户已切回该聊天时不回收
- **WHEN** 聊天 A 处于发送状态时用户切走，但发送结束前用户又切回聊天 A
- **THEN** 系统 SHALL 保留聊天 A 的 `activeChatData`，因为此时 `selectedChatId === chatId`

### Requirement: 清理必须在持久化完成后执行
清理 `activeChatData` 的操作 SHALL 在 middleware 完成 `saveChatAndIndex` 持久化之后执行，确保数据不会因提前清理而丢失。

#### Scenario: 清理时序保证
- **WHEN** `startSendChatMessage.fulfilled` 触发，middleware 执行持久化
- **THEN** 系统 SHALL 先完成 `saveChatAndIndex` 调用，再 dispatch 清理 action

### Requirement: 专用清理 action 不影响现有清理机制
新增的清理 action SHALL 独立于现有的 `clearActiveChatData` action，不修改其行为和保护条件。

#### Scenario: clearActiveChatData 行为不变
- **WHEN** 调用 `clearActiveChatData(chatId)`，且该聊天正在发送中
- **THEN** 系统 SHALL 跳过清理（保持现有行为）
