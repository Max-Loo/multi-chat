/**
 * 初始化步骤配置
 * 
 * 定义应用的所有初始化步骤，包括依赖关系、错误处理和执行逻辑
 */

import type { InitStep, ModelProviderStatus } from '@/services/initialization';
import { initI18n, tSafely } from '@/services/i18n';
import { initializeMasterKey } from '@/store/keyring/masterKey';
import { store } from '@/store';
import { initializeModels } from '@/store/slices/modelSlice';
import { initializeChatList } from '@/store/slices/chatSlices';
import { initializeAppLanguage, initializeTransmitHistoryReasoning, initializeAutoNamingEnabled } from '@/store/slices/appConfigSlices';
import { initializeModelProvider } from '@/store/slices/modelProviderSlice';
import { migrateKeyringV1ToV2 } from '@/utils/tauriCompat';

/** "无可用供应商"错误的标识字符串 */
const NO_PROVIDERS_ERROR_MESSAGE = "无法获取模型供应商数据，请检查网络连接";

/** masterKey 步骤名常量，供外部引用 */
export const MASTER_KEY_STEP_NAME = 'masterKey';

// i18n 初始化失败的错误消息（使用英文常量，因为此时 i18n 肯定未就绪）
const I18N_INIT_FAILED = 'Failed to initialize internationalization';

/**
 * 初始化步骤列表
 */
export const initSteps: InitStep[] = [
  {
    name: 'keyringMigration',
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
    name: 'i18n',
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
    name: 'masterKey',
    critical: true,
    dependencies: ['keyringMigration'],
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
    name: 'models',
    critical: false,
    dependencies: ['masterKey'],
    execute: async (context) => {
      const { models, decryptionFailureCount } = await store.dispatch(initializeModels()).unwrap();
      context.setResult('models', models);
      context.setResult('decryptionFailureCount', decryptionFailureCount);
      return models;
    },
    onError: (error) => ({
      severity: 'warning',
      message: tSafely('error.initialization.modelsFailed', 'Failed to load model data'),
      originalError: error,
    }),
  },
  {
    name: 'chatList',
    critical: false,
    execute: async (context) => {
      const chatList = await store.dispatch(initializeChatList()).unwrap();
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
    name: 'appLanguage',
    critical: false,
    dependencies: ['i18n'],
    execute: async (context) => {
      const appLanguage = await store.dispatch(initializeAppLanguage()).unwrap();
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
    name: 'transmitHistoryReasoning',
    critical: false,
    execute: async (context) => {
      const transmitHistoryReasoning = await store.dispatch(initializeTransmitHistoryReasoning()).unwrap();
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
    name: 'autoNamingEnabled',
    critical: false,
    execute: async (context) => {
      const autoNamingEnabled = await store.dispatch(initializeAutoNamingEnabled()).unwrap();
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
    name: 'modelProvider',
    critical: false,
    execute: async (context) => {
      try {
        const modelProvider = await store.dispatch(initializeModelProvider()).unwrap();
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
        // 注意：虽然 rejectWithValue 的 payload 包含 error 字段，
        // 但 unwrap() 会将其作为错误抛出，所以我们从 store 获取状态
        const storeState = store.getState();
        const modelProviderError = storeState.modelProvider.error;
        const modelProviderLoading = storeState.modelProvider.loading;

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
