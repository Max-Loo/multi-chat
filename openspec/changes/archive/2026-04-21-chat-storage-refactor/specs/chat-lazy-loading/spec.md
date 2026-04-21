## ADDED Requirements

### Requirement: 初始化只加载聊天元数据
应用初始化时 SHALL 只从存储加载 `chat_index`，将其过滤掉 `isDeleted` 条目后存入 Redux 的 `chatMetaList`。

#### Scenario: 正常初始化加载活跃聊天
- **WHEN** 应用启动并执行 `chatList` 初始化步骤
- **THEN** 系统 SHALL 从存储读取 `chat_index`
- **AND** 系统 SHALL 过滤掉 `isDeleted: true` 的条目
- **AND** 系统 SHALL 将过滤后的列表存入 Redux `chatMetaList`
- **AND** 系统 SHALL 不加载任何聊天的消息内容

#### Scenario: 索引为空时初始化
- **WHEN** `chat_index` 不存在或为空数组
- **THEN** 系统 SHALL 将 `chatMetaList` 设为空数组
- **AND** 系统 SHALL 不报错

### Requirement: 选中聊天时按需加载完整数据
当用户选中某个聊天时，系统 SHALL 从存储加载该聊天的完整 Chat 对象（含消息历史）到 Redux `activeChatData`。

#### Scenario: 首次选中聊天加载数据
- **WHEN** 用户点击一个聊天
- **AND** 该聊天的完整数据未在 `activeChatData` 中
- **THEN** 系统 SHALL 从存储读取 `chat_<id>` 的完整数据
- **AND** 系统 SHALL 将数据存入 Redux `activeChatData[chatId]`
- **AND** 系统 SHALL 同时预加载该聊天使用的供应商 SDK

#### Scenario: 再次选中已加载的聊天
- **WHEN** 用户点击一个聊天
- **AND** 该聊天的完整数据已在 `activeChatData` 中
- **THEN** 系统 SHALL 不重复从存储读取
- **AND** 系统 SHALL 直接使用 Redux 中的数据

#### Scenario: 加载失败时降级处理
- **WHEN** 从存储读取聊天数据失败
- **THEN** 系统 SHALL 在控制台记录错误
- **AND** 系统 SHALL 显示错误提示（如 toast）
- **AND** 系统 SHALL 不影响其他聊天的正常使用

### Requirement: 聊天数据内存管理
系统 SHALL 在切换聊天时清理上一个聊天的完整数据以释放内存。

#### Scenario: 切换到新聊天时释放旧数据
- **WHEN** 用户从聊天 A 切换到聊天 B
- **AND** 聊天 A 的数据在 `activeChatData` 中
- **THEN** 系统 SHALL 在聊天 B 数据加载完成后清理聊天 A 的数据
- **AND** 系统 SHALL 保留当前选中聊天的数据
- **AND** 系统 SHALL 跳过正在发送消息的聊天（`sendingChatIds` 中的聊天不可释放）

#### Scenario: 退回聊天列表时释放数据
- **WHEN** 用户取消选中任何聊天（`selectedChatId` 设为 null）
- **THEN** 系统 SHALL 清理 `activeChatData` 中非发送中的数据
- **AND** 系统 SHALL 保留 `sendingChatIds` 中的聊天数据直到发送完成

### Requirement: 发送中聊天的数据保护
系统 SHALL 通过 `sendingChatIds` 集合追踪正在发送消息的聊天，防止其数据被释放。

#### Scenario: 消息发送期间切换聊天
- **WHEN** 聊天 A 正在发送消息（`sendingChatIds` 包含 chatId A）
- **AND** 用户切换到聊天 B
- **THEN** 系统 SHALL 保留聊天 A 在 `activeChatData` 中的数据
- **AND** 系统 SHALL 在聊天 A 所有模型发送完成后释放其数据

#### Scenario: 消息写入时聊天数据不存在
- **WHEN** `appendHistoryToModel` 尝试向 `activeChatData[chatId]` 写入消息
- **AND** `activeChatData[chatId]` 不存在
- **THEN** 系统 SHALL 在控制台记录错误
- **AND** 系统 SHALL 返回 false 表示写入失败
