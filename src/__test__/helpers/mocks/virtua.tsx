/**
 * virtua 虚拟滚动 Mock 工厂
 *
 * 提供可配置的 MockVirtualizer/MockVList 组件，
 * 支持模拟虚拟化渲染行为（只渲染可见范围内的子项）、滚动模拟、渲染项追踪。
 */

import React, { forwardRef, useImperativeHandle, type ReactNode } from 'react'
import { vi } from 'vitest'

/** Mock 配置参数 */
interface VirtuaMockConfig {
  /** 视口高度（默认 600） */
  viewportHeight: number
  /** 每项高度（默认 80） */
  itemHeight: number
  /** 超出视口的渲染项数（默认 2） */
  overscan: number
}

/** 工厂函数返回值 */
interface VirtuaMockResult {
  MockVirtualizer: React.FC<VirtualizerProps>
  MockVList: React.FC<VListProps>
  scrollTo: (index: number) => void
  getRenderedRange: () => { startIndex: number; endIndex: number }
}

interface VirtualizerProps {
  children: ReactNode
  scrollRef?: React.RefObject<HTMLElement | null>
  startMargin?: number
  onScroll?: (offset: number) => void
}

interface VListProps {
  children: ReactNode
  onScroll?: (offset: number) => void
  className?: string
  style?: React.CSSProperties
}

/**
 * 创建 virtua Mock 组件和测试辅助函数
 * @param config 虚拟化配置参数
 */
export function createVirtuaMock(config?: Partial<VirtuaMockConfig>): VirtuaMockResult {
  const mergedConfig: VirtuaMockConfig = {
    viewportHeight: 600,
    itemHeight: 80,
    overscan: 2,
    ...config,
  }

  // 闭包状态：初始可见范围
  const initialVisibleCount = Math.ceil(mergedConfig.viewportHeight / mergedConfig.itemHeight)
  let state = {
    startIndex: 0,
    endIndex: Math.max(0, initialVisibleCount - 1 + mergedConfig.overscan),
  }
  let latestOnScroll: ((offset: number) => void) | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Reason: 测试 mock 需要透传任意 ref 类型
  let latestScrollRef: React.RefObject<HTMLElement | null> | null = null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Reason: 测试 mock 需要透传任意 props
  const MockVirtualizer = forwardRef<any, VirtualizerProps>(({
    children,
    onScroll,
    scrollRef,
    // 以下 props 被接收但不使用（保持接口兼容）
    startMargin: _startMargin,
  }, ref) => {
    // 每次 render 时将 onScroll 存入闭包，供 scrollTo 调用
    latestOnScroll = onScroll ?? null
    // 保存 scrollRef 供 scrollToIndex 使用
    latestScrollRef = scrollRef ?? null

    // 通过 ref 暴露 scrollToIndex，模拟 virtua 行为：设置 scrollTop = scrollHeight（align: 'end'）
    useImperativeHandle(ref, () => ({
      scrollToIndex: vi.fn(() => {
        const container = latestScrollRef?.current
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      }),
    }), [])

    // 将 children 转为数组以计算可见范围
    const childArray = React.Children.toArray(children)
    const totalItems = childArray.length

    // 计算可见范围
    const start = Math.max(0, state.startIndex)
    const end = Math.min(totalItems - 1, state.endIndex)

    return (
      <div data-testid="mock-virtualizer">
        {totalItems > 0
          ? childArray.slice(start, end + 1)
          : children
        }
      </div>
    )
  })

  MockVirtualizer.displayName = 'MockVirtualizer'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Reason: 测试 mock 需要透传任意 props
  const MockVList: React.FC<VListProps> = ({
    children,
    onScroll,
    className,
    style,
  }) => {
    // 每次 render 时将 onScroll 存入闭包
    latestOnScroll = onScroll ?? null

    return (
      <div className={className} style={style} data-testid="mock-vlist">
        {children}
      </div>
    )
  }

  MockVList.displayName = 'MockVList'

  return {
    MockVirtualizer,
    MockVList,
    scrollTo: (index: number) => {
      const visibleCount = Math.ceil(mergedConfig.viewportHeight / mergedConfig.itemHeight)
      const newStart = Math.max(0, index - mergedConfig.overscan)
      const newEnd = index + visibleCount - 1 + mergedConfig.overscan
      state = { startIndex: newStart, endIndex: newEnd }
      latestOnScroll?.(index * mergedConfig.itemHeight)
    },
    getRenderedRange: () => ({ ...state }),
  }
}
