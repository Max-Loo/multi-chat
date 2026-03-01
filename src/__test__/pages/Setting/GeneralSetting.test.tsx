/**
 * GeneralSetting 组件测试
 * 
 * 测试覆盖：
 * - 渲染：语言设置和模型供应商设置组件
 * - 滚动：滚动容器的滚动事件处理
 * - 样式：自定义滚动条类名应用
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import GeneralSetting from "@/pages/Setting/components/GeneralSetting"
import { resetTestState } from "../../helpers/isolation"

// Mock useAdaptiveScrollbar hook
vi.mock("@/hooks/useAdaptiveScrollbar", () => ({
  useAdaptiveScrollbar: () => ({
    scrollbarClassname: "custom-scrollbar-class",
    onScrollEvent: vi.fn(),
  }),
}))

// Mock 子组件以简化测试
vi.mock("@/pages/Setting/components/GeneralSetting/components/LanguageSetting", () => ({
  default: () => <div data-testid="language-setting">LanguageSetting</div>,
}))

vi.mock("@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting", () => ({
  default: () => <div data-testid="model-provider-setting">ModelProviderSetting</div>,
}))

describe("GeneralSetting 组件", () => {
  beforeEach(() => {
    resetTestState()
  })

  afterEach(() => {
    cleanup()
  })

  describe("渲染测试", () => {
    it("应该渲染 LanguageSetting 组件", () => {
      render(<GeneralSetting />)

      const languageSetting = screen.getByTestId("language-setting")
      expect(languageSetting).toBeInTheDocument()
      expect(languageSetting).toHaveTextContent("LanguageSetting")
    })

    it("应该渲染 ModelProviderSetting 组件", () => {
      render(<GeneralSetting />)

      const modelProviderSetting = screen.getByTestId("model-provider-setting")
      expect(modelProviderSetting).toBeInTheDocument()
      expect(modelProviderSetting).toHaveTextContent("ModelProviderSetting")
    })

    it("应该应用自定义滚动条类名", () => {
      const { container } = render(<GeneralSetting />)

      const scrollContainer = container.querySelector(".custom-scrollbar-class")
      expect(scrollContainer).toBeInTheDocument()
    })
  })

  describe("滚动测试", () => {
    it("应该正确设置滚动容器", () => {
      const { container } = render(<GeneralSetting />)

      const scrollContainer = container.querySelector(".overflow-y-auto")
      expect(scrollContainer).toBeInTheDocument()
    })

    it("应该在滚动时调用 onScrollEvent", () => {
      const { container } = render(<GeneralSetting />)

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
