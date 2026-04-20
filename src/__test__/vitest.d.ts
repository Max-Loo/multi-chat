/// <reference types="@testing-library/jest-dom" />

/**
 * i18n mock 工厂函数（由 setup.ts 注册到 globalThis）
 *
 * 用于 vi.mock('react-i18next', () => globalThis.__createI18nMockReturn(R)) 模式
 */
declare global {
  // eslint-disable-next-line no-var
  var __createI18nMockReturn: typeof import('./helpers/mocks/i18n').createI18nMockReturn;
}

// oxlint-disable-next-line require-module-specifiers
export {};
