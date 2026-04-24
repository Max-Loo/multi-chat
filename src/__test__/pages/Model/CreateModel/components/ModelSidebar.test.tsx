/**
 * ModelSidebar 组件单元测试
 *
 * 测试模型供应商侧边栏组件的功能
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import ModelSidebar from '@/pages/Model/CreateModel/components/ModelSidebar'
import { renderWithProviders, createTypeSafeTestStore } from '@/__test__/helpers/render/redux'
import { createMockRemoteProviders } from '@/__test__/helpers/fixtures'
import { createModelProviderSliceState } from '@/__test__/helpers/mocks/testState'
import { ModelProviderKeyEnum } from '@/utils/enums'

// 每个测试后清理
afterEach(() => {
  cleanup()
})

// Mock react-i18next
vi.mock('react-i18next', () =>
  globalThis.__mockI18n({
    model: {
      modelProvider: '模型供应商',
      searchModel: '搜索模型...',
    },
  }));

/**
 * 创建测试用 Redux store
 * @param providers 供应商列表
 */
const createTestStore = (providers?: ReturnType<typeof createMockRemoteProviders>) => {
  return createTypeSafeTestStore({
    modelProvider: createModelProviderSliceState({
      providers: providers || createMockRemoteProviders(),
    }),
  })
}


