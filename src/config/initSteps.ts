/**
 * 初始化步骤配置
 * 
 * 定义应用的所有初始化步骤，包括依赖关系、错误处理和执行逻辑
 */

import type { InitStep } from '@/lib/initialization';
import { initI18n, tSafely } from '@/lib/i18n';
import { initializeMasterKey } from '@/store/keyring/masterKey';
import { store } from '@/store';
import { initializeModels } from '@/store/slices/modelSlice';
import { initializeChatList } from '@/store/slices/chatSlices';
import { initializeAppLanguage, initializeTransmitHistoryReasoning, initializeAutoNamingEnabled } from '@/store/slices/appConfigSlices';
import { initializeModelProvider } from '@/store/slices/modelProviderSlice';
import { isTauri } from '@/utils/tauriCompat';

// i18n 初始化失败的错误消息（使用英文常量，因为此时 i18n 肯定未就绪）
const I18N_INIT_FAILED = 'Failed to initialize internationalization';

/**
 * 初始化步骤列表
 */
export const initSteps: InitStep[] = [
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
    // Web 环境下 masterKey 初始化可能失败（IndexedDB 限制），降级为非关键步骤
    // 这样 i18n 等其他功能仍然可以正常测试和使用
    critical: isTauri(),
    execute: async (context) => {
      const key = await initializeMasterKey();
      context.setResult('masterKey', key);
      return key;
    },
    onError: (error) => ({
      // Web 环境下降级为 warning，Tauri 环境下仍为 fatal
      severity: isTauri() ? 'fatal' : 'warning',
      message: tSafely('error.initialization.masterKeyFailed', 'Failed to initialize master key'),
      originalError: error,
    }),
  },
  {
    name: 'models',
    critical: false,
    dependencies: ['masterKey'],
    execute: async (context) => {
      const models = await store.dispatch(initializeModels()).unwrap();
      context.setResult('models', models);
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
      const modelProvider = await store.dispatch(initializeModelProvider()).unwrap();
      context.setResult('modelProvider', modelProvider);
      return modelProvider;
    },
    onError: (error) => ({
      severity: 'warning',
      message: tSafely('error.initialization.modelProviderFailed', 'Failed to load model provider data'),
      originalError: error,
    }),
  },
];
