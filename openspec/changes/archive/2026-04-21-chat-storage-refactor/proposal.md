## Why

当前所有聊天数据（含全部消息历史）以单个 key 存储在同一个 `chats` 键下，每次消息更新都触发全量序列化和写入。随着聊天数量增长，初始化加载变慢、内存占用持续膨胀、序列化开销线性增加。同时已删除的聊天（`isDeleted: true`）永远保留在 Redux 内存中，无法被清理也无法被导出。

## What Changes

- **BREAKING** 将聊天存储从单 key（`chats` → 全量数组）改为每聊天独立 key（`chat_<id>` → 单个 Chat），新增 `chat_index` 索引 key 存储轻量元数据
- **BREAKING** 初始化时不再加载已标记 `isDeleted` 的聊天到 Redux，只加载活跃聊天的元数据到索引
- **BREAKING** `deleteChat` 从 Redux 中彻底移除（非软标记），存储中保留并标记 `isDeleted: true`
- 新增按需加载能力：切换聊天时从存储加载完整消息数据
- 新增已删除聊天的导出能力：从存储直接读取含 `isDeleted` 标记的聊天数据

## Capabilities

### New Capabilities
- `chat-per-key-storage`: 聊天数据按独立 key 存储，包含索引维护、单聊天读写、增量更新机制
- `chat-lazy-loading`: 聊天消息按需加载，初始化只加载索引元数据，选中聊天时才加载完整消息
- `chat-export`: 聊天导出功能，支持导出活跃聊天和已删除聊天

### Modified Capabilities
- `json-data-persistence`: 存储格式从单 key 全量数组变更为每聊天独立 key + 索引 key

## Impact

- **存储层**: `src/store/storage/chatStorage.ts` — 读写逻辑完全重写
- **Redux Slice**: `src/store/slices/chatSlices.ts` — state 结构变更，`chatList` 改为轻量索引，新增 `activeChatData` 存放当前选中聊天的完整数据，新增 `sendingChatIds` 追踪发送状态防止数据被误释放（基于 `startSendChatMessage` per-chat 生命周期）
- **类型定义**: `src/types/chat.ts` — `Chat` 类型新增 `updatedAt` 字段
- **选择器**: `src/store/selectors/chatSelectors.ts` — 适配新的 state 结构
- **中间件**: `src/store/middleware/chatMiddleware.ts` — 保存逻辑从全量序列化改为单聊天写入
- **初始化**: `src/config/initSteps.ts` — 只加载索引
- **聊天页面**: `src/pages/Chat/` — 选中聊天时触发按需加载
- **数据迁移**: 首次启动时需将旧格式（单 key 数组）迁移到新格式（每聊天独立 key）
