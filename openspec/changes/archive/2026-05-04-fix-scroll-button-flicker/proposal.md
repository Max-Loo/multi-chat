## Why

流式响应期间，"滚动到底部"按钮在每个 chunk 到达时都会短暂闪现后消失。根因是两个依赖 `runningChatData` 的 Effect 存在竞态：`checkScrollStatus` 同步读取 DOM（此时内容已更新但 scroll 位置未跟上），将 `isAtBottom` 设为 false；而 `scrollToBottom` 通过 `requestAnimationFrame` 延迟执行，才将 `isAtBottom` 恢复为 true。每个流式 chunk 都重复此循环，造成按钮持续闪动。

## What Changes

- 重构流式数据更新期间的滚动状态检测逻辑：当用户原本处于底部（`isAtBottomRef.current === true`）时，跳过中间态的 `isAtBottom` 检测，避免竞态导致的状态翻转
- 将 `checkScrollStatus` 的调用时机与 `scrollToBottom` 对齐，确保在 DOM 完全稳定后才判定滚动位置

## Capabilities

### New Capabilities

（无新能力）

### Modified Capabilities

- `scroll-status-manager`: 流式更新期间，当用户原本在底部时，`isAtBottom` 状态必须保持稳定不变，直到 DOM 完全更新并完成自动滚动后再重新检测
- `virtual-scroll`: 流式自动跟随 effect 需确保 `isAtBottom` 判定不会被内容增长过程中的中间态干扰

## Impact

- `src/pages/Chat/components/Panel/Detail/index.tsx`：滚动状态检测和流式自动跟随逻辑
- 现有测试可能需要适配新的判定逻辑
