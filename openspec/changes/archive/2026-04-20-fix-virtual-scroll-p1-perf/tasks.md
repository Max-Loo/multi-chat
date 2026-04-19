## Tasks

- [x] **Task 1: 稳定化 scrollToBottom 依赖** — `historyLengthRef` + 空依赖 `useCallback`
- [x] **Task 2: 合并底部检测为单一数据源** — 移除 `shouldStickToBottom`，统一 `isAtBottom` state + `isAtBottomRef`
- [x] **Task 3: 用 functional updater 替代双重 rAF** — 移除 `isCheckingScrollRef`，`checkScrollStatus` 使用 functional updater
- [x] **Task 4: 拆分 ResizeObserver effect** — ResizeObserver `[]` 依赖 + 内容变化 `[historyList.length, runningChatData]` 依赖
- [x] **Task 5: Sidebar predicate 稳定化** — `useCallback` 包裹 predicate
- [x] **Task 6: 验证与回归测试** — `pnpm test` 1498 passed，`pnpm tsc` 仅预存 virtua 类型错误
