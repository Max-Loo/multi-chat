/**
 * ChatPanelContentDetail 组件测试
 *
 * 测试聊天详情组件的渲染和交互
 * 不 mock useSelectedChat / useIsSending，通过 Redux state 驱动行为
 */

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import ChatPanelContentDetail from '@/pages/Chat/components/Panel/Detail';
import { ModelProviderKeyEnum } from '@/utils/enums';
import type { ChatModel } from '@/types/chat';
import type { Model } from '@/types/model';
import { ChatRoleEnum } from '@/types/chat';
import { chatToMeta } from '@/types/chat';
import { createTypeSafeTestStore, renderWithProviders } from '@/__test__/helpers/render/redux';
import { createChatSliceState, createModelSliceState, createChatPageSliceState } from '@/__test__/helpers/mocks';
import { asTestType } from '@/__test__/helpers/testing-utils';
import { createMockModel } from '@/__test__/helpers/fixtures/model';
import { createMockMessage } from '@/__test__/fixtures/chat';

vi.mock('virtua', () => {
  // oxlint-disable-next-line consistent-function-scoping — Vitest vi.mock 工厂函数会被提升，必须内联定义
  const V = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  return { Virtualizer: V, VList: V };
});

vi.mock('react-i18next', () => globalThis.__mockI18n());

describe('ChatPanelContentDetail', () => {
  /**
   * 创建测试用 Redux Store
   */
  const createTestStore = (overrides?: {
    chatModel?: ChatModel;
    models?: Model[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    runningChat?: any;
  }) => {
    const defaultChatModel: ChatModel = {
      modelId: 'model-1',
      chatHistoryList: [],
    };

    const chatModel = overrides?.chatModel || defaultChatModel;

    const defaultModels: Model[] = [
      createMockModel({
        id: 'model-1',
        nickname: 'Model 1',
        modelKey: 'model-1',
        modelName: 'Model 1',
        providerName: 'TestProvider',
        providerKey: ModelProviderKeyEnum.DEEPSEEK,
      }),
    ];

    const chat = {
        id: 'test-chat-1',
        name: 'Test Chat',
        chatModelList: [chatModel],
        isDeleted: false,
      };

    return createTypeSafeTestStore({
      chat: createChatSliceState({
        chatMetaList: [chatToMeta(chat)],
        activeChatData: { 'test-chat-1': chat },
        sendingChatIds: {},
        selectedChatId: 'test-chat-1',
        runningChat: overrides?.runningChat || {},
      }),
      chatPage: createChatPageSliceState({
        isSidebarCollapsed: false,
        isShowChatPage: true,
      }),
      models: createModelSliceState({
        models: overrides?.models || defaultModels,
      }),
    });
  };

  
  describe('4.3.1 测试渲染单个模型面板', () => {
    it('应该成功渲染单个模型面板', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const store = createTestStore({ chatModel });

      const { container } = renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      expect(container.firstChild).toBeDefined();
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('应该渲染包含滚动容器的面板', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const store = createTestStore({ chatModel });

      const { container } = renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      const scrollContainer = container.querySelector('div.overflow-y-auto');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('应该渲染模型标题（DetailTitle）', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const store = createTestStore({ chatModel });

      renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      // Title 显示 "nickname (modelName)" 格式
      expect(screen.getByText('Model 1 (Model 1)')).toBeInTheDocument();
    });

    it('应该渲染 RunningChatBubble 组件', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const store = createTestStore({ chatModel });

      const { container } = renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      // runningChat 为空，RunningBubble 返回 null，不应有 spinner
      expect(container.querySelector('svg.animate-spin')).toBeNull();
    });
  });

  describe('4.3.2 测试传递 chatModel prop', () => {
    it('应该正确接收和使用 chatModel prop', () => {
      const chatModel: ChatModel = {
        modelId: 'custom-model-1',
        chatHistoryList: [],
      };

      const customModels = [
        createMockModel({
          id: 'custom-model-1',
          nickname: 'Custom Model',
          modelKey: 'custom-model-1',
          modelName: 'Custom Model Name',
          providerName: 'CustomProvider',
          providerKey: 'custom-provider' as ModelProviderKeyEnum,
        }),
      ];

      const store = createTestStore({ chatModel, models: customModels });

      renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      // Title 显示自定义模型的名称
      expect(screen.getByText('Custom Model (Custom Model Name)')).toBeInTheDocument();
    });

    it('应该根据 chatModel 渲染对应的历史记录', () => {
      const message1 = createMockMessage({ role: ChatRoleEnum.USER, content: 'User message 1' });
      const message2 = createMockMessage({ role: ChatRoleEnum.ASSISTANT, content: 'Assistant response 1', finishReason: 'stop' });

      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [message1, message2],
      };

      const store = createTestStore({ chatModel });

      renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      // 应该渲染两条历史消息
      expect(screen.getByText('User message 1')).toBeInTheDocument();
      expect(screen.getByText('Assistant response 1')).toBeInTheDocument();
    });

    it('应该处理空的 chatHistoryList', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const store = createTestStore({ chatModel });

      const { container } = renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      expect(container.firstChild).toBeDefined();
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('应该处理 null 或 undefined 的 chatHistoryList', () => {
      const chatModel1: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: asTestType<ChatModel['chatHistoryList']>(null),
      };

      const store = createTestStore({ chatModel: chatModel1 });

      const { container: container1 } = renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel1} />,
        { store }
      );

      expect(container1.firstChild).toBeDefined();

      const chatModel2: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: asTestType<ChatModel['chatHistoryList']>(undefined),
      };

      const { container: container2 } = renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel2} />,
        { store }
      );

      expect(container2.firstChild).toBeDefined();
    });
  });

  describe('历史消息渲染', () => {
    it('应该渲染多条历史消息', () => {
      const messages = [
        createMockMessage({ role: ChatRoleEnum.USER, content: 'Message 1' }),
        createMockMessage({ role: ChatRoleEnum.ASSISTANT, content: 'Message 2', finishReason: 'stop' }),
        createMockMessage({ role: ChatRoleEnum.USER, content: 'Message 3' }),
        createMockMessage({ role: ChatRoleEnum.ASSISTANT, content: 'Message 4', finishReason: 'stop' }),
      ];

      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: messages,
      };

      const store = createTestStore({ chatModel });

      renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      // 应该渲染 4 个 ChatBubble（2 user + 2 assistant）
      expect(screen.getAllByTestId('user-message').concat(screen.getAllByTestId('assistant-message'))).toHaveLength(4);
    });

    it('应该为每条消息渲染独立的 ChatBubble', () => {
      const messages = [
        createMockMessage({ role: ChatRoleEnum.USER, content: 'User message' }),
        createMockMessage({ role: ChatRoleEnum.ASSISTANT, content: 'Assistant message', finishReason: 'stop' }),
      ];

      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: messages,
      };

      const store = createTestStore({ chatModel });

      renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      // 每条消息对应一个 ChatBubble（1 user + 1 assistant）
      expect(screen.getAllByTestId('user-message').concat(screen.getAllByTestId('assistant-message'))).toHaveLength(2);
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

      renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      expect(screen.getByText('Network error occurred')).toBeInTheDocument();
    });

    it('应该在没有错误时不显示错误提示', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const store = createTestStore({ chatModel });

      renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

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

      const { container } = renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      const scrollContainer = container.querySelector('div.overflow-y-auto');
      expect(scrollContainer).toBeInTheDocument();
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

      const { container } = renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      // isSending=true 且无 history 时应该显示 Spinner
      expect(container.querySelector('svg.animate-spin')).toBeInTheDocument();
    });
  });
});
