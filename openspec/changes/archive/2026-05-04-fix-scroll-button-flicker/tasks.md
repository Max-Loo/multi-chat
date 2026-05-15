## 1. 添加 isStreamingRef 保护机制

- [x] 1.1 在 Detail 组件中声明 `isStreamingRef`（`useRef<boolean>(false)`），用于流式自动跟随期间保护 `isAtBottom` 状态
- [x] 1.2 修改流式自动跟随 effect：在触发 `scrollToBottom` 前将 `isStreamingRef.current` 置为 `true`

## 2. 修改 checkScrollStatus 逻辑

- [x] 2.1 在 `checkScrollStatus` 中增加保护判断：当 `isStreamingRef.current === true` 且 `isAtBottomRef.current === true` 时，跳过 `isAtBottom` 检测（直接保持 `true`），仅检测 `needsScrollbar`
- [x] 2.2 确保不满足保护条件时（`isAtBottomRef.current === false`），`checkScrollStatus` 行为不变

## 3. 重置 isStreamingRef

- [x] 3.1 在 `handleVirtualizerScroll` 中：当检测到已到达底部时，重置 `isStreamingRef.current = false`
- [x] 3.2 在 `handleVirtualizerScroll` 中：当检测到不在底部时，重置 `isStreamingRef.current = false`（确保用户主动上滚立即取消保护）
- [x] 3.3 确认流式结束时 `isStreamingRef` 自然不会被重新激活（因为流式 effect 不再触发）

## 4. 验证

- [ ] 4.1 手动测试：流式响应期间「滚动到底部」按钮不闪现
- [ ] 4.2 手动测试：流式期间用户主动上滚，按钮正常显示
- [ ] 4.3 手动测试：流式结束后恢复正常滚动状态检测
