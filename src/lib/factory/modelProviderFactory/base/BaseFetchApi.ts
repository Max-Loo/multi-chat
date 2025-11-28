import { isNil, isString, mergeWith } from "es-toolkit"
import OpenAI from "openai"
import { StandardMessage } from "@/types/chat"
import { FetchApi, FetchApiParams } from "../index"
import { Model } from "@/types/model"

/**
 * @description 流式 API 请求处理的抽象基类
 * 提供通用的流处理逻辑，子类只需实现特定的配置和解析逻辑
 */
export abstract class BaseFetchApi<T> implements FetchApi {
  /**
   * 创建 OpenAI 客户端，子类必须实现
   * @param model 模型配置
   * @returns OpenAI 客户端实例
   */
  abstract createClient(model: Model): OpenAI

  /**
   * 解析响应数据为标准格式，子类必须实现
   * @param chunk 流式响应数据块
   * @returns 标准化的消息对象
   */
  abstract parseResponse(chunk: T): StandardMessage

  /**
   * 判断哪些字段的内容需要合并，子类可重写
   * @param key 字段名
   * @returns 是否需要合并内容
   */
  protected shouldMergeContent(key: string): boolean {
    return ['reasoning_content', 'content'].includes(key)
  }

  /**
   * 通用的流式请求处理逻辑
   * 处理信号中断、数据块合并、响应解析等通用逻辑
   */
  async* fetch(
    params: FetchApiParams,
    { signal }: { signal?: AbortSignal } = {},
  ): AsyncIterable<StandardMessage> {
    const { model, historyList, message } = params
    const client = this.createClient(model)

    const response = await client.chat.completions.create({
      model: model.modelKey,
      messages: this.buildMessages(historyList, message),
      stream: true,
    }, { signal })

    let tempChunk: T | null = null

    for await (const chunk of response) {
      // 处理信号已经被中断
      if (signal?.aborted) {
        break
      }

      tempChunk = this.mergeChunk(tempChunk, chunk as T)
      yield this.parseResponse(tempChunk)
    }
  }

  /**
   * 构建消息列表，包含历史记录和最新消息
   * @param historyList 历史聊天记录
   * @param message 最新的用户消息
   * @returns OpenAI 格式的消息列表
   */
  private buildMessages(historyList: StandardMessage[], message: string): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    return [
      ...historyList.map(history => ({
        role: history.role,
        content: history.content,
      } as OpenAI.Chat.Completions.ChatCompletionMessageParam)),
      { role: 'user', content: message },
    ]
  }

  /**
   * 合并流式响应数据块
   * 主要用于合并连续的内容流（如文本、推理内容等）
   * @param tempChunk 之前的数据块
   * @param chunk 新的数据块
   * @returns 合并后的数据块
   */
  private mergeChunk(tempChunk: T | null, chunk: T): T {
    if (isNil(tempChunk)) {
      return chunk
    }

    return mergeWith(
      tempChunk as Record<string, unknown>,
      chunk as Record<string, unknown>,
      (targetValue, sourceValue, key) => {
        // 根据子类配置决定是否需要合并内容
        if (this.shouldMergeContent(key)) {
          let str = isString(targetValue) ? targetValue : ''
          if (isString(sourceValue)) {
            str += sourceValue
          }
          return str
        }
        // 其他字段使用默认合并策略
      },
    ) as T
  }
}