## 概述

对 `Detail/index.tsx` 和 `Sidebar/index.tsx` 进行 4 项针对性优化，解决流式场景下的性能瓶颈和正确性隐患。

## 当前架构

```
Detail/index.tsx
├── shouldStickToBottom (useRef) ── 底部跟踪（ref）
├── isAtBottom (useState)         ── 底部跟踪（state）
├── needsScrollbar (useState)     ── 滚动条检测
├── scrollToBottom (useCallback)  ── 依赖 historyList.length
├── checkScrollStatus             ── 双重 rAF + isCheckingScrollRef
├── useEffect (ResizeObserver)    ── 依赖 [historyList, runningChatData, checkScrollStatus]
├── useEffect (流式跟随)          ── 依赖 [runningChatData, scrollToBottom]
└── useEffect (Title RO)          ── 依赖 []
```

## 变更设计

### 变更 1：拆分 ResizeObserver effect

**问题**：当前 effect 依赖 `[historyList, runningChatData, checkScrollStatus]`，每次新消息或流式 token 到达都销毁重建 ResizeObserver。

**方案**：拆为两个独立 effect：

```
effect 1: ResizeObserver 设置     → 依赖 []
effect 2: checkScrollStatus 调用  → 依赖 [historyList.length, runningChatData]
```

ResizeObserver 设置一次后永不重建。内容变化通过 effect 2 调用 `checkScrollStatus()` 响应，ResizeObserver 自身的回调也调用 `checkScrollStatus()`（容器尺寸变化时）。

### 变更 2：合并底部检测为单一数据源

**问题**：`shouldStickToBottom`（ref）和 `isAtBottom`（state）语义相同但由不同代码路径设置，可能不同步。

**方案**：移除 `shouldStickToBottom` ref，统一使用 `isAtBottom` state：
- `handleVirtualizerScroll` 中设置 `isAtBottom`
- 流式跟随 effect 中读取 `isAtBottom`（通过 ref 镜像避免 effect 频繁重建）
- 新增 `isAtBottomRef = useRef(true)` 与 `isAtBottom` state 同步

```
isAtBottom (useState)  ← 唯一真实来源
isAtBottomRef (useRef) ← 同步镜像，供 effect 读取
```

### 变更 3：用 functional updater 替代双重 rAF

**问题**：`checkScrollStatus` 使用 `isCheckingScrollRef` + 双重 `requestAnimationFrame` 防递归，模式脆弱且 DOM 测量值可能过时。

**方案**：
```ts
const checkScrollStatus = useCallback(() => {
  const container = scrollContainerRef.current
  if (!container) return

  const hasScrollbar = container.scrollHeight > container.clientHeight
  const atBottom = (container.scrollHeight - container.scrollTop - container.clientHeight) <= SCROLL_BOTTOM_THRESHOLD

  setNeedsScrollbar(prev => prev === hasScrollbar ? prev : hasScrollbar)
  setIsAtBottom(prev => prev === atBottom ? prev : atBottom)
  isAtBottomRef.current = atBottom
}, [])
```

消除 `isCheckingScrollRef` 和双重 rAF，functional updater 在值不变时跳过渲染。

### 变更 4：Sidebar predicate 稳定化

**问题**：`useDebouncedFilter` 的 `predicate` 参数是内联函数，每次渲染都新建，effect 依赖 `predicate` 变化导致 debounce 被打断。

**方案**：用 `useCallback` 包裹 predicate：

```ts
const filterPredicate = useCallback(
  (chat: Chat) => chat.name?.toLocaleLowerCase().includes(filterText.toLocaleLowerCase()),
  [filterText]
)

const { filteredList } = useDebouncedFilter(filterText, chatList, filterPredicate)
```

`filterText` 变化时 predicate 重建，但这与 debounce 的 `text` 依赖同步——debounce 正确等待用户停止输入后再过滤。

### 变更 5：scrollToBottom 依赖稳定化（P0 关联）

**说明**：此变更在 P0 修复中提出，但与变更 1（ResizeObserver 拆分）紧密关联，一并处理。

**方案**：用 ref 存储 `historyList.length`，使 `scrollToBottom` 的 `useCallback` 依赖为空数组：

```ts
const historyLengthRef = useRef(historyList.length)
useEffect(() => { historyLengthRef.current = historyList.length }, [historyList.length])

const scrollToBottom = useCallback(() => {
  virtualizerRef.current?.scrollToIndex(historyLengthRef.current - 1, { align: 'end' })
  // ... 降级逻辑
}, [])
```

## 文件影响

| 文件 | 变更类型 |
|------|----------|
| `src/pages/Chat/components/Panel/Detail/index.tsx` | 重构核心逻辑 |
| `src/pages/Chat/components/Sidebar/index.tsx` | 添加 useCallback |
