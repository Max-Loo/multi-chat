## 1. 数据层：重新生成覆盖策略

- [x] 1.1 在 `src/types/chat.ts` 中为 `RunningChatEntry` 类型新增 `rollbackContent?: string` 和 `rollbackReasoningContent?: string` 可选字段
- [x] 1.2 在 `src/store/slices/chatSlices.ts` 中调整 `regenerateMessage` thunk 执行顺序：先为每个启用模型 dispatch `editRegenerateInit` 创建 runningChat 条目，再 dispatch `commitRegenerate`（确保回滚字段可写入）
- [x] 1.3 在 `src/services/chat/chatHistoryHelper.ts` 中修改 `commitRegenerate`：遍历所有 ChatModel 时，将旧 content/reasoningContent 暂存到已存在的 `runningChat[chatId][modelId]` 回滚字段中，原地覆盖最后元素为空字符串
- [x] 1.4 在 `src/services/chat/chatHistoryHelper.ts` 中修改 `rollbackRegenerate`：从 `runningChat[chatId][modelId]` 回滚字段恢复旧 content/reasoningContent，清除回滚字段

## 2. UI 层：用户消息操作栏布局重构

- [x] 2.1 在 `ChatBubble.tsx` 的 USER case 中，将 `ActionToolbar` 和 `HistoryPager` 从 `<Card>` 内部移到 Card 外部独立行
- [x] 2.2 将 `HistoryPager` 和 `ActionToolbar` 合并到同一 flex 行，操作按钮在左，翻页器在右侧，整体右对齐
- [x] 2.3 调整外层容器结构，确保操作栏行和 Card 同宽（`max-w-[80%]`）

## 3. UI 层：AI 消息调整

- [x] 3.1 在 `ChatBubble.tsx` 的 ASSISTANT case 中移除 `<HistoryPager>` 渲染
- [x] 3.2 在 `ChatBubble.tsx` 的 ASSISTANT case 中修改 `showActions` 逻辑，增加 `!isRunning` 条件，生成中隐藏操作栏

## 4. 验证

- [x] 4.1 运行 `pnpm tsc` 确认类型检查通过
- [x] 4.2 运行 `pnpm test` 确认所有测试通过
