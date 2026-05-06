/// <reference types="@testing-library/jest-dom" />

/**
 * i18n mock 工厂函数（由 setup.ts 注册到 globalThis）
 *
 * 用于 vi.mock('react-i18next', () => globalThis.__createI18nMockReturn(R)) 模式
 */
declare global {
  // eslint-disable-next-line no-var
  var __createI18nMockReturn: typeof import('./helpers/mocks/i18n').createI18nMockReturn;

  /**
   * mockI18n 封装函数（由 setup.ts 注册到 globalThis）
   *
   * 提供带高频默认翻译键的 i18n mock，替代手动定义 const R = {...} 样板
   */
  // eslint-disable-next-line no-var
  var __mockI18n: typeof import('./helpers/mocks/i18n').mockI18n;

  /**
   * 内存存储 mock 工厂函数（由 setup.ts 注册到 globalThis）
   *
   * 用于 vi.mock 工厂中创建基于 Map 的存储 mock，供集成测试使用
   */
  // eslint-disable-next-line no-var
  var __createMemoryStorageMock: typeof import('./helpers/mocks/storage').createMemoryStorageMock;

  /**
   * useResponsive mock 工厂函数（由 setup.ts 注册到 globalThis）
   *
   * 用于 vi.mock('@/hooks/useResponsive') 创建可变的响应式状态对象
   */
  // eslint-disable-next-line no-var
  var __createResponsiveMock: typeof import('./helpers/mocks/responsive').createResponsiveMock;

  /**
   * tauriCompat 模块 mock 工厂函数（由 setup.ts 注册到 globalThis）
   *
   * 用于 vi.mock('@/utils/tauriCompat') 创建完整的模块 mock 对象
   */
  // eslint-disable-next-line no-var
  var __createTauriCompatModuleMock: typeof import('./helpers/mocks/tauriCompat').createTauriCompatModuleMock;

  /**
   * toast 模块 mock 工厂函数（由 setup.ts 注册到 globalThis）
   *
   * 用于 vi.mock('@/services/toast') 创建完整的模块 mock 对象
   */
  // eslint-disable-next-line no-var
  var __createToastQueueModuleMock: typeof import('./helpers/mocks/toast').createToastQueueModuleMock;

  /**
   * useAdaptiveScrollbar mock 工厂函数（由 setup.ts 注册到 globalThis）
   *
   * 用于 vi.mock('@/hooks/useAdaptiveScrollbar') 创建共享 mock
   */
  // eslint-disable-next-line no-var
  var __createScrollbarMock: typeof import('./helpers/mocks/scrollbar').createScrollbarMock;

  /**
   * markdown-it mock 工厂函数（由 setup.ts 注册到 globalThis）
   *
   * 用于 vi.mock('markdown-it') 创建共享 mock
   */
  // eslint-disable-next-line no-var
  var __createMarkdownItMock: typeof import('./helpers/mocks/markdown').createMarkdownItMock;

  /**
   * dompurify mock 工厂函数（由 setup.ts 注册到 globalThis）
   *
   * 用于 vi.mock('dompurify') 创建共享 mock
   */
  // eslint-disable-next-line no-var
  var __createDompurifyMock: typeof import('./helpers/mocks/dompurify').createDompurifyMock;

  /**
   * highlight.js mock 工厂函数（由 setup.ts 注册到 globalThis）
   *
   * 用于 vi.mock('highlight.js') 创建共享 mock
   */
  // eslint-disable-next-line no-var
  var __createHighlightJsMock: typeof import('./helpers/mocks/highlight').createHighlightJsMock;
}

// oxlint-disable-next-line require-module-specifiers
export {};
