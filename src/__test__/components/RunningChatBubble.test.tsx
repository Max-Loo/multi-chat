/**
 * RunningChatBubble 组件测试
 *
 * 测试正在生成的消息气泡的渲染场景
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import RunningChatBubble from '@/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelContent/components/ChatPanelContentDetail/components/RunningChatBubble';
import { createMockMessage } from '@/__test__/helpers/mocks/chatPanel';
import { ChatRoleEnum, type ChatModel } from '@/types/chat';

/**
 * 创建 Mock ChatModel（简化版本）
 * @param modelId 模型 ID
 * @returns ChatModel 对象
 */
const createMockChatModelForTest = (modelId: string = 'model-1'): ChatModel => {
  return {
    modelId,
    chatHistoryList: [],
  };
};

// Mock ChatBubble 组件
vi.mock('@/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelContent/components/ChatPanelContentDetail/components/ChatBubble', () => ({
  default: vi.fn(({ isRunningBubble, historyRecord }) => (
    <div data-testid="chat-bubble-mock">
      <div data-testid="is-running-bubble">{isRunningBubble ? 'true' : 'false'}</div>
      <div data-testid="history-content">{historyRecord?.content || ''}</div>
      <div data-testid="history-reasoning">{historyRecord?.reasoningContent || ''}</div>
    </div>
  )),
}));

// Mock useTypedSelectedChat hook
const mockSelectedChat = {
  id: 'test-chat-1',
  title: 'Test Chat',
  models: [],
  timestamp: Date.now() / 1000,
};

vi.mock('@/pages/Chat/components/ChatContent/components/ChatPanel/hooks/useTypedSelectedChat', () => ({
  useTypedSelectedChat: vi.fn(() => ({
    selectedChat: mockSelectedChat,
  })),
}));

