import { ModelProviderKeyEnum } from "@/utils/enums"
import { BaseApiAddress } from "../base/BaseApiAddress"
import { BaseFetchApi } from "../base/BaseFetchApi"
import { ConfigurableModelProvider } from "../base/ConfigurableModelProvider"
import { Model, ModelDetail } from "@/types/model"
import { StandardMessage } from "@/types/chat"
import OpenAI from "openai"
import { ChatRoleEnum } from "@/types/chat"
import { getStandardRole } from "@/utils/utils"
import { getFetchFunc } from '@/utils/tauriCompat/http'

/**
 * @description Kimi API 地址处理器
 * 继承通用基类，实现 Kimi 特定的地址处理逻辑
 */
class KimiApiAddress extends BaseApiAddress {
  readonly defaultApiAddress = 'https://api.moonshot.cn'

  /**
   * 重写 URL 标准化方法，Kimi 需要特殊的 /v1 路径处理
   */
  protected normalizeUrl(url: string): string {
    if (url.endsWith('#')) {
      return url.slice(0, url.length - 1)
    }

    if (url.endsWith('/')) {
      return url.slice(0, url.length - 1)
    }

    // 如果不是以 /v1 结尾，则添加 /v1
    return url + '/v1'
  }

  getAddressFormDescription = (): string => '/ 结尾会忽略v1，# 结尾表示自定义'
}

/**
 * @description Kimi 流式响应数据结构
 * 参考 https://platform.moonshot.cn/docs/api/chat#%E8%BF%94%E5%9B%9E%E5%86%85%E5%AE%B9
 */
interface KimiStreamResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role: ChatRoleEnum
      // 真正聊天返回的内容
      content: string;
      // 当为 thinking 模型的时候，在输出真正内容（content）前的推理内容
      reasoning_content: string | null
    }
    finish_reason: string | null
    usage?: {
      prompt_tokens: number
      completion_tokens: number
      cached_tokens?: number
      total_tokens: number
    } | null
  }>
  system_fingerprint: string
}

/**
 * @description Kimi Fetch API 处理器
 * 继承通用基类，实现 Kimi 特定的数据解析逻辑
 */
class KimiFetchApi extends BaseFetchApi<KimiStreamResponse> {
  createClient = (model: Model): OpenAI => {
    const apiAddress = this.getDevEnvBaseUrl(ModelProviderKeyEnum.KIMI) || model.apiAddress

    return new OpenAI({
      apiKey: model.apiKey,
      baseURL: (new KimiApiAddress()).getOpenaiFetchAddress(apiAddress),
      dangerouslyAllowBrowser: true,
      fetch: getFetchFunc(),
    })
  }

  parseResponse = (chunk: KimiStreamResponse): StandardMessage => {
    const {
      id,
      created,
      model,
      choices,
    } = chunk

    const {
      finish_reason,
      delta: { role, content, reasoning_content },
      usage,
    } = choices[0]

    const message: StandardMessage = {
      id,
      timestamp: created,
      modelKey: model,
      finishReason: finish_reason,
      role: getStandardRole(role),
      content: content || '',
      reasoningContent: reasoning_content || '',
      raw: JSON.stringify(chunk),
    }

    if (usage) {
      message.tokensUsage = {
        completion: usage.completion_tokens,
        prompt: usage.prompt_tokens,
        cached: usage.cached_tokens,
      }
    }

    return message
  }
}

/**
 * @description Kimi 模型提供商
 * 使用配置驱动的方式，大幅减少代码重复
 */
export class KimiProvider extends ConfigurableModelProvider {
  readonly key = ModelProviderKeyEnum.KIMI
  readonly name = '月之暗面'
  readonly logoUrl = 'https://www.moonshot.cn/favicon.ico'
  readonly officialSite = 'https://www.moonshot.cn/'
  readonly modelList: ModelDetail[] = [
    { modelKey: 'moonshot-v1-8k', modelName: 'Moonshot v1 8K' },
    { modelKey: 'moonshot-v1-32k', modelName: 'Moonshot v1 32K' },
    { modelKey: 'moonshot-v1-128k', modelName: 'Moonshot v1 128K' },
  ]

  protected createApiAddress = () => new KimiApiAddress()
  protected createFetchApi = () => new KimiFetchApi()
}