## 1. 合并列表与渲染逻辑

- [x] 1.1 在 Detail 组件中创建 `displayList`（合并 historyList + 流式消息），使用 `useMemo` 依赖 `historyList`、`runningChatData?.isSending`、`runningChatData?.history`
- [x] 1.2 将 Virtualizer 内的 `historyList.map()` 替换为 `displayList.map()`，区分最后一项是否为流式消息（`isRunning`）
- [x] 1.3 在 Virtualizer 外部保留 loading spinner（条件：`isSending && !content && !reasoningContent`）

## 2. 滚动逻辑统一

- [x] 2.1 将 `historyLengthRef` 替换为 `displayLengthRef`，跟踪 `displayList.length`
- [x] 2.2 更新 `scrollToBottom` 使用 `displayLengthRef.current - 1` 作为 `scrollToIndex` 的索引
- [x] 2.3 验证流式自动跟随 effect（`runningChatData` 变化时 `scrollToBottom`）能正确滚到流式消息

## 3. 清理

- [x] 3.1 删除 `RunningBubble.tsx` 文件
- [x] 3.2 移除 Detail 中对 `RunningBubble` 的 import 和 JSX 引用
- [x] 3.3 确认无其他文件引用 `RunningBubble`

## 4. 验证

- [ ] 4.1 测试流式期间点击「滚动到底部」按钮能正确到达内容底部
- [ ] 4.2 测试流式自动跟随行为正常（在底部时跟随，向上滚动时停止）
- [ ] 4.3 测试流式结束到历史消息的过渡无闪烁
- [ ] 4.4 测试多面板场景下各面板独立渲染不互相影响
- [x] 4.5 运行 `pnpm tsc` 和 `pnpm lint` 确认无类型和 lint 错误
