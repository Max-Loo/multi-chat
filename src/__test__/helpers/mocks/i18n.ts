/**
 * react-i18next mock 工厂函数
 *
 * 为测试提供类型安全的 i18n mock，支持字符串键和选择器函数两种调用方式。
 *
 * 注意：由于 vi.hoisted 不支持 require 路径别名（@/），需要在测试文件中
 * 通过 vi.hoisted 内联定义工厂函数。此文件作为参考实现，展示正确的工厂函数签名。
 *
 * @example
 * ```typescript
 * const { createI18nMock } = vi.hoisted(() => {
 *   function createI18nMockReturn<T extends Record<string, unknown>>(zhResources: T) {
 *     return {
 *       useTranslation: () => ({
 *         t: ((keyOrSelector: string | ((resources: T) => string)) =>
 *           typeof keyOrSelector === 'function' ? keyOrSelector(zhResources) : keyOrSelector
 *         ) as unknown,
 *         i18n: { language: 'zh', changeLanguage: vi.fn() },
 *       }),
 *       initReactI18next: { type: '3rdParty' as const, init: vi.fn() },
 *     };
 *   }
 *   return { createI18nMock: createI18nMockReturn };
 * });
 *
 * vi.mock('react-i18next', () =>
 *   createI18nMock({
 *     common: { title: '标题' },
 *   })
 * );
 * ```
 */

import { vi } from 'vitest';

/**
 * 创建 react-i18next mock 返回值
 * @param zhResources 翻译资源对象，类型由调用方推断
 * @returns vi.mock('react-i18next') 的返回值
 */
export function createI18nMockReturn<T extends Record<string, unknown>>(zhResources: T) {
  return {
    useTranslation: () => ({
      t: ((keyOrSelector: string | ((resources: T) => string)) =>
        typeof keyOrSelector === 'function' ? keyOrSelector(zhResources) : keyOrSelector
      ) as unknown,
      i18n: {
        language: 'zh',
        changeLanguage: vi.fn(),
      },
    }),
    initReactI18next: {
      type: '3rdParty' as const,
      init: vi.fn(),
    },
  };
}
