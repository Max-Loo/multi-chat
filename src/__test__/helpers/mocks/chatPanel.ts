/**
 * ChatPanel 测试 Mock 工厂
 *
 * 提供聊天面板组件测试所需的 Mock 工厂函数
 */

import { ChatRoleEnum } from '@/types/chat';
import type { StandardMessage } from '@/types/chat';

/**
 * 创建 Mock 聊天消息（面板专用）
 * @param overrides 覆盖默认消息属性
 * @returns Mock 消息对象
 */
export const createMockPanelMessage = (overrides?: Partial<StandardMessage>): StandardMessage => {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: 'test-message-1',
    role: ChatRoleEnum.USER,
    content: 'Test message',
    timestamp: now,
    modelKey: 'test-model',
    finishReason: null,
    raw: null,
    ...overrides,
  };
};
