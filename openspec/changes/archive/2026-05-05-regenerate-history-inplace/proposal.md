## Why

当前重新生成功能始终覆盖 AI 回复内容的最后一个历史版本，无论用户通过翻页器浏览的是哪个版本。当用户翻到早期版本并点击重新生成时，系统会跳回最新版本并覆盖它，且发送给 API 的 prompt 也总是取用户消息的最新版本——这与用户预期（重新生成当前选中的版本）不符。

## What Changes

- `onRegenerate` 回调签名新增 `historyIndex` 参数，从 ChatBubble 向上传递当前翻页器选中的历史索引
- `regenerateMessage` thunk 接收 `historyIndex`，传递给 `commitRegenerate` / `updateHistoryContent` / `rollbackRegenerate`
- `commitRegenerate` / `rollbackRegenerate` / `updateHistoryContent` 从"始终操作 `arr[arr.length - 1]`"改为"操作 `arr[historyIndex]`"
- 发送给 API 的用户消息 prompt 从 `getCurrentContent(userMessage.content)` 改为按 `historyIndex` 取对应版本
- `Detail/index.tsx` 的 reset effect 改为追踪每条消息的 `content.length`，仅在数组长度增长时（编辑 pushContent）重置 `pairHistoryIndices`，原地覆盖（长度不变）不触发重置

## Capabilities

### New Capabilities

- `regenerate-history-inplace`: 重新生成支持在指定历史版本上原地覆盖，包括 historyIndex 的传递链路和各层 helper 函数的索引参数化

### Modified Capabilities

（无——现有 `message-operations` 和 `chat-history-helper` 的需求不变，仅实现细节调整）

## Impact

- **组件层**：`ChatBubble.tsx`（ActionToolbar 回调签名）、`Detail/index.tsx`（handleRegenerate 参数 + pairHistoryIndices reset effect 条件调整）
- **Store 层**：`chatSlices.ts`（regenerateMessage thunk payload + reducer payload）
- **Helper 层**：`chatHistoryHelper.ts`（commitRegenerate / rollbackRegenerate / updateHistoryContent 新增 historyIndex 参数）
- **无破坏性变更**：historyIndex 默认值为数组末尾索引时，行为与当前完全一致
