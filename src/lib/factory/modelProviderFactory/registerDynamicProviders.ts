import { ConfigurableModelProvider } from './base/ConfigurableModelProvider';
import { BaseApiAddress } from './base/BaseApiAddress';
import { BaseFetchApi } from './base/BaseFetchApi';
import { registerProviderFactory } from './index';
import { GenericFactory } from './base/GenericFactory';
import { RemoteProviderData } from '@/services/modelRemoteService';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { Model } from '@/types/model';
import { StandardMessage } from '@/types/chat';
import OpenAI from 'openai';
import { getFetchFunc } from '@/utils/tauriCompat/http';
import { getStandardRole } from '@/utils/utils';
import { ChatRoleEnum } from '@/types/chat';

/**
 * 动态 API 地址处理器
 * 根据远程数据创建 API 地址实例
 */
class DynamicApiAddress extends BaseApiAddress {
  readonly defaultApiAddress: string;

  constructor(apiAddress: string) {
    super();
    this.defaultApiAddress = apiAddress;
  }
}

/**
 * OpenAI 兼容的流式响应数据结构
 */
interface OpenAICompatibleStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: ChatRoleEnum;
      content?: string | null;
      reasoning_content?: string | null;
    };
    finish_reason: string | null;
  }>;
}

/**
 * 动态 Fetch API 处理器
 * 使用 OpenAI 兼容的通用实现
 */
class DynamicFetchApi extends BaseFetchApi<OpenAICompatibleStreamResponse> {
  private readonly providerKey: ModelProviderKeyEnum;

  constructor(providerKey: ModelProviderKeyEnum) {
    super();
    this.providerKey = providerKey;
  }

  createClient = (model: Model): OpenAI => {
    const apiAddress = this.getDevEnvBaseUrl(this.providerKey) || model.apiAddress;

    return new OpenAI({
      apiKey: model.apiKey,
      baseURL: apiAddress,
      dangerouslyAllowBrowser: true,
      fetch: getFetchFunc(),
    });
  };

  parseResponse = (chunk: OpenAICompatibleStreamResponse): StandardMessage => {
    const { id, created, model, choices } = chunk;
    const { finish_reason, delta } = choices[0];

    const message: StandardMessage = {
      id,
      timestamp: created,
      modelKey: model,
      finishReason: finish_reason,
      role: getStandardRole(delta.role),
      content: delta.content || '',
      reasoningContent: delta.reasoning_content || '',
      raw: JSON.stringify(chunk),
    };

    return message;
  };
}

/**
 * 动态模型供应商
 * 根据远程数据创建 Provider 实例
 */
export class DynamicModelProvider extends ConfigurableModelProvider {
  readonly key: ModelProviderKeyEnum;
  readonly name: string;
  readonly modelList: Array<{ modelKey: string; modelName: string }>;
  readonly officialSite?: string;

  private readonly _apiAddressValue: string;

  constructor(remoteProvider: RemoteProviderData) {
    super();

    this.key = remoteProvider.providerKey as ModelProviderKeyEnum;
    this.name = remoteProvider.providerName;
    this.modelList = remoteProvider.models;
    this._apiAddressValue = remoteProvider.apiAddress;

    this.officialSite = undefined;
  }

  /**
   * 创建 API 地址处理器
   */
  protected createApiAddress() {
    return new DynamicApiAddress(this._apiAddressValue);
  }

  /**
   * 创建 Fetch API 处理器
   */
  protected createFetchApi() {
    return new DynamicFetchApi(this.key);
  }
}

/**
 * 动态注册模型供应商
 * @param providers - 从远程 API 获取的供应商数据数组
 */
export const registerDynamicProviders = (
  providers: RemoteProviderData[],
): void => {
  providers.forEach((remoteProvider) => {
    try {
      // 创建动态 Provider 实例
      const provider = new DynamicModelProvider(remoteProvider);
      
      // 注册到工厂
      registerProviderFactory(provider.key, new GenericFactory(provider));
      
      console.log(`Successfully registered provider: ${provider.key}`);
    } catch (error) {
      console.error(`Failed to register provider ${remoteProvider.providerKey}:`, error);
    }
  });
};
