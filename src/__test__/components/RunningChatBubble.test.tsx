/**
 * RunningChatBubble 组件测试
 *
 * 测试正在生成的消息气泡的渲染场景
 * 不 mock ChatBubble 和 useSelectedChat，通过 Redux state 驱动行为
 */

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { createTypeSafeTestStore, renderWithProviders } from '@/__test__/helpers/render/redux';
import { createChatSliceState, createRunningChatEntry } from '@/__test__/helpers/mocks/testState';
import { createMockPanelChatModel } from '@/__test__/helpers/mocks/panelLayout';
import RunningChatBubble from '@/pages/Chat/components/Panel/Detail/RunningBubble';
import { createMockPanelMessage } from '@/__test__/helpers/mocks/chatPanel';
import { ChatRoleEnum } from '@/types/chat';
import { chatToMeta } from '@/types/chat';

vi.mock('react-i18next', () => globalThis.__mockI18n());

const TEST_CHAT_ID = 'test-chat-1';

/**
 * 创建带有选中聊天和运行数据的测试 Store
 */
function createStore(
  chatModel: ReturnType<typeof createMockPanelChatModel>,
  runningChatOverrides?: Parameters<typeof createRunningChatEntry>[2],
) {
  const chat = {
    id: TEST_CHAT_ID,
    chatModelList: [chatModel],
  };

  return createTypeSafeTestStore({
    chat: createChatSliceState({
      chatMetaList: [chatToMeta(chat)],
      activeChatData: { [TEST_CHAT_ID]: chat },
      sendingChatIds: {},
      selectedChatId: TEST_CHAT_ID,
      runningChat: runningChatOverrides
        ? createRunningChatEntry(TEST_CHAT_ID, chatModel.modelId, runningChatOverrides)
        : {},
    }),
  });
}

