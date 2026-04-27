## 1. 类型定义

- [x] 1.0 在 `src/types/chat.ts` 的 `Chat` 类型中新增 `updatedAt?: number` 字段，表示最后一次更新时间（秒级时间戳）
- [x] 1.1 在 `src/types/chat.ts` 中新增 `ChatMeta` 类型（`id`, `name`, `isManuallyNamed`, `modelIds`, `isDeleted`, `updatedAt`），以及 `chatToMeta(chat: Chat): ChatMeta` 转换函数（`updatedAt` 从 `chat.updatedAt` 提取，`modelIds` 从 `chatModelList` 派生）
- [x] 1.2 在 `createChat` reducer 中初始化 `updatedAt` 为当前时间戳；在 `editChat`、`editChatName`、`sendMessage.fulfilled`、`generateChatName.fulfilled` 等变更处同步更新 `updatedAt`

## 2. 存储层重构

- [x] 2.1 重写 `src/store/storage/chatStorage.ts`：新增 `loadChatIndex()` 读取 `chat_index`，`saveChatIndex(index)` 写入索引
- [x] 2.2 新增 `loadChatById(chatId)` 从 `chat_<id>` 读取单个聊天完整数据
- [x] 2.3 新增 `saveChatById(chatId, chat)` 写入单个聊天数据
- [x] 2.4 新增 `saveChatAndIndex(chatId, chat, index)` 同时写入聊天数据和更新索引
- [x] 2.5 新增 `deleteChatFromStorage(chatId, index)` 将聊天标记 `isDeleted` 后写回存储并更新索引
- [x] 2.6 新增 `migrateOldChatStorage()` 检测旧 `chats` key 并迁移为每聊天独立 key + 索引格式（迁移时为缺少 `updatedAt` 的旧聊天补充当前时间戳）。**强制顺序**：(1) 写入所有 `chat_<id>` key（Tauri 端先 `set()` 所有 key，最后一次 `save()`）；(2) 写入 `chat_index`；(3) 删除旧 `chats` key。旧 `chats` key 只在 `chat_index` 写入成功后才可删除

## 3. Redux Slice 重构

- [x] 3.1 修改 `ChatSliceState`：`chatList: Chat[]` 改为 `chatMetaList: ChatMeta[]`，新增 `activeChatData: Record<string, Chat>`，新增 `sendingChatIds: Set<string>` 追踪正在发送的聊天
- [x] 3.2 修改 `initializeChatList` thunk：调用 `loadChatIndex()` 并过滤 `isDeleted` 后写入 `chatMetaList`
- [x] 3.3 修改 `deleteChat` reducer：检查 `sendingChatIds.has(chat.id)`，若正在发送则跳过不执行任何变更；否则从 `chatMetaList` 彻底移除（非软标记），同时从 `activeChatData` 中移除
- [x] 3.4 修改 `createChat` reducer：同时更新 `chatMetaList` 和 `activeChatData`
- [x] 3.5 修改 `editChat` / `editChatName` reducer：同步更新 `chatMetaList` 中的对应条目，并同时更新 `activeChatData[chatId]`（若已加载）。当前 `editChat` 做 `chatList[idx] = { ...chat }` 完整替换（如 `ModelSelect` 用它变更 `chatModelList`），若不同步 `activeChatData` 会导致中间件从 `activeChatData` 持久化时写入旧数据，静默丢失模型配置
- [x] 3.6 修改 `setSelectedChatIdWithPreload` thunk：加载选中聊天的完整数据到 `activeChatData`，清理上一个聊天的数据（跳过 `sendingChatIds` 中的聊天）
- [x] 3.7 修改 `sendMessage` / `startSendChatMessage` thunk：从 `activeChatData` 获取聊天数据；`startSendChatMessage.pending` 将 chatId 加入 `sendingChatIds`，`startSendChatMessage.fulfilled/rejected` 将 chatId 从 `sendingChatIds` 移除（基于 per-chat 生命周期而非 per-model）
- [x] 3.8 修改 `appendHistoryToModel`：操作 `activeChatData[chatId]` 而非 `chatList`，若 `activeChatData[chatId]` 不存在则 log error 并返回 false
- [x] 3.9 修改 `generateChatName` thunk 相关的 extraReducers：适配新 state 结构，同时更新 `chatMetaList` 中对应条目的 `name` 字段和 `activeChatData[chatId].name`（若已加载）
- [x] 3.10 新增 `setActiveChatData` 和 `clearActiveChatData` action，其中 `clearActiveChatData` 检查 `sendingChatIds`，跳过正在发送的聊天

## 4. 选择器适配

- [x] 4.1 修改 `src/store/selectors/chatSelectors.ts`：`selectSelectedChat` 从 `activeChatData` 中获取完整数据
- [x] 4.2 新增 `selectChatMetaList` 选择器，返回过滤后的活跃聊天元数据列表
- [x] 4.3 新增 `selectSelectedChatMeta` 选择器，返回当前选中聊天的元数据

## 5. 中间件适配

- [x] 5.1 修改 `src/store/middleware/chatMiddleware.ts` 保存逻辑：根据 action 类型调用对应的存储函数（单聊天写入 + 索引更新）。**关键**：`deleteChat` 的中间件 effect 必须从 `action.payload.chat` 获取聊天数据（非 `getState()`），因为 reducer 已将聊天从 state 中移除
- [x] 5.2 修改自动命名中间件：从 `activeChatData` 获取聊天数据进行条件检查

## 6. 组件适配

- [x] 6.1 修改 `src/hooks/useExistingChatList.ts`：从 `chatMetaList` 获取数据（不再需要 `isDeleted` 过滤）
- [x] 6.2 修改 `src/hooks/useCurrentSelectedChat.ts`：从 `activeChatData` 获取完整聊天数据
- [x] 6.3 修改 `src/pages/Chat/components/Sidebar/` 相关组件：适配 `ChatMeta` 类型；正在发送的聊天（`sendingChatIds` 中）禁用删除按钮
- [x] 6.4 修改 `src/pages/Chat/components/Panel/Detail/` 相关组件：从 `activeChatData` 获取消息数据
- [x] 6.5 修改 `src/pages/Chat/index.tsx` 路由守卫：使用 `chatMetaList` 进行 URL 合法性检查

## 7. 初始化迁移

- [x] 7.1 修改 `src/config/initSteps.ts` 中 `chatList` 步骤：先调用 `migrateOldChatStorage()` 再执行 `initializeChatList`

## 8. 导出功能

- [x] 8.1 新增 `src/services/chatExport.ts`：实现 `exportAllChats()` 和 `exportDeletedChats()` 函数，从存储直接读取数据
- [x] 8.2 在设置页面或其他合适位置添加导出入口 UI

## 9. 测试

- [x] 9.1 为 `chatStorage.ts` 新增函数编写单元测试（索引读写、单聊天读写、迁移逻辑）
- [x] 9.2 修改现有 `chatSlices` 测试以适配新 state 结构
- [x] 9.3 修改现有 `chatMiddleware` 测试以适配新的存储调用模式
