import { streamText as realStreamText, generateId as realGenerateId } from 'ai';
import { StandardMessage } from '@/types/chat';
import { getCurrentTimestamp } from '@/utils/utils';
import { getProvider } from '@/services/chat/providerFactory';
import { buildMessages } from '@/services/chat/messageTransformer';
import { processStreamEvents } from '@/services/chat/streamProcessor';
import { MetadataCollectionError } from '@/services/chat/types';
import type { AISDKDependencies, ChatRequestParams } from '@/services/chat/types';

/**
 * 默认的 AI SDK 依赖（使用真实的 Vercel AI SDK）
 */
const defaultAISDKDependencies: AISDKDependencies = {
  streamText: realStreamText,
  generateId: realGenerateId,
};

/**
 * 发起流式聊天请求
 * @param params 请求参数
 * @param options 选项（包含取消信号、可选的依赖注入）
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
 * 6. 支持依赖注入（用于测试）
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
 * - 支持依赖注入（便于单元测试）
 *
 * 错误处理策略：
 * - 严格错误收集 + 降级方案
 * - 元数据收集失败时返回基本消息（raw: null）
 * - 其他错误正常抛出
 *
 * @example
 * ```typescript
 * // 正常使用（使用真实 AI SDK）
 * const response = streamChatCompletion(
 *   { model, historyList, message, conversationId },
 *   { signal },
 * );
 *
 * // 测试中使用（注入 mock 依赖）
 * const response = streamChatCompletion(
 *   { model, historyList, message, conversationId },
 *   { 
 *     signal,
 *     dependencies: { streamText: mockStreamText, generateId: mockGenerateId }
 *   },
 * );
 *
 * for await (const message of response) {
 *   // 处理流式消息
 * }
 * ```
 */
export async function* streamChatCompletion(
  params: ChatRequestParams,
  options: { signal?: AbortSignal; dependencies?: AISDKDependencies } = {}
): AsyncIterable<StandardMessage> {
  const { signal, dependencies = defaultAISDKDependencies } = options;
  const { streamText: streamTextFn, generateId: generateIdFn } = dependencies;
  const {
    model,
    historyList,
    message,
    conversationId = generateIdFn(),
    transmitHistoryReasoning = false,
    throttleInterval = 50, // 默认 50ms 节流
  } = params;

  // 1. 获取供应商特定的 provider（异步加载）
  const provider = await getProvider(model.providerKey, model.apiKey, model.apiAddress);
  
  // 2. 构建消息
  const messages = buildMessages(historyList, message, transmitHistoryReasoning);

  // 3. 调用 AI SDK
  const result = streamTextFn({
    model: provider(model.modelKey),
    messages,
    abortSignal: signal,
  });

  // 4. 处理流式响应
  try {
    yield* processStreamEvents(result, {
      conversationId,
      timestamp: getCurrentTimestamp(),
      modelKey: model.modelKey,
      throttleInterval,
    });
  } catch (error) {
    // 降级方案：元数据收集失败时保留已流式传输的内容
    if (error instanceof MetadataCollectionError) {
      console.warn('Metadata collection failed, but stream content is preserved:', error);
      // 不 yield 任何消息，保留已流式传输的内容
      // 如果 yield 空内容，会覆盖 Redux store 中的完整内容
      return;
    } else {
      throw error; // 非元数据错误正常抛出
    }
  }
}

// 工具函数导出（供测试使用）
export { buildMessages } from '@/services/chat/messageTransformer';
export { getProvider } from '@/services/chat/providerFactory';
export { generateChatTitleService } from '@/services/chat/titleGenerator';

// 类型导出
export type { ChatServiceConfig, ChatRequestParams, AISDKDependencies } from '@/services/chat/types';