describe('RunningChatBubble', () => {
  
  describe('4.5.1 测试显示加载动画', () => {
    it('当消息正在生成但还没有内容时，应该显示加载状态', () => {
      const chatModel = createMockPanelChatModel('model-1');

      const store = createStore(chatModel, {
        isSending: true,
        history: {
          id: 'running-msg-1',
          role: ChatRoleEnum.ASSISTANT,
          content: '',
          reasoningContent: '',
          timestamp: Date.now() / 1000,
          modelKey: chatModel.modelId,
          finishReason: null,
          raw: null,
        },
      });

      renderWithProviders(
        <RunningChatBubble chatModel={chatModel} />,
        { store }
      );

      // 不应该渲染 ChatBubble（内容为空），应该渲染 Spinner
      expect(screen.queryByTestId('assistant-message')).toBeNull();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('当 history 为 nil 时，应该显示加载动画', () => {
      const chatModel = createMockPanelChatModel('model-1');

      const store = createStore(chatModel, {
        isSending: true,
        history: null,
      });

      renderWithProviders(
        <RunningChatBubble chatModel={chatModel} />,
        { store }
      );

      expect(screen.queryByTestId('assistant-message')).toBeNull();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('当 isSending 为 false 时，不应该渲染任何内容', () => {
      const chatModel = createMockPanelChatModel('model-1');

      const store = createStore(chatModel, {
        isSending: false,
        history: createMockPanelMessage({
          role: ChatRoleEnum.ASSISTANT,
          content: 'Response',
        }),
      });

      renderWithProviders(
        <RunningChatBubble chatModel={chatModel} />,
        { store }
      );

      expect(screen.queryByTestId('assistant-message')).toBeNull();
      expect(screen.queryByRole('status')).toBeNull();
    });
  });

  describe('4.5.2 测试流式内容更新', () => {
    it('当接收到流式消息内容时，应该渲染包含内容的 ChatBubble', () => {
      const chatModel = createMockPanelChatModel('model-1');
      const streamingContent = 'This is a streaming response';

      const store = createStore(chatModel, {
        isSending: true,
        history: createMockPanelMessage({
          role: ChatRoleEnum.ASSISTANT,
          content: streamingContent,
        }),
      });

      renderWithProviders(
        <RunningChatBubble chatModel={chatModel} />,
        { store }
      );

      // 应该渲染 ChatBubble，包含流式内容
      expect(screen.getByTestId('assistant-message')).toBeInTheDocument();
    });

    it('当接收到推理内容时，应该渲染包含推理的 ChatBubble', () => {
      const chatModel = createMockPanelChatModel('model-1');
      const reasoningContent = 'This is the reasoning process';

      const store = createStore(chatModel, {
        isSending: true,
        history: createMockPanelMessage({
          role: ChatRoleEnum.ASSISTANT,
          content: 'Final answer',
          reasoningContent,
        }),
      });

      renderWithProviders(
        <RunningChatBubble chatModel={chatModel} />,
        { store }
      );

      expect(screen.getByTestId('assistant-message')).toBeInTheDocument();
    });

    it('当流式内容更新时，应该正确更新渲染', () => {
      const chatModel = createMockPanelChatModel('model-1');
      const initialContent = 'Initial content';

      const store = createStore(chatModel, {
        isSending: true,
        history: createMockPanelMessage({
          role: ChatRoleEnum.ASSISTANT,
          content: initialContent,
        }),
      });

      renderWithProviders(
        <RunningChatBubble chatModel={chatModel} />,
        { store }
      );

      // 验证初始内容渲染
      expect(screen.getByTestId('assistant-message')).toBeInTheDocument();
    });
  });

  describe('4.5.3 测试"正在生成..."提示文本', () => {
    it('当显示加载状态时，应该渲染 Spinner 组件', () => {
      const chatModel = createMockPanelChatModel('model-1');

      const store = createStore(chatModel, {
        isSending: true,
        history: createMockPanelMessage({
          role: ChatRoleEnum.ASSISTANT,
          content: '',
        }),
      });

      renderWithProviders(
        <RunningChatBubble chatModel={chatModel} />,
        { store }
      );

      // 空内容时应该渲染 Spinner，不渲染 ChatBubble
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.queryByTestId('assistant-message')).toBeNull();
    });

    it('当 currentChatModel 不存在时，不应该渲染任何内容', () => {
      const chatModel = createMockPanelChatModel('model-1');

      // runningChat 为空，没有匹配的 chatId+modelId
      const store = createStore(chatModel);

      renderWithProviders(
        <RunningChatBubble chatModel={chatModel} />,
        { store }
      );

      expect(screen.queryByTestId('assistant-message')).toBeNull();
      expect(screen.queryByRole('status')).toBeNull();
    });

    it('当运行中的聊天不是当前选中的聊天时，不应该渲染任何内容', () => {
      const chatModel = createMockPanelChatModel('model-1');

      const chat = { id: TEST_CHAT_ID, chatModelList: [chatModel] };

      // runningChat 中有另一个聊天的数据
      const store = createTypeSafeTestStore({
        chat: createChatSliceState({
          chatMetaList: [chatToMeta(chat)],
          activeChatData: { [TEST_CHAT_ID]: chat },
          sendingChatIds: {},
          selectedChatId: TEST_CHAT_ID,
          runningChat: createRunningChatEntry('other-chat-id', chatModel.modelId, {
            isSending: true,
            history: createMockPanelMessage({
              role: ChatRoleEnum.ASSISTANT,
              content: 'Response from other chat',
            }),
          }),
        }),
      });

      renderWithProviders(
        <RunningChatBubble chatModel={chatModel} />,
        { store }
      );

      expect(screen.queryByTestId('assistant-message')).toBeNull();
    });

    it('当运行中的聊天不是当前模型时，不应该渲染任何内容', () => {
      const chatModel = createMockPanelChatModel('model-1');

      const chat = { id: TEST_CHAT_ID, chatModelList: [chatModel] };

      // runningChat 中有另一个模型的数据
      const store = createTypeSafeTestStore({
        chat: createChatSliceState({
          chatMetaList: [chatToMeta(chat)],
          activeChatData: { [TEST_CHAT_ID]: chat },
          sendingChatIds: {},
          selectedChatId: TEST_CHAT_ID,
          runningChat: createRunningChatEntry(TEST_CHAT_ID, 'other-model-id', {
            isSending: true,
            history: createMockPanelMessage({
              role: ChatRoleEnum.ASSISTANT,
              content: 'Response from other model',
            }),
          }),
        }),
      });

      renderWithProviders(
        <RunningChatBubble chatModel={chatModel} />,
        { store }
      );

      expect(screen.queryByTestId('assistant-message')).toBeNull();
    });
  });

  describe('额外测试：边界情况', () => {
    it('应该正确处理只有 reasoningContent 而没有 content 的情况', () => {
      const chatModel = createMockPanelChatModel('model-1');

      const store = createStore(chatModel, {
        isSending: true,
        history: createMockPanelMessage({
          role: ChatRoleEnum.ASSISTANT,
          content: '',
          reasoningContent: 'Only reasoning content',
        }),
      });

      renderWithProviders(
        <RunningChatBubble chatModel={chatModel} />,
        { store }
      );

      // 有 reasoningContent 时应该渲染 ChatBubble
      expect(screen.getByTestId('assistant-message')).toBeInTheDocument();
    });

    it('应该正确处理 null 的 finishReason', () => {
      const chatModel = createMockPanelChatModel('model-1');

      const store = createStore(chatModel, {
        isSending: true,
        history: createMockPanelMessage({
          role: ChatRoleEnum.ASSISTANT,
          content: 'Response with null finishReason',
          finishReason: null,
        }),
      });

      renderWithProviders(
        <RunningChatBubble chatModel={chatModel} />,
        { store }
      );

      // 应该正常渲染 ChatBubble
      expect(screen.getByTestId('assistant-message')).toBeInTheDocument();
    });
  });
});
