import { describe, it, expect } from 'vitest';
import { useCurrentSelectedChat } from '@/hooks/useCurrentSelectedChat';
import { renderHookWithProviders } from '@/__test__/helpers/render/redux';
import { createChatSliceState } from '@/__test__/helpers/mocks/testState';
import { asTestType, createMockChat } from '@/__test__/helpers/testing-utils';

describe('useCurrentSelectedChat', () => {

  describe('有选中聊天测试', () => {
    it('应返回对应的聊天对象', () => {
      const chat1 = createMockChat({ id: 'chat-1', name: 'Chat 1' });
      const chat2 = createMockChat({ id: 'chat-2', name: 'Chat 2' });

      const { result } = renderHookWithProviders(() => useCurrentSelectedChat(), {
        preloadedState: {
          chat: createChatSliceState({
            chatList: [chat1, chat2],
            selectedChatId: 'chat-2',
          }),
        },
      });

      expect(result.current).toEqual(chat2);
      expect(result.current?.id).toBe('chat-2');
    });

    it('应返回第一个聊天', () => {
      const chat1 = createMockChat({ id: 'chat-1', name: 'Chat 1' });

      const { result } = renderHookWithProviders(() => useCurrentSelectedChat(), {
        preloadedState: {
          chat: createChatSliceState({
            chatList: [chat1],
            selectedChatId: 'chat-1',
          }),
        },
      });

      expect(result.current).toEqual(chat1);
    });

  });

  describe('无选中聊天测试', () => {
    it('当 selectedChatId 为 null 时应返回 null', () => {
      const { result } = renderHookWithProviders(() => useCurrentSelectedChat(), {
        preloadedState: {
          chat: createChatSliceState({
            chatList: [],
            selectedChatId: null,
          }),
        },
      });

      expect(result.current).toBeNull();
    });

    it('当 selectedChatId 为 undefined 时应返回 null', () => {
      const { result } = renderHookWithProviders(() => useCurrentSelectedChat(), {
        preloadedState: {
          chat: createChatSliceState({
            chatList: [],
            selectedChatId: asTestType<string>(undefined),
          }),
        },
      });

      expect(result.current).toBeNull();
    });

    it('当聊天列表为空时应返回 null', () => {
      const { result } = renderHookWithProviders(() => useCurrentSelectedChat(), {
        preloadedState: {
          chat: createChatSliceState({
            chatList: [],
            selectedChatId: 'non-existent',
          }),
        },
      });

      expect(result.current).toBeNull();
    });

    it('当选中的聊天ID不存在时应返回 null', () => {
      const chat1 = createMockChat({ id: 'chat-1', name: 'Chat 1' });

      const { result } = renderHookWithProviders(() => useCurrentSelectedChat(), {
        preloadedState: {
          chat: createChatSliceState({
            chatList: [chat1],
            selectedChatId: 'non-existent',
          }),
        },
      });

      expect(result.current).toBeNull();
    });

  });

  describe('Memoization 测试', () => {
    it('应在 selectedChatId 不变时返回相同的引用', () => {
      const chat1 = createMockChat({ id: 'chat-1', name: 'Chat 1' });

      const { result, rerender } = renderHookWithProviders(() => useCurrentSelectedChat(), {
        preloadedState: {
          chat: createChatSliceState({
            chatList: [chat1],
            selectedChatId: 'chat-1',
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
