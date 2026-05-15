## Context

当前 `Detail` 组件在流式响应期间存在两个 Effect 竞态：

```
Effect 1 (line 159): checkScrollStatus()        ← 同步，依赖 [displayList.length, runningChatData]
Effect 2 (line 135): requestAnimationFrame(()    ← 异步，依赖 [runningChatData, scrollToBottom]
                     => scrollToBottom())
```

每个流式 chunk 到达时：
1. React 重渲染，两个 Effect 都触发
2. Effect 1 同步读 DOM → 内容已增长但 scroll 未跟上 → `isAtBottom = false` → 按钮出现
3. Effect 2 下一帧执行 `scrollToBottom` → `isAtBottom = true` → 按钮消失
4. 下一个 chunk → 重复

约束：现有 `scroll-status-manager` 和 `virtual-scroll` specs 的大部分要求不变，只修改流式更新期间的判定时机。

## Goals / Non-Goals

**Goals:**

- 消除流式响应期间「滚动到底部」按钮的闪现
- 保持用户主动上滚时按钮正常出现的交互行为
- 保持 `scrollToBottom` 引用稳定（空依赖数组）

**Non-Goals:**

- 不修改 `SCROLL_BOTTOM_THRESHOLD` 阈值
- 不引入新的第三方依赖
- 不重构 Virtualizer 的使用方式
- 不修改 `scrollToBottom` 的 `useCallback` 依赖

## Decisions

### Decision 1: 引入 `isStreamingRef` 保护 `isAtBottom` 状态

引入 `isStreamingRef`（`useRef<boolean>`），当流式自动跟随激活时置为 `true`。在 `checkScrollStatus` 中，若 `isStreamingRef.current === true` 且 `isAtBottomRef.current === true`，则跳过 `isAtBottom` 的检测，直接保持 `true`。

**替代方案 A**：将 `checkScrollStatus` 的调用也放入 `requestAnimationFrame`。
- ❌ 无法保证与 `scrollToBottom` 的执行顺序，仍可能竞态

**替代方案 B**：将 `checkScrollStatus` 合并到流式自动跟随 effect 内，在 `scrollToBottom` 完成后调用。
- ❌ `scrollToBottom` 是 Virtualizer 的异步操作，无法确定完成时机

**替代方案 C（选用）**：用 ref 保护状态，逻辑简单，无竞态风险。

### Decision 2: 保护范围精确限定

`isStreamingRef` 只在流式自动跟随 effect 中临时置 `true`，在 Virtualizer 的 `onScroll` 回调中（auto-scroll 完成后触发）检测到已经到底部时重置为 `false`。确保用户主动上滚时保护立即失效。

## Risks / Trade-offs

- **[风险] 保护可能持续过长** → 通过 Virtualizer `onScroll` 回调检测实际滚动位置来重置 `isStreamingRef`，确保 auto-scroll 完成后立即恢复正常检测
- **[风险] 用户在流式期间快速上滚** → `handleVirtualizerScroll` 中检测到不在底部时立即重置 `isStreamingRef` 为 `false`，确保按钮正常显示
