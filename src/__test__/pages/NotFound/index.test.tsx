/**
 * NotFound 页面组件测试
 *
 * 测试 404 页面的功能和交互
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

vi.mock('react-i18next', () =>
  globalThis.__mockI18n({
    common: {
      pageNotFound: 'common.pageNotFound',
      pageNotFoundDescription: 'common.pageNotFoundDescription',
      goBack: 'common.goBack',
    },
  }));

describe('NotFound', () => {

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
      renderComponent()
      expect(screen.getByRole('img', { name: 'error' })).toBeInTheDocument()
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
    it('错误图标必须可见', () => {
      renderComponent()
      expect(screen.getByRole('img', { name: 'error' })).toBeInTheDocument()
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
      renderComponent()

      // 验证关键内容元素存在
      expect(screen.getByText('404')).toBeInTheDocument()
      expect(screen.getByText('common.goBack')).toBeInTheDocument()
    })
  })

  describe('样式和布局', () => {
    it('错误图标必须存在', () => {
      renderComponent()
      expect(screen.getByRole('img', { name: 'error' })).toBeInTheDocument()
    })

    it('404 文本必须显示', () => {
      renderComponent()
      expect(screen.getByText('404')).toBeInTheDocument()
    })

    it('内容区域必须包含所有必要元素', () => {
      renderComponent()
      expect(screen.getByText('404')).toBeInTheDocument()
      expect(screen.getByText('common.pageNotFound')).toBeInTheDocument()
      expect(screen.getByText('common.goBack')).toBeInTheDocument()
    })
  })
})