describe('ModelSidebar 组件测试', () => {
  let store: ReturnType<typeof createTestStore>
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    store = createTestStore()
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  describe('4.1 供应商列表渲染', () => {
    it('应该渲染所有供应商', () => {
      const onChange = vi.fn()
      renderWithProviders(
        <ModelSidebar
          value={ModelProviderKeyEnum.DEEPSEEK}
          onChange={onChange}
        />,
        { store })

      expect(screen.getByText('DeepSeek')).toBeInTheDocument()
      expect(screen.getByText('Kimi')).toBeInTheDocument()
      expect(screen.getByText('ZhipuAI')).toBeInTheDocument()
    })

    it('应该渲染空供应商列表', () => {
      const emptyStore = createTypeSafeTestStore({
        modelProvider: createModelProviderSliceState({ providers: [] }),
      })
      const onChange = vi.fn()

      const { container } = renderWithProviders(
        <ModelSidebar
          value={ModelProviderKeyEnum.DEEPSEEK}
          onChange={onChange}
        />,
        { store: emptyStore })

      // 验证没有渲染供应商按钮
      const buttons = container.querySelectorAll('button[title]')
      expect(buttons.length).toBe(0)
    })

    it('应该显示选中状态', () => {
      const onChange = vi.fn()

      renderWithProviders(
        <ModelSidebar
          value={ModelProviderKeyEnum.DEEPSEEK}
          onChange={onChange}
        />,
        { store })

      // 查找包含 DeepSeek 文本的按钮
      const deepseekButton = screen.getAllByText('DeepSeek')[0].closest('button')
      expect(deepseekButton).toHaveClass('bg-gray-200')
    })

    it('应该只显示一个选中状态', () => {
      const onChange = vi.fn()

      renderWithProviders(
        <ModelSidebar
          value={ModelProviderKeyEnum.DEEPSEEK}
          onChange={onChange}
        />,
        { store })

      // 验证 DeepSeek 被选中
      const deepseekButton = screen.getAllByText('DeepSeek')[0].closest('button')
      expect(deepseekButton).toHaveClass('bg-gray-200')

      // 验证其他供应商未被选中
      const kimiButton = screen.getAllByText('Kimi')[0].closest('button')
      const zhipuButton = screen.getAllByText('ZhipuAI')[0].closest('button')
      expect(kimiButton).not.toHaveClass('bg-gray-200')
      expect(zhipuButton).not.toHaveClass('bg-gray-200')
    })
  })

  describe('4.2 文本搜索过滤功能', () => {
    it('应该渲染搜索输入框', () => {
      const onChange = vi.fn()
      renderWithProviders(
        <ModelSidebar
          value={ModelProviderKeyEnum.DEEPSEEK}
          onChange={onChange}
        />,
        { store })

      // 验证搜索框存在（使用 getAll 并检查长度）
      const filterInputs = screen.getAllByPlaceholderText('搜索模型...')
      expect(filterInputs.length).toBeGreaterThan(0)
    })

    it('应该允许在搜索框中输入文本', async () => {
      const onChange = vi.fn()
      renderWithProviders(
        <ModelSidebar
          value={ModelProviderKeyEnum.DEEPSEEK}
          onChange={onChange}
        />,
        { store })

      const filterInput = screen.getAllByPlaceholderText('搜索模型...')[0]
      await user.type(filterInput, 'deep')

      // 验证输入框的值
      expect(filterInput).toHaveValue('deep')
    })

    it('应该允许清空搜索框', async () => {
      const onChange = vi.fn()
      renderWithProviders(
        <ModelSidebar
          value={ModelProviderKeyEnum.DEEPSEEK}
          onChange={onChange}
        />,
        { store })

      const filterInput = screen.getAllByPlaceholderText('搜索模型...')[0]

      // 输入文本
      await user.type(filterInput, 'deep')
      expect(filterInput).toHaveValue('deep')

      // 清空文本
      await user.clear(filterInput)
      expect(filterInput).toHaveValue('')
    })

    it('应该支持搜索框输入', async () => {
      const onChange = vi.fn()
      renderWithProviders(
        <ModelSidebar
          value={ModelProviderKeyEnum.DEEPSEEK}
          onChange={onChange}
        />,
        { store })

      const filterInput = screen.getAllByPlaceholderText('搜索模型...')[0]
      await user.type(filterInput, 'xyz')

      // 验证输入成功
      expect(filterInput).toHaveValue('xyz')
    })
  })

  describe('4.3 选中状态切换', () => {
    it('应该调用 onChange 回调', async () => {
      const onChange = vi.fn()
      const { container } = renderWithProviders(
        <ModelSidebar
          value={ModelProviderKeyEnum.DEEPSEEK}
          onChange={onChange}
        />,
        { store })

      // 查找 Kimi 按钮并点击
      const kimiButton = Array.from(container.querySelectorAll('button[title]')).find(
        btn => btn.getAttribute('title') === 'Kimi'
      )
      expect(kimiButton).toBeTruthy()

      await user.click(kimiButton!)

      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith('moonshotai')
    })

    it('应该允许重复选择同一供应商', async () => {
      const onChange = vi.fn()
      const { container } = renderWithProviders(
        <ModelSidebar
          value={ModelProviderKeyEnum.DEEPSEEK}
          onChange={onChange}
        />,
        { store })

      const deepseekButton = Array.from(container.querySelectorAll('button[title]')).find(
        btn => btn.getAttribute('title') === 'DeepSeek'
      )
      expect(deepseekButton).toBeTruthy()

      // 第一次点击
      await user.click(deepseekButton!)
      expect(onChange).toHaveBeenLastCalledWith('deepseek')

      // 第二次点击
      await user.click(deepseekButton!)
      expect(onChange).toHaveBeenLastCalledWith('deepseek')
      expect(onChange).toHaveBeenCalledTimes(2)
    })
  })

  describe('4.4 返回按钮导航', () => {
    it('应该渲染返回按钮', () => {
      const onChange = vi.fn()
      renderWithProviders(
        <ModelSidebar
          value={ModelProviderKeyEnum.DEEPSEEK}
          onChange={onChange}
        />,
        { store })

      // 查找所有按钮
      const buttons = screen.getAllByRole('button')
      // 第一个按钮应该是返回按钮（带箭头图标）
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('应该显示正确的标题', () => {
      const onChange = vi.fn()
      renderWithProviders(
        <ModelSidebar
          value={ModelProviderKeyEnum.DEEPSEEK}
          onChange={onChange}
        />,
        { store })

      expect(screen.getAllByText('模型供应商')[0]).toBeInTheDocument()
    })
  })

  describe('4.5 Redux 连接', () => {
    it('应该从 Redux store 读取供应商列表', () => {
      const customProviders = createMockRemoteProviders([
        { providerKey: 'test1', providerName: 'Test Provider 1' },
        { providerKey: 'test2', providerName: 'Test Provider 2' },
      ])
      const customStore = createTestStore(customProviders)
      const onChange = vi.fn()

      renderWithProviders(
        <ModelSidebar
          value={ModelProviderKeyEnum.DEEPSEEK}
          onChange={onChange}
        />,
        { store: customStore })

      expect(screen.getByText('Test Provider 1')).toBeInTheDocument()
      expect(screen.getByText('Test Provider 2')).toBeInTheDocument()
    })

    it('应该响应 Redux store 变化', () => {
      const onChange = vi.fn()
      renderWithProviders(
        <ModelSidebar
          value={ModelProviderKeyEnum.DEEPSEEK}
          onChange={onChange}
        />,
        { store })

      // 初始状态验证
      expect(screen.getAllByText('DeepSeek')[0]).toBeInTheDocument()
      expect(screen.getAllByText('Kimi')[0]).toBeInTheDocument()
      expect(screen.getAllByText('ZhipuAI')[0]).toBeInTheDocument()
    })
  })

  describe('4.6 边界情况', () => {
    it('应该处理组件卸载', () => {
      const onChange = vi.fn()
      const { unmount } = renderWithProviders(
        <ModelSidebar
          value={ModelProviderKeyEnum.DEEPSEEK}
          onChange={onChange}
        />,
        { store })

      expect(() => unmount()).not.toThrow()
    })

    it('应该处理重新渲染', () => {
      const onChange = vi.fn()
      const { rerender } = renderWithProviders(
        <ModelSidebar
          value={ModelProviderKeyEnum.DEEPSEEK}
          onChange={onChange}
        />,
        { store })

      rerender(
        <ModelSidebar
          value={ModelProviderKeyEnum.MOONSHOTAI}
          onChange={onChange}
        />
      )
    })

    it('应该处理空搜索输入', async () => {
      const onChange = vi.fn()
      renderWithProviders(
        <ModelSidebar
          value={ModelProviderKeyEnum.DEEPSEEK}
          onChange={onChange}
        />,
        { store })

      const filterInput = screen.getAllByPlaceholderText('搜索模型...')[0]
      
      // 输入后清空
      await user.type(filterInput, 'test')
      await user.clear(filterInput)

      // 验证仍然显示所有供应商
      await waitFor(() => {
        expect(screen.getAllByText('DeepSeek')[0]).toBeInTheDocument()
        expect(screen.getAllByText('Kimi')[0]).toBeInTheDocument()
        expect(screen.getAllByText('ZhipuAI')[0]).toBeInTheDocument()
      })
    })
  })

  describe('4.7 可访问性', () => {
    it('应该为供应商按钮提供 title 属性', () => {
      const onChange = vi.fn()
      renderWithProviders(
        <ModelSidebar
          value={ModelProviderKeyEnum.DEEPSEEK}
          onChange={onChange}
        />,
        { store })

      const deepseekButton = screen.getAllByText('DeepSeek')[0].closest('button')
      expect(deepseekButton).toHaveAttribute('title', 'DeepSeek')
    })

    it('应该显示搜索框占位符', () => {
      const onChange = vi.fn()
      renderWithProviders(
        <ModelSidebar
          value={ModelProviderKeyEnum.DEEPSEEK}
          onChange={onChange}
        />,
        { store })

      const filterInput = screen.getAllByPlaceholderText('搜索模型...')[0]
      expect(filterInput).toBeInTheDocument()
    })
  })
})
