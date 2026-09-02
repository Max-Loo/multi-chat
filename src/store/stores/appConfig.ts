
import { ref } from "vue";
import { defineStore } from "pinia";
import {
  getDefaultAppLanguage,
  LOCAL_STORAGE_LANGUAGE_KEY,
} from "@/services/global";
import { tSafely, changeAppLanguage } from "@/services/i18n";
import { toastQueue } from "@/services/toast";
import {
  LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY,
  LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY,
} from "@/utils/constants";

/**
 * 应用配置 store（对应原 appConfigSlices + appConfigMiddleware）
 * 持久化副作用与迁移前一致：语言、推理传输开关、自动命名开关变更后自动写入 localStorage
 */
export const useAppConfigStore = defineStore("appConfig", () => {
  // 当前应用的语言类型
  const language = ref("");
  // 是否在历史消息中传输推理内容（默认 false）
  const transmitHistoryReasoning = ref(false);
  // 是否启用自动命名功能（默认 true）
  const autoNamingEnabled = ref(true);

  /**
   * 初始化应用的语言（对应原 initializeAppLanguage thunk）
   * @returns 检测到的语言代码
   * @throws 初始化失败时抛出错误（由初始化流程捕获）
   */
  async function initializeAppLanguage(): Promise<string> {
    try {
      const result = await getDefaultAppLanguage();
      // 写入状态并持久化（对应原 fulfilled reducer + 中间件持久化）
      language.value = result.lang;
      persistLanguage(result.lang);
      return result.lang;
    } catch (error) {
      throw new Error(
        tSafely(
          "error.appConfig.failToInitializeLanguage",
          "Failed to initialize language",
        ),
        { cause: error },
      );
    }
  }

  /**
   * 初始化是否传输推理内容的开关状态
   * @returns 从 localStorage 读取的开关状态，默认为 false
   */
  async function initializeTransmitHistoryReasoning(): Promise<boolean> {
    try {
      const storedValue = localStorage.getItem(
        LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY,
      );
      const value = storedValue === "true";
      transmitHistoryReasoning.value = value;
      return value;
    } catch (error) {
      throw new Error(
        tSafely(
          "error.appConfig.failToInitializeTransmitHistoryReasoning",
          "Failed to initialize transmit history reasoning",
        ),
        { cause: error },
      );
    }
  }

  /**
   * 初始化自动命名功能开关状态
   * @returns 从 localStorage 读取的开关状态，默认为 true
   */
  async function initializeAutoNamingEnabled(): Promise<boolean> {
    try {
      const storedValue = localStorage.getItem(
        LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY,
      );
      // 如果 localStorage 中没有值或值为 'false'，则返回 false，否则返回 true
      const value = storedValue !== "false";
      autoNamingEnabled.value = value;
      return value;
    } catch (error) {
      throw new Error(
        tSafely(
          "error.appConfig.failToInitializeAutoNamingEnabled",
          "Failed to initialize auto naming",
        ),
        { cause: error },
      );
    }
  }

  /**
   * 持久化语言偏好到 localStorage
   */
  function persistLanguage(lang: string): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, lang);
    } catch (error) {
      console.warn("[LanguagePersistence] 持久化失败:", error);
    }
  }

  /**
   * 设置应用语言（对应原 setAppLanguage reducer + 中间件的切换流程）
   * @param lang 目标语言代码
   */
  function setAppLanguage(lang: string): void {
    language.value = lang;
    persistLanguage(lang);

    // 用户主动切换语言时执行 i18n 切换并提示（初始化路径不走此处）
    void (async () => {
      const loadingToast = await toastQueue.loading("切换语言中...");

      try {
        const result = await changeAppLanguage(lang);
        toastQueue.dismiss(loadingToast);

        if (result.success) {
          toastQueue.success("语言切换成功");
        } else {
          toastQueue.error(`语言切换失败: ${lang}`);
        }
      } catch (error) {
        toastQueue.dismiss(loadingToast);
        console.error("Language change error:", error);
        toastQueue.error("语言切换失败，请重试");
      }
    })();
  }

  /**
   * 设置是否传输推理内容并持久化
   */
  function setTransmitHistoryReasoning(value: boolean): void {
    transmitHistoryReasoning.value = value;
    localStorage.setItem(
      LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY,
      String(value),
    );
  }

  /**
   * 设置自动命名开关并持久化
   */
  function setAutoNamingEnabled(value: boolean): void {
    autoNamingEnabled.value = value;
    localStorage.setItem(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY, String(value));
  }

  return {
    language,
    transmitHistoryReasoning,
    autoNamingEnabled,
    initializeAppLanguage,
    initializeTransmitHistoryReasoning,
    initializeAutoNamingEnabled,
    setAppLanguage,
    setTransmitHistoryReasoning,
    setAutoNamingEnabled,
  };
});
