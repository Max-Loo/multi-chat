/**
 * i18n Vue 组合式函数
 *
 * 基于 i18next core 与语言切换事件（languageChanged）驱动 Vue 响应式更新：
 * 在组件渲染 effect 中读取 language ref 建立依赖追踪，语言切换时触发重渲染。
 */
import { ref, getCurrentScope, onScopeDispose, type Ref } from 'vue';
import i18next, { type TOptions } from 'i18next';

/** 翻译函数签名（覆盖应用内 t(key) 与 t(key, options) 两种用法） */
export type TranslateFunction = (key: string, options?: TOptions) => string;

/** useTranslation 返回值 */
export interface UseTranslationResult {
  /** 响应式翻译函数：语言切换时模板自动重渲染 */
  t: TranslateFunction;
  /** 当前语言（BCP 47 标签，如 'en'、'zh'） */
  language: Ref<string>;
}

/**
 * Vue 组合式函数：获取响应式翻译能力
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useTranslation } from '@/composables/useTranslation';
 * const { t } = useTranslation();
 * </script>
 *
 * <template>
 *   <p>{{ t('common.confirm') }}</p>
 * </template>
 * ```
 */
export const useTranslation = (): UseTranslationResult => {
  // 当前语言 ref：languageChanged 事件驱动更新
  const language = ref<string>(i18next.language || '');

  const handleLanguageChanged = (lng: string): void => {
    language.value = lng;
  };

  i18next.on('languageChanged', handleLanguageChanged);

  // 组件作用域销毁时移除事件监听，避免泄漏
  if (getCurrentScope()) {
    onScopeDispose(() => {
      i18next.off('languageChanged', handleLanguageChanged);
    });
  }

  /**
   * 响应式翻译函数
   * 内部读取 language.value 建立响应式依赖：在组件渲染 effect 中调用时，
   * 语言切换（language.value 变化）会触发组件重渲染。
   */
  const t: TranslateFunction = (key, options) => {
    // 建立依赖追踪（读取即收集）
    void language.value;
    // 项目启用了 i18next 严格选择器类型（enableSelector: 'optimize'），
    // 编译期限制了字符串键调用签名，但运行时 t(key, options) 完全支持，
    // 此处做局部类型收敛以保持组合式函数的使用体验（t('key')）
    const translate = i18next.t as unknown as (
      key: string,
      options?: TOptions,
    ) => string;
    return translate(key, options ?? {});
  };
  return { t, language };
};
