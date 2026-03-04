/**
 * ModelProvider 测试数据工厂
 * 
 * 提供创建测试用 RemoteProviderData 对象的工厂函数，包含 Zod 运行时验证
 */

import type { RemoteProviderData, ModelsDevApiResponse } from '@/services/modelRemoteService';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { z } from 'zod';

/**
 * Fixture 验证错误类
 * 用于在 Fixture 数据验证失败时抛出错误
 */
export class FixtureValidationError extends Error {
  constructor(
    public fixtureName: string,
    public validationErrors: z.ZodError
  ) {
    super(`Fixture validation failed for "${fixtureName}":\n${JSON.stringify(validationErrors.issues, null, 2)}`);
    this.name = 'FixtureValidationError';
  }
}

/**
 * Zod Schema: RemoteProviderData
 * 用于验证测试数据的结构正确性
 */
const RemoteProviderDataSchema = z.object({
  providerKey: z.string().min(1, 'providerKey 不能为空'),
  providerName: z.string().min(1, 'providerName 不能为空'),
  api: z.string().url('api 必须是有效的 URL'),
  models: z.array(
    z.object({
      modelKey: z.string().min(1, 'modelKey 不能为空'),
      modelName: z.string().min(1, 'modelName 不能为空'),
    })
  ).min(1, '至少需要一个模型'),
});

/**
 * 验证 RemoteProviderData 对象
 * @param data 要验证的数据
 * @param fixtureName Fixture 名称（用于错误提示）
 * @returns 验证后的数据
 * @throws {FixtureValidationError} 验证失败时抛出
 */
function validateRemoteProviderData(data: unknown, fixtureName: string): RemoteProviderData {
  const result = RemoteProviderDataSchema.safeParse(data);
  
  if (!result.success) {
    throw new FixtureValidationError(fixtureName, result.error);
  }
  
  return result.data as RemoteProviderData;
}

/**
 * 创建 Mock RemoteProviderData 对象
 * @param overrides 要覆盖的字段
 * @returns RemoteProviderData 对象
 * @example
 * ```ts
 * const provider = createMockRemoteProvider({
 *   providerName: 'Custom Provider'
 * });
 * ```
 */
export const createMockRemoteProvider = (overrides?: Partial<RemoteProviderData>): RemoteProviderData => {
  const data = {
    providerKey: ModelProviderKeyEnum.DEEPSEEK,
    providerName: 'DeepSeek',
    api: 'https://api.deepseek.com/v1',
    models: [
      {
        modelKey: 'deepseek-chat',
        modelName: 'DeepSeek Chat',
      },
      {
        modelKey: 'deepseek-coder',
        modelName: 'DeepSeek Coder',
      },
    ],
    ...overrides,
  };
  
  return validateRemoteProviderData(data, 'createMockRemoteProvider');
};

/**
 * 创建 DeepSeek 供应商数据
 * @param overrides 要覆盖的字段
 * @returns DeepSeek 供应商数据对象
 * @example
 * ```ts
 * const provider = createDeepSeekProvider({
 *   models: [{ modelKey: 'deepseek-v3', modelName: 'DeepSeek V3' }]
 * });
 * ```
 */
export const createDeepSeekProvider = (overrides?: Partial<RemoteProviderData>): RemoteProviderData => {
  const data = {
    providerKey: ModelProviderKeyEnum.DEEPSEEK,
    providerName: 'DeepSeek',
    api: 'https://api.deepseek.com/v1',
    models: [
      {
        modelKey: 'deepseek-chat',
        modelName: 'DeepSeek Chat',
      },
      {
        modelKey: 'deepseek-coder',
        modelName: 'DeepSeek Coder',
      },
    ],
    ...overrides,
  };
  
  return validateRemoteProviderData(data, 'createDeepSeekProvider');
};

/**
 * 创建 Kimi (Moonshot AI) 供应商数据
 * @param overrides 要覆盖的字段
 * @returns Kimi 供应商数据对象
 * @example
 * ```ts
 * const provider = createKimiProvider({
 *   providerName: 'Moonshot AI'
 * });
 * ```
 */
