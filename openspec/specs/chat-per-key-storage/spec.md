## Purpose

聊天数据按独立 key 存储，每个聊天使用 `chat_<id>` 作为独立 key，配合 `chat_index` 索引管理，替代原有的单一 `chats` key 全量存储。

## Requirements

### Requirement: 聊天数据按独立 key 存储
系统 SHALL 将每个聊天以独立 key（`chat_<id>`）存储在 Store 中，替代原有的单一 `chats` key 全量数组存储。

#### Scenario: 保存单个聊天数据
- **WHEN** 聊天数据发生变更（消息更新、重命名等）
- **THEN** 系统 SHALL 只写入该聊天对应的 `chat_<id>` key
- **AND** 系统 SHALL 不修改其他聊天的 key

#### Scenario: 读取单个聊天数据
- **WHEN** 需要获取某个聊天的完整数据
- **THEN** 系统 SHALL 通过 `chat_<id>` key 读取该聊天的完整 Chat 对象
- **AND** 系统 SHALL 不读取其他聊天的数据

### Requirement: 聊天索引维护
系统 SHALL 维护一个 `chat_index` key，存储所有聊天（含已删除）的轻量元数据列表。

#### Scenario: 创建聊天时更新索引
- **WHEN** 用户创建新聊天
- **THEN** 系统 SHALL 将新聊天的元数据追加到 `chat_index` 数组
- **AND** 系统 SHALL 写入 `chat_<id>` 存储完整数据
- **AND** 系统 SHALL 同时更新索引和聊天数据

#### Scenario: 删除聊天时更新索引
- **WHEN** 用户删除聊天
- **AND** 该聊天不在 `sendingChatIds` 中（没有正在发送的消息）
- **THEN** 系统 SHALL 将该聊天在 `chat_index` 中的 `isDeleted` 字段设为 `true`
- **AND** 系统 SHALL 将 `chat_<id>` 的数据标记 `isDeleted: true` 后写回存储
- **AND** 系统 SHALL 从 Redux 中彻底移除该聊天
- **AND** 中间件 SHALL 从 `action.payload.chat`（非 Redux state）获取聊天原始数据用于标记 `isDeleted`

#### Scenario: 拒绝删除正在发送的聊天
- **WHEN** 用户删除聊天
- **AND** 该聊天在 `sendingChatIds` 中（有消息正在发送）
- **THEN** 系统 SHALL 不执行任何 state 变更
- **AND** 系统 SHALL 在 UI 层禁用该聊天的删除操作

#### Scenario: 重命名聊天时更新索引
- **WHEN** 用户重命名聊天
- **THEN** 系统 SHALL 更新 `chat_index` 中对应条目的 `name` 字段
- **AND** 系统 SHALL 更新 `chat_<id>` 中的 `name` 字段

### Requirement: 索引元数据结构
`chat_index` 中的每条元数据 SHALL 包含以下字段：`id`、`name`、`isManuallyNamed`、`modelIds`、`isDeleted`、`updatedAt`。

#### Scenario: 从完整 Chat 对象生成元数据
- **WHEN** 系统需要从 Chat 对象生成索引元数据
- **THEN** 系统 SHALL 提取 `id`、`name`、`isManuallyNamed`
- **AND** 系统 SHALL 从 `chatModelList` 提取所有 `modelId` 生成 `modelIds` 数组
- **AND** 系统 SHALL 设置 `isDeleted` 字段（默认为 `false`）
- **AND** 系统 SHALL 从 `chat.updatedAt` 提取更新时间（`updatedAt` 字段需先在 `Chat` 类型中新增并在每次变更时维护）

### Requirement: 数据迁移
系统 SHALL 在首次启动时检测旧格式存储并自动迁移到新格式。

#### Scenario: 检测并迁移旧格式数据
- **WHEN** 应用启动时 `chat_index` key 不存在
- **AND** 存在旧的 `chats` key 包含 Chat 数组
- **THEN** 系统 SHALL 将数组中每个 Chat 写入独立的 `chat_<id>` key
- **AND** 系统 SHALL 生成 `chat_index` 并写入
- **AND** 系统 SHALL 删除旧的 `chats` key

#### Scenario: 新安装无旧数据
- **WHEN** 应用首次安装启动
- **AND** 不存在 `chat_index` 和 `chats` key
- **THEN** 系统 SHALL 初始化空的 `chat_index` 数组
- **AND** 系统 SHALL 不执行迁移逻辑
