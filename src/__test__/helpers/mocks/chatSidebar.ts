/**
 * Chat Sidebar 测试 Mock 工厂
 *
 * 提供聊天侧边栏组件测试所需的 Mock 工厂函数
 */

import { ChatRoleEnum } from '@/types/chat';
import type { Chat } from '@/types/chat';
import { createMockPanelMessage } from './chatPanel';
import { generateId } from 'ai';

/**
 * 创建 Mock Chat 对象
 * @param overrides 要覆盖的字段
 * @returns Chat 对象
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

/**
 * 创建包含多个模型的 Chat
 * @param modelCount 模型数量
 * @param overrides 要覆盖的字段
 * @returns Chat 对象
 */
export const createMockChatWithModels = (
  modelCount: number,
  overrides?: Partial<Chat>
): Chat => {
  const chatModelList = Array.from({ length: modelCount }, (_, i) => ({
    modelId: `model-${i}`,
    chatHistoryList: [
      createMockPanelMessage({
        id: `msg-${i}-1`,
        role: ChatRoleEnum.USER,
        content: `User message ${i + 1}`,
      }),
      createMockPanelMessage({
        id: `msg-${i}-2`,
        role: ChatRoleEnum.ASSISTANT,
        content: `Assistant response ${i + 1}`,
      }),
    ],
  }));

  return createMockChat({
    chatModelList,
    ...overrides,
  });
};

/**
 * 创建 Chat 列表
 * @param count 聊天数量
 * @param overrides 每个聊天要覆盖的字段
 * @returns Chat 对象数组
 */
export const createMockChatList = (
  count: number,
  overrides?: Partial<Chat>
): Chat[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockChat({
      name: `Chat ${i + 1}`,
      ...overrides,
    })
  );
};
