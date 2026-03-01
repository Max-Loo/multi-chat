/**
 * 初始化步骤配置
 * 
 * 定义应用的所有初始化步骤，包括依赖关系、错误处理和执行逻辑
 */

import type { InitStep } from '@/lib/initialization';
import { initI18n } from '@/lib/i18n';
import { initializeMasterKey } from '@/store/keyring/masterKey';
import { store } from '@/store';
import { initializeModels } from '@/store/slices/modelSlice';
import { initializeChatList } from '@/store/slices/chatSlices';
import { initializeAppLanguage, initializeIncludeReasoningContent } from '@/store/slices/appConfigSlices';
import { initializeModelProvider } from '@/store/slices/modelProviderSlice';

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
      message: '无法初始化国际化配置',
      originalError: error,
    }),
  },
  {
    name: 'masterKey',
    critical: true,
    execute: async (context) => {
      const key = await initializeMasterKey();
      context.setResult('masterKey', key);
      return key;
    },
    onError: (error) => ({
      severity: 'fatal',
      message: '无法初始化主密钥',
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
      message: '模型数据加载失败',
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
      message: '聊天列表加载失败',
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
      message: '应用语言配置加载失败',
      originalError: error,
    }),
  },
  {
    name: 'includeReasoningContent',
    critical: false,
    execute: async (context) => {
      const includeReasoningContent = await store.dispatch(initializeIncludeReasoningContent()).unwrap();
      context.setResult('includeReasoningContent', includeReasoningContent);
      return includeReasoningContent;
    },
    onError: (error) => ({
      severity: 'ignorable',
      message: '推理内容配置加载失败',
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
      message: '模型供应商数据加载失败',
      originalError: error,
    }),
  },
];
