/**
 * useTypedSelectedChat Hook 测试
 *
 * 测试类型化选中聊天 Hook 的各种场景
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import { useTypedSelectedChat } from '@/pages/Chat/components/ChatContent/components/ChatPanel/hooks/useTypedSelectedChat';
import chatReducer from '@/store/slices/chatSlices';
import type { RootState } from '@/store';
import { createMockChat, createMockChatWithModels } from '@/__test__/helpers/mocks/chatSidebar';

const createTestStore = (state: Partial<RootState>) => {
  return configureStore({
    reducer: {
      chat: chatReducer,
    } as any,
    preloadedState: state as any,
  });
};

const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  const WrapperComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return React.createElement(Provider as any, { store }, children);
  };
  return WrapperComponent;
};

describe('useTypedSelectedChat', () => {
  describe('基础场景', () => {
    it('测试获取有效的选中聊天', () => {
      const chat1 = createMockChat({ id: 'chat-1', name: 'Chat 1' });
      const chat2 = createMockChat({ id: 'chat-2', name: 'Chat 2' });

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
      const { result } = renderHook(() => useTypedSelectedChat(), { wrapper });

      expect(result.current.selectedChat).toBeDefined();
      expect(result.current.selectedChat?.id).toBe('chat-2');
      expect(result.current.selectedChat?.name).toBe('Chat 2');
    });

    it('测试获取空的模型列表', () => {
      const chat = createMockChat({ id: 'chat-1' });
      // 确保没有 chatModelList
      chat.chatModelList = undefined;

      const store = createTestStore({
        chat: {
          chatList: [chat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useTypedSelectedChat(), { wrapper });

      expect(result.current.selectedChat).toBeDefined();
      expect(result.current.chatModelList).toEqual([]);
    });

    it('测试包含模型的聊天', () => {
      const chat = createMockChatWithModels(3, { id: 'chat-1', name: 'Chat with models' });

      const store = createTestStore({
        chat: {
          chatList: [chat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useTypedSelectedChat(), { wrapper });

      expect(result.current.selectedChat).toBeDefined();
      expect(result.current.chatModelList).toBeDefined();
      expect(result.current.chatModelList.length).toBe(3);
      expect(result.current.chatModelList[0]?.modelId).toBeDefined();
      expect(result.current.chatModelList[0]?.chatHistoryList).toBeDefined();
    });

    it('测试选中聊天未定义时的默认行为', () => {
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
      const { result } = renderHook(() => useTypedSelectedChat(), { wrapper });

      // 当 selectedChat 为 null 时，useTypedSelectedChat 会将其转换为 Chat 类型
      expect(result.current.selectedChat).toBeDefined();
      expect(result.current.chatModelList).toEqual([]);
    });
  });

  describe('性能优化', () => {
    it('测试依赖变化时的重新计算', () => {
      const chat1 = createMockChat({ id: 'chat-1', name: 'Chat 1' });
      const chat2 = createMockChat({ id: 'chat-2', name: 'Chat 2' });

      const store = createTestStore({
        chat: {
          chatList: [chat1, chat2],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useTypedSelectedChat(), { wrapper });

      // 初始状态：选中 chat-1
      expect(result.current.selectedChat?.id).toBe('chat-1');
      expect(result.current.selectedChat?.name).toBe('Chat 1');

      // 切换到 chat-2
      store.dispatch({
        type: 'chat/setSelectedChatId',
        payload: 'chat-2',
      } as any);

      // 重新渲染 hook
      const { result: newResult } = renderHook(() => useTypedSelectedChat(), { wrapper });

      expect(newResult.current.selectedChat?.id).toBe('chat-2');
      expect(newResult.current.selectedChat?.name).toBe('Chat 2');
    });

    it('测试 chatModelList 的 memoization', () => {
      const chat = createMockChatWithModels(3, { id: 'chat-1' });

      const store = createTestStore({
        chat: {
          chatList: [chat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      const { result, rerender } = renderHook(() => useTypedSelectedChat(), { wrapper });

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
      const { result } = renderHook(() => useTypedSelectedChat(), { wrapper });

      expect(result.current.selectedChat).toBeDefined();
      expect(result.current.chatModelList).toEqual([]);
    });

    it('测试选中的聊天 ID 不存在', () => {
      const chat1 = createMockChat({ id: 'chat-1', name: 'Chat 1' });

      const store = createTestStore({
        chat: {
          chatList: [chat1],
          selectedChatId: 'non-existent-chat',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useTypedSelectedChat(), { wrapper });

      // 当找不到聊天时，useCurrentSelectedChat 返回 undefined
      // useTypedSelectedChat 应该返回 null
      expect(result.current.selectedChat).toBeNull();
      expect(result.current.chatModelList).toEqual([]);
    });
  });
});
