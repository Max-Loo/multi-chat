import { describe, it, expect, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { memo } from 'react'
import type { EnhancedStore } from '@reduxjs/toolkit'
import { useAppSelector } from '@/hooks/redux'
import ChatButton from '@/pages/Chat/components/Sidebar/components/ChatButton'
import type { ChatButtonProps } from '@/pages/Chat/components/Sidebar/components/ChatButton'
import type { Chat } from '@/types/chat'
import { createTestStore } from '@/__test__/helpers/render/redux'
import { createMockChatList } from '@/__test__/helpers/mocks/chatSidebar'
import { setSelectedChatId } from '@/store/slices/chatSlices'

/**
 * 创建性能测试用的 store（放宽类型约束）
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createPerfStore(chatList: Chat[], selectedChatId: string) {
  return createTestStore({
    chat: {
      selectedChatId,
      chatList,
      loading: false,
      error: null,
      initializationError: null,
      runningChat: {},
    } as any,
  })
}

// Mock ChatButton 的依赖（与 ChatButton.test.tsx 保持一致）
vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: vi.fn(() => ({
    layoutMode: 'desktop',
    width: 1280,
    height: 800,
    isMobile: false,
    isCompact: false,
    isCompressed: false,
    isDesktop: true,
  })),
}))

vi.mock('@/hooks/useNavigateToPage', () => ({
  useNavigateToChat: () => ({
    navigateToChat: vi.fn(),
    clearChatIdParam: vi.fn(),
  }),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: ((keyOrSelector: string | ((resources: any) => string)) => {
      if (typeof keyOrSelector === 'function') {
        const mockResources = {
          chat: {
            unnamed: '未命名',
            rename: '重命名',
            delete: '删除',
            confirmDelete: '确认删除',
            deleteChatConfirm: '确定要删除这个聊天吗？',
            deleteChatSuccess: '删除成功',
            deleteChatFailed: '删除失败',
            editChatSuccess: '重命名成功',
            editChatFailed: '重命名失败',
          },
        }
        return keyOrSelector(mockResources)
      }
      return keyOrSelector
    }) as any,
    i18n: {
      language: 'zh',
      changeLanguage: vi.fn(),
    },
  }),
}))

vi.mock('@/hooks/useConfirm', () => ({
  useConfirm: () => ({
    modal: {
      warning: vi.fn(),
    },
  }),
  ConfirmProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/lib/toast', () => ({
  toastQueue: {
    success: vi.fn(async () => 'toast-id'),
    error: vi.fn(async () => 'toast-id'),
  },
}))

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

/**
 * 优化前模式：每个 wrapper 独立订阅 selectedChatId
 * 模拟旧版 ChatButton 内部 useAppSelector 的行为
 * 当 selectedChatId 变化时，所有 wrapper 都会重渲染
 */
function createLegacyPattern(tracker: ReturnType<typeof createRenderTracker>) {
  const LegacyWrapper = memo(function LegacyWrapper({ chat }: { chat: Chat }) {
    const selectedChatId = useAppSelector((state) => state.chat.selectedChatId)
    tracker.record(chat.id)
    return <ChatButton chat={chat} isSelected={chat.id === selectedChatId} />
  })

  return function LegacyParent({ chatList }: { chatList: Chat[] }) {
    return (
      <>
        {chatList.map(chat => (
          <LegacyWrapper key={chat.id} chat={chat} />
        ))}
      </>
    )
  }
}

/**
 * 优化后模式：父组件订阅一次 selectedChatId，通过 props 下沉
 * 模拟优化后 Sidebar 订阅 + isSelected props 的行为
 * 当 selectedChatId 变化时，只有 isSelected 发生变化的 ChatButton 重渲染
 */
function createOptimizedPattern(tracker: ReturnType<typeof createRenderTracker>) {
  const TrackedButton = memo(({ chat, isSelected }: ChatButtonProps) => {
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

/**
 * 渲染聊天列表并测量选中切换的渲染性能
 */
function measureSelectionChange(
  Pattern: React.FC<{ chatList: Chat[] }>,
  chatList: Chat[],
  store: EnhancedStore,
  newSelectedId: string,
) {
  cleanup()

  render(
    <Provider store={store}>
      <BrowserRouter>
        <Pattern chatList={chatList} />
      </BrowserRouter>
    </Provider>
  )

  const startTime = performance.now()

  act(() => {
    store.dispatch(setSelectedChatId(newSelectedId))
  })

  return { startTime }
}

// ============ 测试用例 ============

describe('ChatButton selector 优化 - 渲染次数对比', () => {
  const CHAT_COUNT = 20

  it('优化前（Legacy 模式）：切换选中时 N 个 ChatButton 全部重渲染', () => {
    const chatList = createMockChatList(CHAT_COUNT)
    const store = createPerfStore(chatList, chatList[0].id)
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
    const store = createPerfStore(chatList, chatList[0].id)
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
    const legacyStore = createPerfStore(chatList, initialId)
    const legacyTracker = createRenderTracker()
    measureSelectionChange(createLegacyPattern(legacyTracker), chatList, legacyStore, newId)
    expect(legacyTracker.getReRenderCount()).toBe(count)

    // 优化后
    const optimizedStore = createPerfStore(chatList, initialId)
    const optimizedTracker = createRenderTracker()
    measureSelectionChange(createOptimizedPattern(optimizedTracker), chatList, optimizedStore, newId)
    expect(optimizedTracker.getReRenderCount()).toBe(2)
  })
})

describe('ChatButton selector 优化 - 连续切换稳定性', () => {
  it('连续切换 3 次选中，优化后每次仅 2 个 ChatButton 重渲染', () => {
    const chatList = createMockChatList(20)
    const store = createPerfStore(chatList, chatList[0].id)
    const tracker = createRenderTracker()
    const OptimizedPattern = createOptimizedPattern(tracker)

    render(
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
    act(() => { store.dispatch(setSelectedChatId(chatList[5].id)) })
    expect(tracker.getCount(chatList[0].id)).toBe(2)
    expect(tracker.getCount(chatList[5].id)).toBe(2)

    // 第 2 次切换：5 → 15
    act(() => { store.dispatch(setSelectedChatId(chatList[15].id)) })
    expect(tracker.getCount(chatList[5].id)).toBe(3)
    expect(tracker.getCount(chatList[15].id)).toBe(2)

    // 第 3 次切换：15 → 0
    act(() => { store.dispatch(setSelectedChatId(chatList[0].id)) })
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

describe('ChatButton selector 优化 - 渲染耗时', () => {
  it('优化后的总渲染耗时不应超过优化前', () => {
    const chatList = createMockChatList(50)
    const RUNS = 10

    const legacyTimes: number[] = []
    const optimizedTimes: number[] = []

    for (let i = 0; i < RUNS; i++) {
      // 优化前
      const legacyStore = createPerfStore(chatList, chatList[0].id)
      const legacyTracker = createRenderTracker()
      const { startTime: legacyStart } = measureSelectionChange(
        createLegacyPattern(legacyTracker), chatList, legacyStore, chatList[49].id,
      )
      legacyTimes.push(legacyTracker.getTotalDuration(legacyStart))

      // 优化后
      const optimizedStore = createPerfStore(chatList, chatList[0].id)
      const optimizedTracker = createRenderTracker()
      const { startTime: optimizedStart } = measureSelectionChange(
        createOptimizedPattern(optimizedTracker), chatList, optimizedStore, chatList[49].id,
      )
      optimizedTimes.push(optimizedTracker.getTotalDuration(optimizedStart))
    }

    const avgLegacy = legacyTimes.reduce((a, b) => a + b, 0) / RUNS
    const avgOptimized = optimizedTimes.reduce((a, b) => a + b, 0) / RUNS

    // 输出耗时供人工审查
    // eslint-disable-next-line no-console
    console.log(`[Perf] 平均渲染耗时 — 优化前: ${avgLegacy.toFixed(2)}ms, 优化后: ${avgOptimized.toFixed(2)}ms`)

    // 断言：优化后耗时不超过优化前的 1.5 倍（容许测试环境波动）
    expect(avgOptimized).toBeLessThanOrEqual(avgLegacy * 1.5)
  })
})

describe('ChatButton selector 优化 - 边界情况', () => {
  it('重复选中同一个聊天时，两种模式都不应触发 ChatButton 重渲染', () => {
    const chatList = createMockChatList(10)
    const selectedId = chatList[0].id

    // 优化前
    const legacyStore = createPerfStore(chatList, selectedId)
    const legacyTracker = createRenderTracker()
    const LegacyPattern = createLegacyPattern(legacyTracker)

    render(
      <Provider store={legacyStore}>
        <BrowserRouter>
          <LegacyPattern chatList={chatList} />
        </BrowserRouter>
      </Provider>
    )
    act(() => { legacyStore.dispatch(setSelectedChatId(selectedId)) })
    chatList.forEach(chat => {
      expect(legacyTracker.getCount(chat.id)).toBe(1)
    })

    // 优化后
    const optimizedStore = createPerfStore(chatList, selectedId)
    const optimizedTracker = createRenderTracker()
    const OptimizedPattern = createOptimizedPattern(optimizedTracker)

    render(
      <Provider store={optimizedStore}>
        <BrowserRouter>
          <OptimizedPattern chatList={chatList} />
        </BrowserRouter>
      </Provider>
    )
    act(() => { optimizedStore.dispatch(setSelectedChatId(selectedId)) })
    chatList.forEach(chat => {
      expect(optimizedTracker.getCount(chat.id)).toBe(1)
    })
  })
})
