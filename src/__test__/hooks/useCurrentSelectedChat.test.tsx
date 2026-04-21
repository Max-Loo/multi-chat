import { describe, it, expect } from 'vitest';
import { useCurrentSelectedChat } from '@/hooks/useCurrentSelectedChat';
import { renderHookWithProviders } from '@/__test__/helpers/render/redux';
import { createChatSliceState } from '@/__test__/helpers/mocks/testState';
import { asTestType, createMockChat } from '@/__test__/helpers/testing-utils';
import { chatToMeta } from '@/types/chat';

describe('useCurrentSelectedChat', () => {

  describe('有选中聊天测试', () => {
    it('应返回对应的聊天对象', () => {
      const chat1 = createMockChat({ id: 'chat-1', name: 'Chat 1' });
      const chat2 = createMockChat({ id: 'chat-2', name: 'Chat 2' });

      const { result } = renderHookWithProviders(() => useCurrentSelectedChat(), {
        preloadedState: {
          chat: createChatSliceState({
            chatMetaList: [chatToMeta(chat1), chatToMeta(chat2)],
            activeChatData: { 'chat-1': chat1, 'chat-2': chat2 },
            sendingChatIds: {},
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
            chatMetaList: [chatToMeta(chat1)],
            activeChatData: { 'chat-1': chat1 },
            sendingChatIds: {},
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
            chatMetaList: [],
            activeChatData: {},
            sendingChatIds: {},
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
            chatMetaList: [],
            activeChatData: {},
            sendingChatIds: {},
            selectedChatId: asTestType<string>(undefined),
          }),
        },
      });

      expect(result.current).toBeNull();
    });

    it('当 activeChatData 为空时应返回 null', () => {
      const { result } = renderHookWithProviders(() => useCurrentSelectedChat(), {
        preloadedState: {
          chat: createChatSliceState({
            chatMetaList: [],
            activeChatData: {},
            sendingChatIds: {},
            selectedChatId: 'non-existent',
          }),
        },
      });

      expect(result.current).toBeNull();
    });

    it('当选中的聊天ID在 activeChatData 中不存在时应返回 null', () => {
      const chat1 = createMockChat({ id: 'chat-1', name: 'Chat 1' });

      const { result } = renderHookWithProviders(() => useCurrentSelectedChat(), {
        preloadedState: {
          chat: createChatSliceState({
            chatMetaList: [chatToMeta(chat1)],
            activeChatData: { 'chat-1': chat1 },
            sendingChatIds: {},
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
            chatMetaList: [chatToMeta(chat1)],
            activeChatData: { 'chat-1': chat1 },
            sendingChatIds: {},
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
