import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { ModelSearch } from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ModelSearch'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (fn: (ns: any) => string) => (fn ? fn({ setting: { modelProvider: { searchPlaceholder: 'setting.modelProvider.searchPlaceholder', searchResult: 'setting.modelProvider.searchResult', totalModels: 'setting.modelProvider.totalModels' } } }) : ''),
  }),
}))

describe('ModelSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    resultCount: 5,
    totalCount: 10,
  }

  describe('搜索框输入', () => {
    it('应该调用 onChange 回调当用户输入文本', async () => {
      render(<ModelSearch {...defaultProps} />)
      const searchInput = screen.getByPlaceholderText('setting.modelProvider.searchPlaceholder')

      await userEvent.type(searchInput, 'test')

      expect(defaultProps.onChange).toHaveBeenCalledTimes(4)
      expect(defaultProps.onChange).toHaveBeenLastCalledWith('t')
    })

    it('应该调用 onChange 回调当清空搜索框', async () => {
      render(<ModelSearch {...defaultProps} value="test" />)
      const searchInput = screen.getByPlaceholderText('setting.modelProvider.searchPlaceholder')

      await userEvent.clear(searchInput)

      expect(defaultProps.onChange).toHaveBeenCalledWith('')
    })

    it('应该显示 placeholder 文本', () => {
      render(<ModelSearch {...defaultProps} />)
      const searchInput = screen.getByPlaceholderText('setting.modelProvider.searchPlaceholder')

      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute('placeholder', 'setting.modelProvider.searchPlaceholder')
    })
  })

  describe('结果统计显示', () => {
    it('应该显示搜索结果数量当有搜索值时', () => {
      render(<ModelSearch {...defaultProps} value="test" resultCount={5} />)
      expect(screen.getByText('setting.modelProvider.searchResult')).toBeInTheDocument()
    })

    it('应该显示总模型数量当无搜索值时', () => {
      render(<ModelSearch {...defaultProps} value="" totalCount={10} />)
      expect(screen.getByText('setting.modelProvider.totalModels')).toBeInTheDocument()
    })

    it('应该显示无结果提示当搜索无结果时', () => {
      render(<ModelSearch {...defaultProps} value="test" resultCount={0} />)
      expect(screen.getByText('setting.modelProvider.searchResult')).toBeInTheDocument()
    })
  })

  describe('事件冒泡阻止', () => {
    it('应该阻止点击事件冒泡', async () => {
      const mockParentClick = vi.fn()
      render(
        <div onClick={mockParentClick}>
          <ModelSearch {...defaultProps} />
        </div>
      )

      const searchInput = screen.getByPlaceholderText('setting.modelProvider.searchPlaceholder')
      await userEvent.click(searchInput)

      expect(mockParentClick).not.toHaveBeenCalled()
    })
  })

  describe('国际化文本', () => {
    it('应该支持搜索框 placeholder 国际化', () => {
      render(<ModelSearch {...defaultProps} />)
      const searchInput = screen.getByPlaceholderText('setting.modelProvider.searchPlaceholder')

      expect(searchInput).toHaveAttribute('placeholder', 'setting.modelProvider.searchPlaceholder')
    })

    it('应该支持结果统计文本国际化', () => {
      render(<ModelSearch {...defaultProps} value="test" resultCount={5} />)
      expect(screen.getByText('setting.modelProvider.searchResult')).toBeInTheDocument()

      render(<ModelSearch {...defaultProps} value="" totalCount={10} />)
      expect(screen.getByText('setting.modelProvider.totalModels')).toBeInTheDocument()
    })
  })

  describe('组件渲染', () => {
    it('应该渲染搜索图标', () => {
      const { container } = render(<ModelSearch {...defaultProps} />)
      const svgIcon = container.querySelector('svg')

      expect(svgIcon).toBeInTheDocument()
    })

    it('应该正确应用样式类名', () => {
      const { container } = render(<ModelSearch {...defaultProps} />)
      const wrapper = container.querySelector('.space-y-2')
      const searchContainer = container.querySelector('.relative')

      expect(wrapper).toBeInTheDocument()
      expect(searchContainer).toBeInTheDocument()
    })
  })
})
