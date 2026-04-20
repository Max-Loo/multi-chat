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
 * @example
 * ```ts
 * const model = createMockModel({
 *   nickname: 'Custom Model',
 *   apiKey: 'sk-custom-key'
 * });
 * ```
 */
export const createMockModel = (overrides?: Partial<Model>): Model => ({
  id: generateId(),
  createdAt: '2024-01-01 00:00:00',
  updateAt: '2024-01-01 00:00:00',
  providerName: 'OpenAI',
  providerKey: ModelProviderKeyEnum.DEEPSEEK,
  nickname: 'Test Model',
  modelName: 'gpt-4',
  modelKey: 'gpt-4',
  apiKey: 'sk-test-123',
  apiAddress: 'https://api.openai.com/v1',
  isEnable: true,
  ...overrides,
});

