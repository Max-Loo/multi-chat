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
 * @description Deepseek API 地址处理器
 * 继承通用基类，实现 Deepseek 特定的地址处理逻辑
 */
class DeepseekApiAddress extends BaseApiAddress {
  readonly defaultApiAddress = 'https://api.deepseek.com'

  getAddressFormDescription = (): string => '# 结尾表示自定义'
}

/**
 * @description Deepseek 流式响应数据结构
 * 参考 https://api-docs.deepseek.com/zh-cn/api/create-chat-completion
 */

interface TokensUsage {
  prompt_tokens: number;
  completion_tokens: number;
  cached_tokens?: number;
  total_tokens: number;
}

interface ChoiceLogprobs {
  // 实际内容
  content: {
    // 输出的token
    token: string;
    // 该 token 的对数概率。-9999.0 代表该 token 的输出概率极小，不在 top 20 最可能输出的 token 中。
    logprob: number;
    // 一个包含该 token UTF-8 字节表示的整数列表。一般在一个 UTF-8 字符被拆分成多个 token 来表示时有用。如果 token 没有对应的字节表示，则该值为 null。
    bytes: number[] | null;
    // 一个包含在该输出位置上，输出概率 top N 的 token 的列表，以及它们的对数概率。在罕见情况下，返回的 token 数量可能少于请求参数中指定的 top_logprobs 值。
    top_logprobs: {
      token: string;
      logprob: number;
      bytes: number[] | null;
    };
  }
  // 推理内容
  reasoning_content: {
    token: string;
    logprob: number;
    bytes: number[] | null;
    top_logprobs: {
      token: string;
      logprob: number;
      bytes: number[] | null;
    };
  }
};

interface DeepseekStreamResponse {
  id: string
  // chat.completion.chunk
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role: ChatRoleEnum
      // 真正聊天返回的内容
      content: string | null;
      // 当为 reasoner 模型的时候，在输出真正内容（content）前的推理内容
      reasoning_content: string | null
    }
    // 该 choice 的对数概率信息。
    logprobs: ChoiceLogprobs | null;
    finish_reason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'insufficient_system_resource' | null;
    usage?: TokensUsage | null;
  }>
  system_fingerprint: string
}

/**
 * @description Deepseek Fetch API 处理器
 * 继承通用基类，实现 Deepseek 特定的数据解析逻辑
 */
class DeepseekFetchApi extends BaseFetchApi<DeepseekStreamResponse> {
  createClient = (model: Model): OpenAI => {
    const apiAddress = this.getDevEnvBaseUrl(ModelProviderKeyEnum.DEEPSEEK) || model.apiAddress

    return new OpenAI({
      apiKey: model.apiKey,
      baseURL: (new DeepseekApiAddress).getOpenaiFetchAddress(apiAddress),
      dangerouslyAllowBrowser: true,
      fetch: getFetchFunc(),
    })
  }

  parseResponse = (chunk: DeepseekStreamResponse): StandardMessage => {
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
 * @description Deepseek 模型提供商
 * 使用配置驱动的方式，大幅减少代码重复
 */
export class DeepseekProvider extends ConfigurableModelProvider {
  readonly key = ModelProviderKeyEnum.DEEPSEEK
  readonly name = '深度求索'
  readonly officialSite = 'https://www.deepseek.com/'
  readonly modelList: ModelDetail[] = [
    { modelKey: 'deepseek-chat', modelName: 'DeepSeek Chat' },
    { modelKey: 'deepseek-reasoner', modelName: 'DeepSeek Reasoner' },
  ]

  protected createApiAddress = () => new DeepseekApiAddress()
  protected createFetchApi = () => new DeepseekFetchApi()
}