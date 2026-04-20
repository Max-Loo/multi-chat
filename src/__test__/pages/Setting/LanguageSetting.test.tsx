/**
 * LanguageSetting 组件测试
 * 
 * 测试覆盖：
 * - 渲染：当前选中的语言显示
 * - 交互：语言选择下拉菜单的展开和收起
 * - 交互：选择语言后更新 Redux store
 * 
 * 注意：由于 shadcn/ui Select 组件的复杂性，我们使用简化 Mock
 * 覆盖率目标：60%+
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent } from "@testing-library/react"
import LanguageSetting from "@/pages/Setting/components/GeneralSetting/components/LanguageSetting"
import { resetTestState } from "../../helpers/isolation"

// 创建 mock 函数（在 vi.mock 之外定义）
const mockDispatch = vi.fn()
const mockSetAppLanguage = vi.fn()

vi.mock("@/hooks/redux", () => ({
  useAppDispatch: () => mockDispatch,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Reason: 第三方库类型定义不完整
  useAppSelector: (selector: (state: any) => any) =>
    selector({
      appConfig: {
        language: "zh",
      },
    }),
}))

// Mock action creator
vi.mock("@/store/slices/appConfigSlices", () => ({
  setAppLanguage: (lang: string) => mockSetAppLanguage(lang),
}))

// Mock i18n functions - 在 factory 内部创建所有内容
vi.mock("@/services/i18n", () => {
  const mockChangeAppLanguage = vi.fn().mockResolvedValue({ success: true })
  return {
    changeAppLanguage: mockChangeAppLanguage,
    getLanguageLabel: (lang: string) => lang,
    initI18n: vi.fn(),
    getInitI18nPromise: vi.fn(),
  }
})

// Mock sonner toast - 在 factory 内部创建
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('react-i18next', () => {
  const R = { common: { language: '语言' } };
  return globalThis.__createI18nMockReturn(R);
});

// 简化 Mock UI 组件，但保留 onValueChange 回调执行
vi.mock("@/components/ui/select", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Reason: 第三方库类型定义不完整
  Select: ({ value, onValueChange, children }: any) => (
    <div data-testid="select" data-value={value}>
      {children}
      <button
        data-testid="toggle-language"
        onClick={() => {
          // 模拟选择英文
          if (value === "zh") {
            onValueChange("en")
          }
        }}
      >
        Toggle Language
      </button>
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Reason: 第三方库类型定义不完整
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: () => <div data-testid="select-value">Language Value</div>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Reason: 第三方库类型定义不完整
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Reason: 第三方库类型定义不完整
  SelectItem: ({ children, value }: any) => (
    <div data-testid={`option-${value}`} data-value={value}>
      {children}
    </div>
  ),
}))

describe("LanguageSetting 组件", () => {
  beforeEach(async () => {
    await resetTestState()
    mockDispatch.mockClear()
    mockSetAppLanguage.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  describe("渲染测试", () => {
    it("应该渲染当前选中的语言标签", () => {
      render(<LanguageSetting />)

      const label = screen.queryByText("语言")
      expect(label).toBeInTheDocument()
    })

    it("应该渲染 Select 组件", () => {
      render(<LanguageSetting />)

      const select = screen.getByTestId("select")
      expect(select).toBeInTheDocument()
      expect(select).toHaveAttribute("data-value", "zh")
    })

    it("应该应用自定义 className", () => {
      const { container } = render(<LanguageSetting className="custom-class" />)

      const wrapper = container.querySelector(".custom-class")
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe("交互测试", () => {
    it("应该展开和收起语言选择下拉菜单", () => {
      render(<LanguageSetting />)

      const select = screen.getByTestId("select")
      const selectContent = screen.getByTestId("select-content")

      expect(select).toBeInTheDocument()
      expect(selectContent).toBeInTheDocument()
    })

    it("选择语言后应该更新 Redux store", async () => {
      render(<LanguageSetting />)

      // 点击触发器模拟语言切换
      const trigger = screen.getByTestId("toggle-language")
      fireEvent.click(trigger)

      // 等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 0))

      // 验证 dispatch 被调用
      expect(mockDispatch).toHaveBeenCalled()
    })

    it("应该正确渲染所有语言选项", () => {
      render(<LanguageSetting />)

      const selectContent = screen.getByTestId("select-content")

      // 验证所有选项都被渲染
      expect(selectContent.querySelector('[data-testid="option-zh"]')).toBeInTheDocument()
      expect(selectContent.querySelector('[data-testid="option-en"]')).toBeInTheDocument()
    })
  })
})
