import { ref } from 'vue';
import { defineStore } from 'pinia';
import { getDefaultAppLanguage } from "@/services/global";
import { tSafely } from "@/services/i18n";
import { LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY } from "@/utils/constants";
import { LOCAL_STORAGE_LANGUAGE_KEY } from "@/services/global";
import { changeAppLanguage } from "@/services/i18n";
import { toastQueue } from '@/services/toast';

/**
 * 应用配置状态接口
 */
export interface AppConfigSliceState {
  // 当前应用的语言类型
  language: string;
  // 是否在历史消息中传输推理内容（默认 false）
  transmitHistoryReasoning: boolean;
  // 是否启用自动命名功能（默认 true）
  autoNamingEnabled: boolean;
}

/**
 * 应用配置 store
 * 转写自 Redux appConfigSlice + appConfigMiddleware（语言/开关持久化副作用并入本 store）
 */
export const useAppConfigStore = defineStore('appConfig', () => {
  // 当前应用的语言类型
  const language = ref('');
  // 是否在历史消息中传输推理内容（默认 false）
  const transmitHistoryReasoning = ref(false);
  // 是否启用自动命名功能（默认 true）
  const autoNamingEnabled = ref(true);

  /**
   * 初始化应用的语言
   * 对应原 initializeAppLanguage thunk + middleware 的持久化副作用
   * @returns 检测到的语言代码
   */
  async function initializeAppLanguage(): Promise<string> {
    try {
      const result = await getDefaultAppLanguage();
      language.value = result.lang;

      // 持久化到 localStorage（原 middleware 监听 initializeAppLanguage.fulfilled）
      persistLanguage(result.lang);

      return result.lang;
    } catch (error) {
      throw new Error(
        tSafely('error.appConfig.failToInitializeLanguage', 'Failed to initialize language'),
        { cause: error }
      );
    }
  }

  /**
   * 初始化是否传输推理内容的开关状态
   * @returns 从 localStorage 读取的开关状态，默认为 false
   */
  async function initializeTransmitHistoryReasoning(): Promise<boolean> {
    try {
      const storedValue = localStorage.getItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY);
      const value = storedValue === 'true';
      transmitHistoryReasoning.value = value;
      return value;
    } catch (error) {
      throw new Error(
        tSafely('error.appConfig.failToInitializeTransmitHistoryReasoning', 'Failed to initialize transmit history reasoning'),
        { cause: error }
      );
    }
  }

  /**
   * 初始化自动命名功能开关状态
   * @returns 从 localStorage 读取的开关状态，默认为 true
   */
  async function initializeAutoNamingEnabled(): Promise<boolean> {
    try {
      const storedValue = localStorage.getItem(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY);
      // 如果 localStorage 中没有值或值为 'false'，则返回 false，否则返回 true
      const value = storedValue !== 'false';
      autoNamingEnabled.value = value;
      return value;
    } catch (error) {
      throw new Error(
        tSafely('error.appConfig.failToInitializeAutoNamingEnabled', 'Failed to initialize auto naming'),
        { cause: error }
      );
    }
  }

  /**
   * 持久化语言到 localStorage
   */
  function persistLanguage(lang: string): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, lang);
    } catch (error) {
      console.warn('[LanguagePersistence] 持久化失败:', error);
    }
  }

  /**
   * 设置应用语言
   * 对应原 setAppLanguage reducer + middleware 的持久化与 i18n 切换副作用
   * @param lang 语言代码
   */
  async function setAppLanguage(lang: string): Promise<void> {
    language.value = lang;

    // 持久化到 localStorage
    persistLanguage(lang);

    // 用户主动切换语言：切换 i18n 语言并反馈（原 middleware 的 setAppLanguage 分支）
    const loadingToast = await toastQueue.loading('切换语言中...');

    try {
      const result = await changeAppLanguage(lang);
      toastQueue.dismiss(loadingToast);

      if (result.success) {
        toastQueue.success('语言切换成功');
      } else {
        toastQueue.error(`语言切换失败: ${lang}`);
      }
    } catch (error) {
      toastQueue.dismiss(loadingToast);
      console.error('Language change error:', error);
      toastQueue.error('语言切换失败，请重试');
    }
  }

  /**
   * 设置是否传输推理内容，并持久化到 localStorage
   * @param value 开关状态
   */
  function setTransmitHistoryReasoning(value: boolean): void {
    transmitHistoryReasoning.value = value;
    // 持久化（原 middleware 监听 setTransmitHistoryReasoning）
    localStorage.setItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, String(value));
  }

  /**
   * 设置自动命名功能开关状态，并持久化到 localStorage
   * @param value 开关状态
   */
  function setAutoNamingEnabled(value: boolean): void {
    autoNamingEnabled.value = value;
    // 持久化（原 middleware 监听 setAutoNamingEnabled）
    localStorage.setItem(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY, String(value));
  }

  return {
    // state
    language,
    transmitHistoryReasoning,
    autoNamingEnabled,
    // actions
    initializeAppLanguage,
    initializeTransmitHistoryReasoning,
    initializeAutoNamingEnabled,
    setAppLanguage,
    setTransmitHistoryReasoning,
    setAutoNamingEnabled,
  };
});
