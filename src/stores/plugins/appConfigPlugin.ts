/**
 * 应用配置持久化插件（Pinia）
 *
 * 对应既有 Redux listener middleware：src/store/middleware/appConfigMiddleware.ts
 * - 语言初始化完成 / 用户切换语言 → 持久化到 localStorage
 * - 用户主动切换语言（setAppLanguage）→ 调用 i18n 切换并提示 Toast
 * - 推理内容传输开关 / 自动命名开关 → 持久化到 localStorage
 */
import type { PiniaPluginContext } from 'pinia';
import { LOCAL_STORAGE_LANGUAGE_KEY } from '@/services/global';
import { LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY } from '@/utils/constants';
import { changeAppLanguage } from '@/services/i18n';
import { toastQueue } from '@/services/toast';

export function installAppConfigPlugin(context: PiniaPluginContext): void {
  // 仅作用于 appConfig store
  if (context.store.$id !== 'appConfig') {
    return;
  }

  context.store.$onAction(({ name, args, after }) => {
    // 用户主动切换语言：持久化 + i18n 切换 + Toast
    if (name === 'setAppLanguage') {
      after(async () => {
        const [language] = args as [string];

        // 持久化到 localStorage
        try {
          localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, language);
        } catch (error) {
          console.warn('[LanguagePersistence] 持久化失败:', error);
        }

        // 用户主动切换语言时显示 Toast 并切换 i18n 语言
        const loadingToast = await toastQueue.loading('切换语言中...');

        try {
          const result = await changeAppLanguage(language);
          toastQueue.dismiss(loadingToast);

          if (result.success) {
            toastQueue.success('语言切换成功');
          } else {
            toastQueue.error(`语言切换失败: ${language}`);
          }
        } catch (error) {
          toastQueue.dismiss(loadingToast);
          console.error('Language change error:', error);
          toastQueue.error('语言切换失败，请重试');
        }
      });
      return;
    }

    // 语言初始化完成：持久化检测到的语言（action 返回值即检测结果）
    if (name === 'initializeAppLanguage') {
      after((result) => {
        try {
          localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, String(result));
        } catch (error) {
          console.warn('[LanguagePersistence] 持久化失败:', error);
        }
      });
      return;
    }

    // 推理内容传输开关：持久化
    if (name === 'setTransmitHistoryReasoning') {
      after(() => {
        const [value] = args as [boolean];
        localStorage.setItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, String(value));
      });
      return;
    }

    // 自动命名开关：持久化
    if (name === 'setAutoNamingEnabled') {
      after(() => {
        const [value] = args as [boolean];
        localStorage.setItem(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY, String(value));
      });
    }
  });
}
