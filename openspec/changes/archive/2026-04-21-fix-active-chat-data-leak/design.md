## Context

当前 `activeChatData` 的清理时机只有一处：`setSelectedChatIdWithPreload.fulfilled` 中清理上一个聊天（跳过 `sendingChatIds` 中的）。但当一个聊天处于发送状态时被切走，发送结束后没有任何机制回收它的 `activeChatData`，导致内存泄漏。

Redux 的处理顺序保证了 reducer 先于 listener middleware 执行，因此不能在 `extraReducers` 中直接清理——此时 middleware 尚未完成持久化，`activeChatData` 被删后 middleware 的 `getState()` 会拿到 `undefined`，导致数据丢失。

## Goals / Non-Goals

**Goals:**
- 在发送结束且持久化完成后，自动回收非当前选中聊天的 `activeChatData`
- 保证数据安全：清理必须在持久化之后
- 保持与现有 `clearActiveChatData` 和 `sendingChatIds` 保护机制的一致性

**Non-Goals:**
- 不修改 `clearActiveChatData` 的现有行为和语义
- 不修改 `sendingChatIds` 的生命周期管理
- 不实现 LRU 等更复杂的缓存回收策略

## Decisions

### 1. 新增专用 reducer action

**选择**：新增 `releaseCompletedBackgroundChat` action，仅在「发送结束、非当前选中」的场景使用

**替代方案**：复用 `clearActiveChatData` — 但该 action 的语义是通用的手动清理，且保护条件（跳过 `sendingChatIds`）在这个场景下已经无意义（`sendingChatIds` 已被 `extraReducers` 删除），会导致语义混乱

**理由**：专用 action 语义清晰，保护条件独立（只检查 `selectedChatId`），不干扰其他清理路径

```typescript
releaseCompletedBackgroundChat: (state, action: PayloadAction<string>) => {
  const chatId = action.payload;
  if (state.selectedChatId !== chatId) {
    delete state.activeChatData[chatId];
  }
}
```

### 2. 在 middleware 中持久化完成后触发清理

**选择**：在 `saveChatListMiddleware` 的保存 effect 中，仅在 `startSendChatMessage.fulfilled/rejected` 匹配且 `saveChatAndIndex` 完成后，dispatch `releaseCompletedBackgroundChat`

**替代方案 A**：在 `extraReducers` 中直接清理 — 会先于 middleware 执行，导致持久化时 `activeChatData` 已被清空，数据丢失

**替代方案 B**：对所有匹配 action 无差别触发清理 — `generateChatName.fulfilled` 可能在其他模型仍在发送时触发保存，此时清理会导致后续模型的 `appendHistoryToModel` 失败，消息丢失

**理由**：`createListenerMiddleware` 的 effect 是 async 函数，在 reducer 同步完成后才运行。在 `await saveChatAndIndex(...)` 之后 dispatch 清理 action，时序安全。但清理必须限定在 `startSendChatMessage.fulfilled/rejected` 两种 action，因为只有此时才能确认聊天的所有模型均已发送完毕

```typescript
// middleware effect 中，仅在发送完成时触发清理
const isSendComplete = startSendChatMessage.fulfilled.match(action) ||
                        startSendChatMessage.rejected.match(action);
if (chatId && chatData) {
  await saveChatAndIndex(chatId, chatData, index);
  if (isSendComplete) {
    const currentState = listenerApi.getState();
    if (currentState.chat.selectedChatId !== chatId) {
      listenerApi.dispatch(releaseCompletedBackgroundChat(chatId));
    }
  }
}
```

### 3. 触发时机：同时覆盖 fulfilled 和 rejected

**选择**：`startSendChatMessage.fulfilled` 和 `startSendChatMessage.rejected` 都触发清理

**理由**：无论发送成功还是失败，发送结束后聊天数据都已被 middleware 持久化（rejected 时 `startSendChatMessage.rejected` 的 extraReducers 会先将 `runningChat` 回写到 `activeChatData`，middleware 再持久化），后台聊天都应该被回收

## Risks / Trade-offs

- **[清理后需要再次访问]** 后台聊天被清理后，如果用户再次选中它，需要重新从存储加载 → 这是已有的按需加载机制，不影响正确性，只是多一次 I/O
- **[dispatch 时序]** middleware effect 中 dispatch 新 action 会触发额外的 reducer 循环 → 开销极低，只是 `delete` 一个 key
