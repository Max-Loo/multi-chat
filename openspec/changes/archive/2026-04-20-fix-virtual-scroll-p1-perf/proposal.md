## Why

虚拟滚动功能在流式消息场景下存在性能瓶颈：ResizeObserver 每次收到 token 都被销毁重建、双底部状态（ref + state）可能不同步、双重 rAF 防递归模式脆弱、Sidebar 内联 predicate 破坏 debounce 语义。这些问题导致流式聊天时产生不必要的 DOM 操作和 React 协调，需要合并前修复。

## What Changes

- 将 ResizeObserver 拆分为独立稳定 effect，不再随 `historyList`/`runningChatData` 变化而重建
- 合并 `shouldStickToBottom`（ref）与 `isAtBottom`（state）为单一数据源，消除不同步风险
- 用 functional updater 值比较替代双重 `requestAnimationFrame` 防递归模式
- Sidebar 中用 `useCallback` 包裹 `useDebouncedFilter` 的 predicate 函数，恢复 debounce 语义

## Capabilities

### New Capabilities

- `scroll-status-manager`: 统一的滚动状态管理能力，合并底部检测、滚动条检测为单一数据源，使用 functional updater 避免冗余渲染

### Modified Capabilities

- `virtual-scroll`: ResizeObserver 生命周期与内容变化解耦，`scrollToBottom` 依赖稳定化
- `chat-sidebar-testing`: predicate 函数稳定性修复

## Impact

- **核心文件**：`src/pages/Chat/components/Panel/Detail/index.tsx`（主要改动）
- **关联文件**：`src/pages/Chat/components/Sidebar/index.tsx`（predicate 稳定化）
- **无 API/类型变更**：纯内部实现优化，不影响组件 props 或公共接口
- **无依赖变更**：不引入新包
