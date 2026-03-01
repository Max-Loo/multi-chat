import { streamText, generateId } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createMoonshotAI } from '@ai-sdk/moonshotai';
import { createZhipu } from 'zhipu-ai-provider';
import type { LanguageModel, ModelMessage, AssistantContent } from 'ai';
import { Model } from '@/types/model';
import { StandardMessage } from '@/types/chat';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { ChatRoleEnum } from '@/types/chat';
import { getFetchFunc } from '@/utils/tauriCompat';
import { getCurrentTimestamp } from '@/utils/utils';
import type { StandardMessageRawResponse } from '@/types/chat';

/**
 * 获取供应商特定的 provider 工厂函数
 * @param providerKey 供应商标识符
 * @param apiKey API 密钥
 * @param baseUrl API 基础地址
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
  const providerInstance = (() => {
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
  })();

  return (modelId: string) => providerInstance(modelId);
}

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
  /** 对话唯一标识（可选，不传则自动生成） */
  conversationId?: string;
  /** 是否在历史消息中传输推理内容（默认 false） */
  includeReasoningContent?: boolean;
}



/**
 * 构建消息列表
 * @param historyList 历史聊天记录
 * @param message 最新的用户消息
 * @param includeReasoningContent 是否包含推理内容
 * @returns ai-sdk 格式的消息列表
 * @internal
 */
export function buildMessages(
  historyList: StandardMessage[],
  message: string,
  includeReasoningContent: boolean = false
): ModelMessage[] {
  return [
    ...historyList.map(history => {
      const baseContent = history.content;

      // system 消息的 content 必须是 string（Vercel AI SDK 限制）
      if (history.role === ChatRoleEnum.SYSTEM) {
        return {
          role: 'system' as const,
          content: baseContent,
        };
      }

      // user 消息：只包含文本内容
      if (history.role === ChatRoleEnum.USER) {
        return {
          role: 'user' as const,
          content: [{ type: 'text' as const, text: baseContent }],
        };
      }

      // assistant 消息：可能包含文本内容和推理内容
      if (history.role === ChatRoleEnum.ASSISTANT) {
        const parts: AssistantContent = [
          { type: 'text' as const, text: baseContent },
        ];

        // 当开关开启且存在非空推理内容时，添加独立的 reasoning part
        if (
          includeReasoningContent &&
          history.reasoningContent &&
          history.reasoningContent.trim().length > 0
        ) {
          parts.push({
            type: 'reasoning' as const,
            text: history.reasoningContent,
          });
        }

        return {
          role: 'assistant' as const,
          content: parts,
        };
      }

      // 不应该到达这里
      throw new Error(`Unknown role: ${history.role}`);
    }),
    { role: 'user' as const, content: [{ type: 'text' as const, text: message }] },
  ];
}

