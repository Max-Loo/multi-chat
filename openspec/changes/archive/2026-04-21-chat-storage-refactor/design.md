## Context

当前聊天数据以 `Chat[]` 数组形式存储在单个 `chats` key 下。Tauri 端写入 `chats.json` 文件，Web 端写入 IndexedDB 的单条记录。每次消息变更都触发全量序列化和写入。Redux 中 `chatList` 持有所有聊天（含已软删除的）的完整数据（包括全部消息历史），侧边栏只需要 `id` 和 `name`。

`StoreCompat` 接口已支持多 key 操作（`get`/`set`/`delete`/`keys`），两端后端（Tauri JSON 文件和 IndexedDB）都天然支持多个 key-value 对。

## Goals / Non-Goals

**Goals:**
- 将聊天存储从单 key 全量数组改为每聊天独立 key + 索引 key
- 初始化只加载活跃聊天的元数据（`id`、`name`、`isManuallyNamed`、`modelIds`），不加载消息内容
- 选中聊天时从存储按需加载完整数据（含消息），离开时可选释放
- 删除聊天从 Redux 中彻底移除，存储中标记 `isDeleted: true` 并保留
- 已删除聊天可被导出功能读取
- 消息更新时只序列化和写入单个聊天，不再全量替换

**Non-Goals:**
- 不实现消息级别的增量写入（仍以整个 Chat 对象为单位写入单个 key）
- 不实现虚拟滚动或消息分页渲染
- 不修改 Model 存储结构（Model 不走此方案）
- 不实现"清空回收站"功能（已删除聊天永久保留在存储中）
- 不修改 `runningChat` 的结构（流式推送的临时数据仍保持在 Redux）

## Decisions

### 1. 存储格式：索引 + 每聊天独立 key

**选择**：`chat_index` 存储元数据数组，`chat_<id>` 存储完整 Chat 对象

**替代方案**：只存 `chat_<id>` 无索引，初始化时遍历所有 key — 但 `keys()` 返回所有 key 需逐个 `get()`，增加 I/O 次数

**理由**：索引一次性加载，提供 O(1) 的列表渲染；单聊天的读写互不影响

```
存储结构:
  'chat_index' → ChatMeta[]              ← 轻量索引，所有聊天（含已删除）的元数据
  'chat_aaa'   → Chat                    ← 完整数据（活跃）
  'chat_bbb'   → Chat (isDeleted: true)  ← 完整数据（已删除，但数据在）

ChatMeta = { id, name, isManuallyNamed, modelIds, isDeleted, updatedAt }

注意：当前 Chat 类型不含 updatedAt 字段，需先在 Chat 类型中新增 updatedAt?: number，在聊天创建和每次变更时更新该值。chatToMeta 从 chat.updatedAt 提取而非生成新时间戳。
```

### 2. Redux state 结构

**选择**：分离元数据列表和活跃聊天数据

```typescript
interface ChatSliceState {
  chatMetaList: ChatMeta[];              // 从 chat_index 加载，过滤掉 isDeleted
  activeChatData: Record<string, Chat>;  // 按需加载的完整聊天数据，key 是 chatId
  sendingChatIds: Set<string>;           // 正在发送消息的聊天 ID 集合，防止发送中被释放
  selectedChatId: string | null;
  runningChat: ...;                      // 不变
  loading: boolean;
  error: string | null;
  initializationError: string | null;
}
```

**替代方案**：保持 `chatList: Chat[]` 结构，在存储层做拆分但 Redux 层透明 — 会丢失按需加载的内存优化

**理由**：分离后 `chatMetaList` 的变更频率极低（只在增删改聊天时变化），侧边栏订阅 `chatMetaList` 不再因消息更新而重渲染。`activeChatData` 按需填充和释放。

### 3. 按需加载时机

**选择**：`setSelectedChatIdWithPreload` thunk 扩展为同时加载聊天数据

**流程**：
1. 用户点击聊天 → dispatch `selectChat(chatId)`
2. thunk 检查 `activeChatData[chatId]` 是否已存在
3. 不存在则 `store.get('chat_<id>')` 加载
4. 加载完成后 dispatch `setActiveChatData({ chatId, chat })`
5. 离开聊天时可选 dispatch `clearActiveChatData(chatId)` 释放内存

**替代方案**：初始化时加载所有活跃聊天的完整数据 — 违背按需加载的目标

**理由**：复用已有的 `setSelectedChatIdWithPreload` thunk，最小化改动面

### 4. 持久化策略

**选择**：变更时只写入受影响的聊天 key + 必要时更新索引

