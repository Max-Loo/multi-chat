import { ref } from 'vue';
import i18next, { type i18n as I18nInstance, type TFunction } from 'i18next';

/**
 * 语言响应式引用
 * 由 i18next 的 languageChanged 事件驱动，所有使用 useTranslation 的组件
 * 在语言切换时自动重渲染
 */
const activeLanguage = ref<string>(i18next.language ?? '');

/** 模块级订阅锁：确保事件监听只注册一次 */
let subscribed = false;

/** 注册 languageChanged 订阅（幂等） */
const ensureSubscription = (): void => {
  if (subscribed) {
    return;
  }
  subscribed = true;
  i18next.on('languageChanged', (lng) => {
    activeLanguage.value = lng ?? '';
  });
};

/**
 * 响应式翻译组合式函数（Vue 版 useTranslation）
 *
 * 保留 i18next 核心与既有语言资源/懒加载体系，仅替换 react-i18next 绑定层：
 * t 函数内部读取语言响应式引用建立依赖，语言切换后调用方组件即时重渲染。
 *
 * @returns t - 与 i18next 签名一致的翻译函数（含类型化 key 提示）
 * @returns i18n - i18next 实例（用于读取 language 等信息）
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useTranslation } from '@/composables/useTranslation';
 * const { t } = useTranslation();
 * </script>
 * <template>
 *   <span>{{ t('common.confirm') }}</span>
 * </template>
 * ```
 */
export function useTranslation(): { t: TFunction; i18n: I18nInstance } {
  ensureSubscription();

  // 透传全部参数（支持项目的类型化 selector key 形式 t(($) => $.common.xxx) 与选项对象）
  const t = ((...args: unknown[]) => {
    // 建立响应式依赖：语言变化触发使用 t 的组件重渲染
    void activeLanguage.value;
    return (i18next.t as (...a: unknown[]) => string)(...args);
  }) as unknown as TFunction;

  return { t, i18n: i18next as I18nInstance };
}
