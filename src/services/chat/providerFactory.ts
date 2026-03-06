import { createDeepSeek } from '@ai-sdk/deepseek';
import { createMoonshotAI } from '@ai-sdk/moonshotai';
import { createZhipu } from 'zhipu-ai-provider';
import type { LanguageModel } from 'ai';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { getFetchFunc } from '@/utils/tauriCompat';

/**
 * 获取供应商特定的 provider 工厂函数
 * @param providerKey 供应商标识符
 * @param apiKey API 密钥
 * @param baseURL API 基础地址
 * @returns 返回供应商特定的语言模型函数
 * @throws 当供应商不支持时抛出错误
 * @example
 * ```typescript
 * const provider = getProvider(ModelProviderKeyEnum.DEEPSEEK, 'sk-xxx', 'https://api.deepseek.com');
 * const model = provider('deepseek-chat');
 * ```
 */
export function getProvider(
  providerKey: ModelProviderKeyEnum,
  apiKey: string,
  baseURL: string
): (modelId: string) => LanguageModel {
  const fetch = getFetchFunc();

  switch (providerKey) {
    case ModelProviderKeyEnum.DEEPSEEK:
      return createDeepSeek({ apiKey, baseURL, fetch });
    case ModelProviderKeyEnum.MOONSHOTAI:
      return createMoonshotAI({ apiKey, baseURL, fetch });
    case ModelProviderKeyEnum.ZHIPUAI:
    case ModelProviderKeyEnum.ZHIPUAI_CODING_PLAN:
      return createZhipu({ apiKey, baseURL, fetch });
    default:
      throw new Error(`Unsupported provider: ${providerKey}`);
  }
}
