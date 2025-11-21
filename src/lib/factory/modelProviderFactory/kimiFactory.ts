import { ModelProviderKeyEnum } from "@/utils/enums"
import { ApiAddress, FetchApi, FetchApiParams, ModelProvider, ModelProviderFactory, ModelProviderFactoryCreator, RenderHistory } from "."
import { isNil, isString, mergeWith } from "es-toolkit"
import OpenAI from 'openai'
import { ChatCompletionChunk } from "openai/resources/index.mjs"
import { fetch } from '@tauri-apps/plugin-http'
import { ChatRoleEnum, StandardizedHistoryRecord, UserMessageRecord } from "@/types/chat"
import { USER_MESSAGE_ID_PREFIX } from "@/utils/constants"

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

    if (actualUrl.endsWith('#') || actualUrl.endsWith('/')) {
      actualUrl = actualUrl.slice(0, actualUrl.length - 1)
    } else {
      actualUrl += '/v1'
    }

    return actualUrl
  }
}

class KimiFetchApi implements FetchApi {
  fetch = async function*(
    {
      model,
      // historyList,
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

    // Kimi 默认开启流式响应
    const response = await client.chat.completions.create({
      model: modelKey,
      messages: [
        { role: 'user', content: message },
      ],
      stream: true,
    }, {
      signal,
    })

    let tempChunk: ChatCompletionChunk | null = null

    for await (const chunk of response) {
      if (signal?.aborted) {
        break
      }
      if (isNil(tempChunk)) {
        tempChunk = chunk
      } else {
        tempChunk = mergeWith(tempChunk, chunk, (targetValue, sourceValue, key) => {
          // 单独处理合并返回内容
          if (key === 'content') {
            return targetValue + sourceValue
          }
        })
      }

      yield JSON.stringify(tempChunk)
    }

  }
}

// 参考 https://platform.moonshot.cn/docs/api/chat#%E8%BF%94%E5%9B%9E%E5%86%85%E5%AE%B9
interface KimiStreamResponseRecord {
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
    }
    finish_reason: string | null;
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens:number
    }
  }>
  system_fingerprint: string;
}


class KimiRenderHistory implements RenderHistory {
  getHistoryRecord = (history: string): StandardizedHistoryRecord => {
    const historyRecord = JSON.parse(history) as KimiStreamResponseRecord | UserMessageRecord
    const {
      id,
    } = historyRecord

    let role: ChatRoleEnum = ChatRoleEnum.USER
    let content: string = ''

    if (id.startsWith(USER_MESSAGE_ID_PREFIX)) {
      const record = historyRecord as UserMessageRecord

      role = record.role
      content = record.content

    } else {
      const record = historyRecord as KimiStreamResponseRecord
      // 理论上只有一条生成记录
      const choice = record.choices[0] || {}
      role = choice.delta.role
      content = choice.delta.content
    }

    return {
      id,
      role,
      content,
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
  ]
}


class KimiFactory implements ModelProviderFactory {
  private modelProvider = new Kimi()
  private fetchApi = new KimiFetchApi()
  private renderHtml = new KimiRenderHistory()

  getModelProvider = () => {
    return this.modelProvider
  }

  getFetchApi = () => {
    return this.fetchApi
  }

  getRenderHtml = () => {
    return this.renderHtml
  }
}

// 注册到工厂函数出口里面
export const registerKimiFactory = () => {
  ModelProviderFactoryCreator.registerFactory(ModelProviderKeyEnum.KIMI, new KimiFactory())
}

