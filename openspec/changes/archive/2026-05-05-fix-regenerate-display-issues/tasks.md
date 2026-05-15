## 1. 滚动索引保护

- [x] 1.1 `ChatBubble.tsx` — `useEffect([content])` 中增加 `historyIndexOverride !== undefined` 判断，paired 模式下跳过 `onHistoryIndexChange` 调用（仅更新 `internalHistoryIndex`）

## 2. 重新生成追踪状态

- [x] 2.1 `Detail/index.tsx` — 新增 `useState<string | null>(null)` 追踪 `regeneratingMessageId`
- [x] 2.2 `Detail/index.tsx` — `handleRegenerate` 中设置 `regeneratingMessageId`，`dispatch(...).finally()` 清理

## 3. displayList 替换逻辑

- [x] 3.1 `Detail/index.tsx` — 扩展 displayList 条目类型为 `{ message, displayMessage, isRunning }`
- [x] 3.2 `Detail/index.tsx` — displayList 构建逻辑：`regeneratingMessageId` 存在时替换对应条目的 displayMessage 和 isRunning，不追加到末尾；不存在时追加到末尾（新消息，保持当前行为）

## 4. 渲染层适配

- [x] 4.1 `Detail/index.tsx` — ChatBubble 渲染使用 `entry.key`（原始 message.id）作为 key，`entry.displayMessage` 提供 content/reasoningContent/isRunning，`entry.message` 提供 messageId/role/操作属性

## 5. 验证

- [x] 5.1 验证翻到历史版本后上下滚动，historyIndex 不被重置
- [x] 5.2 验证重新生成历史版本时，流式内容在原位显示，不出现额外消息
- [x] 5.3 验证重新生成最新版本时，视觉表现与修改前一致
- [x] 5.4 验证发送新消息时，runningData 追加到末尾，行为不变
- [x] 5.5 验证重新生成失败时 rollback 正常，regeneratingMessageId 被清理
