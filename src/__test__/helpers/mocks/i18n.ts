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
 * 高频默认翻译资源（从 52 个测试文件中提取的公共键）
 *
 * 包含 3+ 个文件共享的翻译键，用于减少 vi.mock('react-i18next') 的样板代码。
 * 通过 mockI18n(keys?) 自动合并到自定义翻译中。
 */
export const DEFAULT_I18N_RESOURCES = {
  common: {
    cancel: '取消',
    confirm: '确认',
    loading: '加载中...',
    search: '搜索',
    remark: '备注',
    submit: '提交',
    resetConfirmTitle: '确认重置',
    resetConfirmDescription: '此操作将清除所有数据',
    resetConfirmAction: '确认重置',
  },
  chat: {
    unnamed: '未命名',
    modelDeleted: '模型已删除',
    deleted: '已删除',
    disabled: '被禁用',
    supplier: '供应商',
    model: '模型',
    nickname: '昵称',
    createChat: '创建聊天',
    showSidebar: '显示侧边栏',
    hideSidebar: '隐藏侧边栏',
    rename: '重命名',
    delete: '删除',
    thinking: '思考中...',
    thinkingComplete: '思考完毕',
    sendMessage: '发送消息',
    stopSending: '停止发送',
    typeMessage: '请输入消息...',
    scrollToBottom: '滚动到底部',
  },
  navigation: {
    chat: '聊天',
    model: '模型',
    setting: '设置',
    mobileDrawer: {
      title: '侧边栏',
      description: '侧边栏',
      ariaDescription: '抽屉内容',
    },
  },
  nav: {
    chat: '聊天',
    model: '模型',
    setting: '设置',
  },
  model: {
    modelNickname: '模型昵称',
    apiKey: 'API 密钥',
    apiAddress: 'API 地址',
    model: '模型',
  },
} as const;

/**
 * 深度合并两个对象
 */
function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target } as Record<string, unknown>;
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = result[key];
    if (
      sourceVal && typeof sourceVal === 'object' && !Array.isArray(sourceVal) &&
      targetVal && typeof targetVal === 'object' && !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(targetVal as Record<string, unknown>, sourceVal as Record<string, unknown>);
    } else {
      result[key] = sourceVal;
    }
  }
  return result;
}

/**
 * 创建带默认翻译键的 i18n mock 返回值
 *
 * 替代 vi.mock 工厂中的 `const R = {...}; return globalThis.__createI18nMockReturn(R)` 模式。
 * 内置高频默认翻译键（DEFAULT_I18N_RESOURCES），自动深度合并自定义键。
 *
 * @param keys 自定义翻译键（深度合并到默认键上）
 * @returns vi.mock('react-i18next') 的返回值
 *
 * @example
 * ```typescript
 * // 使用默认翻译
 * vi.mock('react-i18next', () => globalThis.__mockI18n());
 *
 * // 添加/覆盖自定义翻译
 * vi.mock('react-i18next', () => globalThis.__mockI18n({ setting: { key: '自定义' } }));
 * ```
 */
export function mockI18n(keys?: Record<string, unknown>) {
  const merged = keys
    ? deepMerge(DEFAULT_I18N_RESOURCES as unknown as Record<string, unknown>, keys as Record<string, unknown>)
    : DEFAULT_I18N_RESOURCES;
  return createI18nMockReturn(merged);
}

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
