/**
 * 初始化步骤配置
 *
 * 定义应用的所有初始化步骤，包括依赖关系、错误处理和执行逻辑。
 * 数据装配统一写入 Pinia stores（应用启动时已创建并激活 Pinia 实例）。
 */

import type { InitStep, ModelProviderStatus } from '@/services/initialization';
import { initI18n, tSafely } from '@/services/i18n';
import { initializeMasterKey } from '@/store/keyring/masterKey';
import { useModelStore } from '@/store/pinia/model';
import { useChatStore } from '@/store/pinia/chat';
import { useAppConfigStore } from '@/store/pinia/appConfig';
import { useModelProviderStore } from '@/store/pinia/modelProvider';
import { migrateOldChatStorage } from '@/store/storage/chatStorage';
import { migrateKeyringV1ToV2 } from '@/utils/platform';

/** "无可用供应商"错误的标识字符串（与 modelProvider store 的错误文案保持一致） */
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
      const modelStore = useModelStore();
      const result = await modelStore.initializeModels();
      if (!result) {
        throw new Error(modelStore.initializationError || 'Failed to load model data');
      }
      context.setResult('models', result.models);
      context.setResult('decryptionFailureCount', result.decryptionFailureCount);
      return result.models;
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
      const chatStore = useChatStore();
      const chatList = await chatStore.initializeChatList();
      if (!chatList) {
        throw new Error(chatStore.initializationError || 'Failed to load chat list');
      }
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
      const appConfigStore = useAppConfigStore();
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
      const appConfigStore = useAppConfigStore();
      const transmitHistoryReasoning = await appConfigStore.initializeTransmitHistoryReasoning();
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
      const appConfigStore = useAppConfigStore();
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
      const providerStore = useModelProviderStore();
      const modelProvider = await providerStore.initializeModelProvider();

      // 依据 store 的错误状态计算供应商可用性状态（与迁移前 Redux 版语义一致）
      const status: ModelProviderStatus = {
        hasError: !providerStore.loading && !!providerStore.error,
        isNoProvidersError: providerStore.error === NO_PROVIDERS_ERROR_MESSAGE,
      };
      context.setResult('modelProvider', modelProvider);
      context.setResult('modelProviderStatus', status);

      // 请求失败时抛出错误，交给 onError 处理
      if (providerStore.error) {
        throw new Error(providerStore.error);
      }
      return modelProvider;
    },
    onError: (error) => ({
      severity: 'warning',
      message: tSafely('error.initialization.modelProviderFailed', 'Failed to load model provider data'),
      originalError: error,
    }),
  },
];
