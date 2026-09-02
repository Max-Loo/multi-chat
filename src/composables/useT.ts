import i18n, { type TFunction } from "i18next";
import { ref } from "vue";

/**
 * 语言变更版本号：languageChanged 事件触发时递增，
 * 使所有 useT 的调用方（组件渲染/computed）随之重算
 */
const languageVersion = ref(0);

// 模块级单例监听：多个 useT 共享一个监听器
let listenerRegistered = false;

/**
 * 注册语言变更监听（懒执行，首次 useT 时触发）
 */
function ensureLanguageListener(): void {
  if (listenerRegistered) return;
  listenerRegistered = true;
  i18n.on("languageChanged", () => {
    languageVersion.value++;
  });
}

/**
 * Vue 适配层翻译函数（对应原 react-i18next 的 useTranslation）
 *
 * 实现：包装 i18next 实例的 t 函数，每次调用时读取 languageVersion，
 * 使 Vue 响应式系统追踪语言切换并在切换后触发界面即时更新。
 * 类型安全由 i18next v25 核心的 CustomTypeOptions.enableSelector 提供，
 * 与 react-i18next 无关，调用方式与迁移前完全一致。
 *
 * @returns 与 i18next TFunction 签名一致的翻译函数
 *
 * @example
 * const t = useT();
 * t(($) => $.common.confirm)
 */
export function useT(): TFunction<"translation", undefined> {
  ensureLanguageListener();

  const translate = ((...args: unknown[]) => {
    // 读取版本号，使调用方纳入响应式追踪
    void languageVersion.value;
    return (i18n.t as (...fnArgs: unknown[]) => string)(...args);
  }) as unknown as TFunction<"translation", undefined>;

  return translate;
}
