import { describe, it, expect } from 'vitest';
import { useExistingChatList } from '@/hooks/useExistingChatList';
import { renderHookWithProviders } from '@/__test__/helpers/render/redux';
import { createChatSliceState } from '@/__test__/helpers/mocks/testState';
import { createMockChat } from '@/__test__/helpers/testing-utils';

describe('useExistingChatList', () => {

  describe('获取聊天列表测试', () => {
    it('应返回完整的聊天数组（无删除标记）', () => {
      const chat1 = createMockChat({ id: 'chat-1' });
      const chat2 = createMockChat({ id: 'chat-2' });
      const chat3 = createMockChat({ id: 'chat-3' });

      const { result } = renderHookWithProviders(() => useExistingChatList(), {
        preloadedState: {
          chat: createChatSliceState({
            chatList: [chat1, chat2, chat3],
            selectedChatId: null,
          }),
        },
      });

      expect(result.current).toHaveLength(3);
      expect(result.current).toEqual([chat1, chat2, chat3]);
    });

    it('应过滤掉已删除的聊天', () => {
      const chat1 = createMockChat({ id: 'chat-1' });
      const chat2 = createMockChat({ id: 'chat-2', isDeleted: true });
      const chat3 = createMockChat({ id: 'chat-3' });
      const chat4 = createMockChat({ id: 'chat-4', isDeleted: true });

      const { result } = renderHookWithProviders(() => useExistingChatList(), {
        preloadedState: {
          chat: createChatSliceState({
            chatList: [chat1, chat2, chat3, chat4],
            selectedChatId: null,
          }),
        },
      });

      expect(result.current).toHaveLength(2);
      expect(result.current).toEqual([chat1, chat3]);
      expect(result.current.every((chat) => !chat.isDeleted)).toBe(true);
    });

    it('应保留聊天顺序', () => {
      const chat1 = createMockChat({ id: 'chat-1' });
      const chat2 = createMockChat({ id: 'chat-2' });
      const chat3 = createMockChat({ id: 'chat-3' });

      const { result } = renderHookWithProviders(() => useExistingChatList(), {
        preloadedState: {
          chat: createChatSliceState({
            chatList: [chat1, chat2, chat3],
            selectedChatId: null,
          }),
        },
      });

      expect(result.current[0].id).toBe('chat-1');
      expect(result.current[1].id).toBe('chat-2');
      expect(result.current[2].id).toBe('chat-3');
    });
  });

  describe('空列表测试', () => {
    it('应返回空数组', () => {
      const { result } = renderHookWithProviders(() => useExistingChatList(), {
        preloadedState: {
          chat: createChatSliceState({
            chatList: [],
            selectedChatId: null,
          }),
        },
      });

      expect(result.current).toEqual([]);
      expect(result.current).toHaveLength(0);
    });

    it('当所有聊天都已删除时应返回空数组', () => {
      const chat1 = createMockChat({ id: 'chat-1', isDeleted: true });
      const chat2 = createMockChat({ id: 'chat-2', isDeleted: true });
      const chat3 = createMockChat({ id: 'chat-3', isDeleted: true });

      const { result } = renderHookWithProviders(() => useExistingChatList(), {
        preloadedState: {
          chat: createChatSliceState({
            chatList: [chat1, chat2, chat3],
            selectedChatId: null,
          }),
        },
      });

      expect(result.current).toEqual([]);
      expect(result.current).toHaveLength(0);
    });
  });

  describe('Memoization 测试', () => {
    it('应在 chatList 不变时返回相同的引用', () => {
      const chat1 = createMockChat({ id: 'chat-1' });

      const { result, rerender } = renderHookWithProviders(() => useExistingChatList(), {
        preloadedState: {
          chat: createChatSliceState({
            chatList: [chat1],
            selectedChatId: null,
          }),
        },
      });

      const firstResult = result.current;

      rerender();

      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });
  });
});
