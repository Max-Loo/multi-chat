# Chat Slices Testing Specification

## ADDED Requirements

### Requirement: 聊天列表初始化测试
测试系统 SHALL 验证 `initializeChatList` async thunk 能正确从存储加载聊天列表并更新 Redux store 状态。

#### Scenario: 成功初始化聊天列表
- **WHEN** 调用 `initializeChatList.fulfilled` action 并传入聊天列表数据
- **THEN** 系统 SHALL 将聊天列表更新到 store.state.chat.chatList
- **THEN** 系统 SHALL 将 loading 状态设置为 false
- **THEN** 系统 SHALL 将 initializationError 设置为 null

#### Scenario: 初始化失败
- **WHEN** 调用 `initializeChatList.rejected` action
- **THEN** 系统 SHALL 将 loading 状态设置为 false
- **THEN** 系统 SHALL 设置 initializationError 为错误信息

#### Scenario: 初始化开始
- **WHEN** 调用 `initializeChatList.pending` action
- **THEN** 系统 SHALL 将 loading 状态设置为 true
- **THEN** 系统 SHALL 将 initializationError 设置为 null

### Requirement: 聊天列表管理 reducers 测试
测试系统 SHALL 验证所有聊天管理相关的 reducers 能正确更新 Redux store 状态。

#### Scenario: 创建新聊天
- **WHEN** 调用 `createChat` action 并传入新聊天对象
- **THEN** 系统 SHALL 将新聊天添加到 chatList 数组末尾

#### Scenario: 编辑聊天
- **WHEN** 调用 `editChat` action 并传入更新的聊天对象
- **THEN** 系统 SHALL 在 chatList 中找到对应 ID 的聊天并更新其内容

#### Scenario: 编辑聊天名称
- **WHEN** 调用 `editChatName` action 并传入聊天 ID 和新名称
- **THEN** 系统 SHALL 更新对应聊天的 name 字段

#### Scenario: 软删除聊天
- **WHEN** 调用 `deleteChat` action 并传入要删除的聊天对象
- **THEN** 系统 SHALL 将对应聊天的 isDeleted 字段设置为 true
- **THEN** 系统 SHALL 不从 chatList 中移除该聊天
- **WHEN** 被删除的聊天是当前选中的聊天
- **THEN** 系统 SHALL 将 selectedChatId 设置为 null

#### Scenario: 设置选中的聊天 ID
- **WHEN** 调用 `setSelectedChatId` action 并传入聊天 ID
- **THEN** 系统 SHALL 更新 selectedChatId 为传入的 ID

#### Scenario: 清除选中的聊天 ID
- **WHEN** 调用 `clearSelectChatId` action
- **THEN** 系统 SHALL 将 selectedChatId 设置为 null

### Requirement: 消息发送测试
测试系统 SHALL 验证消息发送相关的 async thunk 和 reducers 能正确处理消息发送流程。

#### Scenario: 发送消息开始
- **WHEN** 调用 `sendMessage.pending` action
- **THEN** 系统 SHALL 在 runningChat 状态中初始化对应 chatId 和 modelId 的运行记录
- **THEN** 系统 SHALL 将 isSending 设置为 true
- **THEN** 系统 SHALL 将 errorMessage 设置为空字符串

#### Scenario: 推送运行中的聊天消息
- **WHEN** 调用 `pushRunningChatHistory` action 并传入聊天、模型和消息对象
- **THEN** 系统 SHALL 更新 runningChat[chatId][modelId].history 为传入的消息

#### Scenario: 推送聊天历史记录
- **WHEN** 调用 `pushChatHistory` action 并传入聊天、模型和消息对象
- **THEN** 系统 SHALL 在对应聊天的对应模型的 chatHistoryList 中添加消息

#### Scenario: 发送消息成功
- **WHEN** 调用 `sendMessage.fulfilled` action
- **THEN** 系统 SHALL 将对应模型的 isSending 设置为 false
- **THEN** 系统 SHALL 将运行中的历史记录（runningChat.history）添加到聊天的 chatHistoryList 中
- **THEN** 系统 SHALL 从 runningChat 中删除对应的记录

#### Scenario: 发送消息失败
- **WHEN** 调用 `sendMessage.rejected` action
- **THEN** 系统 SHALL 将对应模型的 isSending 设置为 false
- **THEN** 系统 SHALL 在 errorMessage 中记录错误信息

### Requirement: 多模型消息发送测试
测试系统 SHALL 验证 `startSendChatMessage` async thunk 能正确处理向多个模型同时发送消息的场景。

#### Scenario: 向多个模型发送消息
- **WHEN** 调用 `startSendChatMessage` 并传入包含多个模型的聊天
- **THEN** 系统 SHALL 为每个未删除且启用的模型并行发送消息
- **WHEN** 某个模型被删除或未启用
- **THEN** 系统 SHALL 跳过该模型，不发送消息

#### Scenario: 多模型发送失败清理
- **WHEN** 调用 `startSendChatMessage.rejected` action
- **THEN** 系统 SHALL 将 runningChat 中所有运行中的历史记录回写到对应的 chatHistoryList 中

### Requirement: 选中聊天管理测试
测试系统 SHALL 验证选中聊天相关的状态管理逻辑。

#### Scenario: 获取当前选中的聊天对象
- **WHEN** selectedChatId 为 null
- **THEN** 系统 SHALL 返回 null
- **WHEN** selectedChatId 有值且在 chatList 中存在
- **THEN** 系统 SHALL 返回对应的完整聊天对象
- **WHEN** selectedChatId 有值但对应聊天不存在
- **THEN** 系统 SHALL 返回 undefined

### Requirement: 聊天列表过滤测试
测试系统 SHALL 验证能够正确过滤出未删除的聊天列表。

#### Scenario: 获取未删除的聊天列表
- **WHEN** chatList 中包含已删除和未删除的聊天
- **THEN** 系统 SHALL 只返回 isDeleted 为 false 的聊天列表