| 操作 | 写入 key | 说明 |
|---|---|---|
| 发送消息完成 | `chat_<id>` | 只更新当前聊天 |
| 创建聊天 | `chat_<id>` + `chat_index` | 写入新聊天 + 更新索引 |
| 删除聊天 | `chat_<id>` + `chat_index` | 标记 isDeleted + 从索引中标记 |
| 重命名 | `chat_<id>` + `chat_index` | 更新 name 字段 |
| 自动命名 | `chat_<id>` + `chat_index` | 同上 |

**替代方案**：每次变更只写 `chat_<id>`，索引在下次启动时重建 — 可能导致索引和实际数据不一致

### 5. 删除流程

**选择**：Redux 彻底移除 + 存储标记保留，发送中聊天不可删除

1. dispatch `deleteChat({ chat })` — reducer 检查 `sendingChatIds.has(chat.id)`，若正在发送则跳过（不执行任何 state 变更）
2. 若未在发送中：从 `chatMetaList` 移除，从 `activeChatData` 移除
3. 中间件触发：从 `action.payload.chat`（非 state）获取聊天数据，执行 `store.set('chat_<id>', { ...chat, isDeleted: true })` + `store.set('chat_index', updatedIndex)`

> **关键时序说明**：listener middleware 在 reducer 执行之后运行 effect，此时 state 中已无该聊天数据。因此中间件必须从 `action.payload.chat` 读取原始聊天对象，不能从 `getState()` 中查找。

> **发送中保护说明**：当前软删除（`isDeleted = true`）不移除聊天数据，`appendHistoryToModel` 仍可正常写入。新方案改为硬移除后，若删除正在发送的聊天，后续 `sendMessage.fulfilled` 调用 `appendHistoryToModel` 时 `activeChatData[chatId]` 不存在，导致消息静默丢失。因此必须在 reducer 中拒绝删除发送中的聊天，UI 层也应据此禁用删除按钮。

### 6. 数据迁移

**选择**：应用启动时检测旧格式并自动迁移

**强制写入顺序**（任何偏离都可能导致数据丢失）：
1. 检测 `chat_index` key 是否存在
2. 不存在则读取旧 `chats` key
3. 将数组拆分为多个 `chat_<id>` + `chat_index`
4. **第一步**：写入所有 `chat_<id>` key（Tauri 端先 `set()` 所有 key，最后一次 `save()` 减少磁盘 I/O）
5. **第二步**：写入 `chat_index`
6. **第三步**：删除旧 `chats` key
7. 迁移是幂等的，多次执行不会丢数据（前提是旧 `chats` key 只在 `chat_index` 写入后才删除）

### 7. 发送中聊天的数据保护

**选择**：通过 `sendingChatIds` 集合标记发送状态，阻止 `clearActiveChatData` 释放发送中的聊天

**追踪粒度**：基于 `startSendChatMessage`（per-chat）而非 `sendMessage`（per-model）生命周期。`startSendChatMessage` 通过 `Promise.all` 并发 dispatch 多个 `sendMessage`，其 `fulfilled/rejected` 自然等价于"该聊天所有 model 均已完成"，无需在 reducer 中遍历 `runningChat` 判断完成状态。

**流程**：
1. `startSendChatMessage.pending` → 将 `chatId` 加入 `sendingChatIds`
2. `startSendChatMessage.fulfilled` / `startSendChatMessage.rejected` → 将 `chatId` 从 `sendingChatIds` 移除
3. `clearActiveChatData(chatId)` 执行前检查 `sendingChatIds.has(chatId)`，若正在发送则跳过释放
4. `appendHistoryToModel` 操作 `activeChatData[chatId]`，若 key 不存在则 log error 并返回 false

**理由**：用户可能在消息发送期间切换聊天，若 `clearActiveChatData` 释放了发送中聊天的数据，`sendMessage.fulfilled` 中的 `appendHistoryToModel` 会因 `activeChatData[chatId]` 不存在而静默丢失消息。使用 `startSendChatMessage` 生命周期避免了跨 model 状态耦合，且不受发送期间增删 model 的影响。

## Risks / Trade-offs

- **[迁移失败]** 首次迁移时如果写入中断（崩溃），可能存在部分 key 已写入但索引未更新的情况 → 迁移逻辑在写入所有 `chat_<id>` 后最后写 `chat_index`，保证原子性优先级；启动时检测到无索引但有部分 `chat_*` key 时重新从旧格式迁移
- **[内存不释放]** `activeChatData` 中的聊天数据可能随切换累积 → 提供 `clearActiveChatData` action，聊天切换时清理上一个（跳过 `sendingChatIds` 中的聊天）；或限制 `activeChatData` 最大数量（LRU）
- **[存储中已删除数据膨胀]** 已删除聊天永远保留在存储中 → 后续可加"清空回收站"功能，当前不处理
- **[并发写入]** 多模型同时完成流式响应时，多个 `sendMessage.fulfilled` 可能同时写同一个 `chat_<id>` → `save()` 是 `await` 的，Redux middleware 串行执行 listener，不会真正并发
