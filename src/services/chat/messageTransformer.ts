import type { ModelMessage, AssistantContent } from 'ai';
import { StandardMessage } from '@/types/chat';
import { ChatRoleEnum } from '@/types/chat';

/**
 * 构建消息列表
 * @param historyList 历史聊天记录
 * @param message 最新的用户消息
 * @param transmitHistoryReasoning 是否在历史消息中传输推理内容
 * @returns ai-sdk 格式的消息列表
 * @example
 * ```typescript
 * const messages = buildMessages(historyList, 'Hello', false);
 * // 返回: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }]
 * ```
 */
export function buildMessages(
  historyList: StandardMessage[],
  message: string,
  transmitHistoryReasoning: boolean = false
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
          transmitHistoryReasoning &&
          history.reasoningContent &&
          typeof history.reasoningContent === 'string' &&
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
