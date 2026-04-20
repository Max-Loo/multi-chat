## 1. 稳定化 scrollToBottom 回调

- [x] 1.1 在 `Detail/index.tsx` 中添加 `historyLengthRef`：`useRef(historyList.length)`，并用 `useEffect` 同步 `historyList.length` 到 ref。**此 effect 必须声明在流式自动跟随 effect 之前**，确保同一渲染周期内 ref 先于读取方更新
- [x] 1.2 修改 `scrollToBottom` 的 `useCallback`：内部读取 `historyLengthRef.current`，依赖数组改为 `[]`
- [x] 1.3 移除 `scrollToBottom` 的降级分支（`scrollContainerRef` 直接操作 DOM 的部分），仅保留 Virtualizer 路径

## 2. 优化 checkScrollStatus 变更检测

- [x] 2.1 将 `checkScrollStatus` 中的 `setNeedsScrollbar(hasScrollbar)` 改为 `setNeedsScrollbar(prev => prev === hasScrollbar ? prev : hasScrollbar)`
- [x] 2.2 将 `checkScrollStatus` 中的 `setIsAtBottom(atBottom)` 改为 `setIsAtBottom(prev => prev === atBottom ? prev : atBottom)`
- [x] 2.3 移除双层 `requestAnimationFrame` 包裹，改为同步执行 state setter
- [x] 2.4 移除 `isCheckingScrollRef` 变量及其所有引用

## 3. 验证

- [x] 3.1 运行 `pnpm tsc` 确认类型检查通过（本次改动无新增错误，剩余 `virtua` 模块错误为预先存在）
- [x] 3.2 运行 `pnpm test` 确认所有测试通过（1498 passed，7 failed 均为预先存在的 `virtua` 模块解析问题）
- [x] 3.3 运行 `pnpm lint` 确认无 lint 错误（0 errors, 0 warnings）
