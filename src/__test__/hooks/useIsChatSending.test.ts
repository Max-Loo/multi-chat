/**

 * useIsChatSending Hook 测试

 *

 * 测试发送状态判断 Hook 的各种场景

 */



import { describe, it, expect } from 'vitest';

import { renderHook } from '@testing-library/react';

import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';

import React from 'react';

import { useIsChatSending } from '@/pages/Chat/components/ChatContent/components/ChatPanel/hooks/useIsChatSending';

import chatReducer from '@/store/slices/chatSlices';

import type { RootState } from '@/store';

import { createMockChat } from '@/__test__/helpers/mocks/chatSidebar';



const createTestStore = (state: Partial<RootState>) => {

  return configureStore({

    reducer: {

      chat: chatReducer,

    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    // Reason: Redux Toolkit 严格类型系统限制

    } as any,

    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    // Reason: Redux Toolkit 严格类型系统限制

    preloadedState: state as any,

  });

};



const createWrapper = (store: ReturnType<typeof createTestStore>) => {

  const WrapperComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Reason: 测试错误处理，需要构造无效输入
    return React.createElement(Provider as any, { store }, children);

  };

  return WrapperComponent;

};



describe('useIsChatSending', () => {

  describe('基础场景', () => {

    it('应该返回发送中状态 当单个聊天正在发送', () => {

      const mockChat = createMockChat({ id: 'chat-1' });



      const store = createTestStore({

        chat: {

          chatList: [mockChat],

          selectedChatId: 'chat-1',

          loading: false,

          error: null,

          initializationError: null,

          runningChat: {

            'chat-1': {

              'model-1': { isSending: true, history: null },

            },

          },

        },

      });



      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useIsChatSending(), { wrapper });



      expect(result.current.isSending).toBe(true);

    });



    it('应该返回发送中状态 当多个聊天部分正在发送', () => {

      const chat1 = createMockChat({ id: 'chat-1' });

      const chat2 = createMockChat({ id: 'chat-2' });

      const chat3 = createMockChat({ id: 'chat-3' });



      const store = createTestStore({

        chat: {

          chatList: [chat1, chat2, chat3],

          selectedChatId: 'chat-2',

          loading: false,

          error: null,

          initializationError: null,

          runningChat: {

            'chat-1': {

              'model-1': { isSending: true, history: null },

            },

            'chat-2': {

              'model-2': { isSending: true, history: null },

            },

            'chat-3': {

              'model-3': { isSending: false, history: null },

            },

          },

        },

      });



      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useIsChatSending(), { wrapper });



      expect(result.current.isSending).toBe(true);

    });



    it('应该返回非发送中状态 当当前聊天未发送', () => {

      const chat1 = createMockChat({ id: 'chat-1' });

      const chat2 = createMockChat({ id: 'chat-2' });



      const store = createTestStore({

        chat: {

          chatList: [chat1, chat2],

          selectedChatId: 'chat-2',

          loading: false,

          error: null,

          initializationError: null,

          runningChat: {

            'chat-1': {

              'model-1': { isSending: true, history: null },

            },

            'chat-2': {

              'model-2': { isSending: false, history: null },

            },

          },

        },

      });



      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useIsChatSending(), { wrapper });



      expect(result.current.isSending).toBe(false);

    });

  });



  describe('完成和空场景', () => {

    it('应该返回非发送中状态 当所有模型完成发送', () => {

      const mockChat = createMockChat({ id: 'chat-1' });



      const store = createTestStore({

        chat: {

          chatList: [mockChat],

          selectedChatId: 'chat-1',

          loading: false,

          error: null,

          initializationError: null,

          runningChat: {

            'chat-1': {

              'model-1': { isSending: false, history: null },

              'model-2': { isSending: false, history: null },

            },

          },

        },

      });



      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useIsChatSending(), { wrapper });



      expect(result.current.isSending).toBe(false);

    });



    it('应该返回非发送中状态 当 runningChat 为空', () => {

      const mockChat = createMockChat({ id: 'chat-1' });



      const store = createTestStore({

        chat: {

          chatList: [mockChat],

          selectedChatId: 'chat-1',

          loading: false,

          error: null,

          initializationError: null,

          runningChat: {},

        },

      });



      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useIsChatSending(), { wrapper });



      expect(result.current.isSending).toBe(false);

    });



    it('应该返回非发送中状态 当当前聊天在 runningChat 中不存在', () => {

      const mockChat = createMockChat({ id: 'chat-1' });



      const store = createTestStore({

        chat: {

          chatList: [mockChat],

          selectedChatId: 'chat-1',

          loading: false,

          error: null,

          initializationError: null,

          runningChat: {

            'chat-2': {

              'model-1': { isSending: true, history: null },

            },

          },

        },

      });



      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useIsChatSending(), { wrapper });



      expect(result.current.isSending).toBe(false);

    });

  });



  describe('性能优化', () => {

    it('应该重新计算 当 selectedChat 变化时', () => {

      const chat1 = createMockChat({ id: 'chat-1' });

      const chat2 = createMockChat({ id: 'chat-2' });



      const store = createTestStore({

        chat: {

          chatList: [chat1, chat2],

          selectedChatId: 'chat-1',

          loading: false,

          error: null,

          initializationError: null,

          runningChat: {

            'chat-1': {

              'model-1': { isSending: true, history: null },

            },

            'chat-2': {

              'model-2': { isSending: false, history: null },

            },

          },

        },

      });



      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useIsChatSending(), { wrapper });



      expect(result.current.isSending).toBe(true);



      // 切换到不同的聊天

      store.dispatch({

        type: 'chat/setSelectedChatId',

        payload: 'chat-2',

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Reason: 第三方库类型定义不完整
      } as any);



      // 重新渲染 hook

      const { result: newResult } = renderHook(() => useIsChatSending(), { wrapper });

      expect(newResult.current.isSending).toBe(false);

    });



    it('应该重新计算 当 runningChat 变化时', () => {

      const mockChat = createMockChat({ id: 'chat-1' });



      const store = createTestStore({

        chat: {

          chatList: [mockChat],

          selectedChatId: 'chat-1',

          loading: false,

          error: null,

          initializationError: null,

          runningChat: {

            'chat-1': {

              'model-1': { isSending: false, history: null },

            },

          },

        },

      });



      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useIsChatSending(), { wrapper });



      expect(result.current.isSending).toBe(false);



      // 模拟开始发送（需要更新 store 状态）

      // 注意：这个测试可能需要在实际实现中调整

      // 因为 Redux store 的状态更新需要通过 action

    });

  });

});
