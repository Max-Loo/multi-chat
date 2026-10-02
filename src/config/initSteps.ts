/**
 * 初始化步骤配置
 * 
 * 定义应用的所有初始化步骤，包括依赖关系、错误处理和执行逻辑
 */

import type { InitStep, ModelProviderStatus } from '@/services/initialization';
import { initI18n, tSafely } from '@/services/i18n';
import { initializeMasterKey } from '@/store/keyring/masterKey';
import { getAppPinia } from '@/stores/pinia';
import { useModelStore, useChatStore, useAppConfigStore, useModelProviderStore } from '@/stores';
import { migrateOldChatStorage } from '@/store/storage/chatStorage';
import { migrateKeyringV1ToV2 } from '@/utils/tauriCompat';

/** "无可用供应商"错误的标识字符串 */
const NO_PROVIDERS_ERROR_MESSAGE = "无法获取模型供应商数据，请检查网络连接";

/** 步骤名常量对象，单一事实来源 */
export const STEP_NAMES = {
  keyringMigration: 'keyringMigration',
  i18n: 'i18n',
  masterKey: 'masterKey',
  models: 'models',
  chatList: 'chatList',
  appLanguage: 'appLanguage',
  transmitHistoryReasoning: 'transmitHistoryReasoning',
  autoNamingEnabled: 'autoNamingEnabled',
  modelProvider: 'modelProvider',
} as const;

/** 步骤名联合类型，从 STEP_NAMES 自动派生 */
export type StepName = (typeof STEP_NAMES)[keyof typeof STEP_NAMES];

// i18n 初始化失败的错误消息（使用英文常量，因为此时 i18n 肯定未就绪）
const I18N_INIT_FAILED = 'Failed to initialize internationalization';

// 初始化流程在组件外使用 store：获取应用级 Pinia 单例（与 main.ts 共享，保证数据互通）
const pinia = getAppPinia();
const modelStore = useModelStore(pinia);
const chatStore = useChatStore(pinia);
const appConfigStore = useAppConfigStore(pinia);
const modelProviderStore = useModelProviderStore(pinia);

/**
 * 初始化步骤列表
 */
export const initSteps: InitStep[] = [
  {
    name: STEP_NAMES.keyringMigration,
    critical: false,
    execute: async (context) => {
      const result = await migrateKeyringV1ToV2();
      context.setResult('keyringMigration', result);
      return result;
    },
    onError: (error) => ({
      severity: 'warning',
      message: 'Keyring migration failed',
      originalError: error,
    }),
  },
  {
    name: STEP_NAMES.i18n,
    critical: true,
    execute: async () => {
      await initI18n();
    },
    onError: (error) => ({
      severity: 'fatal',
      message: I18N_INIT_FAILED,
      originalError: error,
    }),
  },
  {
    name: STEP_NAMES.masterKey,
    critical: true,
    dependencies: [STEP_NAMES.keyringMigration],
    execute: async (context) => {
      const result = await initializeMasterKey();
      context.setResult('masterKeyRegenerated', result.isNewlyGenerated);
      return result.key;
    },
    onError: (error) => ({
      severity: 'fatal',
      message: error instanceof Error
        ? error.message
        : tSafely('error.initialization.masterKeyFailed', 'Failed to initialize master key'),
      originalError: error,
    }),
  },
  {
    name: STEP_NAMES.models,
    critical: false,
    dependencies: [STEP_NAMES.masterKey],
    execute: async (context) => {
      const models = await modelStore.initializeModels();
      context.setResult('models', models);
      context.setResult(
        'decryptionFailureCount',
        modelStore.decryptionFailureCount ?? 0,
      );
      return models;
    },
    onError: (error) => ({
      severity: 'warning',
      message: tSafely('error.initialization.modelsFailed', 'Failed to load model data'),
      originalError: error,
    }),
  },
  {
    name: STEP_NAMES.chatList,
    critical: false,
    execute: async (context) => {
      // 先迁移旧格式存储
      await migrateOldChatStorage();
      // 再初始化聊天列表（只加载索引元数据）
      await chatStore.initializeChatList();
      const chatList = chatStore.chatMetaList;
      context.setResult('chatList', chatList);
      return chatList;
    },
    onError: (error) => ({
      severity: 'warning',
      message: tSafely('error.initialization.chatListFailed', 'Failed to load chat list'),
      originalError: error,
    }),
  },
  {
    name: STEP_NAMES.appLanguage,
    critical: false,
    dependencies: [STEP_NAMES.i18n],
    execute: async (context) => {
      const appLanguage = await appConfigStore.initializeAppLanguage();
      context.setResult('appLanguage', appLanguage);
      return appLanguage;
    },
    onError: (error) => ({
      severity: 'warning',
      message: tSafely('error.initialization.appLanguageFailed', 'Failed to load application language configuration'),
      originalError: error,
    }),
  },
  {
    name: STEP_NAMES.transmitHistoryReasoning,
    critical: false,
    execute: async (context) => {
      const transmitHistoryReasoning =
        await appConfigStore.initializeTransmitHistoryReasoning();
      context.setResult('transmitHistoryReasoning', transmitHistoryReasoning);
      return transmitHistoryReasoning;
    },
    onError: (error) => ({
      severity: 'ignorable',
      message: tSafely('error.initialization.transmitHistoryReasoningFailed', 'Failed to load transmit history reasoning configuration'),
      originalError: error,
    }),
  },
  {
    name: STEP_NAMES.autoNamingEnabled,
    critical: false,
    execute: async (context) => {
      const autoNamingEnabled = await appConfigStore.initializeAutoNamingEnabled();
      context.setResult('autoNamingEnabled', autoNamingEnabled);
      return autoNamingEnabled;
    },
    onError: (error) => ({
      severity: 'ignorable',
      message: tSafely('error.initialization.autoNamingEnabledFailed', 'Failed to load auto naming configuration'),
      originalError: error,
    }),
  },
  {
    name: STEP_NAMES.modelProvider,
    critical: false,
    execute: async (context) => {
      try {
        await modelProviderStore.initializeModelProvider();
        const modelProvider = modelProviderStore.providers;
        context.setResult('modelProvider', modelProvider);

        // 请求成功，设置成功状态
        const status: ModelProviderStatus = {
          hasError: false,
          isNoProvidersError: false,
        };
        context.setResult('modelProviderStatus', status);

        return modelProvider;
      } catch (error) {
        // 请求失败，从 store 中获取错误状态
        const modelProviderError = modelProviderStore.error;
        const modelProviderLoading = modelProviderStore.loading;

        const status: ModelProviderStatus = {
          hasError: !modelProviderLoading && !!modelProviderError,
          isNoProvidersError: modelProviderError === NO_PROVIDERS_ERROR_MESSAGE,
        };
        context.setResult('modelProviderStatus', status);

        // 重新抛出错误，让 onError 处理
        throw error;
      }
    },
    onError: (error) => ({
      severity: 'warning',
      message: tSafely('error.initialization.modelProviderFailed', 'Failed to load model provider data'),
      originalError: error,
    }),
  },
];
