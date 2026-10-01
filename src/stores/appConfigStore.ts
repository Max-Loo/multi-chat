/**
 * 应用配置状态管理（Pinia）
 *
 * 对应既有 Redux slice：src/store/slices/appConfigSlices.ts
 * 管理语言、推理内容传输开关、自动命名开关。
 * 持久化与语言切换副作用由 plugins/appConfigPlugin.ts 承载（对应既有 listener middleware）。
 */
import { defineStore } from 'pinia';
import { getDefaultAppLanguage } from '@/services/global';
import { tSafely } from '@/services/i18n';

/** 应用配置状态接口（复用既有 slice 状态形状） */
export interface AppConfigStoreState {
  /** 当前应用的语言类型 */
  language: string;
  /** 是否在历史消息中传输推理内容（默认 false） */
  transmitHistoryReasoning: boolean;
  /** 是否启用自动命名功能（默认 true） */
  autoNamingEnabled: boolean;
}

export const useAppConfigStore = defineStore('appConfig', {
  state: (): AppConfigStoreState => ({
    language: '',
    transmitHistoryReasoning: false,
    autoNamingEnabled: true,
  }),
  actions: {
    /** 设置应用语言（用户主动切换；持久化与 i18n 切换副作用见 appConfigPlugin） */
    setAppLanguage(language: string) {
      this.language = language;
    },
    /** 设置是否传输推理内容（持久化副作用见 appConfigPlugin） */
    setTransmitHistoryReasoning(value: boolean) {
      this.transmitHistoryReasoning = value;
    },
    /** 设置自动命名开关（持久化副作用见 appConfigPlugin） */
    setAutoNamingEnabled(value: boolean) {
      this.autoNamingEnabled = value;
    },
    /**
     * 初始化应用的语言（对应 initializeAppLanguage thunk）
     * @returns 检测到的语言代码
     */
    async initializeAppLanguage(): Promise<string> {
      try {
        const result = await getDefaultAppLanguage();
        this.language = result.lang;
        return result.lang;
      } catch (error) {
        throw new Error(
          tSafely('error.appConfig.failToInitializeLanguage', 'Failed to initialize language'),
          { cause: error },
        );
      }
    },
    /**
     * 初始化是否传输推理内容的开关状态（对应 initializeTransmitHistoryReasoning thunk）
     * @returns 从 localStorage 读取的开关状态，默认为 false
     */
    async initializeTransmitHistoryReasoning(): Promise<boolean> {
      try {
        const storedValue = localStorage.getItem('multi-chat-transmit-history-reasoning');
        this.transmitHistoryReasoning = storedValue === 'true';
        return this.transmitHistoryReasoning;
      } catch (error) {
        throw new Error(
          tSafely('error.appConfig.failToInitializeTransmitHistoryReasoning', 'Failed to initialize transmit history reasoning'),
          { cause: error },
        );
      }
    },
    /**
     * 初始化自动命名功能开关状态（对应 initializeAutoNamingEnabled thunk）
     * @returns 从 localStorage 读取的开关状态，默认为 true
     */
    async initializeAutoNamingEnabled(): Promise<boolean> {
      try {
        const storedValue = localStorage.getItem('multi-chat-auto-naming-enabled');
        // 如果 localStorage 中没有值或值为 'false'，则为 false，否则为 true
        this.autoNamingEnabled = storedValue !== 'false';
        return this.autoNamingEnabled;
      } catch (error) {
        throw new Error(
          tSafely('error.appConfig.failToInitializeAutoNamingEnabled', 'Failed to initialize auto naming'),
          { cause: error },
        );
      }
    },
  },
});
