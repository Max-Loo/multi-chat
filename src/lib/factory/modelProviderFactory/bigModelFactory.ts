import { ModelProviderKeyEnum } from "@/utils/enums"
import { ApiAddress, FetchApi, FetchApiParams, ModelProvider, ModelProviderFactory, ModelProviderFactoryCreator } from "."
import { isNil, isString, mergeWith } from "es-toolkit"
import { ChatRoleEnum, StandardMessage } from "@/types/chat"
import OpenAI from "openai"
import { ChatCompletionMessageParam } from "openai/resources/index.mjs"
import { getStandardRole } from "@/utils/utils"


class BigModelApiAddress implements ApiAddress {
  readonly defaultApiAddress = 'https://open.bigmodel.cn/api/paas/v4'

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
 * 参考 https://docs.bigmodel.cn/api-reference/%E6%A8%A1%E5%9E%8B-api/%E5%AF%B9%E8%AF%9D%E8%A1%A5%E5%85%A8#response-id
 */

interface BigModelStreamResponse {
  id: string;
  // 请求id，发送消息的时候也可以传过去，不传则由系统自动生成
  // request_id: string;
  // 时间戳，以秒为单位
  created: number;
  // 使用到的模型名称
  model: string;
  choices: Array<{
    index: number;
    delta: {
      // 理论上默认为 assistant
      role: ChatRoleEnum;
      // 真正聊天返回的内容
      content: string | null;
      // 当为 reasoner 模型的时候，在输出真正内容（content）前的推理内容
      reasoning_content: string | null;
      finish_reason: 'stop' | 'length' | 'tool_calls' | 'sensitive' | 'network_error' | null;
    }
  }>
  // token 用量
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    prompt_tokens_details: {
      cached_tokens: number;
    }
  };
  content_filter: {
    // 安全生效环节，包括：role = assistant 模型推理，role = user 用户输入，role = history 历史上下文
    role: 'assistant' | 'user' | 'history';
    // 严重程度 level 0-3，level 0 表示最严重，3 表示轻微
    level: number;
  };
}

class BigModelFetchApi implements FetchApi {
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
      baseURL: (new BigModelApiAddress()).getOpenaiFetchAddress(apiAddress),
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
      // 默认开启流式响应
      stream: true,
    }, {
      signal,
    })


    let tempChunk: BigModelStreamResponse | null = null

    for await (const chunk of response) {

      // 处理信号已经被中断
      if (signal?.aborted) {
        break
      }

      // 强制转换成 bigmodel 的格式
      const BigModelChunk = chunk as unknown as BigModelStreamResponse

      if (isNil(tempChunk)) {
        // 临时保存完整的格式，为了保存在 raw 中
        tempChunk = BigModelChunk


      } else {
        tempChunk = mergeWith(tempChunk, BigModelChunk, (targetValue, sourceValue, key) => {
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
        usage,
      } = tempChunk

      const {
        delta: {
          role,
          content,
          reasoning_content,
          finish_reason,
        },
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
          // cached: usage.cached_tokens,
        }
      }

      // 将自己的格式的消息返回给上一层
      yield tempMessage
    }
  }
}

class BigModel implements ModelProvider {
  readonly key = ModelProviderKeyEnum.BIG_MODEL
  readonly name = '智谱AI'
  readonly logoUrl = 'https://cdn.bigmodel.cn/static/logo/dark.svg'
  readonly officialSite = 'https://bigmodel.cn/'
  readonly apiAddress = new BigModelApiAddress()
  readonly modelList = [
    { modelKey: 'glm-4.5', modelName: 'GLM-4.5' },
    { modelKey: 'glm-4.6', modelName: 'GLM-4.6' },
  ]
}


class BigModelFactory implements ModelProviderFactory {
  private modelProvider = new BigModel()
  private fetchApi = new BigModelFetchApi()
  getModelProvider = () => {
    return this.modelProvider
  }

  getFetchApi = () => {
    return this.fetchApi
  }
}

// 注册到工厂函数出口里面
export const registerBigModelFactory = () => {
  ModelProviderFactoryCreator.registerFactory(ModelProviderKeyEnum.BIG_MODEL, new BigModelFactory())
}


