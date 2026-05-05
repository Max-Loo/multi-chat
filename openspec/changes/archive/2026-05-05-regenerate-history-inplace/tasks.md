## 1. Helper 层：参数化 historyIndex

- [x] 1.1 `chatHistoryHelper.ts` — `commitRegenerate` 新增可选参数 `historyIndex?: number`，覆盖 `arr[targetIndex]` 而非 `arr[arr.length - 1]`，对 historyIndex 做 clamp 越界防护
- [x] 1.2 `chatHistoryHelper.ts` — `rollbackRegenerate` 新增可选参数 `historyIndex?: number`，按 targetIndex 恢复
- [x] 1.3 `chatHistoryHelper.ts` — `updateHistoryContent` 新增可选参数 `historyIndex?: number`，按 targetIndex 写入
- [x] 1.4 新增辅助函数 `getContentAtIndex(content, index)` 用于按索引提取指定版本内容（含越界 clamp）

## 2. Store 层：传递 historyIndex

- [x] 2.1 `chatSlices.ts` — `regenerateMessage` thunk payload 类型新增 `historyIndex?: number`
- [x] 2.2 `chatSlices.ts` — `regenerateMessage` thunk 中将 `historyIndex` 传递给 `commitRegenerate` / `updateHistoryContent`
- [x] 2.3 `chatSlices.ts` — `regenerateMessage` thunk 中按 `historyIndex` 提取用户消息内容作为 API prompt（替代 `getCurrentContent`）
- [x] 2.4 `chatSlices.ts` — `commitRegenerate` / `rollbackRegenerate` reducer payload 类型新增 `historyIndex?: number`
- [x] 2.5 `chatSlices.ts` — `regenerateMessage.rejected` handler 从 `action.meta.arg` 提取 `historyIndex` 并传递给 `rollbackRegenerateHelper`（防止回滚写入错误索引导致数据损坏）

## 3. 组件层：从 ChatBubble 传递 historyIndex

- [x] 3.1 `ChatBubble.tsx` — `ActionToolbar` 的 `onRegenerate` 回调签名改为 `(messageId: string, historyIndex: number) => void`，按钮点击时传入当前 historyIndex
- [x] 3.2 `ChatBubble.tsx` — `ChatBubbleProps.onRegenerate` 回调签名同步更新
- [x] 3.3 `Detail/index.tsx` — `handleRegenerate` 接收 `historyIndex`，传入 `regenerateMessage` thunk
- [x] 3.4 `Detail/index.tsx` — 修改 reset effect：新增 `useRef<Record<string, number>>` 追踪每条消息的 `content.length`，仅在 `newLength > prevLength` 时重置 `pairHistoryIndices`，原地覆盖（长度不变）不触发重置

## 4. 测试验证

- [x] 4.1 验证翻到历史版本时重新生成，content 数组指定索引被覆盖，其余版本不变
- [x] 4.2 验证最新版本重新生成，行为与修改前一致
- [x] 4.3 验证 API prompt 使用对应版本的用户消息
- [x] 4.4 验证 rollback 时按 historyIndex 正确恢复
