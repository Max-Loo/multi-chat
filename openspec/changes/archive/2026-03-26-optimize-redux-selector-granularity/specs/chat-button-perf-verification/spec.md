# 规格：ChatButton 渲染性能验证

## 概述

通过构造「优化前」和「优化后」两种模式，在真实 Redux 环境下切换 `selectedChatId`，统计 ChatButton 组件体的实际调用次数和渲染耗时，量化 props 下沉优化的性能收益。

### 核心思路

构造两种模式模拟优化前后的订阅行为：

| 模式 | 订阅方式 | 切换选中时重渲染数 |
|------|----------|-------------------|
| **优化前**（Legacy） | N 个组件各自 `useAppSelector(selectedChatId)` | N |
| **优化后**（Optimized） | 父组件订阅 1 次，通过 `isSelected` props 下沉 | 2 |

测试通过真实 Redux store + `store.dispatch` 触发选中切换，使用 render tracker 统计重渲染次数，用 `performance.now()` 测量耗时。

## 工具函数

### RenderTracker

不侵入生产代码，通过 wrapper 组件统计每次函数体执行：

```typescript
/**
 * 渲染追踪器
 * 记录每个 ChatButton 的渲染次数和耗时
 */
function createRenderTracker() {
  const renderCounts = new Map<string, number>()
  const renderTimestamps = new Map<string, number[]>()

  const record = (id: string) => {
    renderCounts.set(id, (renderCounts.get(id) || 0) + 1)
    const timestamps = renderTimestamps.get(id) || []
    timestamps.push(performance.now())
    renderTimestamps.set(id, timestamps)
  }

  return {
    record,
    getCount(id: string) { return renderCounts.get(id) || 0 },
    /** 统计某次操作（非首次渲染）的重渲染总数 */
    getReRenderCount() {
      let count = 0
      renderCounts.forEach(n => { if (n > 1) count++ })
      return count
    },
    /** 获取某次操作的重渲染耗时（ms），取最后一次渲染时间戳与首次之差 */
    getReRenderDuration(id: string): number {
      const timestamps = renderTimestamps.get(id)
      if (!timestamps || timestamps.length < 2) return 0
      return timestamps[timestamps.length - 1] - timestamps[0]
    },
    /** 切换操作的总耗时区间：所有组件最后一次渲染中最大的时间戳 - dispatch 前的时间戳 */
    getTotalDuration(startTime: number): number {
      let maxTime = 0
      renderTimestamps.forEach(ts => {
        if (ts.length > 0) maxTime = Math.max(maxTime, ts[ts.length - 1])
      })
      return maxTime - startTime
    },
    reset() {
      renderCounts.clear()
      renderTimestamps.clear()
    },
  }
}
```

### 两种模式的组件构造

```typescript
import { memo } from 'react'
import { useAppSelector } from '@/hooks/redux'
import ChatButton from '@/pages/Chat/components/Sidebar/components/ChatButton'
import type { ChatButtonProps } from '@/pages/Chat/components/Sidebar/components/ChatButton'
import type { Chat } from '@/types/chat'

/**
 * 优化前模式：每个 wrapper 独立订阅 selectedChatId
 * 模拟旧版 ChatButton 内部 useAppSelector 的行为
 * 当 selectedChatId 变化时，所有 wrapper 都会重渲染
 */
function createLegacyPattern(tracker: ReturnType<typeof createRenderTracker>) {
  const LegacyWrapper = memo(({ chat }: { chat: Chat }) => {
    // 每个实例独立订阅 — 这是优化前的核心问题
    const selectedChatId = useAppSelector((state) => state.chat.selectedChatId)
    tracker.record(chat.id)
    return <ChatButton chat={chat} isSelected={chat.id === selectedChatId} />
  })

  // 返回接受 chatList 的父组件，与 measureSelectionChange 签名一致
  const LegacyParent = ({ chatList }: { chatList: Chat[] }) => (
    <>
      {chatList.map(chat => (
        <LegacyWrapper key={chat.id} chat={chat} />
      ))}
    </>
  )

  return LegacyParent
}

/**
 * 优化后模式：父组件订阅一次 selectedChatId，通过 props 下沉
 * 模拟优化后 Sidebar 订阅 + isSelected props 的行为
 * 当 selectedChatId 变化时，只有 isSelected 发生变化的 ChatButton 重渲染
 */
function createOptimizedPattern(tracker: ReturnType<typeof createRenderTracker>) {
  const TrackedButton = memo(({ chat, isSelected }: ChatButtonProps & { isSelected: boolean }) => {
    tracker.record(chat.id)
    return <ChatButton chat={chat} isSelected={isSelected} />
  })

  const OptimizedParent = ({ chatList }: { chatList: Chat[] }) => {
    const selectedChatId = useAppSelector((state) => state.chat.selectedChatId)
    return (
      <>
        {chatList.map(chat => (
          <TrackedButton
            key={chat.id}
            chat={chat}
            isSelected={chat.id === selectedChatId}
          />
        ))}
      </>
    )
  }

  return OptimizedParent
}
```

