## 1. Redux Slice 修改

- [x] 1.0 在 `src/store/slices/chatSlices.ts` 中新增 `releaseCompletedBackgroundChat` reducer action，接收 `chatId` 参数，当 `selectedChatId !== chatId` 时删除 `activeChatData[chatId]`
- [x] 1.1 在 `chatSlice.actions` 导出中新增 `releaseCompletedBackgroundChat` 的导出

## 2. 中间件修改

- [x] 2.0 在 `src/store/middleware/chatMiddleware.ts` 中导入 `releaseCompletedBackgroundChat`
- [x] 2.1 修改保存聊天的 listener effect：在 `await saveChatAndIndex(...)` 完成后，检查 `currentState.chat.selectedChatId !== chatId`，若成立则 dispatch `releaseCompletedBackgroundChat(chatId)`

## 3. 测试

- [x] 3.0 为 `releaseCompletedBackgroundChat` reducer 编写单元测试：覆盖「非当前选中时删除」和「当前选中时保留」两个场景
- [x] 3.1 修改 `chatMiddleware` 测试：验证 `startSendChatMessage.fulfilled` 和 `rejected` 触发的保存完成后，后台聊天的 `activeChatData` 被正确回收
- [x] 3.2 补充测试：发送结束后用户已切回该聊天时，`activeChatData` 不被回收
