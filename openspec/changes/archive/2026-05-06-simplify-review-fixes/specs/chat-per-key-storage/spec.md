## MODIFIED Requirements

### Requirement: 聊天数据按独立 key 存储
系统 SHALL 将每个聊天以独立 key（`chat_<id>`）存储在 Store 中。`saveChatAndIndex` 和 `deleteChatFromStorage` 函数 SHALL 合并磁盘刷写操作，使用单次 `init()` + 批量 `set()` + 单次 `save()`，SHALL NOT 为每个子操作分别调用 `save()`。

#### Scenario: 保存单个聊天数据及其索引
- **WHEN** 聊天数据发生变更需要同时更新聊天内容和索引
- **THEN** 系统 SHALL 调用一次 `chatsStore.init()`
- **AND** 系统 SHALL 调用两次 `chatsStore.set()`（分别写入聊天数据和索引）
- **AND** 系统 SHALL 调用一次 `chatsStore.save()` 完成磁盘刷写
- **AND** 系统 SHALL NOT 在中间步骤调用额外的 `save()`

#### Scenario: 删除聊天时合并磁盘刷写
- **WHEN** 删除聊天需要同时写入标记数据和更新索引
- **THEN** 系统 SHALL 使用与 `saveChatAndIndex` 相同的合并刷写模式
- **AND** 系统 SHALL 调用一次 `init()` + 批量 `set()` + 一次 `save()`

#### Scenario: 读取单个聊天数据
- **WHEN** 需要获取某个聊天的完整数据
- **THEN** 系统 SHALL 通过 `chat_<id>` key 读取该聊天的完整 Chat 对象