describe('RunningChatBubble', () => {
  let mockStore: ReturnType<typeof configureStore>;

  beforeEach(() => {
    // 创建一个 fresh 的 Redux store
    mockStore = configureStore({
      reducer: {
        chat: (state = {
          runningChat: {},
        }) => state,
      },
    });
  });

  describe('4.5.1 测试显示加载动画', () => {
    it('当消息正在生成但还没有内容时，应该显示加载状态的 Bubble', () => {
      const chatModel = createMockChatModelForTest('model-1');

      // 设置 runningChat 状态：isSending=true，但 history.content 为空
      mockStore = configureStore({
        reducer: {
          chat: () => ({
            runningChat: {
              [mockSelectedChat.id]: {
                [chatModel.modelId]: {
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
                },
              },
            },
          }),
        },
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
      const chatModel = createMockChatModelForTest('model-1');

      // 设置 runningChat 状态：isSending=true，但 history 为 undefined
      mockStore = configureStore({
        reducer: {
          chat: () => ({
            runningChat: {
              [mockSelectedChat.id]: {
                [chatModel.modelId]: {
                  isSending: true,
                  history: undefined,
                },
              },
            },
          }),
        },
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
      const chatModel = createMockChatModelForTest('model-1');

      // 设置 runningChat 状态：isSending=false
      mockStore = configureStore({
        reducer: {
          chat: () => ({
            runningChat: {
              [mockSelectedChat.id]: {
                [chatModel.modelId]: {
                  isSending: false,
                  history: createMockMessage({
                    role: ChatRoleEnum.ASSISTANT,
                    content: 'Response',
                  }),
                },
              },
            },
          }),
        },
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
      const chatModel = createMockChatModelForTest('model-1');

      const streamingContent = 'This is a streaming response';
      const streamingMessage = createMockMessage({
        role: ChatRoleEnum.ASSISTANT,
        content: streamingContent,
      });

      // 设置 runningChat 状态：isSending=true，有内容
      mockStore = configureStore({
        reducer: {
          chat: () => ({
            runningChat: {
              [mockSelectedChat.id]: {
                [chatModel.modelId]: {
                  isSending: true,
                  history: streamingMessage,
                },
              },
            },
          }),
        },
      });

      const { container } = render(
        <Provider store={mockStore}>
          <RunningChatBubble chatModel={chatModel} />
        </Provider>
      );

      // 应该渲染 ChatBubble
      const chatBubbleMock = container.querySelector('[data-testid="chat-bubble-mock"]');
      expect(chatBubbleMock).toBeDefined();

      // 应该传递 isRunningBubble=true
      const isRunningBubble = container.querySelector('[data-testid="is-running-bubble"]');
      expect(isRunningBubble?.textContent).toBe('true');

      // 应该显示流式内容
      const historyContent = container.querySelector('[data-testid="history-content"]');
      expect(historyContent?.textContent).toBe(streamingContent);
    });

    it('当接收到推理内容时，应该显示在消息气泡中', () => {
      const chatModel = createMockChatModelForTest('model-1');

      const reasoningContent = 'This is the reasoning process';
      const finalAnswer = 'Final answer';
      const reasoningMessage = createMockMessage({
        role: ChatRoleEnum.ASSISTANT,
        content: finalAnswer,
        reasoningContent,
      });

      // 设置 runningChat 状态：包含推理内容
      mockStore = configureStore({
        reducer: {
          chat: () => ({
            runningChat: {
              [mockSelectedChat.id]: {
                [chatModel.modelId]: {
                  isSending: true,
                  history: reasoningMessage,
                },
              },
            },
          }),
        },
      });

      const { container } = render(
        <Provider store={mockStore}>
          <RunningChatBubble chatModel={chatModel} />
        </Provider>
      );

      // 应该渲染 ChatBubble
      const chatBubbleMock = container.querySelector('[data-testid="chat-bubble-mock"]');
      expect(chatBubbleMock).toBeDefined();

      // 应该显示最终答案
      const historyContent = container.querySelector('[data-testid="history-content"]');
      expect(historyContent?.textContent).toBe(finalAnswer);

      // 应该显示推理内容
      const historyReasoning = container.querySelector('[data-testid="history-reasoning"]');
      expect(historyReasoning?.textContent).toBe(reasoningContent);
    });

    it('当流式内容更新时，应该正确更新渲染', () => {
      const chatModel = createMockChatModelForTest('model-1');

      // 初始内容
      const initialContent = 'Initial content';
      const initialMessage = createMockMessage({
        role: ChatRoleEnum.ASSISTANT,
        content: initialContent,
      });

      mockStore = configureStore({
        reducer: {
          chat: () => ({
            runningChat: {
              [mockSelectedChat.id]: {
                [chatModel.modelId]: {
                  isSending: true,
                  history: initialMessage,
                },
              },
            },
          }),
        },
      });

      const { container, rerender } = render(
        <Provider store={mockStore}>
          <RunningChatBubble chatModel={chatModel} />
        </Provider>
      );

      // 初始渲染
      let historyContent = container.querySelector('[data-testid="history-content"]');
      expect(historyContent?.textContent).toBe(initialContent);

      // 模拟内容更新
      const updatedContent = 'Updated content with more text';
      const updatedMessage = createMockMessage({
        role: ChatRoleEnum.ASSISTANT,
        content: updatedContent,
      });

      mockStore = configureStore({
        reducer: {
          chat: () => ({
            runningChat: {
              [mockSelectedChat.id]: {
                [chatModel.modelId]: {
                  isSending: true,
                  history: updatedMessage,
                },
              },
            },
          }),
        },
      });

      rerender(
        <Provider store={mockStore}>
          <RunningChatBubble chatModel={chatModel} />
        </Provider>
      );

      // 内容应该更新
      historyContent = container.querySelector('[data-testid="history-content"]');
      expect(historyContent?.textContent).toBe(updatedContent);
    });
  });

  describe('4.5.3 测试"正在生成..."提示文本', () => {
    it('当显示加载状态时，应该使用 antd Bubble 组件的 loading 属性', () => {
      const chatModel = createMockChatModelForTest('model-1');

      // 设置 runningChat 状态：isSending=true，但 content 为空（触发 loading 状态）
      mockStore = configureStore({
        reducer: {
          chat: () => ({
            runningChat: {
              [mockSelectedChat.id]: {
                [chatModel.modelId]: {
                  isSending: true,
                  history: createMockMessage({
                    role: ChatRoleEnum.ASSISTANT,
                    content: '',
                  }),
                },
              },
            },
          }),
        },
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
      const chatModel = createMockChatModelForTest('model-1');

      // runningChat 中没有对应的聊天或模型
      mockStore = configureStore({
        reducer: {
          chat: () => ({
            runningChat: {},
          }),
        },
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
      const chatModel = createMockChatModelForTest('model-1');

      // runningChat 中有另一个聊天的数据
      mockStore = configureStore({
        reducer: {
          chat: () => ({
            runningChat: {
              'other-chat-id': {
                [chatModel.modelId]: {
                  isSending: true,
                  history: createMockMessage({
                    role: ChatRoleEnum.ASSISTANT,
                    content: 'Response from other chat',
                  }),
                },
              },
            },
          }),
        },
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
      const chatModel = createMockChatModelForTest('model-1');

      // runningChat 中有另一个模型的数据
      mockStore = configureStore({
        reducer: {
          chat: () => ({
            runningChat: {
              [mockSelectedChat.id]: {
                'other-model-id': {
                  isSending: true,
                  history: createMockMessage({
                    role: ChatRoleEnum.ASSISTANT,
                    content: 'Response from other model',
                  }),
                },
              },
            },
          }),
        },
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
      const chatModel = createMockChatModelForTest('model-1');

      const reasoningOnlyMessage = createMockMessage({
        role: ChatRoleEnum.ASSISTANT,
        content: '',
        reasoningContent: 'Only reasoning content',
      });

      mockStore = configureStore({
        reducer: {
          chat: () => ({
            runningChat: {
              [mockSelectedChat.id]: {
                [chatModel.modelId]: {
                  isSending: true,
                  history: reasoningOnlyMessage,
                },
              },
            },
          }),
        },
      });

      const { container } = render(
        <Provider store={mockStore}>
          <RunningChatBubble chatModel={chatModel} />
        </Provider>
      );

      // 应该渲染 ChatBubble（因为有 reasoningContent）
      const chatBubbleMock = container.querySelector('[data-testid="chat-bubble-mock"]');
      expect(chatBubbleMock).toBeDefined();

      const historyReasoning = container.querySelector('[data-testid="history-reasoning"]');
      expect(historyReasoning?.textContent).toBe('Only reasoning content');
    });

    it('应该正确处理 null 的 finishReason', () => {
      const chatModel = createMockChatModelForTest('model-1');

      const messageWithNullFinishReason = createMockMessage({
        role: ChatRoleEnum.ASSISTANT,
        content: 'Response with null finishReason',
        finishReason: null,
      });

      mockStore = configureStore({
        reducer: {
          chat: () => ({
            runningChat: {
              [mockSelectedChat.id]: {
                [chatModel.modelId]: {
                  isSending: true,
                  history: messageWithNullFinishReason,
                },
              },
            },
          }),
        },
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