export const createKimiProvider = (overrides?: Partial<RemoteProviderData>): RemoteProviderData => {
  const data = {
    providerKey: ModelProviderKeyEnum.MOONSHOTAI,
    providerName: 'Kimi',
    api: 'https://api.moonshot.cn/v1',
    models: [
      {
        modelKey: 'moonshot-v1-8k',
        modelName: 'Moonshot v1 8k',
      },
      {
        modelKey: 'moonshot-v1-32k',
        modelName: 'Moonshot v1 32k',
      },
      {
        modelKey: 'moonshot-v1-128k',
        modelName: 'Moonshot v1 128k',
      },
    ],
    ...overrides,
  };
  
  return validateRemoteProviderData(data, 'createKimiProvider');
};

/**
 * 创建 ZhipuAI 供应商数据
 * @param overrides 要覆盖的字段
 * @returns ZhipuAI 供应商数据对象
 * @example
 * ```ts
 * const provider = createZhipuProvider({
 *   models: [{ modelKey: 'glm-4', modelName: 'GLM-4' }]
 * });
 * ```
 */
export const createZhipuProvider = (overrides?: Partial<RemoteProviderData>): RemoteProviderData => {
  const data = {
    providerKey: ModelProviderKeyEnum.ZHIPUAI,
    providerName: 'ZhipuAI',
    api: 'https://open.bigmodel.cn/api/paas/v4',
    models: [
      {
        modelKey: 'glm-4-flash',
        modelName: 'GLM-4 Flash',
      },
      {
        modelKey: 'glm-4-plus',
        modelName: 'GLM-4 Plus',
      },
    ],
    ...overrides,
  };
  
  return validateRemoteProviderData(data, 'createZhipuProvider');
};

/**
 * 批量创建 Mock RemoteProviderData 对象
 * @param providers 供应商配置数组
 * @returns RemoteProviderData 对象数组
 * @example
 * ```ts
 * // 使用默认供应商
 * const providers = createMockRemoteProviders();
 * 
 * // 自定义供应商
 * const customProviders = createMockRemoteProviders([
 *   { providerName: 'Provider 1' },
 *   { providerName: 'Provider 2' }
 * ]);
 * ```
 */
export const createMockRemoteProviders = (
  providers?: Array<Partial<RemoteProviderData>>
): RemoteProviderData[] => {
  if (!providers || providers.length === 0) {
    return [
      createDeepSeekProvider(), 
      createKimiProvider(), 
      createZhipuProvider()
    ];
  }
  
  return providers.map((p, index) => 
    validateRemoteProviderData(
      {
        providerKey: ModelProviderKeyEnum.DEEPSEEK,
        providerName: 'Default Provider',
        api: 'https://api.example.com/v1',
        models: [
          {
            modelKey: 'default-model',
            modelName: 'Default Model',
          },
        ],
        ...p,
      },
      `createMockRemoteProviders[${index}]`
    )
  );
};

/**
 * Zod Schema: ModelsDevApiProvider
 * 用于验证 models.dev API 返回的供应商数据结构
 */
const ModelsDevApiProviderSchema = z.object({
  id: z.string().min(1, 'id 不能为空'),
  name: z.string().min(1, 'name 不能为空'),
  api: z.string().url('api 必须是有效的 URL'),
  env: z.array(z.string()).min(1, 'env 至少需要一个环境变量'),
  npm: z.string().min(1, 'npm 不能为空'),
  doc: z.string().url('doc 必须是有效的 URL'),
  models: z.record(
    z.string(),
    z.object({
      id: z.string().min(1, 'model id 不能为空'),
      name: z.string().min(1, 'model name 不能为空'),
    })
  ).refine(models => Object.keys(models).length > 0, {
    message: '至少需要一个模型',
  }),
});

/**
 * 验证 ModelsDevApiProvider 对象
 * @param data 要验证的数据
 * @param fixtureName Fixture 名称（用于错误提示）
 * @returns 验证后的数据
 * @throws {FixtureValidationError} 验证失败时抛出
 */
function validateModelsDevApiProvider(data: unknown, fixtureName: string): ModelsDevApiProvider {
  const result = ModelsDevApiProviderSchema.safeParse(data);
  
  if (!result.success) {
    throw new FixtureValidationError(fixtureName, result.error);
  }
  
  return result.data as ModelsDevApiProvider;
}

/**
 * 单个模型供应商的 API 数据结构
 */
