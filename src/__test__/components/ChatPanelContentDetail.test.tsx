/**
 * ChatPanelContentDetail 组件测试
 *
 * 测试聊天详情组件的渲染和交互
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import ChatPanelContentDetail from '@/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelContent/components/ChatPanelContentDetail';
import type { ChatModel } from '@/types/chat';
import { ChatRoleEnum } from '@/types/chat';
import chatReducer from '@/store/slices/chatSlices';
import modelReducer from '@/store/slices/modelSlice';
import chatPageReducer from '@/store/slices/chatPageSlices';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // 简单的 mock，返回一些可读的文本
      const translations: Record<string, string> = {
        'chat.scrollToBottom': 'Scroll to bottom',
        'chat.modelDeleted': 'Model Deleted',
        'chat.deleted': 'Deleted',
        'chat.disabled': 'Disabled',
      };
      return translations[key] || key;
    },
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock useTypedSelectedChat hook
vi.mock('@/pages/Chat/components/ChatContent/components/ChatPanel/hooks/useTypedSelectedChat', () => ({
  useTypedSelectedChat: () => ({
    selectedChat: {
      id: 'test-chat-1',
      name: 'Test Chat',
      chatModelList: [],
      isDeleted: false,
    },
  }),
}));

// Mock useIsChatSending hook
vi.mock('@/pages/Chat/components/ChatContent/components/ChatPanel/hooks/useIsChatSending', () => ({
  useIsChatSending: () => ({
    isSending: false,
  }),
}));

// Mock 子组件以简化测试
vi.mock('@/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelContent/components/ChatPanelContentDetail/components/ChatBubble', () => ({
  default: ({ historyRecord }: { historyRecord: any }) => (
    <div data-testid="chat-bubble">{historyRecord.content}</div>
  ),
}));

vi.mock('@/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelContent/components/ChatPanelContentDetail/components/RunningChatBubble', () => ({
  default: () => <div data-testid="running-chat-bubble">Running...</div>,
}));

vi.mock('@/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelContent/components/ChatPanelContentDetail/components/DetailTitle', () => ({
  default: ({ chatModel }: { chatModel: ChatModel }) => (
    <div data-testid="detail-title">{chatModel.modelId}</div>
  ),
}));

describe('ChatPanelContentDetail', () => {
  /**
   * 创建测试用 Redux Store
   */
  const createTestStore = (overrides?: {
    chatModel?: ChatModel;
    models?: any[];
    runningChat?: any;
  }) => {
    const defaultChatModel: ChatModel = {
      modelId: 'model-1',
      chatHistoryList: [],
    };

    const chatModel = overrides?.chatModel || defaultChatModel;

    const defaultModels = [
      {
        id: 'model-1',
        nickname: 'Model 1',
        apiKey: 'test-key',
        apiAddress: 'https://api.test.com',
        remark: 'Test',
        modelKey: 'model-1',
        modelName: 'Model 1',
        providerName: 'TestProvider',
        providerKey: 'deepseek',
        isEnable: true,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updateAt: new Date().toISOString(),
      },
    ];

    return configureStore({
      reducer: {
        chat: chatReducer,
        chatPage: chatPageReducer,
        models: modelReducer,
      } as any,
      preloadedState: {
        chat: {
          chatList: [
            {
              id: 'test-chat-1',
              name: 'Test Chat',
              chatModelList: [chatModel],
              isDeleted: false,
            },
          ],
          selectedChatId: 'test-chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: overrides?.runningChat || {},
        },
        chatPage: {
          isSidebarCollapsed: false,
          isShowChatPage: true,
        },
        models: {
          models: overrides?.models || defaultModels,
          loading: false,
          error: null,
        },
      } as any,
    });
  };

  /**
   * 创建测试包装器
   */
  const createWrapper = (store: ReturnType<typeof createTestStore>) => {
    return function({ children }: { children: React.ReactNode }) {
      return <Provider store={store}>{children}</Provider>;
    };
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('4.3.1 测试渲染单个模型面板', () => {
    it('应该成功渲染单个模型面板', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const store = createTestStore({ chatModel });
      const wrapper = createWrapper(store);

      const { container } = render(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { wrapper }
      );

      // 验证组件成功渲染
      expect(container.firstChild).toBeDefined();
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('应该渲染包含滚动容器的面板', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const store = createTestStore({ chatModel });
      const wrapper = createWrapper(store);

      const { container } = render(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { wrapper }
      );

      // 验证滚动容器存在
      const scrollContainer = container.querySelector('div.overflow-y-auto');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('应该渲染模型标题（DetailTitle）', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const store = createTestStore({ chatModel });
      const wrapper = createWrapper(store);

      render(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { wrapper }
      );

      // 验证模型标题渲染
      expect(screen.getByTestId('detail-title')).toBeInTheDocument();
      expect(screen.getByTestId('detail-title')).toHaveTextContent('model-1');
    });

    it('应该渲染 RunningChatBubble 组件', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const store = createTestStore({ chatModel });
      const wrapper = createWrapper(store);

      render(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { wrapper }
      );

      // 验证 RunningChatBubble 渲染
      expect(screen.getByTestId('running-chat-bubble')).toBeInTheDocument();
    });
  });

  describe('4.3.2 测试传递 chatModel prop', () => {
    it('应该正确接收和使用 chatModel prop', () => {
      const chatModel: ChatModel = {
        modelId: 'custom-model-1',
        chatHistoryList: [],
      };

      const customModels = [
        {
          id: 'custom-model-1',
          nickname: 'Custom Model',
          apiKey: 'custom-key',
          apiAddress: 'https://api.custom.com',
          remark: 'Custom',
          modelKey: 'custom-model-1',
          modelName: 'Custom Model Name',
          providerName: 'CustomProvider',
          providerKey: 'custom-provider',
          isEnable: true,
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updateAt: new Date().toISOString(),
        },
      ];

      const store = createTestStore({ chatModel, models: customModels });
      const wrapper = createWrapper(store);

      render(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { wrapper }
      );

      // 验证使用的是传入的 chatModel
      expect(screen.getByTestId('detail-title')).toHaveTextContent('custom-model-1');
    });

    it('应该根据 chatModel 渲染对应的历史记录', () => {
      const message1 = { id: 'msg-1', role: ChatRoleEnum.USER, content: 'User message 1', timestamp: Date.now() / 1000, modelKey: 'test-model', finishReason: null, raw: null };
      const message2 = { id: 'msg-2', role: ChatRoleEnum.ASSISTANT, content: 'Assistant response 1', timestamp: Date.now() / 1000, modelKey: 'test-model', finishReason: 'stop', raw: null };

      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [message1, message2],
      };

      const store = createTestStore({ chatModel });
      const wrapper = createWrapper(store);

      render(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { wrapper }
      );

      // 验证历史消息被渲染
      expect(screen.getByText('User message 1')).toBeInTheDocument();
      expect(screen.getByText('Assistant response 1')).toBeInTheDocument();
    });

    it('应该处理空的 chatHistoryList', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const store = createTestStore({ chatModel });
      const wrapper = createWrapper(store);

      const { container } = render(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { wrapper }
      );

      // 验证组件在没有历史记录时也能正常渲染
      expect(container.firstChild).toBeDefined();
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('应该处理 null 或 undefined 的 chatHistoryList', () => {
      const chatModel1: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: null as any,
      };

      const store = createTestStore({ chatModel: chatModel1 });
      const wrapper = createWrapper(store);

      const { container: container1 } = render(
        <ChatPanelContentDetail chatModel={chatModel1} />,
        { wrapper }
      );

      expect(container1.firstChild).toBeDefined();

      const chatModel2: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: undefined as any,
      };

      const { container: container2 } = render(
        <ChatPanelContentDetail chatModel={chatModel2} />,
        { wrapper }
      );

      expect(container2.firstChild).toBeDefined();
    });
  });

  describe('历史消息渲染', () => {
    it('应该渲染多条历史消息', () => {
      const messages = [
        { id: 'msg-1', role: ChatRoleEnum.USER, content: 'Message 1', timestamp: Date.now() / 1000, modelKey: 'test-model', finishReason: null, raw: null },
        { id: 'msg-2', role: ChatRoleEnum.ASSISTANT, content: 'Message 2', timestamp: Date.now() / 1000, modelKey: 'test-model', finishReason: 'stop', raw: null },
        { id: 'msg-3', role: ChatRoleEnum.USER, content: 'Message 3', timestamp: Date.now() / 1000, modelKey: 'test-model', finishReason: null, raw: null },
        { id: 'msg-4', role: ChatRoleEnum.ASSISTANT, content: 'Message 4', timestamp: Date.now() / 1000, modelKey: 'test-model', finishReason: 'stop', raw: null },
      ];

      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: messages,
      };

      const store = createTestStore({ chatModel });
      const wrapper = createWrapper(store);

      render(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { wrapper }
      );

      expect(screen.getByText('Message 1')).toBeInTheDocument();
      expect(screen.getByText('Message 2')).toBeInTheDocument();
      expect(screen.getByText('Message 3')).toBeInTheDocument();
      expect(screen.getByText('Message 4')).toBeInTheDocument();
    });

    it('应该为每条消息渲染独立的 ChatBubble', () => {
      const messages = [
        { id: 'msg-1', role: ChatRoleEnum.USER, content: 'User message', timestamp: Date.now() / 1000, modelKey: 'test-model', finishReason: null, raw: null },
        { id: 'msg-2', role: ChatRoleEnum.ASSISTANT, content: 'Assistant message', timestamp: Date.now() / 1000, modelKey: 'test-model', finishReason: 'stop', raw: null },
      ];

      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: messages,
      };

      const store = createTestStore({ chatModel });
      const wrapper = createWrapper(store);

      render(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { wrapper }
      );

      // 验证消息被渲染
      expect(screen.getByText('User message')).toBeInTheDocument();
      expect(screen.getByText('Assistant message')).toBeInTheDocument();

      // 验证 ChatBubble 组件被渲染
      const chatBubbles = screen.getAllByTestId('chat-bubble');
      expect(chatBubbles).toHaveLength(2);
    });
  });

  describe('错误信息显示', () => {
    it('应该在存在错误时显示错误提示', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const runningChat = {
        'test-chat-1': {
          'model-1': {
            isSending: false,
            errorMessage: 'Network error occurred',
          },
        },
      };

      const store = createTestStore({ chatModel, runningChat });
      const wrapper = createWrapper(store);

      render(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { wrapper }
      );

      // 验证错误消息显示
      expect(screen.getByText('Network error occurred')).toBeInTheDocument();
    });

    it('应该在没有错误时不显示错误提示', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const store = createTestStore({ chatModel });
      const wrapper = createWrapper(store);

      render(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { wrapper }
      );

      // 验证没有错误提示显示
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('滚动条自适应', () => {
    it('应该默认应用正确的类名', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const store = createTestStore({ chatModel });
      const wrapper = createWrapper(store);

      const { container } = render(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { wrapper }
      );

      const scrollContainer = container.querySelector('div.overflow-y-auto');
      expect(scrollContainer).toBeInTheDocument();

      // 默认应该有 scrollbar-none 类（未滚动时）
      expect(scrollContainer).toHaveClass('scrollbar-none');
    });
  });

  describe('发送状态显示', () => {
    it('应该在发送状态时正常渲染', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const runningChat = {
        'test-chat-1': {
          'model-1': {
            isSending: true,
            errorMessage: null,
          },
        },
      };

      const store = createTestStore({ chatModel, runningChat });
      const wrapper = createWrapper(store);

      const { container } = render(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { wrapper }
      );

      // 验证组件在发送状态下正常渲染
      expect(container.firstChild).toBeDefined();
    });
  });
});
