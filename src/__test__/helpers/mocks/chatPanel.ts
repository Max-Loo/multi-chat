/**
 * ChatPanel 测试 Mock 工厂
 * 
 * 提供聊天面板组件测试所需的 Mock 工厂函数
 */

import { vi } from 'vitest';
import { createMockStore } from './redux';
import { createReactRouterMocks } from './router';
import { createTauriMocks } from './tauri';
import type { StandardMessage } from '@/types/chat';
import type { Model as ChatModel } from '@/types/model';

/**
 * 创建 Mock 聊天消息
 * @param overrides 覆盖默认消息属性
 * @returns Mock 消息对象
 */
export const createMockMessage = (overrides?: Partial<StandardMessage>): StandardMessage => {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: 'test-message-1',
    role: 'user' as any,
    content: 'Test message',
    timestamp: now,
    modelKey: 'test-model',
    finishReason: null,
    raw: null,
    ...overrides,
  };
};

/**
 * 创建 Mock 聊天模型
 * @param overrides 覆盖默认模型属性
 * @returns Mock 聊天模型对象
 */
export const createMockChatModel = (overrides?: Partial<ChatModel>): ChatModel => {
  const now = new Date().toISOString();
  return {
    id: 'test-model-1',
    nickname: 'Test Model',
    apiKey: 'test-api-key',
    apiAddress: 'https://api.test.com',
    remark: 'Test remark',
    modelKey: 'test-model',
    modelName: 'Test Model Name',
    providerName: 'TestProvider',
    providerKey: 'deepseek' as any,
    isEnable: true,
    createdAt: now,
    updateAt: now,
    ...overrides,
  };
};

/**
 * 创建 Mock 选中聊天
 * @param overrides 覆盖默认聊天属性
 * @returns Mock 选中聊天对象
 */
export const createMockSelectedChat = (overrides?: {
  id?: string;
  title?: string;
  models?: ChatModel[];
  timestamp?: number;
}) => {
  const defaultModels = [createMockChatModel()];
  return {
    id: 'test-chat-1',
    title: 'Test Chat',
    models: defaultModels,
    timestamp: Date.now() / 1000,
    ...overrides,
  };
};

/**
 * 创建 Mock Chat Service
 * @returns Chat service 的 Mock 实现
 */
export const createMockChatService = () => {
  return {
    streamChatCompletion: vi.fn(),
  };
};

/**
 * 创建 ChatPanel 测试 Mock 集合
 * @param customMocks 自定义 Mock 配置
 * @returns 包含所有必需 Mock 的对象
 */
export const createChatPanelMocks = (customMocks?: {
  reduxStore?: ReturnType<typeof createMockStore>;
  router?: ReturnType<typeof createReactRouterMocks>;
  tauri?: ReturnType<typeof createTauriMocks>;
  chatService?: ReturnType<typeof createMockChatService>;
}) => {
  const reduxStore = customMocks?.reduxStore || createMockStore();
  const router = customMocks?.router || createReactRouterMocks();
  const tauri = customMocks?.tauri || createTauriMocks({ isTauri: false });
  const chatService = customMocks?.chatService || createMockChatService();

  return {
    reduxStore,
    router,
    tauri,
    chatService,
  };
};

/**
 * 创建 Mock 运行中的聊天状态
 * @param chatId 聊天 ID
 * @param modelId 模型 ID
 * @returns Mock 运行中聊天对象
 */
export const createMockRunningChat = (chatId?: string, modelId?: string) => {
  return {
    chatId: chatId || 'test-chat-1',
    modelId: modelId || 'test-model-1',
    isSending: true,
  };
};
