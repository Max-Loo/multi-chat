import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useCurrentSelectedChat } from '@/hooks/useCurrentSelectedChat';
import chatReducer from '@/store/slices/chatSlices';
import type { RootState } from '@/store';
import type { Chat } from '@/types/chat';

const createMockChat = (id: string, name: string): Chat => ({
  id,
  name,
  chatModelList: [{
    modelId: 'model-1',
    chatHistoryList: [],
  }],
  isDeleted: false,
});

const createTestStore = (state: Partial<RootState>) => {
  return configureStore({
    reducer: {
      chat: chatReducer,
    } as any,
    preloadedState: state as any,
  });
};

const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return ({ children }: { children: React.ReactNode }) => {
    return <Provider store={store as any}>{children}</Provider>;
  };
};

describe('useCurrentSelectedChat', () => {

  describe('有选中聊天测试', () => {
    it('应返回对应的聊天对象', () => {
      const chat1 = createMockChat('chat-1', 'Chat 1');
      const chat2 = createMockChat('chat-2', 'Chat 2');

      const store = createTestStore({
        chat: {
          chatList: [chat1, chat2],
          selectedChatId: 'chat-2',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useCurrentSelectedChat(), { wrapper });

      expect(result.current).toEqual(chat2);
      expect(result.current?.id).toBe('chat-2');
    });

    it('应返回第一个聊天', () => {
      const chat1 = createMockChat('chat-1', 'Chat 1');

      const store = createTestStore({
        chat: {
          chatList: [chat1],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useCurrentSelectedChat(), { wrapper });

      expect(result.current).toEqual(chat1);
    });
  });

  describe('无选中聊天测试', () => {
    it('当 selectedChatId 为 null 时应返回 null', () => {
      const store = createTestStore({
        chat: {
          chatList: [],
          selectedChatId: null,
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useCurrentSelectedChat(), { wrapper });

      expect(result.current).toBeNull();
    });

    it('当 selectedChatId 为 undefined 时应返回 null', () => {
      const store = createTestStore({
        chat: {
          chatList: [],
          selectedChatId: undefined as any,
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useCurrentSelectedChat(), { wrapper });

      expect(result.current).toBeNull();
    });

    it('当聊天列表为空时应返回 undefined', () => {
      const store = createTestStore({
        chat: {
          chatList: [],
          selectedChatId: 'non-existent',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useCurrentSelectedChat(), { wrapper });

      expect(result.current).toBeUndefined();
    });

    it('当选中的聊天ID不存在时应返回 undefined', () => {
      const chat1 = createMockChat('chat-1', 'Chat 1');

      const store = createTestStore({
        chat: {
          chatList: [chat1],
          selectedChatId: 'non-existent',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useCurrentSelectedChat(), { wrapper });

      expect(result.current).toBeUndefined();
    });
  });

  describe('Memoization 测试', () => {
    it('应在 selectedChatId 不变时返回相同的引用', () => {
      const chat1 = createMockChat('chat-1', 'Chat 1');

      const store = createTestStore({
        chat: {
          chatList: [chat1],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
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
