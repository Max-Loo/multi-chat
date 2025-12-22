import { StandardMessage, ChatRoleEnum } from '@/types/chat';

/**
 * 创建测试用的标准消息数据
 * @param overrides 覆盖默认属性
 * @returns 标准消息对象
 */
export const createMockMessage = (overrides: Partial<StandardMessage> = {}): StandardMessage => {
  return {
    id: 'msg-1',
    timestamp: Date.now() / 1000,
    modelKey: 'gpt-4',
    role: ChatRoleEnum.USER,
    content: 'Hello, world!',
    finishReason: null,
    ...overrides,
  };
};

/**
 * 创建多个测试用的标准消息数据
 * @param count 消息数量
 * @param overrides 覆盖默认属性
 * @returns 标准消息数组
 */
export const createMockMessages = (count = 3, overrides: Partial<StandardMessage> = {}): StandardMessage[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockMessage({
      id: `msg-${index + 1}`,
      content: `Message ${index + 1}`,
      ...overrides,
    })
  );
};

/**
 * 创建用户消息
 * @param content 消息内容
 * @param overrides 覆盖默认属性
 * @returns 用户消息对象
 */
export const createMockUserMessage = (content = 'User message', overrides: Partial<StandardMessage> = {}): StandardMessage => {
  return createMockMessage({
    role: ChatRoleEnum.USER,
    content,
    ...overrides,
  });
};

/**
 * 创建助手消息
 * @param content 消息内容
 * @param overrides 覆盖默认属性
 * @returns 助手消息对象
 */
export const createMockAssistantMessage = (content = 'Assistant response', overrides: Partial<StandardMessage> = {}): StandardMessage => {
  return createMockMessage({
    role: ChatRoleEnum.ASSISTANT,
    content,
    ...overrides,
  });
};