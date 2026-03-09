import { StandardMessage } from '@/types/chat';
import { ChatRoleEnum } from '@/types/chat';
import { collectAllMetadata } from '@/services/chat/metadataCollector';
import type { ProcessStreamOptions } from '@/services/chat/types';
import type { StreamTextResult, ToolSet } from 'ai';

/**
 * 文本流式输出的类型
 * 对应 AI SDK streamText 的默认输出类型
 * 完整输出：string
 * 部分输出：string
 * 元素输出：never（文本流不支持元素流）
 */
type TextOutput = {
  /** 输出模式名称 */
  name: string;
  /** 响应格式 */
  responseFormat: PromiseLike<any>;
  /** 解析完整输出 */
  parseCompleteOutput: (options: { text: string }, context: any) => Promise<string>;
  /** 解析部分输出 */
  parsePartialOutput: (options: { text: string }) => Promise<{ partial: string } | undefined>;
  /** 创建元素流转换（文本流返回 undefined） */
  createElementStreamTransform: () => TransformStream<any, any> | undefined;
};

/**
 * 处理流式事件
 * @param result AI SDK streamText 返回的完整结果对象（包含 fullStream）
 * @param options 流式处理选项
 * @returns 标准消息生成器
 * @throws 当元数据收集失败时抛出错误
 * @example
 * ```typescript
 * const messages = [];
 * for await (const message of processStreamEvents(result, options)) {
 *   messages.push(message);
 * }
 * ```
 */
export async function* processStreamEvents(
  result: StreamTextResult<ToolSet, TextOutput>,
  options: ProcessStreamOptions
): AsyncIterable<StandardMessage> {
  const stream = result.fullStream;
  const { conversationId, timestamp, modelKey, throttleInterval = 50 } = options;

  let content = '';
  let reasoningContent = '';
  let finishReason: string | null = null;
  let usageInfo: StandardMessage['usage'] | undefined;

  // 流式事件统计
  let textDeltaCount = 0;
  let reasoningDeltaCount = 0;
  const streamStartTime = Date.now();

  // 节流配置：限制 Redux store 更新频率
  // throttleInterval = 0 表示不节流（仅用于测试）
  const shouldThrottle = throttleInterval > 0;
  let lastYieldTime = 0;
  let hasPendingUpdate = false;

  for await (const part of stream) {
    const streamPart = part as { type: string; text?: string };
    switch (streamPart.type) {
      case 'text-delta':
        content += streamPart.text ?? '';
        textDeltaCount++;
        break;
      case 'reasoning-delta':
        reasoningContent += streamPart.text ?? '';
        reasoningDeltaCount++;
        break;
      default:
        // 忽略其他事件类型
        break;
    }

    const now = Date.now();
    const shouldYield = !shouldThrottle || (now - lastYieldTime >= throttleInterval);

    if (shouldYield) {
      lastYieldTime = now;
      hasPendingUpdate = false;
      yield {
        id: conversationId,
        timestamp,
        modelKey,
        finishReason,
        role: ChatRoleEnum.ASSISTANT,
        content,
        reasoningContent,
        raw: null,
      };
    } else {
      hasPendingUpdate = true;
    }
  }

  // 如果有未发送的更新，在流结束后立即发送
  if (hasPendingUpdate) {
    yield {
      id: conversationId,
      timestamp,
      modelKey,
      finishReason,
      role: ChatRoleEnum.ASSISTANT,
      content,
      reasoningContent,
      raw: null,
    };
  }

  // 2. 收集所有元数据
  const rawResponse = await collectAllMetadata(result as any);

  // 3. 解析 usage
  finishReason = rawResponse.finishReason.reason;
  if (rawResponse.usage) {
    usageInfo = {
      inputTokens: rawResponse.usage.inputTokens ?? 0,
      outputTokens: rawResponse.usage.outputTokens ?? 0,
    };
  }

  // 4. 计算流式统计
  const streamEndTime = Date.now();
  const streamStats = {
    textDeltaCount,
    reasoningDeltaCount,
    duration: streamEndTime - streamStartTime,
  };

  // 更新 rawResponse 中的 streamStats
  rawResponse.streamStats = streamStats;

  // 5. 返回最终消息
  yield {
    id: conversationId,
    timestamp,
    modelKey,
    finishReason,
    role: ChatRoleEnum.ASSISTANT,
    content,
    reasoningContent,
    usage: usageInfo,
    raw: rawResponse,
  };
}
