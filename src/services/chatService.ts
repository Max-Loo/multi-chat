import OpenAI from 'openai';
import { isNil, isString, mergeWith } from 'es-toolkit';
import { Model } from '@/types/model';
import { StandardMessage } from '@/types/chat';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { normalize } from './urlNormalizer';
import { getFetchFunc } from '@/utils/tauriCompat/http';
import { getStandardRole } from '@/utils/utils';

/**
 * 聊天服务配置
 */
export interface ChatServiceConfig {
  /** API Key */
  apiKey: string;
  /** API 基础地址（原始 URL，会被标准化） */
  baseURL: string;
  /** 模型标识符 */
  model: string;
  /** 是否允许浏览器环境（Tauri 桌面应用需要） */
  dangerouslyAllowBrowser?: boolean;
  /** 供应商标识符（用于开发环境代理和 URL 标准化） */
  providerKey: ModelProviderKeyEnum;
}

/**
 * 聊天请求参数
 */
export interface ChatRequestParams {
  /** 模型配置 */
  model: Model;
  /** 历史聊天记录 */
  historyList: StandardMessage[];
  /** 最新的用户消息 */
  message: string;
}

/**
 * 判断哪些字段的内容需要合并
 * @param key 字段名
 * @returns 是否需要合并内容
 * @internal
 */
function shouldMergeContent(key: string): boolean {
  return ['reasoning_content', 'content'].includes(key);
}

/**
 * 构建消息列表
 * @param historyList 历史聊天记录
 * @param message 最新的用户消息
 * @returns OpenAI 格式的消息列表
 * @internal
 */
function buildMessages(
  historyList: StandardMessage[],
  message: string
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  return [
    ...historyList.map(history => ({
      role: history.role,
      content: history.content,
    } as OpenAI.Chat.Completions.ChatCompletionMessageParam)),
    { role: 'user', content: message },
  ];
}

/**
 * 合并流式响应块
 * @param tempChunk 之前的数据块
 * @param chunk 新的数据块
 * @returns 合并后的数据块
 * @internal
 */
function mergeChunk<T>(
  tempChunk: T | null,
  chunk: T
): T {
  if (isNil(tempChunk)) {
    return chunk;
  }

  return mergeWith(
    tempChunk as Record<string, unknown>,
    chunk as Record<string, unknown>,
    (targetValue, sourceValue, key) => {
      // 根据字段配置决定是否需要合并内容
      if (shouldMergeContent(key)) {
        let str = isString(targetValue) ? targetValue : '';
        if (isString(sourceValue)) {
          str += sourceValue;
        }
        return str;
      }
      // 其他字段使用默认合并策略
    },
  ) as T;
}

/**
 * 创建 OpenAI 客户端
 * @param config 客户端配置
 * @returns OpenAI 客户端实例
 */
export function createClient(config: ChatServiceConfig): OpenAI {
  // 开发环境代理处理
  const baseURL = import.meta.env.DEV
    ? `${location.origin}/${config.providerKey}`
    : config.baseURL;

  // URL 标准化（应用供应商特定规则）
  const normalizedBaseURL = normalize(baseURL, config.providerKey);

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: normalizedBaseURL,
    dangerouslyAllowBrowser: config.dangerouslyAllowBrowser ?? true,
    fetch: getFetchFunc(),
  });
}

/**
 * 解析流式响应块
 * @param chunk OpenAI 流式响应块
 * @param _providerKey 供应商标识符（用于处理格式差异，当前未使用）
 * @returns 标准化的消息对象
 */
export function parseStreamResponse(
  chunk: OpenAI.Chat.Completions.ChatCompletionChunk,
  _providerKey: ModelProviderKeyEnum
): StandardMessage {
  const { id, created, model, choices } = chunk;
  const choice = choices[0];
  const { finish_reason, delta } = choice;

  // 基础消息结构
  const message: StandardMessage = {
    id,
    timestamp: created,
    modelKey: model,
    finishReason: finish_reason,
    role: getStandardRole(delta.role),
    content: delta.content || '',
    reasoningContent: '',
    raw: JSON.stringify(chunk),
  };

  // 处理推理内容字段（如果存在）
  if ('reasoning_content' in delta && typeof delta.reasoning_content === 'string') {
    message.reasoningContent = delta.reasoning_content;
  }

  // 处理 token 使用情况（不同供应商结构不同）
  const usage = (choice as any).usage;
  if (usage) {
    // Deepseek/Kimi：usage.cached_tokens
    if ('cached_tokens' in usage && typeof usage.cached_tokens === 'number') {
      message.tokensUsage = {
        completion: usage.completion_tokens,
        prompt: usage.prompt_tokens,
        cached: usage.cached_tokens,
      };
    }
    // BigModel：usage.prompt_tokens_details.cached_tokens
    else if (
      'prompt_tokens_details' in usage &&
      usage.prompt_tokens_details &&
      typeof usage.prompt_tokens_details.cached_tokens === 'number'
    ) {
      message.tokensUsage = {
        completion: usage.completion_tokens,
        prompt: usage.prompt_tokens,
        cached: usage.prompt_tokens_details.cached_tokens,
      };
    }
    // 标准格式（无 cached_tokens）
    else if (usage.completion_tokens && usage.prompt_tokens) {
      message.tokensUsage = {
        completion: usage.completion_tokens,
        prompt: usage.prompt_tokens,
      };
    }
  }

  return message;
}

/**
 * 发起流式聊天请求
 * @param params 请求参数
 * @param options 取消信号等选项
 * @returns 流式响应生成器
 * @description
 * 提供统一的聊天请求处理接口，使用 OpenAI SDK 与各种兼容 OpenAI API 的供应商通信。
 * 
 * 核心功能：
 * 1. 创建 OpenAI 客户端实例
 * 2. 发起流式聊天请求
 * 3. 解析流式响应数据
 * 4. 构建消息列表
 * 5. 合并流式响应块
 * 
 * 设计原则：
 * - 完全统一的 OpenAI SDK 配置
 * - 响应解析层的适配（处理供应商差异）
 * - 独立于 Provider 架构
 * - 支持开发环境代理
 * - 集成 URL 标准化
 * 
 * @example
 * ```typescript
 * const response = streamChatCompletion(
 *   { model, historyList, message },
 *   { signal },
 * );
 * 
 * for await (const message of response) {
 *   console.log(message.content);
 * }
 * ```
 */
export async function* streamChatCompletion(
  params: ChatRequestParams,
  { signal }: { signal?: AbortSignal } = {}
): AsyncIterable<StandardMessage> {
  const { model, historyList, message } = params;

  const client = createClient({
    apiKey: model.apiKey,
    baseURL: model.apiAddress,
    model: model.modelKey,
    providerKey: model.providerKey,
  });

  const response = await client.chat.completions.create({
    model: model.modelKey,
    messages: buildMessages(historyList, message),
    stream: true,
  }, { signal });

  let tempChunk: OpenAI.Chat.Completions.ChatCompletionChunk | null = null;

  for await (const chunk of response) {
    // 处理信号中断
    if (signal?.aborted) {
      break;
    }

    // 合并数据块
    tempChunk = mergeChunk(tempChunk, chunk);

    // 解析并返回
    yield parseStreamResponse(tempChunk, model.providerKey);
  }
}
