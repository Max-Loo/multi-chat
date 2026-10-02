/**
 * Vue useTranslation Mock 工厂
 *
 * 基于 src/locales/zh/ 真实翻译资源构建字典，t(key) 按嵌套键查找，
 * 未命中时返回键本身。供页面级渲染测试 mock `@/composables/useTranslation` 使用。
 *
 * @example
 * ```ts
 * vi.mock('@/composables/useTranslation', async () => {
 *   const { createUseTranslationMock } = await import(
 *     '@/__test__/helpers/mocks/vueI18n'
 *   );
 *   return { useTranslation: createUseTranslationMock() };
 * });
 * ```
 */
import { ref, type Ref } from 'vue';

import chat from '@/locales/zh/chat.json';
import common from '@/locales/zh/common.json';
import error from '@/locales/zh/error.json';
import model from '@/locales/zh/model.json';
import navigation from '@/locales/zh/navigation.json';
import provider from '@/locales/zh/provider.json';
import setting from '@/locales/zh/setting.json';
import table from '@/locales/zh/table.json';

/** 中文翻译字典（命名空间 → 资源） */
const ZH_RESOURCES: Record<string, unknown> = {
  chat,
  common,
  error,
  model,
  navigation,
  provider,
  setting,
  table,
};

/**
 * 按嵌套键（如 "chat.unnamed"）查找翻译文本
 * @param key 翻译键
 * @returns 命中返回译文，未命中返回键本身
 */
function lookup(key: string): string {
  const result = key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object'
          ? (node as Record<string, unknown>)[part]
          : undefined,
      ZH_RESOURCES,
    );
  return typeof result === 'string' ? result : key;
}

/**
 * 创建 useTranslation mock 返回值
 * @returns 与 `@/composables/useTranslation` 相同签名的 mock 函数
 */
export function createUseTranslationMock() {
  return (): { t: (key: string, options?: Record<string, unknown>) => string; language: Ref<string> } => {
    /** 简单插值：替换 {{name}} 占位符 */
    const t = (key: string, options?: Record<string, unknown>): string => {
      let result = lookup(key);
      if (options) {
        for (const [name, value] of Object.entries(options)) {
          result = result.replace(`{{${name}}}`, String(value));
        }
      }
      return result;
    };
    return { t, language: ref('zh') };
  };
}
