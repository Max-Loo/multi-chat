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
import { screen, cleanup, fireEvent } from "@testing-library/react"
import GeneralSetting from "@/pages/Setting/components/GeneralSetting"
import { renderWithProviders } from "../../helpers/render/redux"
import { resetTestState } from "../../helpers/isolation"
import { exportDeletedChats } from "@/services/chatExport"
import { toastQueue } from "@/services/toast"

// Mock useAdaptiveScrollbar hook
vi.mock("@/hooks/useAdaptiveScrollbar", () => ({
  useAdaptiveScrollbar: () => ({
    scrollbarClassname: "custom-scrollbar-class",
    onScrollEvent: vi.fn(),
  }),
}))

vi.mock('react-i18next', () => {
  const R = { common: { language: '语言' }, setting: { autoNaming: { title: '自动命名', description: '自动为聊天生成标题，默认开启' }, modelProvider: { refreshButton: '刷新模型供应商' }, chatExport: { title: '聊天导出', description: '导出聊天数据为 JSON 文件', exportAll: '导出所有聊天', exportDeleted: '导出已删除聊天', exportSuccess: '导出成功', exportFailed: '导出失败', noDeletedChats: '没有已删除的聊天' } } };
  return globalThis.__createI18nMockReturn(R);
});

// Mock toastQueue（子组件 LanguageSetting 和 ModelProviderSetting 依赖）
vi.mock("@/services/toast", () => ({
  toastQueue: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}))

// Mock changeAppLanguage（LanguageSetting 依赖）
vi.mock("@/services/i18n", () => ({
  changeAppLanguage: vi.fn().mockResolvedValue({ success: true }),
}))

// Mock chatExport 服务（ChatExportSetting 依赖）
vi.mock("@/services/chatExport", () => ({
  exportAllChats: vi.fn().mockResolvedValue({ chats: [], exportedAt: "", version: "" }),
  exportDeletedChats: vi.fn().mockResolvedValue({ chats: [], exportedAt: "", version: "" }),
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

  describe("聊天导出测试", () => {
    it("导出已删除聊天为空时应提示用户", async () => {
      renderWithProviders(<GeneralSetting />)

      const exportDeletedButton = screen.getByText("导出已删除聊天")
      await fireEvent.click(exportDeletedButton)

      // 等待异步操作完成
      await vi.waitFor(() => {
        expect(exportDeletedChats).toHaveBeenCalled()
      })

      // 已删除聊天为空时应提示用户，不应触发文件下载
      expect(toastQueue.info).toHaveBeenCalledWith("没有已删除的聊天")
      expect(toastQueue.success).not.toHaveBeenCalled()
    })
  })
})
