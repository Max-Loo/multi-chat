/**
 * useIsSending Hook 测试
 *
 * 测试发送状态判断 Hook 的各种场景
 */

import { describe, it, expect } from 'vitest';
import { act } from '@testing-library/react';
import { useIsSending } from '@/pages/Chat/hooks/useIsSending';
import { createMockChat } from '@/__test__/helpers/mocks/chatSidebar';
import { renderHookWithProviders } from '@/__test__/helpers/render/redux';
import { createChatSliceState } from '@/__test__/helpers/mocks/testState';
import { setSelectedChatId } from '@/store/slices/chatSlices';
import { chatToMeta } from '@/types/chat';

describe('useIsSending', () => {
  describe('基础场景', () => {
    it('应该返回发送中状态 当单个聊天正在发送', () => {
      const mockChat = createMockChat({ id: 'chat-1' });

      const { result } = renderHookWithProviders(() => useIsSending(), {
        preloadedState: {
          chat: createChatSliceState({
            chatMetaList: [chatToMeta(mockChat)],
            activeChatData: { 'chat-1': mockChat },
            sendingChatIds: {},
            selectedChatId: 'chat-1',
            runningChat: {
              'chat-1': {
                'model-1': { isSending: true, history: null },
              },
            },
          }),
        },
      });

      expect(result.current.isSending).toBe(true);
    });

    it('应该返回发送中状态 当多个聊天部分正在发送', () => {
      const chat1 = createMockChat({ id: 'chat-1' });
      const chat2 = createMockChat({ id: 'chat-2' });
      const chat3 = createMockChat({ id: 'chat-3' });

      const { result } = renderHookWithProviders(() => useIsSending(), {
        preloadedState: {
          chat: createChatSliceState({
            chatMetaList: [chatToMeta(chat1), chatToMeta(chat2), chatToMeta(chat3)],
            activeChatData: { 'chat-1': chat1, 'chat-2': chat2, 'chat-3': chat3 },
            sendingChatIds: {},
            selectedChatId: 'chat-2',
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
          }),
        },
      });

      expect(result.current.isSending).toBe(true);
    });

    it('应该返回非发送中状态 当当前聊天未发送', () => {
      const chat1 = createMockChat({ id: 'chat-1' });
      const chat2 = createMockChat({ id: 'chat-2' });

      const { result } = renderHookWithProviders(() => useIsSending(), {
        preloadedState: {
          chat: createChatSliceState({
            chatMetaList: [chatToMeta(chat1), chatToMeta(chat2)],
            activeChatData: { 'chat-1': chat1, 'chat-2': chat2 },
            sendingChatIds: {},
            selectedChatId: 'chat-2',
            runningChat: {
              'chat-1': {
                'model-1': { isSending: true, history: null },
              },
              'chat-2': {
                'model-2': { isSending: false, history: null },
              },
            },
          }),
        },
      });

      expect(result.current.isSending).toBe(false);
    });
  });

  describe('完成和空场景', () => {
    it('应该返回非发送中状态 当所有模型完成发送', () => {
      const mockChat = createMockChat({ id: 'chat-1' });

      const { result } = renderHookWithProviders(() => useIsSending(), {
        preloadedState: {
          chat: createChatSliceState({
            chatMetaList: [chatToMeta(mockChat)],
            activeChatData: { 'chat-1': mockChat },
            sendingChatIds: {},
            selectedChatId: 'chat-1',
            runningChat: {
              'chat-1': {
                'model-1': { isSending: false, history: null },
                'model-2': { isSending: false, history: null },
              },
            },
          }),
        },
      });

      expect(result.current.isSending).toBe(false);
    });

    it('应该返回非发送中状态 当 runningChat 为空', () => {
      const mockChat = createMockChat({ id: 'chat-1' });

      const { result } = renderHookWithProviders(() => useIsSending(), {
        preloadedState: {
          chat: createChatSliceState({
            chatMetaList: [chatToMeta(mockChat)],
            activeChatData: { 'chat-1': mockChat },
            sendingChatIds: {},
            selectedChatId: 'chat-1',
            runningChat: {},
          }),
        },
      });

      expect(result.current.isSending).toBe(false);
    });

    it('应该返回非发送中状态 当当前聊天在 runningChat 中不存在', () => {
      const mockChat = createMockChat({ id: 'chat-1' });

      const { result } = renderHookWithProviders(() => useIsSending(), {
        preloadedState: {
          chat: createChatSliceState({
            chatMetaList: [chatToMeta(mockChat)],
            activeChatData: { 'chat-1': mockChat },
            sendingChatIds: {},
            selectedChatId: 'chat-1',
            runningChat: {
              'chat-2': {
                'model-1': { isSending: true, history: null },
              },
            },
          }),
        },
      });

      expect(result.current.isSending).toBe(false);
    });
  });

  describe('性能优化', () => {
    it('应该重新计算 当 selectedChat 变化时', () => {
      const chat1 = createMockChat({ id: 'chat-1' });
      const chat2 = createMockChat({ id: 'chat-2' });

      const { result, store } = renderHookWithProviders(() => useIsSending(), {
        preloadedState: {
          chat: createChatSliceState({
            chatMetaList: [chatToMeta(chat1), chatToMeta(chat2)],
            activeChatData: { 'chat-1': chat1, 'chat-2': chat2 },
            sendingChatIds: {},
            selectedChatId: 'chat-1',
            runningChat: {
              'chat-1': {
                'model-1': { isSending: true, history: null },
              },
              'chat-2': {
                'model-2': { isSending: false, history: null },
              },
            },
          }),
        },
      });

      expect(result.current.isSending).toBe(true);

      // 切换到不同的聊天
      act(() => {
        store.dispatch(setSelectedChatId('chat-2'));
      });

      expect(result.current.isSending).toBe(false);
    });

    it('应该重新计算 当 runningChat 变化时', () => {
      const mockChat = createMockChat({ id: 'chat-1' });

      const { result, store } = renderHookWithProviders(() => useIsSending(), {
        preloadedState: {
          chat: createChatSliceState({
            chatMetaList: [chatToMeta(mockChat)],
            activeChatData: { 'chat-1': mockChat },
            sendingChatIds: {},
            selectedChatId: 'chat-1',
            runningChat: {
              'chat-1': {
                'model-1': { isSending: false, history: null },
              },
            },
          }),
        },
      });

      expect(result.current.isSending).toBe(false);

      // 模拟 runningChat 状态变化：通过 sendMessage.pending 更新 runningChat
      act(() => {
        // sendMessage 未导出，无法使用 sendMessage.pending action creator
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        store.dispatch({
          type: 'chatModel/sendMessage/pending',
          meta: {
            arg: {
              chat: { id: 'chat-1' },
              model: { id: 'model-1' },
            },
            requestId: 'test-request-id',
            requestStatus: 'pending',
          },
        } as any);
      });
      // dispatch 后 act 触发重新渲染，result.current 已更新
      expect(result.current.isSending).toBe(true);
    });
  });
});
