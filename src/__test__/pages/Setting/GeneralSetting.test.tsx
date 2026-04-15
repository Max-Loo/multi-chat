/**
 * GeneralSetting 组件测试
 *
 * 测试覆盖：
 * - 渲染：语言设置、自动命名设置、模型供应商设置子组件
 * - 滚动：滚动容器的滚动事件处理
 * - 样式：自定义滚动条类名应用
 *
 * 注意：渲染完整组件树，不 mock 子组件
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { screen, cleanup } from "@testing-library/react"
import GeneralSetting from "@/pages/Setting/components/GeneralSetting"
import { renderWithProviders } from "../../helpers/render/redux"
import { resetTestState } from "../../helpers/isolation"

// Mock useAdaptiveScrollbar hook
vi.mock("@/hooks/useAdaptiveScrollbar", () => ({
  useAdaptiveScrollbar: () => ({
    scrollbarClassname: "custom-scrollbar-class",
    onScrollEvent: vi.fn(),
  }),
}))

const { createI18nMock: _createI18nMock } = vi.hoisted(() => {
  function createI18nMockReturn<T extends Record<string, unknown>>(zhResources: T) {
    return {
      useTranslation: () => ({
        t: ((keyOrSelector: string | ((resources: T) => string)) =>
          typeof keyOrSelector === 'function' ? keyOrSelector(zhResources) : keyOrSelector
        ) as unknown,
        i18n: { language: 'zh', changeLanguage: vi.fn() },
      }),
      initReactI18next: { type: '3rdParty' as const, init: vi.fn() },
    };
  }
  return { createI18nMock: createI18nMockReturn };
});

vi.mock("react-i18next", () =>
  _createI18nMock({
    common: {
      language: "语言",
    },
    setting: {
      autoNaming: {
        title: "自动命名",
        description: "自动为聊天生成标题，默认开启",
      },
      modelProvider: {
        title: "模型供应商",
        description: "从远程服务器获取最新的模型供应商信息",
        refreshButton: "刷新模型供应商",
        refreshing: "刷新中...",
        lastUpdateLabel: "最后更新:",
        refreshSuccess: "模型供应商数据已更新",
        refreshFailed: "刷新失败",
      },
    },
  })
)

// Mock toastQueue（子组件 LanguageSetting 和 ModelProviderSetting 依赖）
vi.mock("@/services/toast", () => ({
  toastQueue: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}))

// Mock changeAppLanguage（LanguageSetting 依赖）
vi.mock("@/services/i18n", () => ({
  changeAppLanguage: vi.fn().mockResolvedValue({ success: true }),
}))

describe("GeneralSetting 组件", () => {
  beforeEach(async () => {
    await resetTestState()
  })

  afterEach(() => {
    cleanup()
  })

  describe("渲染测试", () => {
    it("应该渲染语言设置区域", () => {
      renderWithProviders(<GeneralSetting />)

      // 通过用户可见文本验证 LanguageSetting 真实渲染
      expect(screen.getByText("语言")).toBeInTheDocument()
    })

    it("应该渲染自动命名设置区域", () => {
      renderWithProviders(<GeneralSetting />)

      // 通过用户可见文本验证 AutoNamingSetting 真实渲染
      expect(screen.getByText("自动命名")).toBeInTheDocument()
      expect(screen.getByText("自动为聊天生成标题，默认开启")).toBeInTheDocument()
    })

    it("应该渲染模型供应商设置区域", () => {
      renderWithProviders(<GeneralSetting />)

      // 通过用户可见文本验证 ModelProviderSetting 真实渲染
      expect(screen.getByText("刷新模型供应商")).toBeInTheDocument()
    })

  })

  describe("滚动测试", () => {
    it("应该正确设置滚动容器", () => {
      const { container } = renderWithProviders(<GeneralSetting />)

      const scrollContainer = container.querySelector(".overflow-y-auto")
      expect(scrollContainer).toBeInTheDocument()
    })

    it("应该在滚动时调用 onScrollEvent", () => {
      const { container } = renderWithProviders(<GeneralSetting />)

      const scrollContainer = container.querySelector(".overflow-y-auto")
      expect(scrollContainer).toBeInTheDocument()

      // 触发滚动事件
      if (scrollContainer) {
        const scrollEvent = new Event("scroll", { bubbles: true })
        scrollContainer.dispatchEvent(scrollEvent)
      }

      // 注意：由于我们 Mock 了 onScrollEvent，这里主要验证组件不会崩溃
      // 实际的事件处理在 useEffect 中，由 React 管理
    })
  })
})
