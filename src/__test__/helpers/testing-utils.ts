/**
 * 通用测试工具函数（Vue 版，对应旧 testing-utils.tsx 中的框架无关部分）
 */
import { generateId } from 'ai';
import type { Chat } from '@/types/chat';

/**
 * 用于测试的类型强制转换，替代 as unknown as 模式
 * @param value 需要转换的值
 * @returns 强制转换为目标类型的值
 */
export function asTestType<T>(value: unknown): T {
  return value as T;
}

/**
 * 创建聊天 Mock 数据（原 mocks/chatSidebar 中的工厂）
 */
export const createMockChat = (overrides?: Partial<Chat>): Chat => {
  return {
    id: generateId(),
    name: 'Test Chat',
    chatModelList: [],
    isDeleted: false,
    ...overrides,
  };
};