interface ModelsDevApiProvider {
  /** 供应商唯一标识符 */
  id: string;
  /** 环境变量名数组 */
  env: string[];
  /** NPM 包名 */
  npm: string;
  /** API 基础地址 */
  api: string;
  /** 供应商名称 */
  name: string;
  /** 文档链接 */
  doc: string;
  /** 支持的模型列表（键值对对象） */
  models: {
    [modelId: string]: {
      id: string;
      name: string;
    };
  };
}

/**
 * 创建 DeepSeek API 响应数据（models.dev 格式）
 * @param overrides 要覆盖的字段
 * @returns ModelsDevApiProvider 格式的 DeepSeek 数据
 */
export const createDeepSeekApiResponse = (overrides?: Partial<ModelsDevApiProvider>): ModelsDevApiProvider => {
  const data = {
    id: ModelProviderKeyEnum.DEEPSEEK,
    name: 'DeepSeek',
    api: 'https://api.deepseek.com',
    env: ['DEEPSEEK_API_KEY'],
    npm: '@ai-sdk/deepseek',
    doc: 'https://docs.deepseek.com',
    models: {
      'deepseek-chat': {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
      },
      'deepseek-coder': {
        id: 'deepseek-coder',
        name: 'DeepSeek Coder',
      },
    },
    ...overrides,
  };
  
  return validateModelsDevApiProvider(data, 'createDeepSeekApiResponse');
};

/**
 * 创建 Kimi API 响应数据（models.dev 格式）
 * @param overrides 要覆盖的字段
 * @returns ModelsDevApiProvider 格式的 Kimi 数据
 */
export const createKimiApiResponse = (overrides?: Partial<ModelsDevApiProvider>): ModelsDevApiProvider => {
  const data = {
    id: 'kimi',
    name: 'Kimi',
    api: 'https://api.moonshot.cn',
    env: ['MOONSHOT_API_KEY'],
    npm: '@ai-sdk/moonshotai',
    doc: 'https://docs.moonshot.cn',
    models: {
      'moonshot-v1-8k': {
        id: 'moonshot-v1-8k',
        name: 'Moonshot v1 8k',
      },
      'moonshot-v1-32k': {
        id: 'moonshot-v1-32k',
        name: 'Moonshot v1 32k',
      },
    },
    ...overrides,
  };
  
  return validateModelsDevApiProvider(data, 'createKimiApiResponse');
};

/**
 * 创建 OpenAI API 响应数据（用于测试过滤，models.dev 格式）
 * @param overrides 要覆盖的字段
 * @returns ModelsDevApiProvider 格式的 OpenAI 数据
 */
export const createOpenAIApiResponse = (overrides?: Partial<ModelsDevApiProvider>): ModelsDevApiProvider => {
  const data = {
    id: 'openai',
    name: 'OpenAI',
    api: 'https://api.openai.com',
    env: ['OPENAI_API_KEY'],
    npm: '@ai-sdk/openai',
    doc: 'https://docs.openai.com',
    models: {
      'gpt-4': {
        id: 'gpt-4',
        name: 'GPT-4',
      },
    },
    ...overrides,
  };
  
  return validateModelsDevApiProvider(data, 'createOpenAIApiResponse');
};

/**
 * 创建完整的 models.dev API 响应数据
 * @param providers 供应商配置数组（可选）
 * @returns ModelsDevApiResponse 格式的完整 API 响应
 * @example
 * ```ts
 * // 使用默认供应商（DeepSeek + Kimi）
 * const apiResponse = createMockApiResponse();
 * 
 * // 自定义供应商
 * const customResponse = createMockApiResponse([
 *   createDeepSeekApiResponse({ models: { 'deepseek-v3': { id: 'deepseek-v3', name: 'DeepSeek V3' } } })
 * ]);
 * ```
 */
export const createMockApiResponse = (
  providers?: Array<ModelsDevApiProvider>
): ModelsDevApiResponse => {
  const defaultProviders = [
    createDeepSeekApiResponse(),
    createKimiApiResponse(),
  ];
  
  const providerList = providers || defaultProviders;
  
  // 转换为键值对格式
  const response: ModelsDevApiResponse = {};
  providerList.forEach(provider => {
    response[provider.id] = provider;
  });
  
  return response;
};
