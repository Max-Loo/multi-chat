/**
 * NotFound 页面组件测试
 *
 * 测试 404 页面的功能和交互
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import NotFound from '@/pages/NotFound'

// Mock React Router navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock i18n - 支持函数式调用 t($ => $.key)
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (fn: (arg: any) => string) => fn?.({ common: { pageNotFound: 'common.pageNotFound', pageNotFoundDescription: 'common.pageNotFoundDescription', goBack: 'common.goBack' } }) || '',
  }),
}))

describe('NotFound', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    )
  }

  describe('页面渲染', () => {
    it('应该显示 404 大号数字', () => {
      renderComponent()
      expect(screen.getByText('404')).toBeInTheDocument()
    })

    it('应该显示页面标题和描述', () => {
      renderComponent()
      expect(screen.getByText('common.pageNotFound')).toBeInTheDocument()
      expect(screen.getByText('common.pageNotFoundDescription')).toBeInTheDocument()
    })

    it('应该显示错误图标', () => {
      const { container } = renderComponent()
      const icon = container.querySelector('.lucide-circle-alert')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('导航按钮', () => {
    it('应该显示返回上一页按钮', () => {
      renderComponent()
      expect(screen.getByText('common.goBack')).toBeInTheDocument()
    })

    it('应该返回上一页当点击返回上一页按钮', async () => {
      renderComponent()
      const backButton = screen.getByText('common.goBack')
      await userEvent.click(backButton)
      expect(mockNavigate).toHaveBeenCalledWith(-1)
    })

    it('返回按钮必须是可点击的', () => {
      renderComponent()
      const backButton = screen.getByText('common.goBack')
      expect(backButton).toBeEnabled()
    })

    it('返回按钮必须有正确的标签类型', () => {
      renderComponent()
      const backButton = screen.getByText('common.goBack')
      expect(backButton.tagName).toBe('BUTTON')
    })
  })

  describe('国际化文本', () => {
    it('页面标题必须支持国际化 key', () => {
      renderComponent()
      expect(screen.getByText('common.pageNotFound')).toBeInTheDocument()
    })

    it('页面描述必须支持国际化 key', () => {
      renderComponent()
      expect(screen.getByText('common.pageNotFoundDescription')).toBeInTheDocument()
    })

    it('按钮文本必须支持国际化 key', () => {
      renderComponent()
      expect(screen.getByText('common.goBack')).toBeInTheDocument()
    })
  })

  describe('可访问性', () => {
    it('错误图标必须有正确的尺寸', () => {
      const { container } = renderComponent()
      const icon = container.querySelector('.lucide-circle-alert')
      expect(icon?.className).toContain('h-32')
      expect(icon?.className).toContain('w-32')
    })

    it('返回按钮必须可键盘访问', async () => {
      renderComponent()
      const backButton = screen.getByText('common.goBack')
      
      // 模拟 Tab 键聚焦
      backButton.focus()
      expect(backButton).toHaveFocus()
      
      // 模拟 Enter 键触发
      await userEvent.keyboard('{Enter}')
      expect(mockNavigate).toHaveBeenCalledWith(-1)
    })

    it('页面必须有正确的布局结构', () => {
      const { container } = renderComponent()
      
      // 验证外层容器有正确的 flex 布局
      const outerContainer = container.querySelector('.flex.items-center.justify-center.h-full.w-full')
      expect(outerContainer).toBeInTheDocument()
      
      // 验证内层容器有正确的 flex 列布局
      const innerContainer = container.querySelector('.flex.flex-col.items-center.justify-center')
      expect(innerContainer).toBeInTheDocument()
    })
  })

  describe('样式和布局', () => {
    it('错误图标必须有正确的颜色类名', () => {
      const { container } = renderComponent()
      const icon = container.querySelector('.lucide-circle-alert')
      expect(icon?.className).toContain('text-muted-foreground')
    })

    it('404 文本必须有正确的样式', () => {
      const { container } = renderComponent()
      const text404 = container.querySelector('.text-6xl.font-bold.text-muted-foreground')
      expect(text404).toBeInTheDocument()
      expect(text404?.textContent).toBe('404')
    })

    it('内容区域必须有正确的间距', () => {
      const { container } = renderComponent()
      const contentContainer = container.querySelector('.space-y-6')
      expect(contentContainer).toBeInTheDocument()
    })
  })
})
