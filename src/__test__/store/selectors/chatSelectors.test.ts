/**
 * chatSelectors selector 单元测试
 *
 * 验证 selectSelectedChat、selectChatMetaList、selectSelectedChatMeta 的输入-输出映射和 memoization 行为
 */

import { describe, it, expect } from 'vitest';
import { selectSelectedChat, selectChatMetaList, selectSelectedChatMeta } from '@/store/selectors/chatSelectors';
import { createChatSliceState, createTestRootState } from '@/__test__/helpers/mocks/testState';
import { createMockChat } from '@/__test__/helpers/mocks/chatSidebar';
import type { ChatMeta } from '@/types/chat';

describe('selectSelectedChat', () => {
  describe('输入-输出测试', () => {
    it('应该返回匹配的聊天对象（从 activeChatData 获取）', () => {
      const chat1 = createMockChat({ id: 'chat-1', name: 'Chat 1' });
      const chat2 = createMockChat({ id: 'chat-2', name: 'Chat 2' });

      const state = createTestRootState({
        chat: createChatSliceState({
          chatMetaList: [
            { id: 'chat-1', name: 'Chat 1', modelIds: [], isDeleted: false },
            { id: 'chat-2', name: 'Chat 2', modelIds: [], isDeleted: false },
          ],
          activeChatData: {
            'chat-1': chat1,
            'chat-2': chat2,
          },
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
          chatMetaList: [{ id: 'chat-1', modelIds: [], isDeleted: false }],
          activeChatData: { 'chat-1': chat1 },
          selectedChatId: null,
        }),
      });

      const result = selectSelectedChat(state);

      expect(result).toBeUndefined();
    });

    it('应该在 activeChatData 中无匹配时返回 undefined', () => {
      const state = createTestRootState({
        chat: createChatSliceState({
          chatMetaList: [{ id: 'chat-99', modelIds: [], isDeleted: false }],
          activeChatData: {},
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
          chatMetaList: [{ id: 'chat-1', name: 'Chat 1', modelIds: [], isDeleted: false }],
          activeChatData: { 'chat-1': chat1 },
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
          chatMetaList: [
            { id: 'chat-1', name: 'Chat 1', modelIds: [], isDeleted: false },
            { id: 'chat-2', name: 'Chat 2', modelIds: [], isDeleted: false },
          ],
          activeChatData: { 'chat-1': chat1, 'chat-2': chat2 },
          selectedChatId: 'chat-1',
        }),
      });

      const state2 = createTestRootState({
        chat: createChatSliceState({
          chatMetaList: [
            { id: 'chat-1', name: 'Chat 1', modelIds: [], isDeleted: false },
            { id: 'chat-2', name: 'Chat 2', modelIds: [], isDeleted: false },
          ],
          activeChatData: { 'chat-1': chat1, 'chat-2': chat2 },
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

describe('selectChatMetaList', () => {
  it('应该返回 chatMetaList', () => {
    const metaList: ChatMeta[] = [
      { id: 'chat-1', name: 'Chat 1', modelIds: [], isDeleted: false },
      { id: 'chat-2', name: 'Chat 2', modelIds: [], isDeleted: false },
    ];

    const state = createTestRootState({
      chat: createChatSliceState({ chatMetaList: metaList }),
    });

    const result = selectChatMetaList(state);

    expect(result).toEqual(metaList);
  });

  it('应该在相同输入时返回相同引用', () => {
    const metaList: ChatMeta[] = [{ id: 'chat-1', modelIds: [], isDeleted: false }];

    const state = createTestRootState({
      chat: createChatSliceState({ chatMetaList: metaList }),
    });

    const result1 = selectChatMetaList(state);
    const result2 = selectChatMetaList(state);

    expect(result1).toBe(result2);
  });
});

describe('selectSelectedChatMeta', () => {
  it('应该返回匹配的聊天元数据', () => {
    const metaList: ChatMeta[] = [
      { id: 'chat-1', name: 'Chat 1', modelIds: [], isDeleted: false },
      { id: 'chat-2', name: 'Chat 2', modelIds: [], isDeleted: false },
    ];

    const state = createTestRootState({
      chat: createChatSliceState({
        chatMetaList: metaList,
        selectedChatId: 'chat-1',
      }),
    });

    const result = selectSelectedChatMeta(state);

    expect(result).toBeDefined();
    expect(result?.id).toBe('chat-1');
    expect(result?.name).toBe('Chat 1');
  });

  it('应该在未选中时返回 undefined', () => {
    const metaList: ChatMeta[] = [{ id: 'chat-1', modelIds: [], isDeleted: false }];

    const state = createTestRootState({
      chat: createChatSliceState({
        chatMetaList: metaList,
        selectedChatId: null,
      }),
    });

    const result = selectSelectedChatMeta(state);

    expect(result).toBeUndefined();
  });

  it('应该在列表中无匹配时返回 undefined', () => {
    const metaList: ChatMeta[] = [{ id: 'chat-1', modelIds: [], isDeleted: false }];

    const state = createTestRootState({
      chat: createChatSliceState({
        chatMetaList: metaList,
        selectedChatId: 'chat-99',
      }),
    });

    const result = selectSelectedChatMeta(state);

    expect(result).toBeUndefined();
  });
});
