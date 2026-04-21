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
}

// oxlint-disable-next-line require-module-specifiers
export {};
