/**
 * react-i18next mock 工厂函数
 *
 * 用于 vi.mock('react-i18next') 的统一 mock 创建。
 * 由于 vitest 的 hoisting 限制，vi.mock 工厂无法使用常规 import，
 * 因此此函数通过 setup.ts 注册到 globalThis.__createI18nMockReturn。
 *
 * 支持三种 t() 调用模式：
 * - 选择器函数：t((r) => r.common.title) → 从 R 中解析
 * - 字符串键：t('common.title') → 通过 dot-notation 从 R 中查找
 * - 模板插值：t('common.count', { count: 5 }) → 替换 {{count}} 占位符
 *
 * R 对象只保留测试断言实际使用的翻译键，避免冗余。
 *
 * @example
 * ```typescript
 * // 标准用法（通过 globalThis，在 vi.mock 工厂中使用）
 * vi.mock('react-i18next', () => {
 *   const R = { nav: { chat: '聊天' } };
 *   return globalThis.__createI18nMockReturn(R);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // 模板插值用法
 * vi.mock('react-i18next', () => {
 *   const R = { setting: { count: '共 {{count}} 个模型' } };
 *   return globalThis.__createI18nMockReturn(R);
 * });
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
      t: ((keyOrSelector: string | ((resources: T) => string), options?: Record<string, unknown>) => {
        let result = typeof keyOrSelector === 'function'
          ? keyOrSelector(zhResources)
          : (keyOrSelector as string).split('.').reduce((o: any, p: string) => o?.[p], zhResources) || keyOrSelector;
        if (options && typeof result === 'string') {
          Object.entries(options).forEach(([key, val]) => {
            result = result.replace(`{{${key}}}`, String(val));
          });
        }
        return result;
      }) as unknown,
      i18n: {
        language: 'zh',
        changeLanguage: vi.fn(),
      },
    }),
    initReactI18next: {
      type: '3rdParty' as const,
      init: vi.fn(),
    },
    I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
  };
}
