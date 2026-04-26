/**
 * Chat 测试数据工厂
 * 
 * 提供聊天消息测试所需的 Mock 数据
 */

import type { StandardMessage } from '@/types/chat';
import { ChatRoleEnum } from '@/types/chat';
import { createIdGenerator } from 'ai';

// 生成测试消息 ID 的工具函数（带前缀）
const generateMessageId = createIdGenerator({ prefix: 'test-msg-' });

/**
 * 创建 Mock StandardMessage 对象
 * @param overrides 要覆盖的字段
 * @returns StandardMessage 对象
 * @example
 * ```ts
 * const message = createMockMessage({
 *   role: ChatRoleEnum.USER,
 *   content: 'Hello, world!'
 * });
 * ```
 */
export const createMockMessage = (overrides?: Partial<StandardMessage>): StandardMessage => ({
  id: generateMessageId(),
  timestamp: Date.now() / 1000, // 转换为秒级时间戳
  modelKey: 'deepseek-chat',
  role: ChatRoleEnum.USER,
  content: 'Test message',
  finishReason: 'stop',
  ...overrides,
});

/**
 * 创建用户消息
 * @param content 消息内容
 * @param overrides 要覆盖的字段
 * @returns 用户消息对象
 * @example
 * ```ts
 * const message = createUserMessage('What is the capital of France?');
 * ```
 */
export const createUserMessage = (
  content: string = 'Hello, how are you?',
  overrides?: Partial<StandardMessage>
): StandardMessage =>
  createMockMessage({
    role: ChatRoleEnum.USER,
    content,
    ...overrides,
  });

/**
 * 创建助手消息
 * @param content 消息内容
 * @param overrides 要覆盖的字段
 * @returns 助手消息对象
 * @example
 * ```ts
 * const message = createAssistantMessage('The capital of France is Paris.');
 * ```
 */
export const createAssistantMessage = (
  content: string = 'I am doing well, thank you!',
  overrides?: Partial<StandardMessage>
): StandardMessage =>
  createMockMessage({
    role: ChatRoleEnum.ASSISTANT,
    content,
    ...overrides,
  });

