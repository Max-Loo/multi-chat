import { ModelProviderKeyEnum } from "@/utils/enums"
import { ApiAddress, FetchApi, FetchApiParams, ModelProvider, ModelProviderFactory, ModelProviderFactoryCreator } from "."
import { isNil, isString, mergeWith } from "es-toolkit"
import OpenAI from 'openai'
import { fetch } from '@tauri-apps/plugin-http'
import { ChatRoleEnum, StandardMessage } from "@/types/chat"
import { getStandardRole } from "@/utils/utils"
import { ChatCompletionMessageParam } from "openai/resources/index.mjs"

class KimiApiAddress implements ApiAddress {
  readonly defaultApiAddress = 'https://api.moonshot.cn'

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
    } else {
      actualUrl += '/v1'
    }

    return actualUrl
  }

  getAddressFormDescription = () => {
    return '/ 结尾会忽略v1，# 结尾表示自定义'
  }
}


/**
 * @description 流式响应体
 * 参考 https://platform.moonshot.cn/docs/api/chat#%E8%BF%94%E5%9B%9E%E5%86%85%E5%AE%B9
 */

interface TokensUsage {
  prompt_tokens: number;
  completion_tokens: number;
  cached_tokens?: number;
  total_tokens: number;
}
interface KimiStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role: ChatRoleEnum;
      // 真正聊天返回的内容
      content: string;
      // 当为 thinking 模型的时候，在输出真正内容（content）前的推理内容
      reasoning_content: string | null;
    }
    finish_reason: string | null;
    usage?: TokensUsage | null;
  }>
  system_fingerprint: string;
}

/**
 * @description 常规响应体
 */
// interface KimiResponse {
//   id: string;
//   object: string;
//   created: number;
//   model: string;
//   choices: Array<{
//     index: number;
//     message: {
//       role: ChatRoleEnum;
//       // 真正聊天返回的内容
//       content: string;
//     }
//     finish_reason: string | null;
//   }>
//   usage: TokensUsage;
//   system_fingerprint: string;
// }




class KimiFetchApi implements FetchApi {
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
      baseURL: (new KimiApiAddress()).getOpenaiFetchAddress(apiAddress),
      dangerouslyAllowBrowser: true,
      fetch,
    })

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
      // Kimi 默认开启流式响应
      stream: true,
    }, {
      signal,
    })

    let tempChunk: KimiStreamResponse | null = null

    for await (const chunk of response) {
      // 处理信号已经被中断
      if (signal?.aborted) {
        break
      }

      // 强制转换成 kimi 的格式
      const kimiChunk = chunk as KimiStreamResponse

      if (isNil(tempChunk)) {
        // 临时保存完整的格式，为了保存在 raw 中
        tempChunk = kimiChunk


      } else {
        tempChunk = mergeWith(tempChunk, kimiChunk, (targetValue, sourceValue, key) => {
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

class Kimi implements ModelProvider {
  readonly key = ModelProviderKeyEnum.KIMI
  readonly name = '月之暗面'
  readonly logoUrl = 'https://kimi.moonshot.cn/favicon.ico'
  readonly officialSite = 'https://www.kimi.com/'
  readonly apiAddress = new KimiApiAddress()
  readonly modelList = [
    { modelKey: 'moonshot-v1-auto', modelName: 'moonshot-v1-auto' },
    { modelKey: 'kimi-k2-thinking', modelName: 'kimi-k2-thinking' },
  ]
}


class KimiFactory implements ModelProviderFactory {
  private modelProvider = new Kimi()
  private fetchApi = new KimiFetchApi()

  getModelProvider = () => {
    return this.modelProvider
  }

  getFetchApi = () => {
    return this.fetchApi
  }
}

// 注册到工厂函数出口里面
export const registerKimiFactory = () => {
  ModelProviderFactoryCreator.registerFactory(ModelProviderKeyEnum.KIMI, new KimiFactory())
}

