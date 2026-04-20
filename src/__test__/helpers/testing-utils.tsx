/**
 * 通用测试工具函数
 *
 * 提供可复用的测试辅助函数，简化测试代码编写
 * 此文件重新导出项目中已有的测试工具函数，并提供额外的组合工具函数
 */

import type { Chat, StandardMessage } from '@/types/chat';
import { ChatRoleEnum } from '@/types/chat';
import { createIdGenerator } from 'ai';
import { createMockMessage as _createMockMessage } from '@/__test__/fixtures/chat';
import { createMockChat as _createMockChat } from './mocks/chatSidebar';

/**
 * 用于测试的类型强制转换，替代 as unknown as 模式
 * @param value 需要转换的值
 * @returns 强制转换为目标类型的值
 */
export function asTestType<T>(value: unknown): T {
  return value as T;
}

// render/redux 不在此处重新导出：它导入 react-redux 会在全局 setup 阶段触发 CJS/ESM 兼容性问题
// 需要的测试文件请直接 import from '@/__test__/helpers/render/redux'

// 重新导出 Chat fixtures (从 @/__test__/fixtures/chat 导入)
export { createMockMessage } from '@/__test__/fixtures/chat';

// 重新导出 Chat Mocks (从 mocks/chatSidebar 导入)
export { createMockChat } from './mocks/chatSidebar';

/**
 * 创建包含多个消息的模拟聊天
 * @param messageCount 消息数量
 * @param chatOverrides 聊天覆盖字段
 * @param messageOverrides 消息覆盖字段（可以是函数）
 * @returns Chat 对象
 */
export function createMockChatWithMessages(
  messageCount: number,
  chatOverrides?: Partial<Chat>,
  messageOverrides?: Partial<StandardMessage> | ((index: number) => Partial<StandardMessage>)
): Chat {
  const generateChatId = createIdGenerator({ prefix: 'test-chat-' });
  const generateModelId = createIdGenerator({ prefix: 'test-model-' });
  
  const modelId = generateModelId();
  const messages: StandardMessage[] = Array.from({ length: messageCount }, (_, index) => {
    const override = typeof messageOverrides === 'function' 
      ? messageOverrides(index) 
      : messageOverrides;
    
    return _createMockMessage({
      role: index % 2 === 0 ? ChatRoleEnum.USER : ChatRoleEnum.ASSISTANT,
      content: `Message ${index + 1}`,
      ...override,
    });
  });

  return _createMockChat({
    id: generateChatId(),
    name: `Chat with ${messageCount} messages`,
    chatModelList: [
      {
        modelId,
        chatHistoryList: messages,
      },
    ],
    ...chatOverrides,
  });
}
