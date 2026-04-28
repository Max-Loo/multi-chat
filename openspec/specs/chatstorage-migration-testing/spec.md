## Purpose

chatStorage 迁移逻辑的测试规范，覆盖 `migrateOldChatStorage` 和 `deleteChatFromStorage` 函数的正常路径与边界情况。

## Requirements

### Requirement: 迁移函数完整路径测试
`migrateOldChatStorage` 函数的测试 SHALL 覆盖旧数据存在时的完整三步迁移流程。

#### Scenario: 旧数据存在时执行完整迁移
- **WHEN** `chat_index` key 不存在
- **AND** `chats` key 包含有效的 Chat 数组
- **THEN** 每个 Chat 被写入独立的 `chat_<id>` key
- **AND** `chat_index` key 被创建，包含正确的 ChatMeta 列表
- **AND** 旧的 `chats` key 被删除

#### Scenario: 旧聊天缺少 updatedAt 时自动补充
- **WHEN** 旧格式 Chat 数组中存在 `updatedAt` 为 `undefined` 的聊天
- **THEN** 迁移 SHALL 为该聊天补充当前时间戳作为 `updatedAt`

#### Scenario: 索引已存在时跳过迁移
- **WHEN** `chat_index` key 已存在（非 undefined 且非 null）
- **THEN** 函数 SHALL 直接返回，不执行任何迁移操作

#### Scenario: 旧数据为空数组时初始化空索引
- **WHEN** `chat_index` key 不存在
- **AND** `chats` key 为空数组
- **THEN** `chat_index` 被初始化为空数组
- **AND** 旧的 `chats` key 不被删除（无数据需要迁移）

### Requirement: 删除不存在聊天的边界路径测试
`deleteChatFromStorage` 函数的测试 SHALL 覆盖目标聊天不存在于存储中的边界情况。

#### Scenario: 删除不存在的聊天时跳过并警告
- **WHEN** 目标 chatId 对应的 `chat_<id>` key 不存在于存储中
- **THEN** 函数 SHALL 不修改索引
- **AND** 函数 SHALL 不执行写入操作
- **AND** 函数 SHALL 通过 console.warn 输出警告信息