/**
 * 发起流式聊天请求
 * @param params 请求参数
 * @param options 取消信号等选项
 * @returns 流式响应生成器
 * @description
 * 提供统一的聊天请求处理接口，使用 Vercel AI SDK 与各种供应商通信。
 *
 * 核心功能：
 * 1. 使用供应商特定的 provider 工厂函数
 * 2. 使用 ai-sdk 的 streamText 发起流式聊天请求
 * 3. 将 ai-sdk 流式响应转换为 StandardMessage 格式
 * 4. 支持 AbortSignal 中断请求
 * 5. 自动生成消息 ID 和时间戳
 *
 * 消息 ID 生成规则：
 * - 如果 params 中提供了 conversationId，则使用 conversationId 作为消息 ID
 * - 如果未提供 conversationId，则使用 generateId() 自动生成消息 ID
 * - 这确保了流式响应的所有消息共享同一个 ID，用于标识这一轮对话响应
 *
 * 设计原则：
 * - 供应商特定的优化（使用官方 provider 包）
 * - 统一的接口（对上层透明）
 * - 支持开发环境代理（通过 fetch 配置）
 * - 自动处理 URL 标准化（ai-sdk provider 内置）
 *
 * @example
 * ```typescript
 * const response = streamChatCompletion(
 *   { model, historyList, message, conversationId },
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
  const { model, historyList, message, conversationId = generateId(), includeReasoningContent = false } = params;

  // 获取供应商特定的 provider
  const provider = getProvider(model.providerKey, model.apiKey, model.apiAddress);
  
  // 使用 ai-sdk 的 streamText 发起流式请求
  const result = streamText({
    model: provider(model.modelKey),
    messages: buildMessages(historyList, message, includeReasoningContent),
    abortSignal: signal,
  });

  // 转换为 StandardMessage 格式
  let content = '';
  let reasoningContent = '';
  const timestamp = getCurrentTimestamp();
  const modelKey = model.modelKey;
  let finishReason: string | null = null;
  let usageInfo: StandardMessage['usage'] | undefined;

  // 流式事件统计
  const streamStartTime = Date.now();
  let textDeltaCount = 0;
  let reasoningDeltaCount = 0;

  // 迭代完整流（包含文本、推理内容等所有事件）
  for await (const part of result.fullStream) {
    switch (part.type) {
      case 'text-delta':
        content += part.text;
        textDeltaCount++;
        break;
      case 'reasoning-delta':
        reasoningContent += part.text;
        reasoningDeltaCount++;
        break;
      default:
        break;
    }

    yield {
      id: conversationId,
      timestamp,
      modelKey,
      finishReason,
      role: ChatRoleEnum.ASSISTANT,
      content: content,
      reasoningContent,
      raw: null,
    };
  }

  // 等待完成，获取元数据（带错误处理）
  const metadata = await result;
  const finalFinishReason = await metadata.finishReason;
  const rawFinishReason = await metadata.rawFinishReason;
  const usage = await metadata.usage;
  const responseData = await metadata.response;
  const requestData = await metadata.request;

  finishReason = finalFinishReason || null;

  // 收集可选元数据（错误不中断主流程）
  const collectionErrors: Array<{ field: string; message: string }> = [];
  let providerMetadata: Record<string, Record<string, unknown>> | undefined;
  let transformedWarnings: Array<{ code?: string; message: string }> | undefined;
  let transformedSources: Array<{ sourceType: 'url'; id: string; url: string; title?: string; providerMetadata?: Record<string, unknown> }> | undefined;

  try {
    providerMetadata = await metadata.providerMetadata;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn('Failed to collect provider metadata:', error);
    collectionErrors.push({ field: 'providerMetadata', message: errorMsg });
    providerMetadata = undefined;
  }

  try {
    const rawWarnings = await metadata.warnings;
    transformedWarnings = rawWarnings?.map(w => ({
      code: 'code' in w ? String(w.code) : w.type,
      message: 'message' in w ? w.message : `${w.type}: ${w.feature}${w.details ? ` (${w.details})` : ''}`,
    }));
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn('Failed to collect warnings:', error);
    collectionErrors.push({ field: 'warnings', message: errorMsg });
    transformedWarnings = undefined;
  }

  try {
    const rawSources = await metadata.sources;
    transformedSources = rawSources
      ?.filter(s => s.sourceType === 'url')
      .map(s => ({
        sourceType: s.sourceType as 'url',
        id: s.id,
        url: s.url,
        title: s.title,
        providerMetadata: s.providerMetadata,
      }));
    // 空数组转换为 undefined，方便使用的时候直接校验空状态
    if (transformedSources && transformedSources.length === 0) {
      transformedSources = undefined;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn('Failed to collect sources:', error);
    collectionErrors.push({ field: 'sources', message: errorMsg });
    transformedSources = undefined;
  }

  // 收集响应元数据（过滤敏感信息）
  const headers = responseData.headers
    ? Object.fromEntries(
        Object.entries(responseData.headers).filter(
          ([key]) => !['authorization', 'Authorization', 'x-api-key', 'X-API-Key'].includes(key)
        )
      )
    : undefined;

  const responseMetadata = {
    id: responseData.id,
    modelId: responseData.modelId,
    timestamp: responseData.timestamp.toISOString(),
    headers,
  };

  // 收集请求元数据（过滤敏感信息，限制大小）
  let requestBody = typeof requestData.body === 'string' ? requestData.body : JSON.stringify(requestData.body);
  try {
    const parsedBody = JSON.parse(requestBody);
    // 移除敏感字段
    if (parsedBody.apiKey) delete parsedBody.apiKey;
    if (parsedBody.api_key) delete parsedBody.api_key;
    if (parsedBody.authorization) delete parsedBody.authorization;
    if (parsedBody.Authorization) delete parsedBody.Authorization;
    requestBody = JSON.stringify(parsedBody);
  } catch {
    // 如果解析失败，保持原始字符串
  }

  // 限制请求体大小（10KB = 10240 字节）
  const MAX_BODY_SIZE = 10240;
  if (requestBody.length > MAX_BODY_SIZE) {
    requestBody = requestBody.substring(0, MAX_BODY_SIZE) + '... (truncated)';
  }

  const requestMetadata = {
    body: requestBody,
  };

  // 收集完成原因
  const finishReasonMetadata = {
    reason: (finalFinishReason ?? 'other') as 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other',
    rawReason: rawFinishReason,
  };

  // 解析 token 使用情况（直接映射 Vercel AI SDK 的 usage 对象）
  if (usage) {
    usageInfo = {
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
    };
  }

  // 收集完整的 usage 元数据
  const usageMetadata = {
    inputTokens: usage?.inputTokens ?? 0,
    outputTokens: usage?.outputTokens ?? 0,
    totalTokens: usage?.totalTokens ?? 0,
    inputTokenDetails: usage?.inputTokenDetails,
    outputTokenDetails: usage?.outputTokenDetails,
    raw: usage?.raw,
  };

  // 计算流式处理耗时
  const streamEndTime = Date.now();
  const streamStats = {
    textDeltaCount,
    reasoningDeltaCount,
    duration: streamEndTime - streamStartTime,
  };

  // 构建原始响应对象（阶段 1：基础字段）
  const rawResponse: StandardMessageRawResponse = {
    response: responseMetadata,
    request: requestMetadata,
    usage: usageMetadata,
    finishReason: finishReasonMetadata,
    providerMetadata,
    warnings: transformedWarnings,
    streamStats,
    sources: transformedSources,
    ...(collectionErrors.length > 0 && { errors: collectionErrors }),
  };

  // 返回最终消息（包含 finishReason 和 usage）
  yield {
    id: conversationId,
    timestamp,
    modelKey,
    finishReason,
    role: ChatRoleEnum.ASSISTANT,
    content: content,
    reasoningContent,
    usage: usageInfo,
    raw: rawResponse,
  };
}
