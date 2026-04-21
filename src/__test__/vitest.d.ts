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
}

// oxlint-disable-next-line require-module-specifiers
export {};
