import { ModelProviderKeyEnum } from "@/utils/enums"
import { BaseApiAddress } from "../base/BaseApiAddress"
import { BaseFetchApi } from "../base/BaseFetchApi"
import { ConfigurableModelProvider } from "../base/ConfigurableModelProvider"
import { Model, ModelDetail } from "@/types/model"
import { StandardMessage } from "@/types/chat"
import OpenAI from "openai"
import { fetch } from '@tauri-apps/plugin-http'
import { ChatRoleEnum } from "@/types/chat"
import { getStandardRole } from "@/utils/utils"

/**
 * @description BigModel (智谱AI) API 地址处理器
 * 继承通用基类，实现 BigModel 特定的地址处理逻辑
 */
class BigModelApiAddress extends BaseApiAddress {
  readonly defaultApiAddress = 'https://open.bigmodel.cn/api/paas/v4'

  getAddressFormDescription = (): string => '# 结尾表示自定义'
}

/**
 * @description BigModel 流式响应数据结构
 * 参考 https://docs.bigmodel.cn/api-reference/%E6%A8%A1%E5%9E%8B-api/%E5%AF%B9%E8%AF%9D%E8%A1%A5%E5%85%A8#response-id
 */
interface BigModelStreamResponse {
  id: string
  // 请求id，发送消息的时候也可以传过去，不传则由系统自动生成
  // request_id: string;
  // 时间戳，以秒为单位
  created: number
  // 使用到的模型名称
  model: string
  choices: Array<{
    index: number
    delta: {
      // 理论上默认为 assistant
      role: ChatRoleEnum;
      // 真正聊天返回的内容
      content: string | null;
      // 当为 reasoner 模型的时候，在输出真正内容（content）前的推理内容
      reasoning_content: string | null
      finish_reason: 'stop' | 'length' | 'tool_calls' | 'sensitive' | 'network_error' | null
    }
  }>
  // token 用量
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    prompt_tokens_details: {
      cached_tokens: number
    }
  }
  content_filter: {
    // 安全生效环节，包括：role = assistant 模型推理，role = user 用户输入，role = history 历史上下文
    role: 'assistant' | 'user' | 'history';
    // 严重程度 level 0-3，level 0 表示最严重，3 表示轻微
    level: number
  }
}

/**
 * @description BigModel Fetch API 处理器
 * 继承通用基类，实现 BigModel 特定的数据解析逻辑
 */
class BigModelFetchApi extends BaseFetchApi<BigModelStreamResponse> {
  createClient = (model: Model): OpenAI => {
    return new OpenAI({
      apiKey: model.apiKey,
      baseURL: model.apiAddress,
      dangerouslyAllowBrowser: true,
      fetch,
    })
  }

  parseResponse = (chunk: BigModelStreamResponse): StandardMessage => {
    const {
      id,
      created,
      model,
      choices,
      usage,
    } = chunk

    const {
      delta: {
        role,
        content,
        reasoning_content,
        finish_reason,
      },
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
        // cached: usage.prompt_tokens_details?.cached_tokens,
      }
    }

    return message
  }
}

/**
 * @description BigModel (智谱AI) 模型提供商
 * 使用配置驱动的方式，大幅减少代码重复
 */
export class BigModelProvider extends ConfigurableModelProvider {
  readonly key = ModelProviderKeyEnum.BIG_MODEL
  readonly name = '智谱AI'
  readonly logoUrl = 'https://cdn.bigmodel.cn/static/logo/dark.svg'
  readonly officialSite = 'https://bigmodel.cn/'
  readonly modelList: ModelDetail[] = [
    { modelKey: 'glm-4.5', modelName: 'GLM-4.5' },
    { modelKey: 'glm-4.6', modelName: 'GLM-4.6' },
  ]

  protected createApiAddress = () => new BigModelApiAddress()
  protected createFetchApi = () => new BigModelFetchApi()
}