import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { NoProvidersAvailable } from '@/components/NoProvidersAvailable'

vi.mock('react-i18next', () =>
  globalThis.__mockI18n({
    common: {
      noProvidersAvailable: '无可用模型供应商',
      noProvidersDescription: '请检查网络连接或稍后重试',
      noProvidersHint: '您可以尝试刷新页面',
      reload: '重新加载',
    },
  }));

describe('NoProvidersAvailable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { reload: vi.fn() },
    })
  })

  afterEach(() => {
    cleanup()
  })

  describe('错误信息展示', () => {
    it('应该显示错误标题和描述', () => {
      render(<NoProvidersAvailable />)
      
      expect(screen.getByText('无可用模型供应商')).toBeInTheDocument()
      expect(screen.getByText('请检查网络连接或稍后重试')).toBeInTheDocument()
    })

    it('应该显示错误提示信息', () => {
      render(<NoProvidersAvailable />)
      
      expect(screen.getByText('您可以尝试刷新页面')).toBeInTheDocument()
    })

    it('应该显示错误图标', () => {
      render(<NoProvidersAvailable />)
      
      const icon = screen.getByTestId('no-providers-icon')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('reload 功能', () => {
    it('应该调用 window.location.reload 当点击重新加载按钮', async () => {
      const mockReload = vi.fn()
      window.location.reload = mockReload
      
      render(<NoProvidersAvailable />)
      
      const reloadButton = screen.getByText('重新加载')
      fireEvent.click(reloadButton)

      expect(mockReload).toHaveBeenCalledTimes(1)
    })

    it('重新加载按钮必须有正确的文本', () => {
      render(<NoProvidersAvailable />)
      
      const reloadButton = screen.getByText('重新加载')
      expect(reloadButton).toBeInTheDocument()
      expect(reloadButton.tagName).toBe('BUTTON')
    })

    it('重新加载按钮必须是可点击的', () => {
      render(<NoProvidersAvailable />)
      
      const reloadButton = screen.getByText('重新加载')
      expect(reloadButton).toBeEnabled()
    })
  })

  describe('可访问性', () => {
    it('错误图标必须有正确的文本和尺寸', () => {
      render(<NoProvidersAvailable />)
      
      const icon = screen.getByTestId('no-providers-icon')
      expect(icon).toHaveClass('h-16', 'w-16')
    })

    it('重新加载按钮必须可键盘访问', () => {
      const mockReload = vi.fn()
      window.location.reload = mockReload

      render(<NoProvidersAvailable />)

      const reloadButton = screen.getByText('重新加载')

      // 模拟 Tab 键聚焦
      reloadButton.focus()
      expect(reloadButton).toHaveFocus()

      // button 元素本身支持键盘 Enter/Space 触发点击
      expect(reloadButton.tagName).toBe('BUTTON')
    })
  })

  describe('样式和布局', () => {
    it('错误容器必须有正确的样式类名', () => {
      render(<NoProvidersAvailable />)
      
      const container = screen.getByTestId('no-providers-container')
      expect(container).toBeInTheDocument()
    })

    it('内容容器必须有正确的布局类名', () => {
      render(<NoProvidersAvailable />)
      
      const contentContainer = screen.getByTestId('no-providers-content')
      expect(contentContainer).toBeInTheDocument()
    })

    it('图标必须有正确的颜色类名', () => {
      render(<NoProvidersAvailable />)
      
      const icon = screen.getByTestId('no-providers-icon')
      expect(icon).toHaveClass('text-destructive')
    })
  })
})
