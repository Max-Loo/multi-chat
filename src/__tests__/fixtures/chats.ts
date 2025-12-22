import { Chat } from '@/types/chat';

/**
 * 创建测试用的聊天数据
 * @param overrides 覆盖默认属性
 * @returns 聊天对象
 */
export const createMockChat = (overrides: Partial<Chat> = {}): Chat => {
  return {
    id: 'chat-1',
    name: 'Test Chat',
    isDeleted: false,
    ...overrides,
  };
};

/**
 * 创建多个测试用的聊天数据
 * @param count 聊天数量
 * @param overrides 覆盖默认属性
 * @returns 聊天数组
 */
export const createMockChats = (count = 3, overrides: Partial<Chat> = {}): Chat[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockChat({
      id: `chat-${index + 1}`,
      name: `Chat ${index + 1}`,
      ...overrides,
    }),
  );
};

/**
 * 创建已删除的聊天数据
 * @param overrides 覆盖默认属性
 * @returns 已删除的聊天对象
 */
export const createMockDeletedChat = (overrides: Partial<Chat> = {}): Chat => {
  return createMockChat({
    isDeleted: true,
    ...overrides,
  });
};