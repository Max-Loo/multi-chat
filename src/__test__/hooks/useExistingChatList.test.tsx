import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useExistingChatList } from '@/hooks/useExistingChatList';
import type { Chat } from '@/types/chat';
import { createTypeSafeTestStore } from '@/__test__/helpers/render/redux';
import { createChatSliceState } from '@/__test__/helpers/mocks/testState';

const createMockChat = (id: string, isDeleted: boolean = false): Chat => ({
  id,
  name: `Chat ${id}`,
  chatModelList: [{
    modelId: 'model-1',
    chatHistoryList: [],
  }],
  isDeleted,
});

const createWrapper = (store: ReturnType<typeof createTypeSafeTestStore>) => {
  return ({ children }: { children: React.ReactNode }) => {
    return <Provider store={store}>{children}</Provider>;
  };
};

describe('useExistingChatList', () => {

  describe('获取聊天列表测试', () => {
    it('应返回完整的聊天数组（无删除标记）', () => {
      const chat1 = createMockChat('chat-1', false);
      const chat2 = createMockChat('chat-2', false);
      const chat3 = createMockChat('chat-3', false);

      const store = createTypeSafeTestStore({
        chat: createChatSliceState({
          chatList: [chat1, chat2, chat3],
          selectedChatId: null,
        }),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useExistingChatList(), { wrapper });

      expect(result.current).toHaveLength(3);
      expect(result.current).toEqual([chat1, chat2, chat3]);
    });

    it('应过滤掉已删除的聊天', () => {
      const chat1 = createMockChat('chat-1', false);
      const chat2 = createMockChat('chat-2', true);
      const chat3 = createMockChat('chat-3', false);
      const chat4 = createMockChat('chat-4', true);

      const store = createTypeSafeTestStore({
        chat: createChatSliceState({
          chatList: [chat1, chat2, chat3, chat4],
          selectedChatId: null,
        }),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useExistingChatList(), { wrapper });

      expect(result.current).toHaveLength(2);
      expect(result.current).toEqual([chat1, chat3]);
      expect(result.current.every((chat) => !chat.isDeleted)).toBe(true);
    });

    it('应保留聊天顺序', () => {
      const chat1 = createMockChat('chat-1', false);
      const chat2 = createMockChat('chat-2', false);
      const chat3 = createMockChat('chat-3', false);

      const store = createTypeSafeTestStore({
        chat: createChatSliceState({
          chatList: [chat1, chat2, chat3],
          selectedChatId: null,
        }),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useExistingChatList(), { wrapper });

      expect(result.current[0].id).toBe('chat-1');
      expect(result.current[1].id).toBe('chat-2');
      expect(result.current[2].id).toBe('chat-3');
    });
  });

  describe('空列表测试', () => {
    it('应返回空数组', () => {
      const store = createTypeSafeTestStore({
        chat: createChatSliceState({
          chatList: [],
          selectedChatId: null,
        }),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useExistingChatList(), { wrapper });

      expect(result.current).toEqual([]);
      expect(result.current).toHaveLength(0);
    });

    it('当所有聊天都已删除时应返回空数组', () => {
      const chat1 = createMockChat('chat-1', true);
      const chat2 = createMockChat('chat-2', true);
      const chat3 = createMockChat('chat-3', true);

      const store = createTypeSafeTestStore({
        chat: createChatSliceState({
          chatList: [chat1, chat2, chat3],
          selectedChatId: null,
        }),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useExistingChatList(), { wrapper });

      expect(result.current).toEqual([]);
      expect(result.current).toHaveLength(0);
    });
  });

  describe('Memoization 测试', () => {
    it('应在 chatList 不变时返回相同的引用', () => {
      const chat1 = createMockChat('chat-1', false);

      const store = createTypeSafeTestStore({
        chat: createChatSliceState({
          chatList: [chat1],
          selectedChatId: null,
        }),
      });

      const wrapper = createWrapper(store);
      const { result, rerender } = renderHook(() => useExistingChatList(), { wrapper });

      const firstResult = result.current;

      rerender();

      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });
  });
});