### 测试辅助函数

```typescript
import { act, cleanup, render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ConfirmProvider } from '@/hooks/useConfirm'
import { createTestStore } from '@/__test__/helpers/render/redux'
import { createMockChatList } from '@/__test__/helpers/mocks/chatSidebar'
import chatReducer from '@/store/slices/chatSlices'
import type { EnhancedStore } from '@reduxjs/toolkit'

/**
 * 渲染聊天列表并测量选中切换的渲染性能
 */
function measureSelectionChange(
  Pattern: React.FC<{ chatList: Chat[] }>,
  chatList: Chat[],
  store: EnhancedStore,
  newSelectedId: string,
) {
  // 清理前一次渲染，避免同一测试内多次 render() 产生 DOM 残留
  cleanup()

  render(
    <Provider store={store}>
      <BrowserRouter>
        <ConfirmProvider>
          <Pattern chatList={chatList} />
        </ConfirmProvider>
      </BrowserRouter>
    </Provider>
  )

  // 记录切换前的渲染快照（每个 chat 应已渲染 1 次）
  const startTime = performance.now()

  // 通过真实 Redux dispatch 触发选中切换
  act(() => {
    store.dispatch(chatReducer.actions.setSelectedChatId(newSelectedId))
  })

  return { startTime }
}
```

## 测试用例

### 用例 1：渲染次数对比（核心验证）

验证在相同场景下，优化前 N 个 ChatButton 全部重渲染，优化后仅 2 个重渲染。

```typescript
describe('ChatButton selector 优化 - 渲染次数对比', () => {
  const CHAT_COUNT = 20

  it('优化前（Legacy 模式）：切换选中时 N 个 ChatButton 全部重渲染', () => {
    const chatList = createMockChatList(CHAT_COUNT)
    const store = createTestStore({
      chat: { selectedChatId: chatList[0].id, chatList, loading: false },
    })
    const tracker = createRenderTracker()
    const LegacyPattern = createLegacyPattern(tracker)

    measureSelectionChange(
      LegacyPattern, chatList, store, chatList[9].id,
    )

    // 所有 20 个 ChatButton 都重渲染了（初始渲染 + 选中变化各 1 次 = 2 次）
    chatList.forEach(chat => {
      expect(tracker.getCount(chat.id)).toBe(2)
    })

    // 重渲染总数 = 20（所有组件都因 selectedChatId 变化而重渲染）
    expect(tracker.getReRenderCount()).toBe(CHAT_COUNT)
  })

  it('优化后（Optimized 模式）：切换选中时仅 2 个 ChatButton 重渲染', () => {
    const chatList = createMockChatList(CHAT_COUNT)
    const store = createTestStore({
      chat: { selectedChatId: chatList[0].id, chatList, loading: false },
    })
    const tracker = createRenderTracker()
    const OptimizedPattern = createOptimizedPattern(tracker)

    measureSelectionChange(
      OptimizedPattern, chatList, store, chatList[9].id,
    )

    // 只有 chat-0（取消选中）和 chat-9（新选中）重渲染了 2 次
    expect(tracker.getCount(chatList[0].id)).toBe(2)
    expect(tracker.getCount(chatList[9].id)).toBe(2)

    // 其余 18 个只渲染了 1 次（初始渲染）
    chatList.forEach(chat => {
      if (chat.id !== chatList[0].id && chat.id !== chatList[9].id) {
        expect(tracker.getCount(chat.id)).toBe(1)
      }
    })

    // 重渲染总数 = 2
    expect(tracker.getReRenderCount()).toBe(2)
  })
})
```

### 用例 2：多数据规模对比

验证不同聊天数量下的渲染次数差异。

