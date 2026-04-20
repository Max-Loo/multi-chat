## Why

虚拟滚动组件存在两个代码质量问题：`scrollToBottom` 因依赖 `historyList.length` 导致完整消息加入历史时回调引用变化，使流式 effect 不必要地重新执行；`checkScrollStatus` 使用双层 rAF + `isCheckingScrollRef` 防递归模式，实现过于复杂。

需注意：`scrollToBottom` 在整个流式会话中最多重建 2 次（用户消息 + AI 完成消息加入历史时），每个 token 变化的是 `runningChatData` 而非 `historyList.length`；React 18+ 对 `setState(sameValue)` 已自动 bailout 跳过 reconciliation。因此本次改动的核心价值是代码简化与回调引用稳定性，性能改善为次要收益。

## What Changes

- 将 `scrollToBottom` 的 `historyList.length` 依赖改用 ref 存储，使 `useCallback` 依赖数组为空，保持回调引用完全稳定
- 用 functional updater 模式替代双重 `requestAnimationFrame` 防递归模式，简化 `checkScrollStatus` 实现，移除 `isCheckingScrollRef`
- 注意：functional updater 在 React 18+ 中与直接 `setState` 的 bailout 行为一致，此改动的价值在于简化代码（移除双层 rAF + 防递归 ref），而非额外的性能收益

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `virtual-scroll`: 修改"消息列表自动滚到底部"和"滚动条自适应显示"两个需求的实现约束——要求 `scrollToBottom` 回调引用稳定、滚动状态更新需进行变更检测

## Impact

- **核心文件**: `src/pages/Chat/components/Panel/Detail/index.tsx`
- **影响范围**: `scrollToBottom`、`checkScrollStatus`、`handleVirtualizerScroll`、流式自动跟随 effect、ResizeObserver effect
- **无 API 变更**: 不影响外部接口和组件 props
- **无依赖变更**: 不引入新包
