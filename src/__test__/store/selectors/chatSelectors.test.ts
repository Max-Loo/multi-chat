/**
 * chatSelectors selector 单元测试
 *
 * 验证 selectSelectedChat 的输入-输出映射和 memoization 行为
 */

import { describe, it, expect } from 'vitest';
import { selectSelectedChat } from '@/store/selectors/chatSelectors';
import { createChatSliceState, createTestRootState } from '@/__test__/helpers/mocks/testState';
import { createMockChat } from '@/__test__/helpers/mocks/chatSidebar';

describe('selectSelectedChat', () => {
  describe('输入-输出测试', () => {
    it('应该返回匹配的聊天对象', () => {
      const chat1 = createMockChat({ id: 'chat-1', name: 'Chat 1' });
      const chat2 = createMockChat({ id: 'chat-2', name: 'Chat 2' });

      const state = createTestRootState({
        chat: createChatSliceState({
          chatList: [chat1, chat2],
          selectedChatId: 'chat-1',
        }),
      });

      const result = selectSelectedChat(state);

      expect(result).toBeDefined();
      expect(result?.id).toBe('chat-1');
      expect(result?.name).toBe('Chat 1');
    });

    it('应该在未选中时返回 undefined', () => {
      const chat1 = createMockChat({ id: 'chat-1' });

      const state = createTestRootState({
        chat: createChatSliceState({
          chatList: [chat1],
          selectedChatId: null,
        }),
      });

      const result = selectSelectedChat(state);

      expect(result).toBeUndefined();
    });

    it('应该在列表中无匹配时返回 undefined', () => {
      const chat1 = createMockChat({ id: 'chat-1' });

      const state = createTestRootState({
        chat: createChatSliceState({
          chatList: [chat1],
          selectedChatId: 'chat-99',
        }),
      });

      const result = selectSelectedChat(state);

      expect(result).toBeUndefined();
    });
  });

  describe('memoization 引用稳定性测试', () => {
    it('应该在相同输入时返回相同引用', () => {
      const chat1 = createMockChat({ id: 'chat-1', name: 'Chat 1' });

      const state = createTestRootState({
        chat: createChatSliceState({
          chatList: [chat1],
          selectedChatId: 'chat-1',
        }),
      });

      const result1 = selectSelectedChat(state);
      const result2 = selectSelectedChat(state);

      expect(result1).toBe(result2);
    });

    it('应该在 selectedChatId 变化时返回新的聊天对象', () => {
      const chat1 = createMockChat({ id: 'chat-1', name: 'Chat 1' });
      const chat2 = createMockChat({ id: 'chat-2', name: 'Chat 2' });

      const state1 = createTestRootState({
        chat: createChatSliceState({
          chatList: [chat1, chat2],
          selectedChatId: 'chat-1',
        }),
      });

      const state2 = createTestRootState({
        chat: createChatSliceState({
          chatList: [chat1, chat2],
          selectedChatId: 'chat-2',
        }),
      });

      const result1 = selectSelectedChat(state1);
      const result2 = selectSelectedChat(state2);

      expect(result1?.id).toBe('chat-1');
      expect(result2?.id).toBe('chat-2');
      expect(result1).not.toBe(result2);
    });
  });
});