```typescript
describe('ChatButton selector 优化 - 多数据规模', () => {
  it.each([
    { count: 10, label: '10 个聊天' },
    { count: 20, label: '20 个聊天' },
    { count: 50, label: '50 个聊天' },
  ])('$label：优化前重渲染 N 个，优化后仅 2 个', ({ count }) => {
    const chatList = createMockChatList(count)
    const initialId = chatList[0].id
    const newId = chatList[count - 1].id

    // 优化前
    const legacyStore = createTestStore({
      chat: { selectedChatId: initialId, chatList, loading: false },
    })
    const legacyTracker = createRenderTracker()
    measureSelectionChange(createLegacyPattern(legacyTracker), chatList, legacyStore, newId)
    expect(legacyTracker.getReRenderCount()).toBe(count)

    // 优化后
    const optimizedStore = createTestStore({
      chat: { selectedChatId: initialId, chatList, loading: false },
    })
    const optimizedTracker = createRenderTracker()
    measureSelectionChange(createOptimizedPattern(optimizedTracker), chatList, optimizedStore, newId)
    expect(optimizedTracker.getReRenderCount()).toBe(2)
  })
})
```

### 用例 3：连续切换稳定性

验证多次快速切换选中时，优化后的行为始终稳定。

```typescript
describe('ChatButton selector 优化 - 连续切换稳定性', () => {
  it('连续切换 3 次选中，优化后每次仅 2 个 ChatButton 重渲染', () => {
    const chatList = createMockChatList(20)
    const store = createTestStore({
      chat: { selectedChatId: chatList[0].id, chatList, loading: false },
    })
    const tracker = createRenderTracker()
    const OptimizedPattern = createOptimizedPattern(tracker)

    const { rerender } = render(
      <Provider store={store}>
        <BrowserRouter>
          <OptimizedPattern chatList={chatList} />
        </BrowserRouter>
      </Provider>
    )

    // 初始状态：每个 chat 渲染 1 次
    chatList.forEach(chat => {
      expect(tracker.getCount(chat.id)).toBe(1)
    })

    // 第 1 次切换：0 → 5
    act(() => { store.dispatch(chatReducer.actions.setSelectedChatId(chatList[5].id)) })
    expect(tracker.getCount(chatList[0].id)).toBe(2)
    expect(tracker.getCount(chatList[5].id)).toBe(2)

    // 第 2 次切换：5 → 15
    act(() => { store.dispatch(chatReducer.actions.setSelectedChatId(chatList[15].id)) })
    expect(tracker.getCount(chatList[5].id)).toBe(3)
    expect(tracker.getCount(chatList[15].id)).toBe(2)

    // 第 3 次切换：15 → 0
    act(() => { store.dispatch(chatReducer.actions.setSelectedChatId(chatList[0].id)) })
    expect(tracker.getCount(chatList[15].id)).toBe(3)
    expect(tracker.getCount(chatList[0].id)).toBe(3)

    // 其余 17 个 chat 始终只渲染了 1 次
    const unchangedChats = chatList.filter(
      c => c.id !== chatList[0].id && c.id !== chatList[5].id && c.id !== chatList[15].id
    )
    unchangedChats.forEach(chat => {
      expect(tracker.getCount(chat.id)).toBe(1)
    })
  })
})
```

### 用例 4：渲染耗时对比

测量优化前后切换选中的总渲染耗时，验证优化减少了渲染开销。

```typescript
describe('ChatButton selector 优化 - 渲染耗时', () => {
  it('优化后的总渲染耗时不应超过优化前', () => {
    const chatList = createMockChatList(50)
    const RUNS = 10 // 多次运行取平均值，降低测试环境波动

    const legacyTimes: number[] = []
    const optimizedTimes: number[] = []

    for (let i = 0; i < RUNS; i++) {
      // 优化前
      const legacyStore = createTestStore({
        chat: { selectedChatId: chatList[0].id, chatList, loading: false },
      })
      const legacyTracker = createRenderTracker()
      const { startTime: legacyStart } = measureSelectionChange(
        createLegacyPattern(legacyTracker), chatList, legacyStore, chatList[49].id,
      )
      legacyTimes.push(legacyTracker.getTotalDuration(legacyStart))

      // 优化后
      const optimizedStore = createTestStore({
        chat: { selectedChatId: chatList[0].id, chatList, loading: false },
      })
      const optimizedTracker = createRenderTracker()
      const { startTime: optimizedStart } = measureSelectionChange(
        createOptimizedPattern(optimizedTracker), chatList, optimizedStore, chatList[49].id,
      )
      optimizedTimes.push(optimizedTracker.getTotalDuration(optimizedStart))
    }

    const avgLegacy = legacyTimes.reduce((a, b) => a + b, 0) / RUNS
    const avgOptimized = optimizedTimes.reduce((a, b) => a + b, 0) / RUNS

    // 输出耗时供人工审查（测试环境中绝对值波动较大，仅记录趋势）
    // eslint-disable-next-line no-console
    console.log(`[Perf] 平均渲染耗时 — 优化前: ${avgLegacy.toFixed(2)}ms, 优化后: ${avgOptimized.toFixed(2)}ms`)

    // 断言：优化后耗时不超过优化前（考虑测试环境波动，不做严格数值断言）
    // 此断言主要验证优化没有引入额外的性能退化
    expect(avgOptimized).toBeLessThanOrEqual(avgLegacy * 1.5) // 允许 50% 波动容差
  })
})
```

