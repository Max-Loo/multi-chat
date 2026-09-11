import { ref } from 'vue';
import { defineStore } from 'pinia';
import { getDefaultAppLanguage, LOCAL_STORAGE_LANGUAGE_KEY } from '@/services/global';
import { changeAppLanguage, tSafely } from '@/services/i18n';
import { toastQueue } from '@/services/toast';
import { LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY } from '@/utils/constants';

/**
 * 应用配置 Store（Pinia 版）
 *
 * 状态与动作与迁移前 Redux appConfig slice + appConfigMiddleware 一致：
 * 语言、推理内容传输开关、自动命名开关及其初始化与持久化逻辑
 * （原 listener middleware 的持久化/Toast 逻辑下沉到 action 内）。
 */
export const useAppConfigStore = defineStore('appConfig', () => {
  // ==== State ====
  /** 当前应用的语言类型 */
  const language = ref('');
  /** 是否在历史消息中传输推理内容（默认 false） */
  const transmitHistoryReasoning = ref(false);
  /** 是否启用自动命名功能（默认 true） */
  const autoNamingEnabled = ref(true);

  // ==== Actions ====

  /**
   * 初始化应用的语言（同时持久化到 localStorage，原 middleware 逻辑下沉）
   * @throws 当语言初始化失败时抛出错误
   */
  const initializeAppLanguage = async (): Promise<void> => {
    try {
      const result = await getDefaultAppLanguage();
      language.value = result.lang;

      // 持久化到 localStorage
      try {
        localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, language.value);
      } catch (err) {
        console.warn('[LanguagePersistence] 持久化失败:', err);
      }
    } catch (error) {
      throw new Error(
        tSafely('error.appConfig.failToInitializeLanguage', 'Failed to initialize language'),
        { cause: error },
      );
    }
  };

  /**
   * 初始化是否传输推理内容的开关状态
   * 从 localStorage 读取，默认为 false
   * @throws 当读取失败时抛出错误
   */
  const initializeTransmitHistoryReasoning = async (): Promise<void> => {
    try {
      const storedValue = localStorage.getItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY);
      transmitHistoryReasoning.value = storedValue === 'true';
    } catch (error) {
      throw new Error(
        tSafely('error.appConfig.failToInitializeTransmitHistoryReasoning', 'Failed to initialize transmit history reasoning'),
        { cause: error },
      );
    }
  };

  /**
   * 初始化自动命名功能开关状态
   * 从 localStorage 读取，默认为 true
   * @throws 当读取失败时抛出错误
   */
  const initializeAutoNamingEnabled = async (): Promise<void> => {
    try {
      const storedValue = localStorage.getItem(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY);
      // 如果 localStorage 中没有值或值为 'false'，则返回 false，否则返回 true
      autoNamingEnabled.value = storedValue !== 'false';
    } catch (error) {
      throw new Error(
        tSafely('error.appConfig.failToInitializeAutoNamingEnabled', 'Failed to initialize auto naming'),
        { cause: error },
      );
    }
  };

  /** 设置是否传输推理内容（同时持久化，原 middleware 逻辑下沉） */
  const setTransmitHistoryReasoning = (value: boolean) => {
    transmitHistoryReasoning.value = value;
    try {
      localStorage.setItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, String(value));
    } catch (error) {
      console.warn('[TransmitHistoryReasoningPersistence] 持久化失败:', error);
    }
  };

  /** 设置自动命名开关（同时持久化，原 middleware 逻辑下沉） */
  const setAutoNamingEnabled = (value: boolean) => {
    autoNamingEnabled.value = value;
    try {
      localStorage.setItem(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY, String(value));
    } catch (error) {
      console.warn('[AutoNamingPersistence] 持久化失败:', error);
    }
  };

  /**
   * 设置应用语言（用户主动切换，同时持久化并切换 i18n 语言，原 middleware 逻辑下沉）
   */
  const setAppLanguage = async (lang: string) => {
    language.value = lang;

    // 持久化到 localStorage
    try {
      localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, lang);
    } catch (error) {
      console.warn('[LanguagePersistence] 持久化失败:', error);
    }

    // 用户主动切换语言时显示 Toast 并调用 i18n 切换
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
  };

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
