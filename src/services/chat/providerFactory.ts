import type { LanguageModel } from 'ai';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { getFetchFunc } from '@/utils/tauriCompat';
import { getProviderSDKLoader } from './providerLoader';

/**
 * 获取供应商特定的 provider 工厂函数（异步版本）
 * 
 * 该函数按需动态加载供应商 SDK，首次使用时会有轻微延迟。
 * 通过预加载机制可以最小化用户感知的延迟。
 * 
 * @param providerKey 供应商标识符
 * @param apiKey API 密钥
 * @param baseURL API 基础地址
 * @returns 返回供应商特定的语言模型函数
 * @throws 当供应商不支持或 SDK 加载失败时抛出错误
 * 
 * @example
 * ```typescript
 * // 异步调用
 * const provider = await getProvider(ModelProviderKeyEnum.DEEPSEEK, 'sk-xxx', 'https://api.deepseek.com');
 * const model = provider('deepseek-chat');
 * ```
 */
export async function getProvider(
  providerKey: ModelProviderKeyEnum,
  apiKey: string,
  baseURL: string
): Promise<(modelId: string) => LanguageModel> {
  const fetch = getFetchFunc();
  
  try {
    // 动态加载供应商 SDK
    const loader = getProviderSDKLoader();
    const createProvider = await loader.loadProvider(providerKey);
    
    // 创建并返回 provider
    return createProvider({ apiKey, baseURL, fetch });
  } catch (error) {
    const err = error as Error;
    const enhancedError = new Error(
      `Failed to initialize provider "${providerKey}": ${err.message}. ` +
      `Please check your network connection and try again.`
    );
    // 保留原始错误作为 cause
    enhancedError.cause = err;
    throw enhancedError;
  }
}
