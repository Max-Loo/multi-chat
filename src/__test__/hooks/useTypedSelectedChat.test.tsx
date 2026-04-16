/**
 * useSelectedChat Hook 测试
 *
 * 测试类型化选中聊天 Hook 的各种场景
 */

import { describe, it, expect } from 'vitest';
import { useSelectedChat } from '@/pages/Chat/hooks/useSelectedChat';
import { createMockChat, createMockChatWithModels } from '@/__test__/helpers/mocks/chatSidebar';
import { renderHookWithProviders } from '@/__test__/helpers/render/redux';
import { createChatSliceState } from '@/__test__/helpers/mocks/testState';

describe('useSelectedChat', () => {

  describe('基础场景', () => {
    it('测试获取有效的选中聊天', () => {
      const chat1 = createMockChat({ id: 'chat-1', name: 'Chat 1' });
      const chat2 = createMockChat({ id: 'chat-2', name: 'Chat 2' });

      const { result } = renderHookWithProviders(() => useSelectedChat(), {
        preloadedState: {
          chat: createChatSliceState({
            chatList: [chat1, chat2],
            selectedChatId: 'chat-2',
          }),
        },
      });

      expect(result.current.selectedChat).toBeDefined();
      expect(result.current.selectedChat?.id).toBe('chat-2');
      expect(result.current.selectedChat?.name).toBe('Chat 2');
    });

    it('测试获取空的模型列表', () => {
      const chat = createMockChat({ id: 'chat-1' });
      // 确保没有 chatModelList
      chat.chatModelList = undefined;

      const { result } = renderHookWithProviders(() => useSelectedChat(), {
        preloadedState: {
          chat: createChatSliceState({
            chatList: [chat],
            selectedChatId: 'chat-1',
          }),
        },
      });

      expect(result.current.selectedChat).toBeDefined();
      expect(result.current.chatModelList).toEqual([]);
    });

    it('测试包含模型的聊天', () => {
      const chat = createMockChatWithModels(3, { id: 'chat-1', name: 'Chat with models' });

      const { result } = renderHookWithProviders(() => useSelectedChat(), {
        preloadedState: {
          chat: createChatSliceState({
            chatList: [chat],
            selectedChatId: 'chat-1',
          }),
        },
      });

      expect(result.current.selectedChat).toBeDefined();
      expect(result.current.chatModelList).toBeDefined();
      expect(result.current.chatModelList.length).toBe(3);
      expect(result.current.chatModelList[0]?.modelId).toBeDefined();
      expect(result.current.chatModelList[0]?.chatHistoryList).toBeDefined();
    });

    it('测试选中聊天未定义时的默认行为', () => {
      const { result } = renderHookWithProviders(() => useSelectedChat(), {
        preloadedState: {
          chat: createChatSliceState({
            chatList: [],
            selectedChatId: null,
          }),
        },
      });

      // 当 selectedChat 为 null 时，useSelectedChat 会将其转换为 Chat 类型
      expect(result.current.selectedChat).toBeDefined();
      expect(result.current.chatModelList).toEqual([]);
    });

  });

  describe('性能优化', () => {
    it('测试依赖变化时的重新计算', () => {
      const chat1 = createMockChat({ id: 'chat-1', name: 'Chat 1' });
      const chat2 = createMockChat({ id: 'chat-2', name: 'Chat 2' });

      const { result, store } = renderHookWithProviders(() => useSelectedChat(), {
        preloadedState: {
          chat: createChatSliceState({
            chatList: [chat1, chat2],
            selectedChatId: 'chat-1',
          }),
        },
      });

      // 初始状态：选中 chat-1
      expect(result.current.selectedChat?.id).toBe('chat-1');
      expect(result.current.selectedChat?.name).toBe('Chat 1');

      // 切换到 chat-2
      store.dispatch({
        type: 'chat/setSelectedChatId',
        payload: 'chat-2',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Reason: 第三方库类型定义不完整
      } as any);

      // 重新渲染 hook
      const { result: newResult } = renderHookWithProviders(() => useSelectedChat(), { store });

      expect(newResult.current.selectedChat?.id).toBe('chat-2');
      expect(newResult.current.selectedChat?.name).toBe('Chat 2');
    });

    it('测试 chatModelList 的 memoization', () => {
      const chat = createMockChatWithModels(3, { id: 'chat-1' });

      const { result, rerender } = renderHookWithProviders(() => useSelectedChat(), {
        preloadedState: {
          chat: createChatSliceState({
            chatList: [chat],
            selectedChatId: 'chat-1',
          }),
        },
      });

      const firstModelList = result.current.chatModelList;

      // 重新渲染不改变依赖
      rerender();

      const secondModelList = result.current.chatModelList;

      // 验证返回相同的引用（memoization）
      expect(firstModelList).toBe(secondModelList);
    });

  });

  describe('边界情况', () => {
    it('测试聊天列表为空的情况', () => {
      const { result } = renderHookWithProviders(() => useSelectedChat(), {
        preloadedState: {
          chat: createChatSliceState({
            chatList: [],
            selectedChatId: null,
          }),
        },
      });

      expect(result.current.selectedChat).toBeDefined();
      expect(result.current.chatModelList).toEqual([]);
    });

    it('测试选中的聊天 ID 不存在', () => {
      const chat1 = createMockChat({ id: 'chat-1', name: 'Chat 1' });

      const { result } = renderHookWithProviders(() => useSelectedChat(), {
        preloadedState: {
          chat: createChatSliceState({
            chatList: [chat1],
            selectedChatId: 'non-existent-chat',
          }),
        },
      });

      // 当找不到聊天时，useCurrentSelectedChat 返回 undefined
      // useSelectedChat 应该返回 null
      expect(result.current.selectedChat).toBeNull();
      expect(result.current.chatModelList).toEqual([]);
    });

  });
});
