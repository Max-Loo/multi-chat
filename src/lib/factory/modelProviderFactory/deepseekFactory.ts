import { ModelProviderKeyEnum } from "@/utils/enums"
import { ApiAddress, FetchApi, FetchApiParams, ModelProvider, ModelProviderFactory, ModelProviderFactoryCreator } from "."
import { isNil, isString, mergeWith } from "es-toolkit"
import { ChatRoleEnum, StandardMessage } from "@/types/chat"
import OpenAI from "openai"
import { fetch } from '@tauri-apps/plugin-http'
import { ChatCompletionMessageParam } from "openai/resources/index.mjs"
import { getStandardRole } from "@/utils/utils"


class DeepseekApiAddress implements ApiAddress {
  readonly defaultApiAddress = 'https://api.deepseek.com'

  getOpenaiDisplayAddress = (url: string) => {
    if (url?.endsWith('#')) {
      return url.slice(0, url.length - 1)
    }

    return this.getOpenaiFetchAddress(url) + '/chat/completions'
  }

  getOpenaiFetchAddress = (url: string) => {
    let actualUrl = url

    // 默认会填充 预设的地址
    if (!isString(actualUrl)) {
      actualUrl = this.defaultApiAddress
    }

    if ([
      '#',
      '/',
    ].some(char => actualUrl.endsWith(char))) {
      actualUrl = actualUrl.slice(0, actualUrl.length - 1)
    }

    return actualUrl
  }

  getAddressFormDescription = () => {
    return '# 结尾表示自定义'
  }
}

/**
 * @description 流式响应体
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
  id: string;
  // chat.completion.chunk
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role: ChatRoleEnum;
      // 真正聊天返回的内容
      content: string | null;
      // 当为 reasoner 模型的时候，在输出真正内容（content）前的推理内容
      reasoning_content: string | null;
    }
    // 该 choice 的对数概率信息。
    logprobs: ChoiceLogprobs | null;
    finish_reason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'insufficient_system_resource' | null;
    usage?: TokensUsage | null;
  }>
  system_fingerprint: string;
}



class DeepseekFetchApi implements FetchApi {
  fetch = async function*(
    {
      model,
      historyList,
      message,
    }: FetchApiParams,
    { signal }: { signal?: AbortSignal } = {},
  ) {
    const {
      apiKey,
      apiAddress,
      modelKey,
    } = model

    const client = new OpenAI({
      apiKey,
      baseURL: (new DeepseekApiAddress()).getOpenaiFetchAddress(apiAddress),
      dangerouslyAllowBrowser: true,
      fetch,
    })

    // Deepseek 默认开启流式响应
    const response = await client.chat.completions.create({
      model: modelKey,
      messages: [
        ...(historyList.map(history => {
          return {
            role: history.role,
            content: history.content,
          } as ChatCompletionMessageParam
        })),
        { role: 'user', content: message },
      ],
      stream: true,
    }, {
      signal,
    })


    let tempChunk: DeepseekStreamResponse | null = null

    for await (const chunk of response) {

      // 处理信号已经被中断
      if (signal?.aborted) {
        break
      }

      // 强制转换成 kimi 的格式
      const deepseekChunk = chunk as DeepseekStreamResponse

      if (isNil(tempChunk)) {
        // 临时保存完整的格式，为了保存在 raw 中
        tempChunk = deepseekChunk


      } else {
        tempChunk = mergeWith(tempChunk, deepseekChunk, (targetValue, sourceValue, key) => {
          // 单独处理合并返回内容
          if ([
            'reasoning_content',
            'content',
          ].includes(key)) {
            let str = isString(targetValue) ? targetValue : ''

            if (isString(sourceValue)) {
              str += sourceValue
            }
            return str
          }
        })
      }

      const {
        id,
        created,
        model,
        choices,
      } = tempChunk

      const {
        finish_reason,
        delta: {
          role,
          content,
          reasoning_content,
        },
        usage,
      } = choices[0]

      // 拼装自己的格式
      const tempMessage: StandardMessage = {
        id,
        timestamp: created,
        modelKey: model,
        finishReason: finish_reason,
        role: getStandardRole(role),
        content: content || '',
        reasoningContent: reasoning_content || '',
        raw: JSON.stringify(tempChunk),
      }

      if (!isNil(usage)) {
        tempMessage.tokensUsage = {
          completion: usage.completion_tokens,
          prompt: usage.prompt_tokens,
          cached: usage.cached_tokens,
        }
      }

      // 将自己的格式的消息返回给上一层
      yield tempMessage
    }
  }
}

class Deepseek implements ModelProvider {
  readonly key = ModelProviderKeyEnum.DEEPSEEK
  readonly name = '深度求索'
  readonly logoUrl = 'https://deepseek.com/favicon.ico'
  readonly officialSite = 'https://www.deepseek.com/'
  readonly apiAddress = new DeepseekApiAddress()
  readonly modelList = [
    { modelKey: 'deepseek-chat', modelName: 'DeepSeek Chat' },
    { modelKey: 'deepseek-reasoner', modelName: 'DeepSeek Reasoner' },
  ]
}


class DeepseekFactory implements ModelProviderFactory {
  private modelProvider: Deepseek = new Deepseek()
  private fetchApi: DeepseekFetchApi = new DeepseekFetchApi()

  getModelProvider = (): ModelProvider => {
    return this.modelProvider
  }

  getFetchApi = () => {
    return this.fetchApi
  }
}

// 注册函数
export const registerDeepseekFactory = () => {
  // 注册到工厂函数出口里面
  ModelProviderFactoryCreator.registerFactory(ModelProviderKeyEnum.DEEPSEEK, new DeepseekFactory())
}