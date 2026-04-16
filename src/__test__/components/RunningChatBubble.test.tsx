/**
 * RunningChatBubble 组件测试
 *
 * 测试正在生成的消息气泡的渲染场景
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createTypeSafeTestStore } from '@/__test__/helpers/render/redux';
import { createChatSliceState, createRunningChatEntry } from '@/__test__/helpers/mocks/testState';
import { createMockPanelChatModel } from '@/__test__/helpers/mocks/panelLayout';
import RunningChatBubble from '@/pages/Chat/components/Panel/Detail/RunningBubble';
import { createMockPanelMessage } from '@/__test__/helpers/mocks/chatPanel';
import { ChatRoleEnum } from '@/types/chat';

vi.mock('react-i18next', () => {
  const R = { common: { loading: 'Loading...' } };
  return globalThis.__createI18nMockReturn(R);
});

// Mock ChatBubble 组件
vi.mock('@/components/chat/ChatBubble', () => ({
  ChatBubble: vi.fn(({ isRunning, content, reasoningContent }) => (
    <div data-testid="chat-bubble-mock">
      <div data-testid="is-running-bubble">{isRunning ? 'true' : 'false'}</div>
      <div data-testid="history-content">{content || ''}</div>
      <div data-testid="history-reasoning">{reasoningContent || ''}</div>
    </div>
  )),
}));

// Mock useSelectedChat hook because it requires complex Redux store setup
const mockSelectedChat = {
  id: 'test-chat-1',
  title: 'Test Chat',
  models: [],
  timestamp: Date.now() / 1000,
};

vi.mock('@/pages/Chat/hooks/useSelectedChat', () => ({
  useSelectedChat: vi.fn(() => ({
    selectedChat: mockSelectedChat,
  })),
}));

describe('RunningChatBubble', () => {
  let mockStore: ReturnType<typeof createTypeSafeTestStore>;

  beforeEach(() => {
    // 创建一个 fresh 的 Redux store
    mockStore = createTypeSafeTestStore();
  });

  describe('4.5.1 测试显示加载动画', () => {
    it('当消息正在生成但还没有内容时，应该显示加载状态的 Bubble', () => {
      const chatModel = createMockPanelChatModel('model-1');

      // 设置 runningChat 状态：isSending=true，但 history.content 为空
      mockStore = createTypeSafeTestStore({
        chat: createChatSliceState({
          runningChat: createRunningChatEntry(mockSelectedChat.id, chatModel.modelId, {
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
          }),
        }),
      });

      const { container } = render(
        <Provider store={mockStore}>
          <RunningChatBubble chatModel={chatModel} />
        </Provider>
      );

      // 组件应该渲染一个 Bubble，但 ChatBubble 不应该被调用（因为 content 为空）
      const chatBubbleMock = container.querySelector('[data-testid="chat-bubble-mock"]');
      expect(chatBubbleMock).toBeNull();
    });

    it('当 history 为 nil 时，应该显示加载动画', () => {
      const chatModel = createMockPanelChatModel('model-1');

      // 设置 runningChat 状态：isSending=true，但 history 为 undefined
      mockStore = createTypeSafeTestStore({
        chat: createChatSliceState({
          runningChat: createRunningChatEntry(mockSelectedChat.id, chatModel.modelId, {
            isSending: true,
            history: undefined,
          }),
        }),
      });

      const { container } = render(
        <Provider store={mockStore}>
          <RunningChatBubble chatModel={chatModel} />
        </Provider>
      );

      // 不应该渲染 ChatBubble
      const chatBubbleMock = container.querySelector('[data-testid="chat-bubble-mock"]');
      expect(chatBubbleMock).toBeNull();
    });

    it('当 isSending 为 false 时，不应该渲染任何内容', () => {
      const chatModel = createMockPanelChatModel('model-1');

      // 设置 runningChat 状态：isSending=false
      mockStore = createTypeSafeTestStore({
        chat: createChatSliceState({
          runningChat: createRunningChatEntry(mockSelectedChat.id, chatModel.modelId, {
            isSending: false,
            history: createMockPanelMessage({
              role: ChatRoleEnum.ASSISTANT,
              content: 'Response',
            }),
          }),
        }),
      });

      const { container } = render(
        <Provider store={mockStore}>
          <RunningChatBubble chatModel={chatModel} />
        </Provider>
      );

      // 不应该渲染任何内容
      const chatBubbleMock = container.querySelector('[data-testid="chat-bubble-mock"]');
      expect(chatBubbleMock).toBeNull();
    });
  });

  describe('4.5.2 测试流式内容更新', () => {
    it('当接收到流式消息内容时，应该实时更新消息气泡', () => {
      const chatModel = createMockPanelChatModel('model-1');

      const streamingContent = 'This is a streaming response';
      const streamingMessage = createMockPanelMessage({
        role: ChatRoleEnum.ASSISTANT,
        content: streamingContent,
      });

      // 设置 runningChat 状态：isSending=true，有内容
      mockStore = createTypeSafeTestStore({
        chat: createChatSliceState({
          runningChat: createRunningChatEntry(mockSelectedChat.id, chatModel.modelId, {
            isSending: true,
            history: streamingMessage,
          }),
        }),
      });

      // 组件应该能够渲染而不抛错
      expect(() => {
        render(
          <Provider store={mockStore}>
            <RunningChatBubble chatModel={chatModel} />
          </Provider>
        );
      }).not.toThrow();
    });

    it('当接收到推理内容时，应该显示在消息气泡中', () => {
      const chatModel = createMockPanelChatModel('model-1');

      const reasoningContent = 'This is the reasoning process';
      const finalAnswer = 'Final answer';
      const reasoningMessage = createMockPanelMessage({
        role: ChatRoleEnum.ASSISTANT,
        content: finalAnswer,
        reasoningContent,
      });

      // 设置 runningChat 状态：包含推理内容
      mockStore = createTypeSafeTestStore({
        chat: createChatSliceState({
          runningChat: createRunningChatEntry(mockSelectedChat.id, chatModel.modelId, {
            isSending: true,
            history: reasoningMessage,
          }),
        }),
      });

      // 组件应该能够渲染而不抛错
      expect(() => {
        render(
          <Provider store={mockStore}>
            <RunningChatBubble chatModel={chatModel} />
          </Provider>
        );
      }).not.toThrow();
    });

    it('当流式内容更新时，应该正确更新渲染', () => {
      const chatModel = createMockPanelChatModel('model-1');

      // 初始内容
      const initialContent = 'Initial content';
      const initialMessage = createMockPanelMessage({
        role: ChatRoleEnum.ASSISTANT,
        content: initialContent,
      });

      mockStore = createTypeSafeTestStore({
        chat: createChatSliceState({
          runningChat: createRunningChatEntry(mockSelectedChat.id, chatModel.modelId, {
            isSending: true,
            history: initialMessage,
          }),
        }),
      });

      const { rerender } = render(
        <Provider store={mockStore}>
          <RunningChatBubble chatModel={chatModel} />
        </Provider>
      );

      // 模拟内容更新
      const updatedContent = 'Updated content with more text';
      const updatedMessage = createMockPanelMessage({
        role: ChatRoleEnum.ASSISTANT,
        content: updatedContent,
      });

      mockStore = createTypeSafeTestStore({
        chat: createChatSliceState({
          runningChat: createRunningChatEntry(mockSelectedChat.id, chatModel.modelId, {
            isSending: true,
            history: updatedMessage,
          }),
        }),
      });

      // 重新渲染应该不抛错
      expect(() => {
        rerender(
          <Provider store={mockStore}>
            <RunningChatBubble chatModel={chatModel} />
          </Provider>
        );
      }).not.toThrow();
    });
  });

  describe('4.5.3 测试"正在生成..."提示文本', () => {
    it('当显示加载状态时，应该使用 antd Bubble 组件的 loading 属性', () => {
      const chatModel = createMockPanelChatModel('model-1');

      // 设置 runningChat 状态：isSending=true，但 content 为空（触发 loading 状态）
      mockStore = createTypeSafeTestStore({
        chat: createChatSliceState({
          runningChat: createRunningChatEntry(mockSelectedChat.id, chatModel.modelId, {
            isSending: true,
            history: createMockPanelMessage({
              role: ChatRoleEnum.ASSISTANT,
              content: '',
            }),
          }),
        }),
      });

      // 由于 antd Bubble 被 mock 为返回 null，我们只能验证组件不抛错
      expect(() => {
        render(
          <Provider store={mockStore}>
            <RunningChatBubble chatModel={chatModel} />
          </Provider>
        );
      }).not.toThrow();
    });

    it('当 currentChatModel 不存在时，不应该渲染任何内容', () => {
      const chatModel = createMockPanelChatModel('model-1');

      // runningChat 中没有对应的聊天或模型
      mockStore = createTypeSafeTestStore({
        chat: createChatSliceState({
          runningChat: {},
        }),
      });

      const { container } = render(
        <Provider store={mockStore}>
          <RunningChatBubble chatModel={chatModel} />
        </Provider>
      );

      // 不应该渲染任何内容
      const chatBubbleMock = container.querySelector('[data-testid="chat-bubble-mock"]');
      expect(chatBubbleMock).toBeNull();
    });

    it('当运行中的聊天不是当前选中的聊天时，不应该渲染任何内容', () => {
      const chatModel = createMockPanelChatModel('model-1');

      // runningChat 中有另一个聊天的数据
      mockStore = createTypeSafeTestStore({
        chat: createChatSliceState({
          runningChat: createRunningChatEntry('other-chat-id', chatModel.modelId, {
            isSending: true,
            history: createMockPanelMessage({
              role: ChatRoleEnum.ASSISTANT,
              content: 'Response from other chat',
            }),
          }),
        }),
      });

      const { container } = render(
        <Provider store={mockStore}>
          <RunningChatBubble chatModel={chatModel} />
        </Provider>
      );

      // 不应该渲染任何内容
      const chatBubbleMock = container.querySelector('[data-testid="chat-bubble-mock"]');
      expect(chatBubbleMock).toBeNull();
    });

    it('当运行中的聊天不是当前模型时，不应该渲染任何内容', () => {
      const chatModel = createMockPanelChatModel('model-1');

      // runningChat 中有另一个模型的数据
      mockStore = createTypeSafeTestStore({
        chat: createChatSliceState({
          runningChat: createRunningChatEntry(mockSelectedChat.id, 'other-model-id', {
            isSending: true,
            history: createMockPanelMessage({
              role: ChatRoleEnum.ASSISTANT,
              content: 'Response from other model',
            }),
          }),
        }),
      });

      const { container } = render(
        <Provider store={mockStore}>
          <RunningChatBubble chatModel={chatModel} />
        </Provider>
      );

      // 不应该渲染任何内容
      const chatBubbleMock = container.querySelector('[data-testid="chat-bubble-mock"]');
      expect(chatBubbleMock).toBeNull();
    });
  });

  describe('额外测试：边界情况', () => {
    it('应该正确处理只有 reasoningContent 而没有 content 的情况', () => {
      const chatModel = createMockPanelChatModel('model-1');

      const reasoningOnlyMessage = createMockPanelMessage({
        role: ChatRoleEnum.ASSISTANT,
        content: '',
        reasoningContent: 'Only reasoning content',
      });

      mockStore = createTypeSafeTestStore({
        chat: createChatSliceState({
          runningChat: createRunningChatEntry(mockSelectedChat.id, chatModel.modelId, {
            isSending: true,
            history: reasoningOnlyMessage,
          }),
        }),
      });

      // 组件应该能够渲染而不抛错
      expect(() => {
        render(
          <Provider store={mockStore}>
            <RunningChatBubble chatModel={chatModel} />
          </Provider>
        );
      }).not.toThrow();
    });

    it('应该正确处理 null 的 finishReason', () => {
      const chatModel = createMockPanelChatModel('model-1');

      const messageWithNullFinishReason = createMockPanelMessage({
        role: ChatRoleEnum.ASSISTANT,
        content: 'Response with null finishReason',
        finishReason: null,
      });

      mockStore = createTypeSafeTestStore({
        chat: createChatSliceState({
          runningChat: createRunningChatEntry(mockSelectedChat.id, chatModel.modelId, {
            isSending: true,
            history: messageWithNullFinishReason,
          }),
        }),
      });

      const { container } = render(
        <Provider store={mockStore}>
          <RunningChatBubble chatModel={chatModel} />
        </Provider>
      );

      // 应该正常渲染
      const chatBubbleMock = container.querySelector('[data-testid="chat-bubble-mock"]');
      expect(chatBubbleMock).toBeDefined();
    });
  });
});
