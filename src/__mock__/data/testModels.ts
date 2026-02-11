/**
 * 测试用的 Mock 模型数据
 * 提供用于测试的示例 Model 对象
 */

import type { Model } from '@/types/model';
import { ModelProviderKeyEnum } from '@/utils/enums';

/**
 * 测试用的模型列表
 */
export const mockModels: Model[] = [
  {
    id: 'model-1',
    createdAt: '2024-01-01 00:00:00',
    updateAt: '2024-01-01 00:00:00',
    providerName: 'DeepSeek',
    providerKey: ModelProviderKeyEnum.DEEPSEEK,
    nickname: 'DeepSeek Chat',
    modelName: 'DeepSeek Chat',
    modelKey: 'deepseek-chat',
    apiKey: 'sk-test-key-1',
    apiAddress: 'https://api.deepseek.com',
    isEnable: true,
  },
  {
    id: 'model-2',
    createdAt: '2024-01-01 00:00:00',
    updateAt: '2024-01-01 00:00:00',
    providerName: 'Kimi',
    providerKey: ModelProviderKeyEnum.KIMI,
    nickname: 'Kimi Moonshot',
    modelName: 'Moonshot V1 8K',
    modelKey: 'moonshot-v1-8k',
    apiKey: 'sk-test-key-2',
    apiAddress: 'https://api.moonshot.cn',
    isEnable: true,
  },
  {
    id: 'model-3',
    createdAt: '2024-01-01 00:00:00',
    updateAt: '2024-01-01 00:00:00',
    providerName: 'OpenAI',
    providerKey: ModelProviderKeyEnum.OPEN_AI,
    nickname: 'GPT-4',
    modelName: 'GPT-4',
    modelKey: 'gpt-4',
    apiKey: 'sk-test-key-3',
    apiAddress: 'https://api.openai.com',
    isEnable: true,
  },
];

/**
 * 单个测试模型
 */
export const mockModel: Model = mockModels[0];

/**
 * 加密后的 API 密钥示例（用于测试加密功能）
 */
export const mockEncryptedApiKey = 'enc:YWJjZGVmZ2hpams=';

/**
 * 测试用的聊天消息数据
 */
export const mockChatMessage = {
  id: 'msg-1',
  role: 'user' as const,
  content: '你好，世界！',
  timestamp: Date.now(),
};

/**
 * 测试用的聊天会话数据
 */
export const mockChatSession = {
  id: 'session-1',
  title: '测试会话',
  modelId: 'model-1',
  messages: [mockChatMessage],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
