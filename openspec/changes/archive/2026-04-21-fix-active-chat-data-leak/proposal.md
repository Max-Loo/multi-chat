## Why

当聊天处于发送状态时用户切换到其他聊天，发送结束后该聊天数据会永久残留在 Redux 的 `activeChatData` 中，没有任何机制回收它。虽然单次泄漏数据量不大，但长时间使用会逐渐累积，且逻辑不自洽——已有清理机制只在「切换时清理上一个」，无法覆盖「后台发送结束后回收」的场景。

## What Changes

- 新增 `releaseCompletedBackgroundChat` reducer action，用于在发送结束后安全回收非当前选中聊天的 `activeChatData`
- 修改 `chatMiddleware`，在 `startSendChatMessage.fulfilled` 和 `startSendChatMessage.rejected` 持久化完成后，dispatch 该 action 回收后台聊天数据

## Capabilities

### New Capabilities
- `active-chat-data-cleanup`: 后台聊天发送结束后的内存回收机制，确保 `activeChatData` 不会因发送中切换而累积

### Modified Capabilities

## Impact

- **Redux Slice**: `src/store/slices/chatSlices.ts` — 新增 `releaseCompletedBackgroundChat` reducer
- **中间件**: `src/store/middleware/chatMiddleware.ts` — 在持久化完成后 dispatch 清理 action
- **测试**: `src/__test__/store/slices/chatSlices.test.ts`、`src/__test__/store/middleware/chatMiddleware.test.ts` — 新增用例
