## 1. 提取辅助函数

- [x] 1.1 在 `src/store/slices/chatSlices.ts` 中 slice 定义之前添加 `appendHistoryToModel` 辅助函数，类型签名为 `(state: WritableDraft<ChatSliceState>, chatId: string, modelId: string, message: StandardMessage | null): boolean`，函数开头对 message 做 null 守卫
- [x] 1.2 为辅助函数添加中文 JSDoc 注释

## 2. 替换重复逻辑

- [x] 2.1 替换 `pushChatHistory` reducer（约 399-413 行）中的内联逻辑为 `appendHistoryToModel` 调用
- [x] 2.2 替换 `sendMessage.fulfilled` 处理器（约 463-476 行）中的内联逻辑为 `appendHistoryToModel` 调用，保留 `if (!appendHistoryToModel(...)) return` 守卫以确保追加失败时跳过后续 `delete` 清理逻辑
- [x] 2.3 替换 `startSendChatMessage.rejected` 处理器（约 531-547 行）中的内联逻辑为 `appendHistoryToModel` 调用

## 3. 验证

- [x] 3.1 运行 `pnpm tsc` 确认类型检查通过
- [x] 3.2 运行 `pnpm test` 确认所有现有测试通过
