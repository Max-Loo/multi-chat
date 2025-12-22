import { Model } from '@/types/model';
import { ModelProviderKeyEnum } from '@/utils/enums';

/**
 * 创建测试用的模型数据
 * @param overrides 覆盖默认属性
 * @returns 模型对象
 */
export const createMockModel = (overrides: Partial<Model> = {}): Model => {
  const now = new Date().toISOString();
  return {
    id: 'model-1',
    createdAt: now,
    updateAt: now,
    providerName: 'OpenAI',
    providerKey: ModelProviderKeyEnum.OPEN_AI,
    nickname: 'GPT-4',
    modelName: 'GPT-4',
    modelKey: 'gpt-4',
    apiKey: 'sk-test-key',
    apiAddress: 'https://api.openai.com/v1',
    isEnable: true,
    isDeleted: false,
    ...overrides,
  };
};

/**
 * 创建多个测试用的模型数据
 * @param count 模型数量
 * @param overrides 覆盖默认属性
 * @returns 模型数组
 */
export const createMockModels = (count = 3, overrides: Partial<Model> = {}): Model[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockModel({
      id: `model-${index + 1}`,
      nickname: `Model ${index + 1}`,
      modelName: `Model ${index + 1}`,
      modelKey: `model-${index + 1}`,
      ...overrides,
    }),
  );
};

/**
 * 创建已删除的模型数据
 * @param overrides 覆盖默认属性
 * @returns 已删除的模型对象
 */
export const createMockDeletedModel = (overrides: Partial<Model> = {}): Model => {
  return createMockModel({
    isDeleted: true,
    ...overrides,
  });
};