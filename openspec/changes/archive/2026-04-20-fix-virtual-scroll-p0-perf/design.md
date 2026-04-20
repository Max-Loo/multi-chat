## Context

`Detail/index.tsx` 是聊天面板的核心渲染组件，负责虚拟化消息列表、流式自动跟随、滚动状态管理。当前实现中存在两个代码质量问题：

1. **`scrollToBottom` 回调引用不稳定**：`useCallback` 依赖 `[historyList.length]`，在完整消息加入历史时回调引用变化 → 依赖 `scrollToBottom` 的流式 effect（第 146-152 行）重新执行。注意：`historyList.length` 仅在完整消息加入历史时变化（每次流式会话最多 2 次：用户消息 + AI 完成消息），每个 token 变化的是 `runningChatData` 而非 `historyList.length`，因此重建频率不高，但回调不稳定是不良实践
2. **`checkScrollStatus` 实现过于复杂**：使用双层 `requestAnimationFrame` + `isCheckingScrollRef` 防递归模式来更新 `needsScrollbar` 和 `isAtBottom` 两个 state。React 18+ 对 `setState(sameValue)` 已自动 bailout 跳过 reconciliation，因此双层 rAF 的防递归机制可以简化为 functional updater 模式

当前相关代码结构：
- `scrollToBottom`（第 86-98 行）→ 被 流式 effect（第 146-152 行）依赖
- `checkScrollStatus`（第 101-128 行）→ 被 `handleVirtualizerScroll`（第 174-184 行）调用
- `isCheckingScrollRef` + 双层 rAF → 防递归机制（可移除）

## Goals / Non-Goals

**Goals:**
- 稳定化 `scrollToBottom` 回调引用（依赖数组为空），消除完整消息加入历史时不必要的流式 effect 重新执行
- 简化 `checkScrollStatus` 实现，用 functional updater 模式替代双层 rAF + `isCheckingScrollRef` 防递归机制
- 改善代码可维护性，减少间接层（ref 同步 + rAF + 防递归标志）

**Non-Goals:**
- 不解决 `shouldStickToBottom`(ref) 与 `isAtBottom`(state) 的语义重复问题（P1）
- 不解决 ResizeObserver 依赖问题（P1）
- 不改变组件外部接口或行为语义

## Decisions

### 决策 1：用 ref 存储 `historyList.length` 稳定化 `scrollToBottom`

**方案**：引入 `historyLengthRef`，在 `useEffect` 中同步 `historyList.length`，`scrollToBottom` 内部读取 ref。

```ts
const historyLengthRef = useRef(historyList.length)
useEffect(() => { historyLengthRef.current = historyList.length }, [historyList.length])

const scrollToBottom = useCallback(() => {
  virtualizerRef.current?.scrollToIndex(historyLengthRef.current - 1, { align: 'end' })
}, [])
```

**替代方案**：
- A) 将 `scrollToBottom` 改为普通函数（非 useCallback）：每次渲染都创建新引用，问题更严重 → 否决
- B) 用 `useRef` 直接持有整个 `historyList`：过度，只需 length → 否决

**选择理由**：ref + effect 同步是 React 中"最新值 + 稳定引用"的标准模式，最小改动。注意：`historyLengthRef` 同步 effect 必须声明在流式自动跟随 effect 之前，以确保 ref 值在同一渲染周期内先于读取方更新。

### 决策 2：用 functional updater 替代双层 rAF 防递归

**方案**：在 `checkScrollStatus` 中直接读取 DOM 值，通过 functional updater 比较新旧值：

```ts
const checkScrollStatus = useCallback(() => {
  const container = scrollContainerRef.current
  if (!container) return

  const hasScrollbar = container.scrollHeight > container.clientHeight
  const atBottom = (container.scrollHeight - container.scrollTop - container.clientHeight) <= SCROLL_BOTTOM_THRESHOLD

  setNeedsScrollbar(prev => prev === hasScrollbar ? prev : hasScrollbar)
  setIsAtBottom(prev => prev === atBottom ? prev : atBottom)
}, [])
```

**替代方案**：
- A) 保持 rAF 但添加值比较：仍有一次 rAF 延迟 → 不如直接比较
- B) 使用 `useSyncExternalStore`：过度设计，此处是内部状态 → 否决

**选择理由**：functional updater 模式语义清晰，使"值未变则跳过"的意图显式化。移除双层 rAF 和 `isCheckingScrollRef` 减少了间接层。注意：React 18+ 对 `setState(sameValue)` 已自动 bailout，functional updater 不提供额外性能收益，但使代码意图更明确。

### 决策 3：移除 `isCheckingScrollRef`

**依据**：`isCheckingScrollRef` 唯一目的是防止双层 rAF 的递归。决策 2 消除了双层 rAF，此 ref 不再需要。

## Risks / Trade-offs

- **`historyLengthRef` 同步延迟**：ref 在 effect 中更新，理论上存在一帧的延迟窗口。但 `scrollToBottom` 只在流式 effect 中被调用（依赖 `runningChatData` 变化），此时 `historyList.length` 已更新，ref 在同一轮渲染 commit 阶段同步 → **无实际风险**。
- **functional updater 与批量更新**：React 18+ 自动批量更新，两个 `setState` 的 functional updater 在同一微任务中执行，不会导致中间态渲染 → **无风险**。
- **移除 rAF 防抖**：当前双层 rAF + `isCheckingScrollRef` 提供约 2 帧（~32ms@60fps）的防抖保护。移除后，`checkScrollStatus` 在每次滚动事件中同步执行 state dispatch。React bailout 在值不变时跳过渲染，但 dispatch 队列调度本身有微量开销。在快速滚动场景下，单帧内可能执行更多次 dispatch → **风险极低**，因为 virtua 的 onScroll 回调频率已受内部限制，且 React bailout 开销可忽略。
- **`handleVirtualizerScroll` 中 `shouldStickToBottom` 与 `checkScrollStatus` 的 `isAtBottom` 可能短暂不一致**：两者使用相同的 DOM 计算公式但执行时机不同。此问题在修改前已存在 → **不引入新风险**。
