## Context

`chatSlices.ts` 是聊天状态管理的核心文件（573 行），其中「在 chatList 中定位特定聊天的特定模型并追加历史消息」的导航逻辑出现了 3 次。这三次出现的触发时机不同（发送前、正常完成、异常中断），但执行的操作本质相同。

当前代码使用 Immer（通过 Redux Toolkit）管理 state，支持直接修改 draft 对象。

## Goals / Non-Goals

**Goals:**
- 将重复的 chatList 导航逻辑收敛到一个函数中
- 保持与现有 Immer draft 的兼容性
- 不改变任何外部可观测行为

**Non-Goals:**
- 不重构 chatSlices 的整体拆分（属于更大范围的重构）
- 不修改 Chat 或 StandardMessage 的数据结构
- 不引入新的抽象层或工具库

## Decisions

### 1. 辅助函数放在 chatSlices.ts 文件内部

**选择**: 在 `chatSlices.ts` 文件顶部（slice 定义之前）定义一个模块级函数。

**理由**: 该函数仅被 chatSlice 的 reducers 和 extraReducers 使用，无外部消费者。放在同一文件内可以：
- 直接操作 `ChatSliceState` 类型，无需额外导出
- 保持 Immer draft 的类型一致性
- 避免为单个内部函数创建新文件

**备选方案**: 创建独立的 `chatHistoryHelper.ts` — 过度抽象，目前只有一个调用方文件。

### 2. 函数签名使用 (state, chatId, modelId, message) 四参数

**选择**: 直接传递基础类型而非整个 action 对象。

**理由**: 三处调用点的数据来源不同（有的从 `action.payload` 取，有的从 `action.meta.arg` 取，有的从 `runningChat` 遍历取），统一为基础类型参数更灵活。

**类型签名**:
```typescript
import type { WritableDraft } from '@reduxjs/toolkit'
function appendHistoryToModel(
  state: WritableDraft<ChatSliceState>,
  chatId: string,
  modelId: string,
  message: StandardMessage | null
): boolean
```

`message` 允许 `null` 是因为 `startSendChatMessage.rejected` 中 `historyItem.history` 可能为 null，函数内部在开头做 null 检查统一处理。

### 3. 返回 boolean 表示是否成功

**选择**: 函数返回 `true`/`false` 表示追加是否成功。

**理由**: 现有代码在各处都用 `return` 做静默失败处理（聊天被删除时跳过）。返回 boolean 保留了这一语义，调用方可以选择性地处理失败情况，但目前所有调用点都会忽略返回值（保持现有行为）。

## Risks / Trade-offs

- **[风险] Immer draft 类型兼容性]** → 函数参数类型声明为 `WritableDraft<ChatSliceState>`（从 `immer` 导入）。在 RTK 的 `CaseReducer` 中，`state` 运行时类型是 Immer 的 `WritableDraft`，如果声明为 `ChatSliceState` 会导致嵌套类型不匹配（如 `Draft<string>[]` vs `string[]`）。
- **[风险] 三处行为不完全一致]** → `sendMessage.fulfilled` 在追加后还会清理 `runningChat` 临时数据，`startSendChatMessage.rejected` 需要遍历所有模型。辅助函数只负责"追加消息"这一步，其余逻辑保留在原处。
- **[风险] early return 与清理逻辑的耦合]** → `sendMessage.fulfilled` 中，当前内联导航失败时的 `return` 会跳过后续的 `delete state.runningChat[chat.id][model.id]` 清理。替换后必须保留 `if (!appendHistoryToModel(...)) return` 的守卫，确保清理逻辑仅在追加成功时执行，与现有行为一致。
- **[风险] 类型断言移除]** → 当前 `sendMessage.fulfilled` 第 476 行使用 `as StandardMessage` 强制断言 `currentChatModel.history`（类型为 `StandardMessage | null`）。辅助函数接受 `null` 并在内部守卫，因此断言可安全移除。若 `history` 确实为 null，当前代码会将其强制写入数组，重构后则不会——这是行为改善而非退步。
- **[优化机会] forEach 内重复 findIndex]** → `startSendChatMessage.rejected` 中 `Object.entries(currentChat).forEach(...)` 每次迭代都会在辅助函数内重新查找 chatIdx。这与现有代码行为一致，不影响正确性，未来可考虑将 chatIdx 查找提到循环外优化。
