/**
 * ChatPanel 测试数据工厂
 * 
 * 提供创建测试用 ChatPanel 相关数据的工厂函数
 */

import type { StandardMessage } from '@/types/chat';
import { ChatRoleEnum } from '@/types/chat';

/**
 * 创建测试用用户消息
 * @param overrides 要覆盖的字段
 * @returns 用户消息对象
 */
export const createUserMessage = (overrides?: Partial<StandardMessage>): StandardMessage => {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: `user-msg-${now}`,
    role: ChatRoleEnum.USER,
    content: 'This is a test message from user',
    timestamp: now,
    modelKey: 'test-model',
    finishReason: null,
    raw: null,
    ...overrides,
  };
};

/**
 * 创建测试用助手消息
 * @param overrides 要覆盖的字段
 * @returns 助手消息对象
 */
export const createAssistantMessage = (overrides?: Partial<StandardMessage>): StandardMessage => {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: `assistant-msg-${now}`,
    role: ChatRoleEnum.ASSISTANT,
    content: 'This is a test response from assistant',
    timestamp: now,
    modelKey: 'test-model',
    finishReason: 'stop',
    raw: null,
    ...overrides,
  };
};

/**
 * 创建包含推理内容的助手消息
 * @param reasoningContent 推理内容
 * @param overrides 要覆盖的字段
 * @returns 包含推理内容的助手消息对象
 */
export const createReasoningMessage = (
  reasoningContent: string,
  overrides?: Partial<StandardMessage>
): StandardMessage => {
  return createAssistantMessage({
    reasoningContent,
    content: 'Final answer based on reasoning',
    ...overrides,
  });
};

/**
 * 创建测试用系统消息
 * @param overrides 要覆盖的字段
 * @returns 系统消息对象
 */
export const createSystemMessage = (overrides?: Partial<StandardMessage>): StandardMessage => {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: `system-msg-${now}`,
    role: ChatRoleEnum.SYSTEM,
    content: 'This is a system instruction',
    timestamp: now,
    modelKey: 'test-model',
    finishReason: null,
    raw: null,
    ...overrides,
  };
};

/**
 * 创建测试用工具消息
 * @param overrides 要覆盖的字段
 * @returns 工具消息对象
 */
export const createToolMessage = (overrides?: Partial<StandardMessage>): StandardMessage => {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: `tool-msg-${now}`,
    role: ChatRoleEnum.TOOL,
    content: 'Tool execution result',
    timestamp: now,
    modelKey: 'test-model',
    finishReason: null,
    raw: null,
    ...overrides,
  };
};

/**
 * 创建流式消息序列（模拟流式响应）
 * @param chunkCount 消息块数量
 * @param baseMessage 基础消息
 * @returns 消息对象数组
 */
export const createStreamingMessages = (
  chunkCount: number,
  baseMessage?: Partial<StandardMessage>
): StandardMessage[] => {
  const messages: StandardMessage[] = [];
  const base = createAssistantMessage(baseMessage);

  for (let i = 0; i < chunkCount; i++) {
    messages.push({
      ...base,
      id: `streaming-chunk-${i}`,
      content: `Chunk ${i + 1} of streaming response`,
      timestamp: base.timestamp + i,
    });
  }

  return messages;
};

/**
 * 创建包含 Token 使用情况的消息
 * @param inputTokens 输入 token 数量
 * @param outputTokens 输出 token 数量
 * @param overrides 要覆盖的字段
 * @returns 包含 Token 使用情况的消息对象
 */
export const createMessageWithUsage = (
  inputTokens: number,
  outputTokens: number,
  overrides?: Partial<StandardMessage>
): StandardMessage => {
  return createAssistantMessage({
    usage: {
      inputTokens,
      outputTokens,
    },
    ...overrides,
  });
};

/**
 * 创建多轮对话历史
 * @param rounds 对话轮数
 * @returns 消息对象数组
 */
export const createConversationHistory = (rounds: number): StandardMessage[] => {
  const messages: StandardMessage[] = [];
  const startTime = Math.floor(Date.now() / 1000);

  for (let i = 0; i < rounds; i++) {
    messages.push(createUserMessage({
      id: `user-round-${i}`,
      content: `User message in round ${i + 1}`,
      timestamp: startTime + i * 2,
    }));

    messages.push(createAssistantMessage({
      id: `assistant-round-${i}`,
      content: `Assistant response in round ${i + 1}`,
      timestamp: startTime + i * 2 + 1,
    }));
  }

  return messages;
};
