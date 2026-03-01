/**
 * ModelProvider 测试数据工厂
 * 
 * 提供创建测试用 RemoteProviderData 对象的工厂函数
 */

import type { RemoteProviderData } from '@/services/modelRemoteService';
import { ModelProviderKeyEnum } from '@/utils/enums';

/**
 * 创建 Mock RemoteProviderData 对象
 * @param overrides 要覆盖的字段
 * @returns RemoteProviderData 对象
 */
export const createMockRemoteProvider = (overrides?: Partial<RemoteProviderData>): RemoteProviderData => ({
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
});

/**
 * 创建 DeepSeek 供应商数据
 * @param overrides 要覆盖的字段
 */
export const createDeepSeekProvider = (overrides?: Partial<RemoteProviderData>): RemoteProviderData =>
  createMockRemoteProvider({
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
  });

/**
 * 创建 Kimi (Moonshot AI) 供应商数据
 * @param overrides 要覆盖的字段
 */
export const createKimiProvider = (overrides?: Partial<RemoteProviderData>): RemoteProviderData =>
  createMockRemoteProvider({
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
  });

/**
 * 批量创建 Mock RemoteProviderData 对象
 * @param providers 供应商配置数组
 * @returns RemoteProviderData 对象数组
 */
export const createMockRemoteProviders = (
  providers?: Array<Partial<RemoteProviderData>>
): RemoteProviderData[] => {
  if (!providers || providers.length === 0) {
    return [createDeepSeekProvider(), createKimiProvider()];
  }
  return providers.map(p => createMockRemoteProvider(p));
};
