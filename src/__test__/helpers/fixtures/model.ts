/**
 * Model 测试数据工厂
 * 
 * 提供创建测试用 Model 对象的工厂函数
 */

import type { Model } from '@/types/model';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { createIdGenerator } from 'ai';

// 生成测试模型 ID 的工具函数（带前缀）
const generateId = createIdGenerator({ prefix: 'test-model-' });

/**
 * 创建 Mock Model 对象
 * @param overrides 要覆盖的字段
 * @returns Model 对象
 */
export const createMockModel = (overrides?: Partial<Model>): Model => ({
  id: generateId(),
  createdAt: '2024-01-01 00:00:00',
  updateAt: '2024-01-01 00:00:00',
  providerName: 'OpenAI',
  providerKey: ModelProviderKeyEnum.OPEN_AI,
  nickname: 'Test Model',
  modelName: 'gpt-4',
  modelKey: 'gpt-4',
  apiKey: 'sk-test-123',
  apiAddress: 'https://api.openai.com/v1',
  isEnable: true,
  ...overrides,
});

/**
 * 批量创建 Mock Model 对象
 * @param count 创建数量
 * @param overrides 每个对象要覆盖的字段（可选，可以是函数）
 * @returns Model 对象数组
 */
export const createMockModels = (
  count: number,
  overrides?: Partial<Model> | ((index: number) => Partial<Model>)
): Model[] => {
  return Array.from({ length: count }, (_, index) => {
    const override = typeof overrides === 'function' ? overrides(index) : overrides;
    return createMockModel(override);
  });
};

/**
 * 创建 DeepSeek 模型
 * @param overrides 要覆盖的字段
 */
export const createDeepSeekModel = (overrides?: Partial<Model>): Model =>
  createMockModel({
    providerName: 'DeepSeek',
    providerKey: ModelProviderKeyEnum.DEEPSEEK,
    nickname: 'DeepSeek V3',
    modelName: 'deepseek-chat',
    modelKey: 'deepseek-chat',
    apiAddress: 'https://api.deepseek.com/v1',
    ...overrides,
  });

/**
 * 创建 Kimi 模型
 * @param overrides 要覆盖的字段
 */
export const createKimiModel = (overrides?: Partial<Model>): Model =>
  createMockModel({
    providerName: 'Kimi',
    providerKey: ModelProviderKeyEnum.KIMI,
    nickname: 'Kimi',
    modelName: 'moonshot-v1-8k',
    modelKey: 'moonshot-v1-8k',
    apiAddress: 'https://api.moonshot.cn/v1',
    ...overrides,
  });

/**
 * 创建已加密 API Key 的模型
 * @param overrides 要覆盖的字段
 */
export const createEncryptedModel = (overrides?: Partial<Model>): Model =>
  createMockModel({
    apiKey: 'enc:encrypted-api-key-data',
    ...overrides,
  });
