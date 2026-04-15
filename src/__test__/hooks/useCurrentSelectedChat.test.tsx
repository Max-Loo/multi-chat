import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useCurrentSelectedChat } from '@/hooks/useCurrentSelectedChat';
import type { Chat } from '@/types/chat';
import { createTypeSafeTestStore } from '@/__test__/helpers/render/redux';
import { createChatSliceState } from '@/__test__/helpers/mocks/testState';
import { asTestType } from '@/__test__/helpers/testing-utils';

const createMockChat = (id: string, name: string): Chat => ({
  id,
  name,
  chatModelList: [{
    modelId: 'model-1',
    chatHistoryList: [],
  }],
  isDeleted: false,
});

const createWrapper = (store: ReturnType<typeof createTypeSafeTestStore>) => {
  return ({ children }: { children: React.ReactNode }) => {
    return <Provider store={store}>{children}</Provider>;
  };
};

describe('useCurrentSelectedChat', () => {

  describe('有选中聊天测试', () => {
    it('应返回对应的聊天对象', () => {
      const chat1 = createMockChat('chat-1', 'Chat 1');
      const chat2 = createMockChat('chat-2', 'Chat 2');

      const store = createTypeSafeTestStore({
        chat: createChatSliceState({
          chatList: [chat1, chat2],
          selectedChatId: 'chat-2',
        }),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useCurrentSelectedChat(), { wrapper });

      expect(result.current).toEqual(chat2);
      expect(result.current?.id).toBe('chat-2');
    });

    it('应返回第一个聊天', () => {
      const chat1 = createMockChat('chat-1', 'Chat 1');

      const store = createTypeSafeTestStore({
        chat: createChatSliceState({
          chatList: [chat1],
          selectedChatId: 'chat-1',
        }),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useCurrentSelectedChat(), { wrapper });

      expect(result.current).toEqual(chat1);
    });

  });

  describe('无选中聊天测试', () => {
    it('当 selectedChatId 为 null 时应返回 null', () => {
      const store = createTypeSafeTestStore({
        chat: createChatSliceState({
          chatList: [],
          selectedChatId: null,
        }),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useCurrentSelectedChat(), { wrapper });

      expect(result.current).toBeNull();
    });

    it('当 selectedChatId 为 undefined 时应返回 null', () => {
      const store = createTypeSafeTestStore({
        chat: createChatSliceState({
          chatList: [],
          selectedChatId: asTestType<string>(undefined),
        }),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useCurrentSelectedChat(), { wrapper });

      expect(result.current).toBeNull();
    });

    it('当聊天列表为空时应返回 null', () => {
      const store = createTypeSafeTestStore({
        chat: createChatSliceState({
          chatList: [],
          selectedChatId: 'non-existent',
        }),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useCurrentSelectedChat(), { wrapper });

      expect(result.current).toBeNull();
    });

    it('当选中的聊天ID不存在时应返回 null', () => {
      const chat1 = createMockChat('chat-1', 'Chat 1');

      const store = createTypeSafeTestStore({
        chat: createChatSliceState({
          chatList: [chat1],
          selectedChatId: 'non-existent',
        }),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useCurrentSelectedChat(), { wrapper });

      expect(result.current).toBeNull();
    });

  });

  describe('Memoization 测试', () => {
    it('应在 selectedChatId 不变时返回相同的引用', () => {
      const chat1 = createMockChat('chat-1', 'Chat 1');

      const store = createTypeSafeTestStore({
        chat: createChatSliceState({
          chatList: [chat1],
          selectedChatId: 'chat-1',
        }),
      });

      const wrapper = createWrapper(store);
      const { result, rerender } = renderHook(() => useCurrentSelectedChat(), { wrapper });

      const firstResult = result.current;

      rerender();

      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });

  });
});
