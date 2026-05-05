## 1. 数据结构变更

- [x] 1.1 在 `src/types/chat.ts` 中将 `StandardMessage` 的 `content` 类型从 `string` 改为 `string | string[]`
- [x] 1.2 在 `src/types/chat.ts` 中将 `StandardMessage` 的 `reasoningContent` 类型从 `string | undefined` 改为 `string | string[] | undefined`
- [x] 1.3 实现 `getCurrentContent(content: string | string[]): string` helper 函数 — string 取自身，string[] 取最后一个元素
- [x] 1.4 在 `src/services/chat/messageTransformer.ts` 的 `buildMessages` 中，使用 `getCurrentContent` 读取 content
- [x] 1.5 修复所有因类型变更产生的 TypeScript 编译错误

## 2. 消息操作辅助函数（位置索引定位）

- [x] 2.1 实现位置索引定位逻辑：接收 messageId，在所有 ChatModel 的 chatHistoryList 中找到包含该 ID 的列表，返回位置索引
- [x] 2.2 实现 `commitEdit(state, chatId, userMessageId, newContent)` — 通过位置索引原子更新用户消息和 AI 回复的 content/reasoningContent 数组；AI 回复不存在时跳过
- [x] 2.3 实现 `rollbackEdit(state, chatId, userMessageId)` — 回滚用户消息和 AI 回复的数组（弹出最后元素，恢复一致性）
- [x] 2.4 实现 `commitRegenerate(state, chatId, assistantMessageId)` — 通过位置索引将旧 AI 回复 push 进数组，追加空字符串占位
- [x] 2.5 实现 `rollbackRegenerate(state, chatId, assistantMessageId)` — 回滚 AI 回复数组（弹出占位元素）
- [x] 2.6 实现 `updateHistoryContent(state, chatId, modelId, messageIndex, content, reasoningContent?)` — 替换 AI 回复 content/reasoningContent 数组最后一个元素，清理 runningChat 条目

## 3. Redux Reducers & Actions

- [x] 3.1 新增 `commitEdit` 同步 reducer
- [x] 3.2 新增 `rollbackEdit` 同步 reducer
- [x] 3.3 新增 `commitRegenerate` 同步 reducer
- [x] 3.4 新增 `rollbackRegenerate` 同步 reducer
- [x] 3.5 新增 `updateHistoryContent` 同步 reducer — 流式完成后替换 AI 回复 content/reasoningContent 数组最后一个元素，清理 runningChat 条目
- [x] 3.6 新增 `editAndResendMessage` 异步 thunk — dispatch commitEdit → 对每个启用模型裁剪历史并调用 streamChatCompletion → 流式完成后 dispatch updateHistoryContent → 失败时 dispatch rollbackEdit
- [x] 3.7 新增 `regenerateMessage` 异步 thunk — dispatch commitRegenerate → 对每个启用模型裁剪历史并调用 streamChatCompletion → 流式完成后 dispatch updateHistoryContent → 失败时 dispatch rollbackRegenerate

## 4. Middleware 持久化

- [x] 4.1 在 `chatMiddleware.ts` 中为 `editAndResendMessage.fulfilled`、`regenerateMessage.fulfilled` 添加持久化监听，触发 `saveChatAndIndex`

## 5. ChatBubble 操作工具栏 UI

- [x] 5.1 扩展 `ChatBubbleProps` 接口 — 新增 `messageId`、`isLatestUserMessage`、`isLastAssistant`、`onCopy`、`onEdit`、`onRegenerate` props；`content` 和 `reasoningContent` 类型改为 `string | string[]`
- [x] 5.2 更新 `arePropsEqual` 比较函数 — 数组类型比较长度 + 最后一个元素
- [x] 5.3 实现操作工具栏组件 — 始终固定显示在气泡左下角，纯图标按钮 + hover tooltip；最新用户消息显示复制/编辑；AI 消息显示复制 + 条件重新生成
- [x] 5.4 实现行内编辑模式 — 点击编辑后气泡变为 Textarea，支持 Enter 确认 / Escape 取消 / 空内容禁用确认
- [x] 5.5 实现编辑历史翻页控件 — content 为 string[] 时显示翻页指示器，支持切换历史版本

## 6. Detail 组件集成

- [x] 6.1 在 `Detail/index.tsx` 中为 ChatBubble 传递操作回调 props — 根据 `historyList` 计算每条消息的 `messageId`、`isLatestUserMessage`、`isLastAssistant`（发送中不显示操作栏）
- [x] 6.2 实现复制回调 — 调用 `copyToClipboard` 并触发 Toast 提示"已复制到剪贴板"
- [x] 6.3 实现编辑回调 — dispatch `editAndResendMessage`
- [x] 6.4 实现重新生成回调 — dispatch `regenerateMessage`

## 7. 国际化

- [x] 7.1 在 `src/locales/zh/chat.json` 中新增操作按钮相关文案（复制、编辑、重新生成、编辑确认、编辑取消、已复制到剪贴板、复制失败）
- [x] 7.2 在 `src/locales/en/chat.json` 中同步英文翻译
- [x] 7.3 在 `src/locales/fr/chat.json` 中同步法文翻译

## 8. 测试验证

- [x] 8.1 为位置索引定位逻辑编写单元测试（正常定位、消息不存在）
- [x] 8.2 为 `commitEdit`、`rollbackEdit` 编写单元测试（含 AI 回复不存在的边界场景）
- [x] 8.3 为 `commitRegenerate`、`rollbackRegenerate`、`updateHistoryContent` 编写单元测试
- [x] 8.4 为 `getCurrentContent` helper 函数编写单元测试
- [x] 8.5 为 `editAndResendMessage`、`regenerateMessage` thunks 编写 Redux 测试（含失败回滚场景）
- [x] 8.6 运行 `pnpm test` 确认所有测试通过
- [x] 8.7 运行 `pnpm tsc` 确认类型检查通过