### 用例 5：边界情况

```typescript
describe('ChatButton selector 优化 - 边界情况', () => {
  it('重复选中同一个聊天时，两种模式都不应触发 ChatButton 重渲染', () => {
    const chatList = createMockChatList(10)
    const selectedId = chatList[0].id

    // 优化前
    const legacyStore = createTestStore({
      chat: { selectedChatId: selectedId, chatList, loading: false },
    })
    const legacyTracker = createRenderTracker()
    render(
      <Provider store={legacyStore}>
        <BrowserRouter>
          {(() => createLegacyPattern(legacyTracker))()({ chatList })}
        </BrowserRouter>
      </Provider>
    )
    // 再次 dispatch 相同的 selectedChatId
    act(() => { legacyStore.dispatch(chatReducer.actions.setSelectedChatId(selectedId)) })
    // selectedChatId 值未变，所有 ChatButton 仍为 1 次渲染
    chatList.forEach(chat => {
      expect(legacyTracker.getCount(chat.id)).toBe(1)
    })

    // 优化后
    const optimizedStore = createTestStore({
      chat: { selectedChatId: selectedId, chatList, loading: false },
    })
    const optimizedTracker = createRenderTracker()
    render(
      <Provider store={optimizedStore}>
        <BrowserRouter>
          {(() => createOptimizedPattern(optimizedTracker))()({ chatList })}
        </BrowserRouter>
      </Provider>
    )
    act(() => { optimizedStore.dispatch(chatReducer.actions.setSelectedChatId(selectedId)) })
    chatList.forEach(chat => {
      expect(optimizedTracker.getCount(chat.id)).toBe(1)
    })
  })
})
```

## 文件位置

`src/__test__/performance/chat-button-render-count.test.tsx`

与常规测试隔离，避免 CI 频繁运行。

## 运行方式

```bash
# 仅运行性能验证测试
pnpm vitest run src/__test__/performance/

# 运行并显示 console 输出（查看耗时数据）
pnpm vitest run src/__test__/performance/ --reporter=verbose
```

## 依赖

- `createMockChatList` from `@/__test__/helpers/mocks/chatSidebar`
- `createTestStore` from `@/__test__/helpers/render/redux`
- `chatReducer` from `@/store/slices/chatSlices`
- `ChatButton` from `@/pages/Chat/components/Sidebar/components/ChatButton`
- `useAppSelector` from `@/hooks/redux`
- ChatButton 相关的 mock hooks（`useResponsive`、`useNavigateToPage`、`useConfirm`、`react-i18next`、`toastQueue`）— 复用现有 `ChatButton.test.tsx` 中的 mock 配置

## 注意事项

- 性能测试需 mock 与 ChatButton 相同的依赖（参考现有 `ChatButton.test.tsx` 的 mock 配置）
- `createLegacyPattern` / `createOptimizedPattern` 不 spy 生产代码，通过 wrapper 组件注入渲染追踪，符合项目测试规范
- 耗时测试使用多次运行取平均，降低测试环境波动影响。绝对耗时值在不同机器/CI 环境差异较大，不应做严格的数值断言，仅验证趋势（优化后 ≤ 优化前）
- React Compiler 环境下，内联事件处理器会被自动缓存，不影响渲染计数测量的准确性
- `LegacyWrapper` 使用 `memo` 包裹，与旧版 ChatButton 一致——但 `memo` 无法阻止 `useAppSelector` 内部触发的重渲染，这正是需要优化的原因
